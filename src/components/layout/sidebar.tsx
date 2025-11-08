
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
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Staff } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "../ui/badge";

interface AppSidebarProps {
  isAdmin?: boolean;
}

export function AppSidebar({ isAdmin }: AppSidebarProps) {
  const pathname = usePathname();
  const isManagementPagesActive = ["/staff", "/fleet", "/jobs", "/clients", "/admin", "/map", "/equipment-tracking", "/paperwork"].some(path => pathname.startsWith(path));
  const isRequestsPagesActive = pathname.startsWith("/requests");
  const isAdminPagesActive = pathname.startsWith("/admin");


  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <TrafficCone className="h-8 w-8 text-sidebar-primary" />
          <h2 className="text-xl font-bold text-sidebar-foreground">TTM Vision</h2>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Dashboard"
              isActive={pathname === "/dashboard"}
            >
              <Link href="/dashboard">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
                      <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/requests")}>
                           <Link href="/requests">
                            Job Requests
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
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/paperwork")}>
                          <Link href="/paperwork">
                            Paperwork
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/map")}>
                           <Link href="/map" className="flex justify-between items-center w-full">
                            <span>Map</span>
                            <Badge variant="outline" className="text-xs bg-yellow-400/20 text-yellow-400 font-semibold border-yellow-500">Coming Soon</Badge>
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
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/admin/company-approval")}>
                          <Link href="/admin/company-approval">
                            Company Approval
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
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
                />
                <p className="text-xs text-sidebar-foreground/70">
                  Sponsored Content
                </p>
              </Link>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-center p-2 group-data-[collapsible=icon]:hidden">
          <Badge variant="secondary">v0.2 Beta</Badge>
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
