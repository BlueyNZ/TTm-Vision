
'use client';
import { useParams, useRouter } from 'next/navigation';
import { jobData, Staff } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { StaffSelector } from '@/components/staff/staff-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


export default function JobEditPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  const firestore = useFirestore();

  const [job, setJob] = useState(jobData.find((j) => j.id === jobId));
  const [selectedStms, setSelectedStms] = useState<Staff | null>(null);
  const [selectedTcs, setSelectedTcs] = useState<Staff[]>([]);

  const staffCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);

  const { data: staffList, isLoading: isLoadingStaff } = useCollection<Staff>(staffCollection);

  useEffect(() => {
    // In a real app, you'd fetch this data from a server
    const currentJob = jobData.find((j) => j.id === jobId);
    if (currentJob) {
      setJob(currentJob);
      if (staffList) {
        const stms = staffList.find(s => s.name === currentJob.stms);
        setSelectedStms(stms || null);
      }
    }
  }, [jobId, staffList]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!job) return;
    const { name, value } = e.target;
    setJob({ ...job, [name]: value });
  };
  
  const handleStatusChange = (value: string) => {
    if (!job) return;
    setJob({ ...job, status: value as typeof job.status });
  };

  const handleAddTc = (staff: Staff) => {
    if (!selectedTcs.find(tc => tc.id === staff.id) && selectedStms?.id !== staff.id) {
        setSelectedTcs([...selectedTcs, staff]);
    }
  };

  const handleRemoveTc = (staffId: string) => {
    setSelectedTcs(selectedTcs.filter(tc => tc.id !== staffId));
  }

  const handleSelectStms = (staff: Staff | null) => {
    setSelectedStms(staff);
    // Remove from TCs if they are also selected there
    if (staff) {
        handleRemoveTc(staff.id);
    }
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this data to your API to save it
    console.log('Updated Job Data:', {
        ...job,
        stms: selectedStms?.name,
        tcs: selectedTcs.map(tc => tc.name)
    });
    toast({
      title: 'Job Updated',
      description: `The details for ${job?.location} have been saved.`,
    });
    router.push(`/jobs/${jobId}`);
  };

  if (!job) {
    return <p>Loading job details...</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Job Pack</CardTitle>
          <CardDescription>Update the details for the job at {job.location}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" value={job.location} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Job Description</Label>
            <Textarea id="name" name="name" value={job.name} onChange={handleInputChange} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="stms">STMS</Label>
             <StaffSelector 
                staffList={staffList || []}
                selectedStaff={selectedStms}
                onSelectStaff={handleSelectStms}
                placeholder="Select STMS"
                loading={isLoadingStaff}
                disabledIds={selectedTcs.map(tc => tc.id)}
             />
          </div>
          <div className="space-y-2">
            <Label>Traffic Controllers (TCs)</Label>
             <StaffSelector 
                staffList={staffList || []}
                onSelectStaff={handleAddTc}
                placeholder="Add a TC to the job"
                loading={isLoadingStaff}
                disabledIds={[selectedStms?.id, ...selectedTcs.map(tc => tc.id)].filter((id): id is string => !!id)}
             />
             <div className="space-y-2 pt-2">
                {selectedTcs.map(tc => (
                    <div key={tc.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className='flex items-center gap-3'>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://picsum.photos/seed/${tc.id}/200/200`} />
                                <AvatarFallback>{tc.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm">{tc.name}</p>
                                <p className="text-xs text-muted-foreground">{tc.role}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveTc(tc.id)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {selectedTcs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">No traffic controllers assigned.</p>
                )}
             </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={handleStatusChange} value={job.status}>
                <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
