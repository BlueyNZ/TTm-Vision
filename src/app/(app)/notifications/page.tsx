'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Bell, AlertCircle, Info, Clock, Truck, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import { Job, Staff, Truck as TruckType } from "@/lib/data";
import { useMemo } from "react";
import { differenceInDays } from "date-fns";

type Notification = {
  id: string;
  type: 'new_request' | 'certification_expiring' | 'truck_service' | 'job_starting_soon' | 'license_expiring' | 'client_registration';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'normal' | 'high';
  relatedId?: string;
};

function getNotificationIcon(type: string) {
  switch (type) {
    case 'new_request':
      return <Bell className="h-5 w-5 text-blue-500" />;
    case 'certification_expiring':
    case 'license_expiring':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case 'truck_service':
      return <Truck className="h-5 w-5 text-orange-500" />;
    case 'job_starting_soon':
      return <Calendar className="h-5 w-5 text-green-500" />;
    case 'client_registration':
      return <Bell className="h-5 w-5 text-purple-500" />;
    default:
      return <Info className="h-5 w-5 text-muted-foreground" />;
  }
}

function formatTimestamp(timestamp: Date) {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const firestore = useFirestore();

  // Get pending job requests
  const pendingJobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'job_packs'),
      where('status', '==', 'Pending')
    );
  }, [firestore]);
  const { data: pendingJobs } = useCollection<Job>(pendingJobsQuery);

  // Get upcoming jobs
  const upcomingJobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'job_packs'),
      where('status', '==', 'Upcoming')
    );
  }, [firestore]);
  const { data: upcomingJobs } = useCollection<Job>(upcomingJobsQuery);

  // Get all staff for certification checks
  const staffQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'staff'));
  }, [firestore]);
  const { data: allStaff } = useCollection<Staff>(staffQuery);

  // Get all trucks for service checks
  const trucksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'trucks'));
  }, [firestore]);
  const { data: allTrucks } = useCollection<TruckType>(trucksQuery);

  // Get pending client registrations
  const clientRegistrationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'client_registrations'),
      where('status', '==', 'Pending')
    );
  }, [firestore]);
  const { data: pendingRegistrations } = useCollection(clientRegistrationsQuery);

    // Generate notifications from real data
  const notifications = useMemo(() => {
    const notifs: Notification[] = [];
    const now = new Date();

    // 1. Pending client registrations
    pendingRegistrations?.forEach((registration: any) => {
      const requestedAt = registration.requestedAt instanceof Timestamp 
        ? registration.requestedAt.toDate() 
        : new Date(registration.requestedAt);
      
      notifs.push({
        id: `registration-${registration.id}`,
        type: 'client_registration',
        title: 'New Client Registration',
        message: `${registration.companyName} (${registration.contactName}) is awaiting approval`,
        timestamp: requestedAt,
        priority: 'high',
        relatedId: registration.id,
      });
    });

    // 2. Pending job requests
    pendingJobs?.forEach(job => {
      notifs.push({
        id: `request-${job.id}`,
        type: 'new_request',
        title: 'New Job Request',
        message: `Job request from ${job.clientName} at ${job.location}`,
        timestamp: now,
        priority: 'high',
        relatedId: job.id,
      });
    });

    // 2. Jobs starting soon (within 3 days)
    upcomingJobs?.forEach(job => {
      const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
      const daysUntil = differenceInDays(startDate, now);
      
      if (daysUntil >= 0 && daysUntil <= 3) {
        notifs.push({
          id: `job-soon-${job.id}`,
          type: 'job_starting_soon',
          title: 'Job Starting Soon',
          message: `${job.jobNumber} at ${job.location} starts ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`,
          timestamp: startDate,
          priority: daysUntil <= 1 ? 'high' : 'normal',
          relatedId: job.id,
        });
      }
    });

    // 3. Expiring certifications (within 30 days)
    allStaff?.forEach(staff => {
      staff.certifications?.forEach(cert => {
        const expiryDate = cert.expiryDate instanceof Timestamp ? cert.expiryDate.toDate() : new Date(cert.expiryDate);
        const daysUntilExpiry = differenceInDays(expiryDate, now);
        
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
          notifs.push({
            id: `cert-${staff.id}-${cert.name}`,
            type: 'certification_expiring',
            title: 'Certification Expiring Soon',
            message: `${staff.name}'s ${cert.name} certification expires in ${daysUntilExpiry} days`,
            timestamp: expiryDate,
            priority: daysUntilExpiry <= 7 ? 'high' : 'normal',
            relatedId: staff.id,
          });
        }
      });

      // 4. Expiring licenses (within 30 days)
      staff.licenses?.forEach(license => {
        const expiryDate = license.expiryDate instanceof Timestamp ? license.expiryDate.toDate() : new Date(license.expiryDate);
        const daysUntilExpiry = differenceInDays(expiryDate, now);
        
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
          notifs.push({
            id: `license-${staff.id}-${license.name}`,
            type: 'license_expiring',
            title: 'License Expiring Soon',
            message: `${staff.name}'s ${license.name} expires in ${daysUntilExpiry} days`,
            timestamp: expiryDate,
            priority: daysUntilExpiry <= 7 ? 'high' : 'normal',
            relatedId: staff.id,
          });
        }
      });
    });

    // 5. Truck service due soon
    allTrucks?.forEach(truck => {
      const nextServiceDate = truck.service.nextServiceDate instanceof Timestamp 
        ? truck.service.nextServiceDate.toDate() 
        : new Date(truck.service.nextServiceDate);
      const daysUntilService = differenceInDays(nextServiceDate, now);
      const kmsUntilService = truck.service.nextServiceKms - truck.currentKms;
      
      if (daysUntilService >= 0 && daysUntilService <= 14) {
        notifs.push({
          id: `truck-date-${truck.id}`,
          type: 'truck_service',
          title: 'Truck Service Due Soon',
          message: `${truck.name} (${truck.plate}) service due in ${daysUntilService} days`,
          timestamp: nextServiceDate,
          priority: daysUntilService <= 7 ? 'high' : 'normal',
          relatedId: truck.id,
        });
      }
      
      if (kmsUntilService <= 500 && kmsUntilService > 0) {
        notifs.push({
          id: `truck-kms-${truck.id}`,
          type: 'truck_service',
          title: 'Truck Service Due Soon',
          message: `${truck.name} (${truck.plate}) service due in ${kmsUntilService}km`,
          timestamp: now,
          priority: kmsUntilService <= 100 ? 'high' : 'normal',
          relatedId: truck.id,
        });
      }
    });

    // Sort by priority (high first), then timestamp (newest first)
    return notifs.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [pendingJobs, upcomingJobs, allStaff, allTrucks, pendingRegistrations]);

  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;

  return (
    <div className="flex flex-col gap-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with important alerts and reminders
          </p>
        </div>
        {notifications.length > 0 && (
          <Badge variant="default" className="h-8 px-3">
            {notifications.length} Total
          </Badge>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">All Clear!</h3>
            <p className="text-muted-foreground mt-2">
              No notifications at this time. You're all caught up!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`card-modern transition-all hover:shadow-md ${
                notification.priority === 'high' ? 'border-l-4 border-l-orange-500' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {notification.title}
                        </h3>
                        <p className="text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {notification.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs flex-shrink-0">
                          High Priority
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(notification.timestamp)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {highPriorityCount > 0 && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <p className="text-sm font-medium">
            {highPriorityCount} high priority {highPriorityCount === 1 ? 'item' : 'items'} requiring attention
          </p>
        </div>
      )}
    </div>
  );
}
