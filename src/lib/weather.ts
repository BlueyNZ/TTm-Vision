// Weather utility functions for job scheduling

export interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  icon: string;
  windSpeed: number;
  humidity: number;
  precipitation: number;
  timestamp: number;
}

export interface WeatherForecast {
  date: string;
  temp: number;
  condition: string;
  icon: string;
  windSpeed: number;
  precipitation: number;
  warnings: string[];
}

export interface WeatherRisk {
  level: 'low' | 'medium' | 'high' | 'extreme';
  warnings: string[];
  recommendations: string[];
}

/**
 * Fetch current weather for a location
 */
export async function getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenWeather API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
      humidity: data.main.humidity,
      precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
      timestamp: data.dt,
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
}

/**
 * Fetch 7-day weather forecast
 */
export async function getWeatherForecast(lat: number, lng: number): Promise<WeatherForecast[]> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenWeather API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Group by day and get midday forecast
    const dailyForecasts: { [key: string]: any[] } = {};
    
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = [];
      }
      dailyForecasts[date].push(item);
    });

    return Object.entries(dailyForecasts).slice(0, 7).map(([date, forecasts]) => {
      // Get midday forecast (around 12:00)
      const middayForecast = forecasts.reduce((prev, curr) => {
        const prevHour = new Date(prev.dt * 1000).getHours();
        const currHour = new Date(curr.dt * 1000).getHours();
        return Math.abs(currHour - 12) < Math.abs(prevHour - 12) ? curr : prev;
      });

      const maxWind = Math.max(...forecasts.map((f: any) => f.wind.speed * 3.6));
      const totalPrecip = forecasts.reduce((sum: number, f: any) => 
        sum + (f.rain?.['3h'] || f.snow?.['3h'] || 0), 0
      );

      const warnings = assessWeatherRisks({
        temp: middayForecast.main.temp,
        windSpeed: maxWind,
        precipitation: totalPrecip,
        condition: middayForecast.weather[0].main,
      }).warnings;

      return {
        date,
        temp: Math.round(middayForecast.main.temp),
        condition: middayForecast.weather[0].main,
        icon: middayForecast.weather[0].icon,
        windSpeed: Math.round(maxWind),
        precipitation: Math.round(totalPrecip),
        warnings,
      };
    });
  } catch (error) {
    console.error('Failed to fetch forecast:', error);
    return [];
  }
}

/**
 * Assess weather-related risks for traffic management work
 */
export function assessWeatherRisks(conditions: {
  temp: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
}): WeatherRisk {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let level: 'low' | 'medium' | 'high' | 'extreme' = 'low';

  // Wind risks
  if (conditions.windSpeed > 60) {
    level = 'extreme';
    warnings.push('⚠️ Extreme winds - Sign placement unsafe');
    recommendations.push('Consider postponing job');
  } else if (conditions.windSpeed > 40) {
    if (level !== 'extreme') level = 'high';
    warnings.push('⚠️ High winds - Secure all signage');
    recommendations.push('Use extra weights on signs');
    recommendations.push('Avoid tall or large signs');
  } else if (conditions.windSpeed > 25) {
    if (level === 'low') level = 'medium';
    warnings.push('Moderate winds - Monitor sign stability');
  }

  // Precipitation risks
  if (conditions.precipitation > 10) {
    level = level === 'low' ? 'high' : level;
    warnings.push('⚠️ Heavy rain - Reduced visibility');
    recommendations.push('Increase signage visibility');
    recommendations.push('Additional warning lights recommended');
  } else if (conditions.precipitation > 5) {
    level = level === 'low' ? 'medium' : level;
    warnings.push('Rain expected - Ensure proper drainage');
  }

  // Temperature risks
  if (conditions.temp > 35) {
    level = level === 'low' ? 'high' : level;
    warnings.push('⚠️ Extreme heat - Worker safety risk');
    recommendations.push('Schedule frequent breaks');
    recommendations.push('Ensure adequate hydration');
  } else if (conditions.temp > 30) {
    level = level === 'low' ? 'medium' : level;
    warnings.push('High temperature - Stay hydrated');
  } else if (conditions.temp < 5) {
    level = level === 'low' ? 'medium' : level;
    warnings.push('Cold conditions - Ice risk');
    recommendations.push('Watch for icy patches');
  }

  // Visibility risks
  if (conditions.condition === 'Fog' || conditions.condition === 'Mist') {
    level = level === 'low' ? 'high' : level;
    warnings.push('⚠️ Low visibility - Increase warning distance');
    recommendations.push('Deploy early warning signs further back');
    recommendations.push('Use flashing beacons');
  }

  if (conditions.condition === 'Thunderstorm') {
    level = 'extreme';
    warnings.push('⚠️ Thunderstorm - Unsafe conditions');
    recommendations.push('Cease outdoor operations');
  }

  // Snow/ice
  if (conditions.condition === 'Snow') {
    level = level === 'low' ? 'high' : level;
    warnings.push('⚠️ Snow - Slippery conditions');
    recommendations.push('Ensure all staff have appropriate footwear');
    recommendations.push('Increase setup time allowance');
  }

  return { level, warnings, recommendations };
}

/**
 * Get weather icon emoji
 */
export function getWeatherEmoji(condition: string): string {
  const emojiMap: { [key: string]: string } = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
    Haze: '🌫️',
  };
  return emojiMap[condition] || '🌤️';
}

/**
 * Get risk level color
 */
export function getRiskColor(level: WeatherRisk['level']): string {
  const colorMap = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    extreme: 'text-red-600 bg-red-50 border-red-200',
  };
  return colorMap[level];
}
