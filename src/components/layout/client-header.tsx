
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

interface ClientHeaderProps {
  isAdmin?: boolean;
}

export function ClientHeader({ isAdmin }: ClientHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  
  const pathParts = pathname.split("/").filter(Boolean);
  let title = "Dashboard";

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/client-login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Something went wrong. Please try again.",
      });
    }
  };

  if (pathParts.length > 1) {
    title = pathParts[pathParts.length - 1].replace(/-/g, " ");
  }

  const showBackButton = pathParts.length > 2;
  
  const handleBackClick = () => {
    router.back();
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
            <Link href="/dashboard">
              <Repeat className="mr-2 h-4 w-4" />
              Switch to Staff View
            </Link>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <span>{user?.email || 'My Account'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.email || 'My Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/client/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/client/support')}>Support</DropdownMenuItem>
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
