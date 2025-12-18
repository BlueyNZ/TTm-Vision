'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/tenant-context';
import { Staff } from '@/lib/data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Crown } from 'lucide-react';

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferOwnershipDialog({ open, onOpenChange }: TransferOwnershipDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!firestore || !tenantId || !open) return;

    const fetchStaff = async () => {
      try {
        const staffQuery = query(
          collection(firestore, 'staff'),
          where('tenantId', '==', tenantId),
          where('email', '!=', user?.email) // Exclude current user
        );
        const staffSnapshot = await getDocs(staffQuery);
        const staffList = staffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Staff[];
        
        setStaffMembers(staffList);
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load staff members.',
        });
      }
    };

    fetchStaff();
  }, [firestore, tenantId, user?.email, open, toast]);

  const handleTransfer = async () => {
    if (!firestore || !tenantId || !selectedStaffId || !user?.uid) return;

    setIsLoading(true);

    try {
      // Update the new owner's role to 'Owner'
      await updateDoc(doc(firestore, 'staff', selectedStaffId), {
        role: 'Owner',
        accessLevel: 'Admin'
      });

      // Update current owner's role to STMS with Admin access
      const currentStaffQuery = query(
        collection(firestore, 'staff'),
        where('email', '==', user.email),
        where('tenantId', '==', tenantId)
      );
      const currentStaffSnapshot = await getDocs(currentStaffQuery);
      
      if (!currentStaffSnapshot.empty) {
        const currentStaffDoc = currentStaffSnapshot.docs[0];
        await updateDoc(doc(firestore, 'staff', currentStaffDoc.id), {
          role: 'STMS',
          accessLevel: 'Admin'
        });
      }

      toast({
        title: 'Ownership Transferred',
        description: 'The ownership has been successfully transferred.',
      });

      // Refresh the page to update permissions
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      onOpenChange(false);
    } catch (error) {
      console.error('Error transferring ownership:', error);
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: 'Failed to transfer ownership. Please try again.',
      });
    } finally {
      setIsLoading(false);
      setIsConfirming(false);
    }
  };

  const selectedStaff = staffMembers.find(s => s.id === selectedStaffId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Transfer Ownership
          </DialogTitle>
          <DialogDescription>
            Transfer ownership of this company to another staff member.
          </DialogDescription>
        </DialogHeader>

        {!isConfirming ? (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action will transfer full ownership to the selected staff member. 
                You will become an Admin with reduced permissions.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="staff-select">Select New Owner</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger id="staff-select">
                  <SelectValue placeholder="Choose a staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} - {staff.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to transfer ownership to <strong>{selectedStaff?.name}</strong>? 
                This action cannot be undone without their approval.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {!isConfirming ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setIsConfirming(true)}
                disabled={!selectedStaffId || isLoading}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsConfirming(false)}
                disabled={isLoading}
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleTransfer}
                disabled={isLoading}
              >
                {isLoading ? 'Transferring...' : 'Confirm Transfer'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
