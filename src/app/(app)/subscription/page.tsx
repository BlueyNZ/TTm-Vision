
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const tiers = [
  {
    name: 'TTM Vision',
    price: '$199',
    priceSuffix: '/ month',
    baseRate: '$199/month base',
    perUserRate: '+ $25/user/month',
    description: 'Complete traffic management solution for your business.',
    features: [
      'Job Management & Scheduling',
      'Staff & Client Management',
      'Fleet & Equipment Tracking',
      'Real-time GPS Tracking',
      'Document Management (TMP, Forms)',
      'Client Portal Access',
      'Mobile App Access',
      'Advanced Analytics & Reporting',
      'Email & Phone Support',
    ],
    buttonText: 'Get Started',
    isPopular: true,
    borderColor: 'border-primary',
  },
];

const addons = [
  {
    id: 'custom-branding',
    name: 'Custom Branding & Job Numbers',
    description: 'Customize your job number prefix and upload your company logo to display on reports and documents.',
    price: '$20',
    priceSuffix: '/ month',
    icon: '🎨',
  },
  {
    id: 'advanced-reporting',
    name: 'Advanced Reporting',
    description: 'Enhanced analytics with custom report builder and automated report scheduling.',
    price: '$30',
    priceSuffix: '/ month',
    icon: '📊',
  },
  {
    id: 'api-access',
    name: 'API Access',
    description: 'Full REST API access to integrate TTM Vision with your existing systems.',
    price: '$40',
    priceSuffix: '/ month',
    icon: '🔌',
  },
];

export default function SubscriptionPage() {
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Simple, transparent pricing for your TTM business.
        </p>
      </div>

      {/* Early Access Disclaimer */}
      <Card className="max-w-4xl mx-auto bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                Early Access
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">Free During Early Access</h3>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                While TTM Vision is in the early stages of development, subscriptions are not yet available. 
                The platform is currently <strong>completely free to use</strong> for all features. 
                We'll notify you well in advance before any subscription plans take effect.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <div className="w-full max-w-md">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={cn(
                'flex flex-col relative',
                tier.borderColor,
                tier.isPopular ? 'border-2' : 'border'
              )}
            >
              {tier.isPopular && (
                <Badge
                  variant="default"
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-6">
                <div>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.priceSuffix && (
                      <span className="ml-1 text-muted-foreground">
                        {tier.priceSuffix}
                      </span>
                    )}
                  </div>
                  {tier.baseRate && (
                    <div className="mt-3 space-y-1">
                      <p className="text-sm text-muted-foreground">{tier.baseRate}</p>
                      <p className="text-sm font-semibold text-primary">{tier.perUserRate}</p>
                    </div>
                  )}
                </div>
                {tier.features && (
                  <ul className="space-y-3 pt-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.isPopular ? 'default' : 'outline'}
                >
                  {tier.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Add-ons Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Add-ons</h2>
          <p className="mt-2 text-muted-foreground">
            Enhance your subscription with powerful add-ons
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {addons.map((addon) => (
            <Card 
              key={addon.id}
              className={cn(
                "transition-all cursor-pointer hover:shadow-lg",
                selectedAddons.includes(addon.id) 
                  ? "border-primary border-2 shadow-md" 
                  : "border hover:border-primary/50"
              )}
              onClick={() => toggleAddon(addon.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{addon.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{addon.name}</CardTitle>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold text-primary">{addon.price}</span>
                        <span className="text-sm text-muted-foreground">{addon.priceSuffix}</span>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                    selectedAddons.includes(addon.id)
                      ? "bg-primary border-primary"
                      : "border-muted-foreground"
                  )}>
                    {selectedAddons.includes(addon.id) && (
                      <Check className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{addon.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedAddons.length > 0 && (
          <Card className="max-w-4xl mx-auto bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Selected Add-ons</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''} selected
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Additional monthly cost</p>
                  <p className="text-2xl font-bold text-primary">
                    ${addons
                      .filter(a => selectedAddons.includes(a.id))
                      .reduce((sum, a) => sum + parseInt(a.price.replace('$', '')), 0)}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
