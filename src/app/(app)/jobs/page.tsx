
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllJobsList } from "@/components/jobs/all-jobs-list";
import { JobRequestsList } from "@/components/jobs/job-requests-list";


export default function JobsPage() {
  return (
    <>
    <Tabs defaultValue="all">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
            <TabsTrigger value="all">All Jobs</TabsTrigger>
            <TabsTrigger value="requests">Job Requests</TabsTrigger>
        </TabsList>
         <Button asChild>
            <Link href="/jobs/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Job
            </Link>
          </Button>
      </div>
      <TabsContent value="all">
        <Card>
            <CardHeader>
                <CardTitle>All Jobs</CardTitle>
                <CardDescription>
                View and manage all active, upcoming, and completed jobs.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <AllJobsList />
            </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="requests">
         <Card>
            <CardHeader>
                <CardTitle>Job Requests</CardTitle>
                <CardDescription>
                Review, approve, or deny new job requests submitted by clients.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <JobRequestsList />
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </>
  );
}
