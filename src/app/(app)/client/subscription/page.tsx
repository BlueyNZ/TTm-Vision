
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
    name: 'Basic',
    price: '$49',
    priceSuffix: '/ user / month',
    description: 'For small teams getting started.',
    features: [
      'Job Management',
      'Staff Scheduling',
      'Basic Reporting',
      'Email Support',
    ],
    buttonText: 'Select Basic',
    borderColor: 'border-neutral-300 dark:border-neutral-700',
  },
  {
    name: 'Pro',
    price: '$79',
    priceSuffix: '/ user / month',
    description: 'For growing businesses that need more power.',
    features: [
      'Everything in Basic',
      'Advanced Reporting',
      'Client Portal Access',
      'Fleet Management',
      'Priority Phone & Email Support',
    ],
    buttonText: 'Choose Pro',
    isPopular: true,
    borderColor: 'border-primary',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceSuffix: '',
    description: 'For large organizations with custom needs.',
    features: [
      'Everything in Pro',
      'Custom Integrations (API Access)',
      'Dedicated Account Manager',
      'On-site Training',
      '24/7/365 Support',
    ],
    buttonText: 'Contact Sales',
    borderColor: 'border-blue-500',
  },
];

export default function ClientSubscriptionPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Subscription Plans</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Choose the plan that's right for your business.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.priceSuffix && (
                  <span className="ml-1 text-muted-foreground">
                    {tier.priceSuffix}
                  </span>
                )}
              </div>
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
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
  );
}
