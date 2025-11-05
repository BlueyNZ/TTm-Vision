
import { Timestamp } from "firebase/firestore";

export type Client = {
  id: string;
  name: string;
  userId?: string; // The Firebase Auth UID of the user associated with this client account.
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
  role: 'TC' | 'STMS' | 'Operator';
  certifications: Certification[];
  licenses?: License[];
  emergencyContact: {
    name: string;
    phone: string;
  };
  accessLevel: 'Staff Member' | 'Admin' | 'Client';
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
  clientName: string;
  clientId?: string;
  startDate: Timestamp | Date | string;
  startTime: string;
  siteSetupTime: string;
  setupType?: 'Stop-Go' | 'Lane Shift' | 'Shoulder' | 'Mobiles' | 'Other';
  otherSetupType?: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled' | 'Pending';
  stms: Staff['name'] | null;
  stmsId: Staff['id'] | null;
  tcs: { id: Staff['id'], name: Staff['name']}[];
};
