
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function PaperworkPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paperwork</CardTitle>
        <CardDescription>
          This section will contain all paperwork and forms.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
            <FileText className="w-16 h-16 mb-4" />
            <p className="text-lg font-semibold">The paperwork section is under construction.</p>
        </div>
      </CardContent>
    </Card>
  );
}
