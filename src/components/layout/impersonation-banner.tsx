'use client';

import { useTenant } from '@/contexts/tenant-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedTenantName, stopImpersonating } = useTenant();

  if (!isImpersonating || !impersonatedTenantName) {
    return null;
  }

  return (
    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950 mb-4 rounded-none border-b-2">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200 font-medium">
            You are viewing as <strong>{impersonatedTenantName}</strong> (Super Admin Mode)
          </AlertDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={stopImpersonating}
          className="border-orange-600 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900"
        >
          <X className="h-3 w-3 mr-1" />
          Exit View Mode
        </Button>
      </div>
    </Alert>
  );
}
