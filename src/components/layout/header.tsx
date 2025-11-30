
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
import { ArrowLeft, LogOut, ChevronDown } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

    if (page === 'paperwork' && id) return 'Paperwork Menu';
    if (page === 'paperwork') return 'Paperwork';

    if (page === 'settings') return 'Settings';
    if (page === 'support') return 'Support';
    if (page === 'client' && parts.length > 1 && parts[1] === 'request-job') return 'Request Job';

    if (action === 'edit') {
      if(page === 'jobs') return 'Edit Job';
      if(page === 'staff') return 'Edit Staff';
      if(page === 'fleet') return 'Edit Truck';
      return 'Edit Item';
    }

    if (id && id !== 'create' && id !== 'past') {
      if(page === 'jobs' && parts.length > 2) return `Job ${parts[2]}`; // For paperwork subpages
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

    if (id === 'past' && page === 'jobs') {
        return 'Past Jobs';
    }
    
    if (page === 'admin' && parts.length > 1 && parts[1] === 'create-staff') {
        return 'Create Staff';
    }

    if(page) return page.replace(/-/g, " ");

    return "Dashboard";
  }


  // Determine if the back button should be shown
  if (pathParts.length > 0 && pathParts[0] !== 'dashboard') {
    showBackButton = true;
  }
  // Explicitly hide on top-level admin overview
  if (pathParts[0] === 'admin' && pathParts.length === 1) {
    showBackButton = false;
  }
  // Explicitly hide on top-level jobs, staff, fleet, clients pages
  if (['jobs', 'staff', 'fleet', 'clients'].includes(pathParts[0]) && pathParts.length === 1) {
     showBackButton = false;
  }

  title = getTitleForPage(pathParts);

  const handleBackClick = () => {
    router.back();
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b bg-background/80 px-3 sm:px-4 backdrop-blur-sm md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1 flex items-center gap-2 sm:gap-4 min-w-0">
        {showBackButton && (
           <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0" onClick={handleBackClick}>
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only">Back</span>
            </Button>
        )}
        <h1 className="text-base font-semibold capitalize sm:text-lg md:text-2xl truncate">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-4 md:ml-auto md:flex-initial md:justify-end flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <span className="hidden sm:inline truncate max-w-[120px] md:max-w-none">{user?.displayName || 'My Account'}</span>
              <span className="sm:hidden">Menu</span>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{user?.displayName || 'My Account'}</DropdownMenuLabel>
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
