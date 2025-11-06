
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUser, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Staff } from "@/lib/data";
import { LoaderCircle, Info } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [emergencyContactName, setEmergencyContactName] = useState('');
    const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const staffQuery = useMemoFirebase(() => {
        if (!firestore || !user?.email) return null;
        return query(collection(firestore, 'staff'), where('email', '==', user.email));
    }, [firestore, user?.email]);

    const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);
    const staffMember = staffData?.[0];

    useEffect(() => {
        if (staffMember) {
            setName(staffMember.name);
            setPhone(staffMember.phone || '');
            setEmergencyContactName(staffMember.emergencyContact.name);
            setEmergencyContactPhone(staffMember.emergencyContact.phone);
        }
    }, [staffMember]);


    const handleProfileSave = () => {
        if (!firestore || !staffMember) return;
        const staffDocRef = doc(firestore, 'staff', staffMember.id);
        setDocumentNonBlocking(staffDocRef, { 
            name: name,
            phone: phone,
            emergencyContact: {
                name: emergencyContactName,
                phone: emergencyContactPhone,
            }
        }, { merge: true });
        toast({ title: "Profile Updated", description: "Your profile details have been saved." });
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.email) return;
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: "Passwords don't match" });
            return;
        }

        const credential = EmailAuthProvider.credential(user.email, currentPassword);

        try {
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };


    if (isUserLoading || isStaffLoading) {
        return <div className="flex h-full w-full items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-primary" /></div>
    }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
                            Enable dark mode for a better experience at night.
                        </p>
                    </div>
                    <Switch
                        id="dark-mode"
                        checked={theme === 'dark'}
                        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                </div>
            </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="email">Email</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-muted text-muted-foreground border-border" side="top" align="center">
                    <p>Your email cannot be changed. Please contact an administrator if an update is required.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input id="email" type="email" value={user?.email || ''} disabled />
          </div>
           <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
            <Input id="emergencyContactName" value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
            <Input id="emergencyContactPhone" value={emergencyContactPhone} onChange={e => setEmergencyContactPhone(e.target.value)} />
          </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleProfileSave}>Save Changes</Button>
        </CardFooter>
      </Card>
      
        <Card>
            <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Change your password.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}/>
                         <p className="text-xs text-muted-foreground px-1">
                            Use a strong, unique password to keep your account secure. It should be at least 8 characters long.
                        </p>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}/>
                    </div>
                     <Button type="submit">Change Password</Button>
                </form>
            </CardContent>
        </Card>

       <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="job-updates" className="text-base">New Assignments & Changes</Label>
                    <p className="text-sm text-muted-foreground">
                        Receive notifications for new job assignments and updates.
                    </p>
                </div>
                <Switch id="job-updates" defaultChecked />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="fleet-alerts" className="text-base">Fleet Alerts</Label>
                     <p className="text-sm text-muted-foreground">
                        Get alerts for vehicle maintenance and service requirements.
                    </p>
                </div>
                <Switch id="fleet-alerts" />
            </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
            <Button>Save Preferences</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
