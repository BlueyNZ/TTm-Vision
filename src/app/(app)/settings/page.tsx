'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Manage your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="Harrison Price" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="harrison@trafficflow.com" disabled />
          </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
            <Button>Save Changes</Button>
        </CardFooter>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="job-updates" className="text-base">Job Updates</Label>
                    <p className="text-sm text-muted-foreground">
                        Receive notifications for new job assignments and updates.
                    </p>
                </div>
                <Switch id="job-updates" defaultChecked />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="fleet-alerts" className="text-base">Fleet Alerts</Label>
                     <p className="text-sm text-muted-foreground">
                        Get alerts for vehicle maintenance and service requirements.
                    </p>
                </div>
                <Switch id="fleet-alerts" />
            </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
            <Button>Save Preferences</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
