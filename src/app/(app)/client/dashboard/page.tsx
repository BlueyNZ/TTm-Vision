
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase";

export default function ClientDashboardPage() {
    const { user } = useUser();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome, Client!</CardTitle>
                    <CardDescription>This is your client portal. Your jobs will be listed here soon.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This area is currently under construction.</p>
                </CardContent>
            </Card>
        </div>
    );
}
