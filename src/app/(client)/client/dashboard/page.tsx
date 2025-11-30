
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { Job, Client } from "@/lib/data";
import { collection, Timestamp, query, where, orderBy } from "firebase/firestore";
import { LoaderCircle, Circle, MapPin, Calendar, Building2, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

const getDisplayedStatus = (job: Job) => {
  const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
  const endDate = job.endDate ? (job.endDate instanceof Timestamp ? job.endDate.toDate() : new Date(job.endDate)) : null;
  const now = new Date();

  if (job.status === 'Cancelled') return 'Cancelled';
  if (job.status === 'Completed') return 'Completed';
  if (now < startDate) return 'Upcoming';
  if (endDate && now >= startDate && now <= endDate) return 'In Progress';
  return job.status;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Upcoming':
      return 'secondary';
    case 'In Progress':
      return 'default';
    case 'Cancelled':
      return 'destructive';
    case 'Completed':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'fill-success';
      case 'Cancelled':
        return 'fill-destructive';
      default:
        return 'fill-muted-foreground';
    }
};

export default function ClientDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Get current client based on logged-in user email
  const clientQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'clients'), where('email', '==', user.email));
  }, [firestore, user?.email]);
  const { data: clientData, isLoading: isClientLoading } = useCollection<Client>(clientQuery);
  const currentClient = useMemo(() => clientData?.[0], [clientData]);

  // Get jobs for this client
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !currentClient?.id) return null;
    return query(
      collection(firestore, 'job_packs'),
      where('clientId', '==', currentClient.id),
      orderBy('startDate', 'desc')
    );
  }, [firestore, currentClient?.id]);
  const { data: jobData, isLoading: isJobsLoading } = useCollection<Job>(jobsQuery);

  const activeJobs = useMemo(() => {
    if (!jobData) return [];
    return jobData.filter(job => {
      const status = getDisplayedStatus(job);
      return status === 'In Progress' || status === 'Upcoming';
    });
  }, [jobData]);

  const completedJobs = useMemo(() => {
    if (!jobData) return [];
    return jobData.filter(job => getDisplayedStatus(job) === 'Completed').slice(0, 5);
  }, [jobData]);

  const isLoading = isUserLoading || isClientLoading || isJobsLoading;

  return (
    <div className="flex flex-col gap-6 animate-in">
      <Card className="card-modern overflow-hidden">
        <div className="h-1 w-full gradient-primary"></div>
        <CardHeader className="text-center pb-8 pt-8">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome, {currentClient?.name || user?.displayName || 'Client'}!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Manage your jobs and view project status
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {isLoading ? <LoaderCircle className="h-8 w-8 animate-spin" /> : activeJobs.length}
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {isLoading ? <LoaderCircle className="h-8 w-8 animate-spin" /> : jobData?.filter(j => getDisplayedStatus(j) === 'Completed').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <LoaderCircle className="h-8 w-8 animate-spin" /> : jobData?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request New Job Button */}
      <Card className="card-modern">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center text-white">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Need a new job?</h3>
                <p className="text-sm text-muted-foreground">Submit a job request to get started</p>
              </div>
            </div>
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/client/request-job">
                Request New Job
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      <Card className="card-modern">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Active Jobs</CardTitle>
              <CardDescription>Currently in progress or upcoming</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeJobs.length > 0 ? (
            <div className="space-y-3">
              {activeJobs.map(job => {
                const displayedStatus = getDisplayedStatus(job);
                const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);

                return (
                  <div key={job.id} className="group p-4 border border-border/50 rounded-xl hover:border-primary/50 transition-all hover:shadow-md bg-card/50">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold text-base sm:text-lg flex items-center gap-2">
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0"/>
                          <span className="line-clamp-2">{job.location}</span>
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Job #{job.jobNumber}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>
                          <span className="truncate">{format(startDate, 'eeee, dd MMM yyyy')}</span>
                        </p>
                      </div>
                      <Badge 
                        variant={getStatusVariant(displayedStatus)}
                        className={cn(
                          "flex items-center gap-2 w-fit h-fit text-xs sm:text-sm", 
                          displayedStatus === 'In Progress' && 'bg-success/20 text-green-800 border-success'
                        )}
                      >
                        <Circle className={cn("h-2 w-2", getStatusColor(displayedStatus))}/>
                        {displayedStatus}
                      </Badge>
                    </div>
                    {job.stms && (
                      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                        <span className="font-medium">STMS:</span> {job.stms}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">No active jobs at the moment.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Completed Jobs */}
      {completedJobs.length > 0 && (
        <Card className="card-modern">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-success to-success/70 flex items-center justify-center text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Recently Completed</CardTitle>
                <CardDescription>Your latest completed jobs</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedJobs.map(job => {
                const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);

                return (
                  <div key={job.id} className="p-4 border border-border/50 rounded-xl bg-card/50">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold text-base flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                          <span className="line-clamp-2">{job.location}</span>
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Job #{job.jobNumber} • {format(startDate, 'dd MMM yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline" className="w-fit h-fit">
                        <Circle className="h-2 w-2 fill-muted-foreground mr-2"/>
                        Completed
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
