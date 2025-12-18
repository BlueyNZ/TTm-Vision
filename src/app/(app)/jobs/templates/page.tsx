'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobPackTemplate } from "@/lib/data";
import { ArrowLeft, MoreHorizontal, LoaderCircle, Trash2, Edit, FileText } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useTenant } from "@/contexts/tenant-context";
import { CreateTemplateDialog } from "@/components/jobs/create-template-dialog";

export default function TemplatesPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [templateToDelete, setTemplateToDelete] = useState<JobPackTemplate | null>(null);

  const templatesCollection = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'job_pack_templates'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);

  const { data: templateData, isLoading } = useCollection<JobPackTemplate>(templatesCollection);

  const sortedTemplates = useMemo(() => {
    if (!templateData) return [];
    return [...templateData].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }, [templateData]);

  const handleDeleteTemplate = () => {
    if (!firestore || !templateToDelete) return;

    const templateDocRef = doc(firestore, 'job_pack_templates', templateToDelete.id);
    deleteDocumentNonBlocking(templateDocRef);
    
    toast({
      title: "Template Deleted",
      description: `The template "${templateToDelete.name}" has been deleted.`,
      variant: "destructive",
    });

    setTemplateToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <CardTitle className="text-lg sm:text-xl">Job Pack Templates</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage reusable templates for job pack creation.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link href="/jobs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </Link>
            </Button>
            <CreateTemplateDialog>
              <Button size="sm" className="w-full sm:w-auto">
                <FileText className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </CreateTemplateDialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : sortedTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Create your first template to speed up job pack creation with pre-configured settings.
              </p>
              <CreateTemplateDialog>
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Your First Template
                </Button>
              </CreateTemplateDialog>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Template Name</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm">Description</TableHead>
                  <TableHead className="text-xs sm:text-sm">Setup Type</TableHead>
                  <TableHead className="hidden lg:table-cell text-xs sm:text-sm">Default Times</TableHead>
                  <TableHead className="text-xs sm:text-sm">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTemplates?.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {template.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                      <div className="max-w-md truncate text-muted-foreground">
                        {template.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {template.setupType === 'Other' && template.otherSetupType
                          ? template.otherSetupType
                          : template.setupType}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-muted-foreground">
                      {template.siteSetupTime || template.startTime ? (
                        <div className="space-y-1">
                          {template.siteSetupTime && (
                            <div>On Site: {template.siteSetupTime}</div>
                          )}
                          {template.startTime && (
                            <div>Start: {template.startTime}</div>
                          )}
                        </div>
                      ) : (
                        'No defaults'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setTemplateToDelete(template)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template
              <span className="font-semibold"> "{templateToDelete?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
