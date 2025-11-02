import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to TrafficFlow</CardTitle>
        <CardDescription>
          This is your main dashboard. Key administrative metrics have been moved to the Admin section.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>You can view and manage jobs, staff, and fleet from the sidebar.</p>
      </CardContent>
    </Card>
  );
}
