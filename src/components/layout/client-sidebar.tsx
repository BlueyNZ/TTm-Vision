
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
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Settings,
  LifeBuoy,
  TrafficCone,
  Briefcase,
  Info,
  Star,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "../ui/badge";

export function ClientSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/client/dashboard" className="flex items-center gap-2">
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
              isActive={pathname === "/client/dashboard"}
            >
              <Link href="/client/dashboard">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Request Job"
              isActive={pathname === "/client/request-job"}
            >
              <Link href="/client/request-job">
                <Briefcase />
                <span>Request Job</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
          <Badge variant="secondary">v0.2 Beta</Badge>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="About Us" isActive={pathname === "/client/about"}>
              <Link href="/client/about">
                <Info />
                <span>About Us</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Subscription" isActive={pathname === "/client/subscription"}>
              <Link href="/client/subscription" className="flex justify-between items-center w-full">
                 <div className="flex items-center gap-2">
                  <Star />
                  <span>Subscription</span>
                </div>
                <Badge variant="outline" className="text-xs bg-yellow-400/20 text-yellow-400 font-semibold border-yellow-500">Coming Soon</Badge>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" isActive={pathname === "/client/settings"}>
              <Link href="/client/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Support" isActive={pathname === "/client/support"}>
              <Link href="/client/support">
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
