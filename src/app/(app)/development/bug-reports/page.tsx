'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { LoaderCircle, Bug, ExternalLink, Calendar, User, Globe, Check, Sparkles, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface BugReport {
  id: string;
  title: string;
  description: string;
  stepsToReproduce?: string;
  reportedBy: {
    email: string;
    displayName: string;
    uid: string | null;
  };
  tenantId: string | null;
  tenantName: string | null;
  page: string;
  url: string | null;
  userAgent: string | null;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity?: 'minor' | 'moderate' | 'major' | 'critical';
  detailQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  aiAnalysis?: {
    reasoning: string;
    suggestedActions: string[];
    analyzedAt: Timestamp;
  };
  createdAt: Timestamp;
}

const statusColors = {
  open: 'bg-blue-500',
  'in-progress': 'bg-yellow-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-500',
};

const severityColors = {
  minor: 'bg-gray-500',
  moderate: 'bg-blue-500',
  major: 'bg-orange-500',
  critical: 'bg-red-500',
};

const detailQualityColors = {
  poor: 'bg-red-500',
  fair: 'bg-yellow-500',
  good: 'bg-blue-500',
  excellent: 'bg-green-500',
};

const priorityColors = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

export default function BugReportsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const reportsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'bug_reports'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: reports, isLoading } = useCollection<BugReport>(reportsRef);

  const handleMarkAsFixed = async () => {
    if (!firestore || !selectedReport) return;
    
    setIsUpdating(true);
    try {
      const reportRef = doc(firestore, 'bug_reports', selectedReport.id);
      await updateDoc(reportRef, {
        status: 'resolved'
      });
      
      toast({
        title: 'Status Updated',
        description: 'Bug report marked as resolved.',
      });
      
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating bug report:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to update bug report status.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteReport = async (reportId: string, reportTitle: string) => {
    if (!firestore) return;
    
    if (!confirm(`Are you sure you want to delete the bug report "${reportTitle}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const reportRef = doc(firestore, 'bug_reports', reportId);
      await deleteDoc(reportRef);
      
      toast({
        title: 'Report Deleted',
        description: 'Bug report has been permanently deleted.',
      });
      
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error deleting bug report:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Failed to delete bug report.',
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Bug Reports
              </CardTitle>
              <CardDescription>
                View all bug reports submitted by users
              </CardDescription>
            </div>
            {reports && (
              <Badge variant="secondary" className="text-sm">
                {reports.length} Total Reports
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const createdDate = report.createdAt instanceof Timestamp 
                      ? report.createdAt.toDate() 
                      : new Date(report.createdAt);

                    return (
                      <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium max-w-xs truncate">
                          {report.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusColors[report.status]} text-white`}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${priorityColors[report.priority]} text-white`}>
                            {report.priority}
                          </Badge>
                          {report.aiAnalysis && (
                            <span title="AI Analyzed">
                              <Sparkles className="h-3 w-3 inline-block ml-1 text-purple-500" />
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{report.reportedBy.displayName}</TableCell>
                        <TableCell className="truncate max-w-xs">
                          {report.tenantName || 'N/A'}
                        </TableCell>
                        <TableCell>{format(createdDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReport(report.id, report.title);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No bug reports yet</p>
              <p className="text-sm">Bug reports will appear here when users submit them</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              {selectedReport?.title}
            </DialogTitle>
            <DialogDescription>
              Bug Report Details
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <>
              <ScrollArea className="max-h-[600px] pr-4">
                <div className="space-y-6">
                  {/* Status and Priority */}
                  <div className="flex gap-4 items-center justify-between">
                    <div className="flex gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <Badge variant="outline" className={`${statusColors[selectedReport.status]} text-white mt-1`}>
                          {selectedReport.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Priority</Label>
                        <Badge variant="outline" className={`${priorityColors[selectedReport.priority]} text-white mt-1`}>
                          {selectedReport.priority}
                        </Badge>
                      </div>
                      {selectedReport.severity && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Severity</Label>
                          <Badge variant="outline" className={`${severityColors[selectedReport.severity]} text-white mt-1`}>
                            {selectedReport.severity}
                          </Badge>
                        </div>
                      )}
                      {selectedReport.detailQuality && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Detail Quality</Label>
                          <Badge variant="outline" className={`${detailQualityColors[selectedReport.detailQuality]} text-white mt-1`}>
                            {selectedReport.detailQuality}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {selectedReport.status !== 'resolved' && selectedReport.status !== 'closed' && (
                      <Button 
                        onClick={handleMarkAsFixed}
                        disabled={isUpdating}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {isUpdating ? 'Updating...' : 'Mark as Fixed'}
                      </Button>
                    )}
                  </div>

                <Separator />

                {/* Reported By */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4" />
                    Reported By
                  </div>
                  <div className="ml-6 space-y-1 text-sm">
                    <p><strong>Name:</strong> {selectedReport.reportedBy.displayName}</p>
                    <p><strong>Email:</strong> {selectedReport.reportedBy.email}</p>
                    {selectedReport.tenantName && (
                      <p><strong>Company:</strong> {selectedReport.tenantName}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Date */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar className="h-4 w-4" />
                    Submitted
                  </div>
                  <p className="ml-6 text-sm">
                    {format(
                      selectedReport.createdAt instanceof Timestamp 
                        ? selectedReport.createdAt.toDate() 
                        : new Date(selectedReport.createdAt),
                      'PPpp'
                    )}
                  </p>
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Description</Label>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedReport.description}
                  </p>
                </div>

                {/* Steps to Reproduce */}
                {selectedReport.stepsToReproduce && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Steps to Reproduce</Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {selectedReport.stepsToReproduce}
                    </p>
                  </div>
                )}

                {/* AI Analysis */}
                {selectedReport.aiAnalysis && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        AI Analysis
                      </div>
                      <div className="ml-6 space-y-3 text-sm">
                        <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-md border border-purple-200 dark:border-purple-800">
                          <Label className="text-xs font-semibold text-purple-700 dark:text-purple-300">Reasoning</Label>
                          <p className="text-sm mt-1">{selectedReport.aiAnalysis.reasoning}</p>
                        </div>
                        {selectedReport.aiAnalysis.suggestedActions && selectedReport.aiAnalysis.suggestedActions.length > 0 && (
                          <div>
                            <Label className="text-xs font-semibold">Suggested Actions</Label>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {selectedReport.aiAnalysis.suggestedActions.map((action, idx) => (
                                <li key={idx} className="text-sm">{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Technical Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Globe className="h-4 w-4" />
                    Technical Details
                  </div>
                  <div className="ml-6 space-y-2 text-sm">
                    <div>
                      <strong>Page:</strong> {selectedReport.page}
                    </div>
                    {selectedReport.url && (
                      <div className="flex items-center gap-2">
                        <strong>URL:</strong>
                        <a 
                          href={selectedReport.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {selectedReport.url.substring(0, 50)}...
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {selectedReport.userAgent && (
                      <div>
                        <strong>User Agent:</strong>
                        <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 p-2 rounded">
                          {selectedReport.userAgent}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <div className="flex items-center justify-between gap-4 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => handleDeleteReport(selectedReport.id, selectedReport.title)}
                disabled={isUpdating}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Report
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                  disabled={isUpdating}
                >
                  Close
                </Button>
                {selectedReport.status !== 'resolved' && (
                  <Button
                    onClick={handleMarkAsFixed}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Mark as Fixed
                  </Button>
                )}
              </div>
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
