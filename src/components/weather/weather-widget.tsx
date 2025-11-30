'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  getCurrentWeather, 
  getWeatherForecast, 
  assessWeatherRisks,
  getWeatherEmoji,
  getRiskColor,
  type WeatherData,
  type WeatherForecast 
} from '@/lib/weather';
import { CloudRain, Wind, Droplets, AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
  jobDate?: Date;
  compact?: boolean;
}

export function WeatherWidget({ latitude, longitude, jobDate, compact = false }: WeatherWidgetProps) {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true);
      try {
        const [current, forecastData] = await Promise.all([
          getCurrentWeather(latitude, longitude),
          getWeatherForecast(latitude, longitude),
        ]);
        
        setCurrentWeather(current);
        setForecast(forecastData);
      } catch (error) {
        console.error('Weather fetch error:', error);
      } finally {
        setLoading(false);
      }
    }

    if (latitude && longitude) {
      fetchWeather();
    }
  }, [latitude, longitude]);

  if (loading) {
    return (
      <Card className={compact ? '' : 'w-full'}>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Loading weather...</div>
        </CardContent>
      </Card>
    );
  }

  if (!currentWeather) {
    return null;
  }

  const risks = assessWeatherRisks({
    temp: currentWeather.temp,
    windSpeed: currentWeather.windSpeed,
    precipitation: currentWeather.precipitation,
    condition: currentWeather.condition,
  });

  // Find forecast for job date if provided
  const jobDateForecast = jobDate
    ? forecast.find(f => f.date === format(jobDate, 'yyyy-MM-dd'))
    : null;

  const displayWeather = jobDateForecast || {
    temp: currentWeather.temp,
    windSpeed: currentWeather.windSpeed,
    precipitation: currentWeather.precipitation,
    condition: currentWeather.condition,
  };

  const displayRisks = jobDateForecast
    ? { level: (jobDateForecast.warnings.length > 0 ? 'high' : 'low') as 'low' | 'medium' | 'high' | 'extreme', warnings: jobDateForecast.warnings, recommendations: [] as string[] }
    : risks;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-2xl">{getWeatherEmoji(displayWeather.condition)}</span>
        <div className="text-sm">
          <div className="font-medium">{displayWeather.temp}°C</div>
          {displayRisks.warnings.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {displayRisks.warnings.length} warning{displayRisks.warnings.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CloudRain className="h-4 w-4" />
          Weather Conditions
          {jobDate && (
            <Badge variant="outline" className="ml-auto text-xs">
              {format(jobDate, 'MMM d')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current/Job Date Weather */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getWeatherEmoji(displayWeather.condition)}</span>
            <div>
              <div className="text-2xl font-bold">{displayWeather.temp}°C</div>
              <div className="text-sm text-muted-foreground capitalize">
                {currentWeather.description}
              </div>
            </div>
          </div>
        </div>

        {/* Conditions Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{displayWeather.windSpeed} km/h</div>
              <div className="text-xs text-muted-foreground">Wind</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{currentWeather.humidity}%</div>
              <div className="text-xs text-muted-foreground">Humidity</div>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        {displayRisks.warnings.length > 0 && (
          <Alert className={getRiskColor(displayRisks.level)}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Safety Warnings</div>
              <ul className="space-y-1 text-sm">
                {displayRisks.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
              {displayRisks.recommendations.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <div className="font-semibold mb-1 text-xs">Recommendations:</div>
                  <ul className="space-y-1 text-xs">
                    {displayRisks.recommendations.map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 7-Day Forecast */}
        {forecast.length > 0 && !jobDate && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">7-Day Forecast</span>
            </div>
            <div className="space-y-2">
              {forecast.slice(0, 5).map((day) => (
                <div key={day.date} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{format(new Date(day.date), 'EEE, MMM d')}</span>
                  <div className="flex items-center gap-2">
                    <span>{getWeatherEmoji(day.condition)}</span>
                    <span className="font-medium">{day.temp}°C</span>
                    <Wind className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{day.windSpeed} km/h</span>
                    {day.warnings.length > 0 && (
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
