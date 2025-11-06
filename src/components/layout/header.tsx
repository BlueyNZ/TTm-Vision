"use client";

import { usePathname, useRouter } from "next/navigation";
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
import { ArrowLeft, LogOut, ChevronDown, Repeat } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface AppHeaderProps {
  isAdmin?: boolean;
}

export function AppHeader({ isAdmin }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  
  const pathParts = pathname.split("/").filter(Boolean);
  let title = "Dashboard";
  let showBackButton = false;
  let backPath = "";

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Something went wrong. Please try again.",
      });
    }
  };

  const getTitleForPage = (parts: string[]) => {
    const page = parts[0];
    const id = parts[1];
    const action = parts[2];
    
    if (page === 'scheduler') return 'Scheduler';
    if (page === 'requests' && id) return 'Review Request';
    if (page === 'requests') return 'Job Requests';

    if (page === 'settings') return 'Settings';
    if (page === 'support') return 'Support';
    if (page === 'client' && parts.length > 1 && parts[1] === 'request-job') return 'Request Job';

    if (action === 'edit') {
      if(page === 'jobs') return 'Edit Job';
      if(page === 'staff') return 'Edit Staff';
      if(page === 'fleet') return 'Edit Truck';
      return 'Edit Item';
    }

    if (id && id !== 'create') {
      if(page === 'jobs') return 'Job Details';
      if(page === 'staff') return 'Staff Profile';
      if(page === 'fleet') return 'Truck Profile';
      return 'Item Details';
    }

     if (id === 'create') {
      if(page === 'jobs') return 'Create Job';
      if(page === 'staff') return 'Create Staff';
      if(page === 'fleet') return 'Create Truck';
      return 'Create Item';
    }
    
    if (page === 'admin' && parts.length > 1 && parts[1] === 'create-staff') {
        return 'Create Staff';
    }

    if(page) return page.replace(/-/g, " ");

    return "Dashboard";
  }


  // Determine if the back button should be shown and where it should go.
  if (pathParts.length > 0) {
    const page = pathParts[0];

    if (page === 'requests' && pathParts.length > 1) {
      showBackButton = true;
      backPath = '/requests';
    }
    // Always show back button for settings and support
    else if (page === 'scheduler' || page === 'settings' || page === 'support' || (page === 'client' && pathParts[1] === 'request-job')) {
      showBackButton = true;
      backPath = page === 'client' ? '/client/dashboard' : '/dashboard';
    } 
    // Handle top-level management pages
    else if (['jobs', 'staff', 'fleet', 'clients'].includes(page) && pathParts.length === 1) {
      showBackButton = true;
      backPath = '/admin';
    }
    // Handle detail or edit pages within management sections
    else if (['jobs', 'staff', 'fleet'].includes(page) && pathParts.length > 1) {
      showBackButton = true;
      // edit page or deeper should go back to detail page
      if (pathParts[2] === 'edit' || pathParts.length > 2) { 
        backPath = `/${pathParts[0]}/${pathParts[1]}`;
      } else { // Detail page should go back to list page
        backPath = `/${pathParts[0]}`;
      }
    }
    // Handle create staff page
    else if (page === 'admin' && pathParts.length > 1) {
        showBackButton = true;
        backPath = '/admin';
    }
  }


  title = getTitleForPage(pathParts);

  const handleBackClick = () => {
    if (backPath) {
      router.push(backPath);
    } else {
      router.back();
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1 flex items-center gap-4">
        {showBackButton && (
           <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleBackClick}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
        )}
        <h1 className="text-lg font-semibold capitalize md:text-2xl truncate">
          {title}
        </h1>
      </div>
      <div className="flex flex-1 items-center gap-4 md:ml-auto md:flex-initial md:justify-end">
        {isAdmin && (
            <Button asChild variant="outline" size="sm">
              <Link href="/client/dashboard">
                <Repeat className="mr-2 h-4 w-4" />
                Switch to Client View
              </Link>
            </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <span>{user?.displayName || 'My Account'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.displayName || 'My Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/support')}>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
