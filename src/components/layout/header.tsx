
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
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "../ui/button";
import { ArrowLeft, LogOut, ChevronDown, Users, Menu, Building2, Crown } from "lucide-react";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/tenant-context";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Tenant, Staff } from "@/lib/data";
import { TransferOwnershipDialog } from "@/components/settings/transfer-ownership-dialog";

interface AppHeaderProps {
  isAdmin?: boolean;
  showSidebar?: boolean;
}

export function AppHeader({ isAdmin, showSidebar = true }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { tenantId } = useTenant();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  
  // Get user's custom claims to determine role
  useEffect(() => {
    if (auth?.currentUser) {
      auth.currentUser.getIdTokenResult().then((idTokenResult) => {
        setUserRole(idTokenResult.claims.role as string || null);
      });
    }
  }, [auth?.currentUser]);
  
  // Check if user is owner of current tenant
  useEffect(() => {
    if (!firestore || !tenantId || !user?.email) return;
    
    const checkOwnership = async () => {
      try {
        const staffQuery = query(
          collection(firestore, 'staff'),
          where('email', '==', user.email),
          where('tenantId', '==', tenantId)
        );
        const staffSnapshot = await getDocs(staffQuery);
        
        if (!staffSnapshot.empty) {
          const staffData = staffSnapshot.docs[0].data() as Staff;
          setIsOwner(staffData.role === 'Owner');
        }
      } catch (error) {
        console.error('Error checking ownership:', error);
      }
    };
    
    checkOwnership();
  }, [firestore, tenantId, user?.email]);
  
  // Fetch company name from tenant
  useEffect(() => {
    if (!firestore || !tenantId) return;
    
    const fetchCompanyName = async () => {
      try {
        const tenantDoc = await getDoc(doc(firestore, 'tenants', tenantId));
        if (tenantDoc.exists()) {
          const tenantData = tenantDoc.data() as Tenant;
          setCompanyName(tenantData.name);
        }
      } catch (error) {
        console.error('Error fetching company name:', error);
      }
    };
    
    fetchCompanyName();
  }, [firestore, tenantId]);
  
  // Only use sidebar hook if sidebar is available
  let toggleSidebar: (() => void) | undefined;
  try {
    if (showSidebar) {
      const sidebar = useSidebar();
      toggleSidebar = sidebar.toggleSidebar;
    }
  } catch {
    // Not in a sidebar context, that's fine
  }
  
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
      router.push('/');
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
    <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b border-border/40 bg-background/95 backdrop-blur-md px-3 sm:px-4 md:px-6 shadow-sm">
      {showSidebar ? (
        <SidebarTrigger className="md:hidden hover:bg-accent/50 transition-colors" />
      ) : (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/client/dashboard')}
          className="md:hidden hover:bg-accent/50 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <div className="flex-1 flex items-center gap-2 sm:gap-4 min-w-0">
        {showBackButton && (
           <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 hover:bg-accent/50 transition-all hover:scale-105" onClick={handleBackClick}>
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Back</span>
            </Button>
        )}
        <div className="flex flex-col min-w-0">
          <h1 className="text-base font-bold capitalize sm:text-lg md:text-2xl truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {title}
          </h1>
          {companyName && (
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{companyName}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-4 md:ml-auto md:flex-initial md:justify-end flex-shrink-0">
        {userRole !== 'client' && (
          <Button 
            variant={pathname.startsWith('/client') ? "default" : "outline"} 
            size="sm" 
            onClick={() => router.push(pathname.startsWith('/client') ? '/dashboard' : '/client/dashboard')}
            className="flex items-center gap-1 sm:gap-2 rounded-xl hover:scale-105 transition-all"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{pathname.startsWith('/client') ? 'Staff View' : 'Client View'}</span>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 hover:bg-accent/50 transition-all rounded-xl">
              <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-sm">
                {(user?.displayName || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline truncate max-w-[120px] md:max-w-none font-medium">{user?.displayName || 'My Account'}</span>
              <span className="sm:hidden font-medium">Menu</span>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/50">
            <DropdownMenuLabel className="truncate font-semibold">{user?.displayName || 'My Account'}</DropdownMenuLabel>
            <DropdownMenuLabel className="truncate text-xs text-muted-foreground font-normal">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-lg cursor-pointer">Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/support')} className="rounded-lg cursor-pointer">Support</DropdownMenuItem>
            {isOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setTransferDialogOpen(true)} 
                  className="rounded-lg cursor-pointer text-amber-600 focus:text-amber-600"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Transfer Ownership
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <TransferOwnershipDialog 
        open={transferDialogOpen} 
        onOpenChange={setTransferDialogOpen} 
      />
    </header>
  );
}
