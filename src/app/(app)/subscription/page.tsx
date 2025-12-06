
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
import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function SubscriptionPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Simple, transparent pricing for your TTM business.
        </p>
      </div>

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
    </div>
  );
}
