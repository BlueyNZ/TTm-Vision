
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardPage() {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to TrafficFlow</CardTitle>
            <CardDescription>
              This is your main dashboard. Key administrative metrics have been moved to the Admin section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>You can view and manage staff and fleet from the sidebar.</p>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
