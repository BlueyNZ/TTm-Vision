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
import { ArrowLeft, Search, LogOut } from "lucide-react";
import { Input } from "../ui/input";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  
  const pathParts = pathname.split("/").filter(Boolean);
  let title = pathParts[0] || "Dashboard";
  let showBackButton = false;
  let backPath = "";

  const handleLogout = async () => {
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

    if (page === 'settings') return 'Settings';
    if (page === 'support') return 'Support';

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

    if(page) return page.replace(/-/g, " ");

    return "Dashboard";
  }


  if (pathParts.length > 1 || ['settings', 'support'].includes(pathParts[0])) {
      showBackButton = true;
      if (['settings', 'support'].includes(pathParts[0])) {
        backPath = '/dashboard';
      } else if (pathParts.length > 2 && pathParts[2] === 'edit') {
        backPath = `/${pathParts[0]}/${pathParts[1]}`;
      } else {
        backPath = `/${pathParts[0]}`;
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
                <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200/200`} alt={user?.displayName || "User"} />
                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
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
