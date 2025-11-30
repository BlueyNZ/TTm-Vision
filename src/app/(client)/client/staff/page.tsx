
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { Job, Client, Staff } from "@/lib/data";
import { collection, query, where } from "firebase/firestore";
import { LoaderCircle, Users, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ClientStaffPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Get current client
  const clientQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'clients'), where('email', '==', user.email));
  }, [firestore, user?.email]);
  const { data: clientData, isLoading: isClientLoading } = useCollection<Client>(clientQuery);
  const currentClient = useMemo(() => clientData?.[0], [clientData]);

  // Get client's jobs
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !currentClient?.id) return null;
    return query(
      collection(firestore, 'job_packs'),
      where('clientId', '==', currentClient.id)
    );
  }, [firestore, currentClient?.id]);
  const { data: jobData, isLoading: isJobsLoading } = useCollection<Job>(jobsQuery);

  // Get all staff
  const staffCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);
  const { data: allStaff, isLoading: isStaffLoading } = useCollection<Staff>(staffCollection);

  // Get unique staff IDs from client's jobs
  const assignedStaffIds = useMemo(() => {
    if (!jobData) return new Set<string>();
    const ids = new Set<string>();
    
    jobData.forEach(job => {
      if (job.stmsId) ids.add(job.stmsId);
      job.tcs?.forEach(tc => {
        if (tc.id) ids.add(tc.id);
      });
    });
    
    return ids;
  }, [jobData]);

  // Filter staff to only those assigned to client's jobs
  const assignedStaff = useMemo(() => {
    if (!allStaff) return [];
    return allStaff.filter(staff => assignedStaffIds.has(staff.id));
  }, [allStaff, assignedStaffIds]);

  const isLoading = isClientLoading || isJobsLoading || isStaffLoading;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STMS':
        return 'bg-primary/20 text-primary border-primary';
      case 'TC':
        return 'bg-blue-500/20 text-blue-800 border-blue-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in">
      <Card className="card-modern overflow-hidden">
        <div className="h-1 w-full gradient-primary"></div>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Assigned Staff</CardTitle>
              <CardDescription>Staff members working on your jobs</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : assignedStaff.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {assignedStaff.map(staff => (
                <Card key={staff.id} className="card-modern">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 rounded-xl">
                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                          {staff.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{staff.name}</h3>
                          <Badge className={`mt-1 ${getRoleColor(staff.role)}`}>
                            {staff.role}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          {staff.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <a 
                                href={`mailto:${staff.email}`}
                                className="hover:text-primary transition-colors truncate"
                              >
                                {staff.email}
                              </a>
                            </div>
                          )}
                          
                          {staff.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              <a 
                                href={`tel:${staff.phone}`}
                                className="hover:text-primary transition-colors"
                              >
                                {staff.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No staff assigned to your jobs yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Staff will appear here once they are assigned to your jobs.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
