import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
        <CardDescription>
          Administrative controls and settings for the company.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is where admin-specific content will be displayed.</p>
      </CardContent>
    </Card>
  );
}
