
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { Client } from "@/lib/data";
import { collection, query, where, addDoc, Timestamp } from "firebase/firestore";
import { LoaderCircle, MapPin, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { LocationAutocompleteInput } from "@/components/jobs/location-autocomplete-input";

export default function RequestJobPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current client
  const clientQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'clients'), where('email', '==', user.email));
  }, [firestore, user?.email]);
  const { data: clientData, isLoading: isClientLoading } = useCollection<Client>(clientQuery);
  const currentClient = useMemo(() => clientData?.[0], [clientData]);

  const [formData, setFormData] = useState({
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    specialRequirements: '',
  });

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    setFormData(prev => ({ ...prev, location: place.formatted_address || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firestore || !currentClient) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to submit request. Please try again.",
      });
      return;
    }

    if (!formData.location || !formData.startDate) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create job request with 'Pending' status
      await addDoc(collection(firestore, 'job_packs'), {
        clientId: currentClient.id,
        clientName: currentClient.name,
        location: formData.location,
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: formData.endDate ? Timestamp.fromDate(new Date(formData.endDate)) : null,
        description: formData.description || '',
        specialRequirements: formData.specialRequirements || '',
        status: 'Pending',
        createdAt: Timestamp.now(),
        requestedBy: user?.email || '',
        jobNumber: 0, // Will be assigned when approved
        stms: '',
        stmsId: '',
        tcs: [],
      });

      toast({
        title: "Request Submitted",
        description: "Your job request has been submitted successfully. You'll be notified once it's reviewed.",
        duration: 5000,
      });

      router.push('/client/dashboard');
    } catch (error) {
      console.error('Error submitting job request:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isClientLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentClient) {
    return (
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Client Profile Not Found</CardTitle>
          <CardDescription>
            Unable to find your client profile. Please contact support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in">
      <Card className="card-modern overflow-hidden">
        <div className="h-1 w-full gradient-primary"></div>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Request New Job</CardTitle>
              <CardDescription>Submit a new job request for review</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Info (Read-only) */}
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input 
                value={currentClient.name} 
                disabled 
                className="bg-muted"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Job Location *</Label>
              <LocationAutocompleteInput
                onPlaceSelected={handlePlaceSelected}
                initialValue={formData.location}
              />
              <p className="text-xs text-muted-foreground">Start typing to search for an address</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  min={formData.startDate}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the work to be done..."
                rows={4}
                className="rounded-xl resize-none"
              />
            </div>

            {/* Special Requirements */}
            <div className="space-y-2">
              <Label htmlFor="specialRequirements">Special Requirements</Label>
              <Textarea
                id="specialRequirements"
                value={formData.specialRequirements}
                onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                placeholder="Any special requirements or notes..."
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/client/dashboard')}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
