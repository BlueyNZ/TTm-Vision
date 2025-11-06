
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Scan } from "lucide-react";

export default function EquipmentTrackingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Tracking</CardTitle>
        <CardDescription>
          This feature is currently under construction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
            <Scan className="w-16 h-16 mb-4" />
            <p className="text-lg font-semibold">The equipment tracking system will be available here soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
