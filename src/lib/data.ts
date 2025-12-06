

import { Timestamp } from "firebase/firestore";

// Tenant (Organization) type for multi-tenant support
export type Tenant = {
  id: string; // e.g., 'traffic-flow'
  name: string; // Display name
  status: 'Active' | 'Suspended' | 'Inactive';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  settings?: {
    logo?: string;
    primaryColor?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
};

export type Client = {
  id: string;
  tenantId: string; // Organization/company this client belongs to
  name: string;
  email?: string; // Email for client portal login
  phone?: string; // Contact phone number
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
  tenantId: string; // Organization/company this staff belongs to
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
  tenantId: string; // Organization/company this truck belongs to
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
  tenantId: string; // Organization/company this job belongs to
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
  tenantId: string; // Organization/company this timesheet belongs to
  jobId: string;
  staffId: string;
  staffName: string;
  role: 'TC' | 'STMS' | 'Operator' | 'Owner' | 'Tester' | 'Other';
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
    tenantId: string; // Organization/company this inspection belongs to
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
  tenantId: string; // Organization/company this hazard ID belongs to
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
  tenantId: string; // Organization/company this NZGTTM hazard ID belongs to
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
  tenantId: string; // Organization/company this TMP checking process belongs to
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
  tenantId: string; // Organization/company this on-site record belongs to
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
    tenantId: string; // Organization/company this mobile ops record belongs to
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
    tenantId: string; // Organization/company this job note belongs to
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
    tenantId: string; // Organization/company this site photo belongs to
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
  tenantId: string; // Organization/company this incident report belongs to
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
  tenantId: string; // Organization/company this site audit belongs to
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
