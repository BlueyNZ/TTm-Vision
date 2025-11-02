
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "../ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "../ui/input";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  
  const pathParts = pathname.split("/").filter(Boolean);
  let title = pathParts[0] || "Dashboard";
  let showBackButton = false;

  if (pathParts.length > 1) {
      showBackButton = true;
      if (pathParts[1] !== 'create' && pathParts[2] !== 'edit') {
        title = "Job Details"
      } else {
        title = pathParts.length > 2 ? "Edit Job" : "Create Job";
      }
  } else if (pathParts[0]) {
      title = pathParts[0].replace(/-/g, " ");
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1 flex items-center gap-4">
        {showBackButton && (
           <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
        )}
        <h1 className="text-lg font-semibold capitalize md:text-2xl truncate">
          {title}
        </h1>
      </div>
      <div className="flex flex-1 items-center gap-4 md:ml-auto md:flex-initial md:justify-end">
        <form className="hidden md:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://picsum.photos/seed/user/200/200" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
