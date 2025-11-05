
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function RequestJobPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request a New Job</CardTitle>
          <CardDescription>
            Fill out the form below to request a new traffic management job.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-10">
            The job request form is coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
