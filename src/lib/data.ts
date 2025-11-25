
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
  date: Date;
  time: string;
  signatureDataUrl: string;
  comments: string;
  isNextCheckRequired?: 'Yes' | 'No';
};

export type OnSiteRecord = {
  id: string;
  jobId: string;
  jobDate: string;
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
  installDate: Date;
  installTime: string;
  removalDate?: Date;
  removalTime?: string;
  tslSpeed: number;
  placementFrom: string;
  placementTo: string;
  lengthOfTsl: number;
  dateTslRemainsInPlace?: string;
};
