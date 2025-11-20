
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
  control: string;
};

export type SiteHazard = {
  description: string;
  control: string;
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
  siteAccessExit: string;
  safetyZones: string;
  evacuationPoints: string;
  adjustmentsToSite: string;
  nearestMedicalCentre: string;
  other: string;
  requiredPpe: string[];
  createdAt: Timestamp;
};
