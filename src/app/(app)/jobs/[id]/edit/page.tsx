
'use client';
import { useParams, useRouter } from 'next/navigation';
import { jobData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

export default function JobEditPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;
  
  const [job, setJob] = useState(jobData.find((j) => j.id === jobId));

  useEffect(() => {
    // In a real app, you'd fetch this data from a server
    const currentJob = jobData.find((j) => j.id === jobId);
    if (currentJob) {
      setJob(currentJob);
    }
  }, [jobId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!job) return;
    const { name, value } = e.target;
    setJob({ ...job, [name]: value });
  };
  
  const handleStatusChange = (value: string) => {
    if (!job) return;
    setJob({ ...job, status: value as typeof job.status });
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this data to your API to save it
    console.log('Updated Job Data:', job);
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
            <Input id="stms" name="stms" value={job.stms} onChange={handleInputChange} />
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
