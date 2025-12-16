
"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Truck,
  Settings,
  LifeBuoy,
  TrafficCone,
  Shield,
  ChevronDown,
  FileText,
  Briefcase,
  UserPlus,
  Building,
  GitPullRequest,
  Calendar,
  Map,
  Scan,
  Info,
  Star,
  Bell,
  Code,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Staff, Job } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "../ui/badge";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { TenantSwitcher } from "./tenant-switcher";

interface AppSidebarProps {
  isAdmin?: boolean;
}

export function AppSidebar({ isAdmin }: AppSidebarProps) {
  const pathname = usePathname();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check for superAdmin custom claim
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (user) {
        try {
          // Force token refresh to get latest claims
          const tokenResult = await user.getIdTokenResult(true);
          console.log("🔍 All custom claims:", tokenResult.claims);
          console.log("🔐 SuperAdmin status:", tokenResult.claims.superAdmin);
          setIsSuperAdmin(tokenResult.claims.superAdmin === true);
        } catch (error) {
          console.error("Error checking superAdmin claim:", error);
          setIsSuperAdmin(false);
        }
      } else {
        setIsSuperAdmin(false);
      }
    };
    
    checkSuperAdmin();
  }, [user]);

  const jobRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'job_packs'), where('status', '==', 'Pending'));
  }, [firestore]);

  const { data: jobRequests } = useCollection<Job>(jobRequestsQuery);
  const pendingRequestsCount = jobRequests?.length || 0;

  // Query for upcoming jobs (for job starting soon notifications)
  const upcomingJobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'job_packs'), where('status', '==', 'Upcoming'));
  }, [firestore]);
  const { data: upcomingJobs } = useCollection<Job>(upcomingJobsQuery);

  // Query for pending client registrations
  const clientRegistrationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'client_registrations'), where('status', '==', 'Pending'));
  }, [firestore]);
  const { data: pendingRegistrations } = useCollection(clientRegistrationsQuery);
  const pendingRegistrationsCount = pendingRegistrations?.length || 0;

  // Track if user has viewed notifications page
  const [hasViewedNotifications, setHasViewedNotifications] = useState(false);

  // Check localStorage for last viewed timestamp
  useEffect(() => {
    const lastViewed = localStorage.getItem('notificationsLastViewed');
    if (lastViewed) {
      const viewedTime = new Date(lastViewed).getTime();
      const now = new Date().getTime();
      // If viewed within last 5 minutes, hide the badge
      setHasViewedNotifications(now - viewedTime < 5 * 60 * 1000);
    }
  }, [pathname]);

  // Count notifications (pending requests + jobs starting in 3 days + pending registrations)
  const notificationCount = useMemo(() => {
    let count = pendingRequestsCount + pendingRegistrationsCount;
    const now = new Date();
    upcomingJobs?.forEach(job => {
      const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
      const daysUntil = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= 3) count++;
    });
    return count;
  }, [pendingRequestsCount, pendingRegistrationsCount, upcomingJobs]);

  const isManagementPagesActive = ["/staff", "/fleet", "/jobs", "/clients", "/admin", "/equipment-tracking"].some(path => pathname.startsWith(path));
  const isRequestsPagesActive = pathname.startsWith("/requests");
  const isAdminPagesActive = pathname.startsWith("/admin");
  const isDashboardPagesActive = ["/dashboard", "/map", "/paperwork"].some(path => pathname.startsWith(path));


  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <TrafficCone className="h-8 w-8 text-sidebar-primary" />
          <h2 className="text-xl font-bold text-sidebar-foreground">TTM Vision</h2>
        </Link>
        <div className="mt-4">
          <TenantSwitcher />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <Collapsible asChild defaultOpen={isDashboardPagesActive}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip="Dashboard"
                  isActive={isDashboardPagesActive}
                  className="justify-between"
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/dashboard"}>
                      <Link href="/dashboard">
                        My Jobs
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuSubButton asChild isActive={pathname.startsWith("/map")}>
                      <Link href="/map">
                        Job Map
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuSubButton asChild isActive={pathname.startsWith("/paperwork")}>
                      <Link href="/paperwork">
                        Paperwork
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          {isAdmin && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Scheduler"
                  isActive={pathname === "/scheduler"}
                >
                  <Link href="/scheduler">
                    <Calendar />
                    <span>Scheduler</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible asChild defaultOpen={isRequestsPagesActive}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Requests"
                      isActive={isRequestsPagesActive}
                      className="justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <GitPullRequest />
                        <span>Requests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {pendingRequestsCount > 0 && (
                           <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground group-data-[collapsible=icon]:hidden">
                            {pendingRequestsCount}
                          </Badge>
                        )}
                        <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/requests")}>
                           <Link href="/requests" className="flex items-center justify-between w-full">
                            <span>Job Requests</span>
                             {pendingRequestsCount > 0 && (
                              <Badge variant="secondary" className="h-5 p-1 text-xs">
                                {pendingRequestsCount}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

               <Collapsible asChild defaultOpen={isManagementPagesActive}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Management"
                      isActive={isManagementPagesActive}
                      className="justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase />
                        <span>Management</span>
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname === "/admin"}>
                           <Link href="/admin">
                            Overview
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/jobs")}>
                           <Link href="/jobs">
                            Jobs
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/fleet")}>
                           <Link href="/fleet">
                            Fleet
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/staff")}>
                          <Link href="/staff">
                            Staff
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/clients")}>
                           <Link href="/clients">
                            Clients
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/notifications")}>
                           <Link href="/notifications" className="flex justify-between items-center w-full">
                            <span className="flex items-center gap-2">
                              Notifications
                              {notificationCount > 0 && !hasViewedNotifications && (
                                <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                                  {notificationCount}
                                </Badge>
                              )}
                            </span>
                            <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-500 font-semibold border-blue-500">New</Badge>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/equipment-tracking")}>
                           <Link href="/equipment-tracking" className="flex justify-between items-center w-full">
                            <span>Equipment</span>
                            <Badge variant="outline" className="text-xs bg-yellow-400/20 text-yellow-400 font-semibold border-yellow-500">Coming Soon</Badge>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              <Collapsible asChild defaultOpen={isAdminPagesActive && pathname !== "/admin"}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Admin"
                      isActive={isAdminPagesActive && pathname !== "/admin"}
                      className="justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Shield />
                        <span>Admin</span>
                        {pendingRegistrationsCount > 0 && (
                          <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                            {pendingRegistrationsCount}
                          </Badge>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/admin/create-staff")}>
                          <Link href="/admin/create-staff">
                            Create Staff
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/admin/client-registrations")}>
                          <Link href="/admin/client-registrations" className="flex justify-between items-center w-full">
                            <span className="flex items-center gap-2">
                              Client Registrations
                              {pendingRegistrationsCount > 0 && (
                                <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                                  {pendingRegistrationsCount}
                                </Badge>
                              )}
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              {isSuperAdmin && (
                <Collapsible asChild defaultOpen={pathname.startsWith("/dev") || pathname.startsWith("/diagnostics") || pathname.startsWith("/test-claims")}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Developer"
                        isActive={pathname.startsWith("/dev") || pathname.startsWith("/diagnostics") || pathname.startsWith("/test-claims")}
                        className="justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Code />
                          <span>Developer</span>
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dev"}>
                            <Link href="/dev">
                              Manage Companies
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/test-claims"}>
                            <Link href="/test-claims">
                              Test Claims
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/diagnostics"}>
                            <Link href="/diagnostics">
                              Diagnostics
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2 group-data-[collapsible=icon]:hidden">
          <Card className="bg-sidebar-accent border-sidebar-border">
            <CardContent className="p-2">
              <Link
                href="#"
                className="flex flex-col items-center gap-2 text-center"
              >
                <Image
                  src="https://picsum.photos/seed/3/200/100"
                  alt="ad"
                  width={200}
                  height={100}
                  className="rounded-md"
                  data-ai-hint="advertisement banner"
                  priority
                />
                <p className="text-xs text-sidebar-foreground/70">
                  Sponsored Content
                </p>
              </Link>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-center p-2 group-data-[collapsible=icon]:hidden">
          <Badge variant="secondary">v1.0 Release</Badge>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="About Us" isActive={pathname === "/about"}>
              <Link href="/about">
                <Info />
                <span>About Us</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Subscription" isActive={pathname === "/subscription"}>
              <Link href="/subscription" className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <Star />
                  <span>Subscription</span>
                </div>
                <Badge variant="outline" className="text-xs bg-yellow-400/20 text-yellow-400 font-semibold border-yellow-500">Coming Soon</Badge>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" isActive={pathname === "/settings"}>
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Support" isActive={pathname === "/support"}>
              <Link href="/support">
                <LifeBuoy />
                <span>Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
