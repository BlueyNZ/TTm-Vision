
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
  FilePlus,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

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
                <FilePlus />
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
              <Link href="#" className="flex flex-col items-center gap-2 text-center">
                 <Image 
                  src="https://picsum.photos/seed/ad/200/100" 
                  alt="Sponsor ad" 
                  width={200}
                  height={100}
                  className="rounded-md"
                  data-ai-hint="abstract company"
                />
                <p className="text-xs text-sidebar-foreground/70">
                  Sponsored Content Here. <span className="underline">Learn More</span>
                </p>
              </Link>
            </CardContent>
          </Card>
        </div>
        <SidebarMenu>
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
