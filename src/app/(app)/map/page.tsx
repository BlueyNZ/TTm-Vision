
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Map as MapIcon } from "lucide-react";

export default function MapPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Map</CardTitle>
        <CardDescription>
          This feature is currently under construction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
            <MapIcon className="w-16 h-16 mb-4" />
            <p className="text-lg font-semibold">The live map will be displayed here soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
