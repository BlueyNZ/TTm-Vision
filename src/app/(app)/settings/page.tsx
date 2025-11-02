'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUser, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { doc, collection, query, where, Timestamp } from "firebase/firestore";
import { useCollection, useDoc } from "@/firebase/firestore/use-collection";
import { Staff } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoaderCircle, Edit } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";


export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const { setTheme } = useTheme();

    const [name, setName] = useState('');
    const [emergencyContactName, setEmergencyContactName] = useState('');
    const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const staffQuery = useMemoFirebase(() => {
        if (!firestore || !user?.displayName) return null;
        return query(collection(firestore, 'staff'), where('name', '==', user.displayName));
    }, [firestore, user?.displayName]);

    const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);
    const staffMember = staffData?.[0];

    useEffect(() => {
        if (staffMember) {
            setName(staffMember.name);
            setEmergencyContactName(staffMember.emergencyContact.name);
            setEmergencyContactPhone(staffMember.emergencyContact.phone);
        }
    }, [staffMember]);


    const handleProfileSave = () => {
        if (!firestore || !staffMember) return;
        const staffDocRef = doc(firestore, 'staff', staffMember.id);
        setDocumentNonBlocking(staffDocRef, { 
            name: name,
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
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => setTheme('light')}>Light</Button>
                        <Button variant="outline" onClick={() => setTheme('dark')}>Dark</Button>
                        <Button variant="outline" onClick={() => setTheme('system')}>System</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200/200`} />
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                     <Label htmlFor="avatar-upload">Profile Photo</Label>
                     <p className="text-sm text-muted-foreground pb-2">Upload a new photo for your profile.</p>
                     <Button asChild variant="outline">
                        <label htmlFor="avatar-upload">
                            <Edit className="mr-2 h-4 w-4" />
                            Upload Image
                            <input id="avatar-upload" type="file" className="sr-only" />
                        </label>
                    </Button>
                </div>
            </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email || ''} disabled />
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
