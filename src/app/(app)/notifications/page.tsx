'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, AlertCircle, Info, Clock, Truck, Calendar, UserCog, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { useTenant } from '@/contexts/tenant-context';
import { Job, Staff, Truck as TruckType } from "@/lib/data";
import { useMemo, useState, useEffect } from "react";
import { differenceInDays } from "date-fns";
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const router = useRouter();
  const { tenantId } = useTenant();

  // Mark notifications as viewed when page loads
  useEffect(() => {
    localStorage.setItem('notificationsLastViewed', new Date().toISOString());
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    switch (notification.type) {
      case 'new_request':
        if (notification.relatedId) {
          router.push(`/requests/${notification.relatedId}`);
        }
        break;
      case 'job_starting_soon':
        if (notification.relatedId) {
          router.push(`/jobs/${notification.relatedId}`);
        }
        break;
      case 'certification_expiring':
      case 'license_expiring':
        router.push('/staff');
        break;
      case 'truck_service':
        router.push('/fleet');
        break;
      case 'client_registration':
        router.push('/admin');
        break;
    }
  };

  // Get pending job requests
  const pendingJobsQuery = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(
      collection(firestore, 'job_packs'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'Pending')
    );
  }, [firestore, tenantId]);
  const { data: pendingJobs } = useCollection<Job>(pendingJobsQuery);

  // Get upcoming jobs
  const upcomingJobsQuery = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(
      collection(firestore, 'job_packs'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'Upcoming')
    );
  }, [firestore, tenantId]);
  const { data: upcomingJobs } = useCollection<Job>(upcomingJobsQuery);

  // Get all staff for certification checks
  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'staff'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
  const { data: allStaff } = useCollection<Staff>(staffQuery);

  // Get all trucks for service checks
  const trucksQuery = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'trucks'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
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
          priority: 'normal',
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

  // Categorize notifications
  const categorizedNotifications = useMemo(() => {
    return {
      urgent: notifications.filter(n => n.priority === 'high'),
      requests: notifications.filter(n => n.type === 'new_request' || n.type === 'client_registration'),
      jobs: notifications.filter(n => n.type === 'job_starting_soon'),
      staff: notifications.filter(n => n.type === 'certification_expiring' || n.type === 'license_expiring'),
      fleet: notifications.filter(n => n.type === 'truck_service'),
    };
  }, [notifications]);

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <Card 
      key={notification.id} 
      className={`card-modern transition-all hover:shadow-md cursor-pointer ${
        notification.priority === 'high' ? 'border-l-4 border-l-orange-500' : ''
      }`}
      onClick={() => handleNotificationClick(notification)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-tight">
                {notification.title}
              </h3>
              {notification.priority === 'high' && (
                <Badge variant="destructive" className="text-xs flex-shrink-0 h-5">
                  Urgent
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTimestamp(notification.timestamp)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="text-center py-8">
      <Icon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
      <h3 className="font-medium text-muted-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground/70 mt-1">{description}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with important alerts and reminders
          </p>
        </div>
        <div className="flex items-center gap-2">
          {highPriorityCount > 0 && (
            <Badge variant="destructive" className="h-8 px-3">
              {highPriorityCount} Urgent
            </Badge>
          )}
          {notifications.length > 0 && (
            <Badge variant="secondary" className="h-8 px-3">
              {notifications.length} Total
            </Badge>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">All Clear!</h3>
            <p className="text-muted-foreground mt-2">
              No notifications at this time. You're all caught up!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all" className="relative">
              All
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="urgent" className="relative">
              Urgent
              {categorizedNotifications.urgent.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                  {categorizedNotifications.urgent.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {categorizedNotifications.requests.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {categorizedNotifications.requests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="jobs">
              Jobs
              {categorizedNotifications.jobs.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {categorizedNotifications.jobs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="staff">
              Staff
              {categorizedNotifications.staff.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {categorizedNotifications.staff.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="fleet">
              Fleet
              {categorizedNotifications.fleet.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {categorizedNotifications.fleet.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-6">
            {notifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
          </TabsContent>

          <TabsContent value="urgent" className="space-y-3 mt-6">
            {categorizedNotifications.urgent.length === 0 ? (
              <EmptyState 
                icon={AlertCircle}
                title="No Urgent Items"
                description="All high priority notifications have been addressed"
              />
            ) : (
              categorizedNotifications.urgent.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-3 mt-6">
            {categorizedNotifications.requests.length === 0 ? (
              <EmptyState 
                icon={FileCheck}
                title="No Pending Requests"
                description="No job requests or client registrations awaiting review"
              />
            ) : (
              categorizedNotifications.requests.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-3 mt-6">
            {categorizedNotifications.jobs.length === 0 ? (
              <EmptyState 
                icon={Calendar}
                title="No Upcoming Jobs"
                description="No jobs starting in the next 3 days"
              />
            ) : (
              categorizedNotifications.jobs.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </TabsContent>

          <TabsContent value="staff" className="space-y-3 mt-6">
            {categorizedNotifications.staff.length === 0 ? (
              <EmptyState 
                icon={UserCog}
                title="All Certifications Current"
                description="No certifications or licenses expiring in the next 30 days"
              />
            ) : (
              categorizedNotifications.staff.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </TabsContent>

          <TabsContent value="fleet" className="space-y-3 mt-6">
            {categorizedNotifications.fleet.length === 0 ? (
              <EmptyState 
                icon={Truck}
                title="Fleet Maintenance Up to Date"
                description="No truck services due in the next 14 days"
              />
            ) : (
              categorizedNotifications.fleet.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
