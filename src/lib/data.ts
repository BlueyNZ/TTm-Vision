

import { Timestamp } from "firebase/firestore";

export type Client = {
  id: string;
  name: string;
  userId?: string; // The Firebase Auth UID of the user associated with this client account.
  status: 'Pending' | 'Active';
};

export type Certification = {
  name: 'TTMW' | 'TMO-NP' | 'TMO' | 'STMS-U' | 'STMS (CAT A)' | 'STMS (CAT B)' | 'STMS (CAT C)' | 'STMS-NP';
  expiryDate: Date | Timestamp;
};

export type License = {
  name: 'Class 1 (Learner)' | 'Class 1 (Restricted)' | 'Class 1 (Full)' | 'Class 2' | 'Class 3' | 'Class 4' | 'Class 5' | 'WTR Endorsement';
  expiryDate: Date | Timestamp;
}

export type Staff = {
  id: string;
  name: string;
  email: string;
  phone: string; // Added for SMS notifications
  role: 'TC' | 'STMS' | 'Operator' | 'Owner' | 'Tester';
  certifications: Certification[];
  licenses?: License[];
  emergencyContact: {
    name: string;
    phone: string;
  };
  accessLevel: 'Staff Member' | 'Admin' | 'Client' | 'Client Staff';
  clientId?: string; // ID of the client company if this is a client user
  clientRole?: 'Admin' | 'Staff';
  nztaId?: string;
};

export type Truck = {
  id: string;
  name: string;
  plate: string;
  status: 'Operational' | 'Check Required' | 'In Service';
  service: {
    lastServiceDate: Timestamp | Date | string;
    nextServiceDate: Timestamp | Date | string;
    nextServiceKms: number;
  };
  currentKms: number;
  fuelLog: {
    date: string;
    volumeLiters: number;
    cost: number;
  }[];
};

export type Job = {
  id: string;
  jobNumber: string;
  name: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  description?: string;
  clientName: string;
  clientId?: string;
  startDate: Timestamp | Date | string;
  endDate?: Timestamp | Date | string;
  startTime: string;
  siteSetupTime: string;
  setupType?: 'Stop-Go' | 'Lane Shift' | 'Shoulder' | 'Mobiles' | 'Other';
  otherSetupType?: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled' | 'Pending';
  stms: Staff['name'] | null;
  stmsId: Staff['id'] | null;
  tcs: { id: Staff['id'], name: Staff['name']}[];
  contactPerson?: string;
  contactNumber?: string;
  tmpUrl?: string;
  wapUrl?: string;
  mobileOpsRecords?: OnSiteRecordMobileOps[];
};

export type Timesheet = {
  id: string;
  jobId: string;
  staffId: string;
  staffName: string;
  role: 'STMS' | 'TC/TTMW' | 'TMO' | 'Shadow Driver' | 'Other Driver' | 'Yard Work' | 'Truck';
  jobDate: Timestamp;
  startTime: string;
  finishTime: string;
  breaks: number;
  totalHours: string;
  notes?: string;
  signatureDataUrl: string;
  createdAt: Timestamp;
};

type InspectionCheck = {
    status: "Yes" | "No" | "N/A";
    comments?: string;
};

export type TruckInspection = {
    id: string;
    jobId: string;
    truckId: string;
    driverId: string;
    regoExpires: Timestamp;
    wofExpires: Timestamp;
    rucExpires: string;
    odoStart: number;
    odoEnd: number;
    hubStart: number;
    hubEnd: number;
    
    engineOil: InspectionCheck,
    coolant: InspectionCheck,
    brakeFluid: InspectionCheck,
    adBlue: InspectionCheck,
    brakes: InspectionCheck,
    airBrakes: InspectionCheck,
    tyres: InspectionCheck,
    steering: InspectionCheck,
    lights: InspectionCheck,
    arrowBoard: InspectionCheck,
    pad: InspectionCheck,
    horn: InspectionCheck,
    mirrors: InspectionCheck,
    windscreen: InspectionCheck,
    wipers: InspectionCheck,
    cameras: InspectionCheck,
    cabInterior: InspectionCheck,
    seatBelts: InspectionCheck,
    vehicleExterior: InspectionCheck,
    gateLatches: InspectionCheck,
    
    firstAidKit: InspectionCheck,
    spillKit: InspectionCheck,
    fireExtinguisher: InspectionCheck,
    wheelChocks: InspectionCheck,
  
    additionalComments?: string;
    inspectionDate: Timestamp;
    inspectedById: string;
    signatureDataUrl: string;
    createdAt: Timestamp;
};

export type Hazard = {
  present: 'Yes' | 'No';
  control?: string;
};

export type SiteHazard = {
  description?: string;
  control?: string;
};

export type HazardId = {
  id: string;
  jobId: string;
  hazardIdNo: string;
  performedBy: string;
  signees: number;
  performedAt: Timestamp;
  commonHazards: {
    contractorMovements: Hazard;
    poorRoadSurface: Hazard;
    mobilityScooters: Hazard;
    largeVehicles: Hazard;
    weather: Hazard;
    cyclists: Hazard;
    excessSpeed: Hazard;
    pedestriansFootpathClosed: Hazard;
    pedestriansFootpathDetour: Hazard;
    trafficVehicles: Hazard;
    visibility: Hazard;
  };
  siteSpecificHazards: SiteHazard[];
  siteAccessExit?: string;
  safetyZones?: string;
  evacuationPoints?: string;
  adjustmentsToSite?: string;
  nearestMedicalCentre?: string;
  other?: string;
  requiredPpe?: string[];
  createdAt: Timestamp;
};

export type HazardIdNzgttm = {
  id: string;
  jobId: string;
  hazardIdNo: string;
  performedBy: string;
  performedAt: Timestamp;
  signees: number;
  signaturesObtained: number;
  siteAccessExit?: string;
  safetyZones?: string;
  evacuationPoints?: string;
  adjustmentsToSite?: string;
  nearestMedicalCentre?: string;
  other?: string;
  requiredPpe?: string[];
  otherPpe?: string;
  otherPpeDescription?: string;
  createdAt: Timestamp;
};

type ProcessCheck = {
  status: 'Yes' | 'No' | 'N/A';
};

export type TmpCheckingProcess = {
  id: string;
  jobId: string;
  tmpNumber: string;
  tmdNumber: string;
  tmpType: 'GENERIC' | 'SITE SPECIFIC';
  createdAt: Timestamp;

  // Checks
  locationDetails: {
    correctRoadLevel: ProcessCheck;
    trafficCountConfirmed?: ProcessCheck;
    comment: string;
  };
  shape: {
    intersections: ProcessCheck;
    verticalCurves: ProcessCheck;
    horizontalCurves: ProcessCheck;
    sufficientAdvanceWarning: ProcessCheck;
    comment: string;
  };
  directionAndProtection: {
    sufficientLength: ProcessCheck;
    sufficientWidth: ProcessCheck;
    adequateSightDistance: ProcessCheck;
    sufficientRoomForTtc: ProcessCheck;
    comment: string;
  };
  requiredSpeedRestrictions: {
    correctTsl: ProcessCheck;
    comment: string;
  };
  plantAndEquipment: {
    plantFits: ProcessCheck;
    comment: string;
  };
  personalSafety: {
    workersInWorkingSpace: ProcessCheck;
    comment: string;
  };
  layoutDiagrams: {
    diagramsMatch: ProcessCheck;
    manageHeavyVehicles: ProcessCheck;
    changesRequired: ProcessCheck;
    comment: string;
  };
  
  completedBy: {
    staffId: string;
    staffName: string;
    signatureDataUrl: string;
    dateSigned: Timestamp;
    qualification: string;
  }[];
};

export type WorksiteMonitoring = {
  id?: string;
  checkType: 'Site Set-Up' | 'Site Check' | 'Unattended/Removal';
  date: Date | string;
  time: string;
  signatureDataUrl: string;
  comments: string;
  isNextCheckRequired?: 'Yes' | 'No';
};

export type OnSiteRecord = {
  id: string;
  jobId: string;
  jobDate: Date;
  tmpNumber?: string;
  stmsInChargeId?: string;
  stmsSignatureDataUrl?: string;
  stmsTimeSigned?: Timestamp;
  isStmsInChargeOfWorkingSpace: boolean;
  workingSpacePerson?: string;
  workingSpaceContact?: string;
  workingSpaceSignatureDataUrl?: string;
  workingSpaceTimeSigned?: Timestamp;
  handovers?: TtmHandover[];
  delegations?: TtmDelegation[];
  worksiteMonitoring?: WorksiteMonitoring[];
  temporarySpeedLimits?: TemporarySpeedLimit[];
  generalComments?: string;
  createdAt: Timestamp;
}

export type TtmHandover = {
  id?: string;
  isExternal: boolean;
  receivingStmsId?: string;
  receivingStmsName: string;
  receivingStmsNztaId?: string;
  receivingStmsSignatureDataUrl: string;
  briefingCompleted: boolean;
};

export type TtmDelegation = {
  id?: string;
  isExternal: boolean;
  delegatedPersonId: string;
  delegatedPersonName: string;
  delegatedPersonNztaId?: string;
  delegatedPersonSignatureDataUrl: string;
  briefingCompleted: boolean;
};

export type TemporarySpeedLimit = {
  id?: string;
  streetName: string;
  installDate: Date | string;
  installTime: string;
  removalDate?: Date | string;
  removalTime?: string;
  tslSpeed: number;
  placementFrom: string;
  placementTo: string;
  lengthOfTsl: number;
  dateTslRemainsInPlace?: string;
};

export type OnSiteRecordMobileOps = {
    id: string;
    jobId: string;
    tmpReference: string;
    date: Timestamp;
    stmsId: string;
    stmsName: string;
    stmsWarrantType: string;
    stmsTtmId: string;
    stmsWarrantExpiry: Timestamp;
    stmsSignature: string;
    stmsSignatureTime: string;
    preStartCheckTime: string;
    preStartSignature: string;
    checks: {
        highVis: 'OK' | 'Not OK' | 'N/A';
        beacons: 'OK' | 'Not OK' | 'N/A';
        boards: 'OK' | 'Not OK' | 'N/A';
        tma: 'OK' | 'Not OK' | 'N/A';
        radios: 'OK' | 'Not OK' | 'N/A';
        signs: 'OK' | 'Not OK' | 'N/A';
    };
    operationRecords: { roadName: string; startPoint: string; endPoint: string; startTime: string; endTime: string }[];
    siteChecks: { 
        time: string; 
        distancesMaintained: boolean; 
        positioningMaintained: boolean; 
        boardsMaintained: boolean; 
        roadClear: boolean; 
        staticMaintained: boolean; 
        safetyZonesMaintained: boolean; 
        workingSpaceMaintained: boolean; 
    }[];
    comments: string[];
    createdAt: Timestamp;
}

export type Attachment = {
  name: string;
  url: string;
};

export type JobNote = {
    id: string;
    jobId: string;
    noteType: 'General' | 'Safety' | 'Client Request' | 'Variation';
    description: string;
    updates?: string;
    attachments: Attachment[];
    raisedBy: string;
    raisedById: string;
    dateRaised: Timestamp;
    createdAt: Timestamp;
};


export type SitePhoto = {
    id: string;
    jobId: string;
    photos: {
      url: string;
      comment: string;
    }[];
    submittedBy: string;
    submittedById: string;
    createdAt: Timestamp;
}

export type IncidentReport = {
  id: string;
  jobId: string;
  incidentReferenceNo: string;
  copptmReference?: string;
  incidentDate: Timestamp;
  incidentTime: string;
  reportingCompany: string;
  reportedBy: string; // name
  reportedById: string; // id
  stmsId: string;
  stmsName: string;
  roadLocation: string;
  descriptionOfEvents: string;
  incidentType: string;
  operationType: 'Static' | 'Mobile' | 'Semi-static' | 'Shoulder' | 'Unattended';
  phaseOfOperation: 'Install' | 'Static' | 'Mobile' | 'Semi-Static' | 'Removal';
  damageTo: ('Vehicles' | 'Plant' | 'TTM equipment')[];
  injuries: {
    roadWorkers: { minor: number; notifiable: number; fatal: number };
    roadUsers: { minor: number; notifiable: number; fatal: number };
  };
  roadUserVehicles: { type: string; rego: string }[];
  tmaVehicles: { truckId: string; lane: string }[];
  policeAttended: boolean;
  policeOfficerDetails?: string;
  furtherInformation?: string;
  attachments: Attachment[];
  investigation: {
    assignedToId?: string;
    dateAssigned?: Timestamp;
    status?: string;
    summary?: string;
    potentialConsequence?: string;
    canHappenAgain?: string;
    classification?: string;
    rootCause?: string;
  };
  createdAt: Timestamp;
}

export type AuditScoreItem = {
    tally: number;
};

export type OtherAspectsCheck = 'Yes' | 'No' | 'N/A';

export type SiteAudit = {
  id: string;
  jobId: string;
  auditNumber: string;
  auditType?: string;
  auditDate: Timestamp;
  rca?: string;
  carWapNumber?: string;
  gpsCoordinates?: { lat: number; lng: number };
  roadName?: string;
  suburb?: string;
  roadId?: string;
  ttmRoadLevel?: string;
  activityDescription?: string;
  ttmMethod?: string;
  ttmContractor?: string;
  workingSpaceContractor?: string;
  principal?: string;
  signs: {
    missing: AuditScoreItem;
    position: AuditScoreItem;
    notVisible: AuditScoreItem;
    wrongSign: AuditScoreItem;
    condition: AuditScoreItem;
    permanentSign: AuditScoreItem;
    unapproved: AuditScoreItem;
    nonCompliantSupport: AuditScoreItem;
  };
  mobile: {
    tailPilot: AuditScoreItem;
    leadPilot: AuditScoreItem;
    shadowVehicle: AuditScoreItem;
    tmaMissing: AuditScoreItem;
    awvms: AuditScoreItem;
  };
  pedestrians: {
    inadequateProvision: AuditScoreItem;
    inadequateProvisionCyclists: AuditScoreItem;
  };
  delineation: {
    missingTaper: AuditScoreItem;
    taperTooShort: AuditScoreItem;
    trailingTaper: AuditScoreItem;
    spacingInTaper: AuditScoreItem;
    spacingAlongLanes: AuditScoreItem;
    missingDelineation: AuditScoreItem;
    condition: AuditScoreItem;
    nonApprovedDevice: AuditScoreItem;
    roadMarking: AuditScoreItem;
    siteAccess: AuditScoreItem;
  };
  miscellaneous: {
    workingInLiveLanes: AuditScoreItem;
    missingController: AuditScoreItem;
    safetyZoneCompromised: AuditScoreItem;
    highVisGarment: AuditScoreItem;
    marginalSurface: AuditScoreItem;
    unacceptableSurface: AuditScoreItem;
    barrierDefects: AuditScoreItem;
    unsafeTtm: AuditScoreItem;
    vmsMessage: AuditScoreItem;
    flashingBeacons: AuditScoreItem;
    parkingFeatures: AuditScoreItem;
    unsafeParking: AuditScoreItem;
    marginalItems: AuditScoreItem;
  };
  otherWorksiteAspects: {
    qualifiedPerson: OtherAspectsCheck;
    tslAppropriate: OtherAspectsCheck;
    roadUserFlow: OtherAspectsCheck;
    onSiteRecord: OtherAspectsCheck;
    tmpApproved: OtherAspectsCheck;
    tmpType?: string;
    tmpSighted: OtherAspectsCheck;
    tmpApplicable: OtherAspectsCheck;
    ttmInAccordance: OtherAspectsCheck;
    gtmpCheckForm: OtherAspectsCheck;
    tslMatrix: OtherAspectsCheck;
    riskAssessment: OtherAspectsCheck;
  };
  photos: Attachment[];
  siteFixed: 'Yes' | 'No' | 'N/A';
  siteActivityCeasedBy?: string;
  complaintCallout: 'Yes' | 'No' | 'N/A';
  auditPlanned: 'Planned' | 'Unplanned' | 'N/A';
  siteActivityStatus: 'Attended' | 'Unattended';
  lowRisk: boolean;
  goodSiteInduction: 'Yes' | 'No' | 'N/A';
  tmpDesignIssues: 'Yes' | 'No' | 'N/A';
  notificationsRca: 'Yes' | 'No' | 'N/A';
  finalScore: number;
  finalRating: string;
  comments?: string;
  actionsToBeTaken?: string;
  auditorId: string;
  auditorName: string;
  auditorSignatureUrl: string;
  stmsId?: string;
  stmsName?: string;
  stmsSignatureUrl?: string;
  scrLeftOnsite: boolean;
  createdAt: Timestamp;
}

```
  </change>
  <change>
    <file>src/app/(app)/jobs/[id]/paperwork/site-audit-copttm-scr/page.tsx</file>
    <content><![CDATA[

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LoaderCircle,
  PlusCircle,
  FileText,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Job, SiteAudit } from '@/lib/data';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


export default function SiteAuditsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [itemToDelete, setItemToDelete] = useState<SiteAudit | null>(null);

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);

  const auditsRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return collection(firestore, 'job_packs', jobId, 'site_audits');
  }, [firestore, jobId]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: audits, isLoading: areItemsLoading } = useCollection<SiteAudit>(auditsRef);

  const isLoading = isJobLoading || areItemsLoading;

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    deleteDocumentNonBlocking(doc(firestore, 'job_packs', jobId, 'site_audits', itemToDelete.id));
    toast({
        variant: "destructive",
        title: "Site Audit Deleted",
        description: `The audit has been deleted.`,
    });
    setItemToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Site Audits (CoPTTM SCR)</CardTitle>
            <CardDescription>
              All audits for job {job?.jobNumber || '...'}.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/jobs/${jobId}/paperwork/site-audit-copttm-scr/create`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Audit
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          ) : audits && audits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Audit No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Final Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((item) => {
                  const auditDate = item.auditDate instanceof Timestamp ? item.auditDate.toDate() : new Date(item.auditDate);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.auditNumber}</TableCell>
                      <TableCell>{format(auditDate, 'PPP')}</TableCell>
                      <TableCell>{item.auditorName}</TableCell>
                      <TableCell>{item.finalScore}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => router.push(`/jobs/${jobId}/paperwork/site-audit-copttm-scr/create?view=${item.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => router.push(`/jobs/${jobId}/paperwork/site-audit-copttm-scr/create?edit=${item.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setItemToDelete(item)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12" />
              <p className="mt-4 font-semibold">No Site Audits Submitted</p>
              <p>Click "New Audit" to submit the first one for this job.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this site audit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
