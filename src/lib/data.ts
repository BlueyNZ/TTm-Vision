
import { Timestamp } from "firebase/firestore";

export type Certification = {
  name: 'TTMW' | 'TMO-NP' | 'TMO' | 'STMS-U' | 'STMS (CAT A)' | 'STMS (CAT B)' | 'STMS (CAT C)' | 'STMS-NP';
  expiryDate: Date | Timestamp;
};

export type Staff = {
  id: string;
  name: string;
  role: 'TC' | 'STMS' | 'Operator';
  certifications: Certification[];
  emergencyContact: {
    name: string;
    phone: string;
  };
  accessLevel: 'Staff Member' | 'Admin';
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


export const jobData: Omit<Job, 'id'>[] = [
  {
    jobNumber: "TF-0001",
    name: "SH1 Motorway Closure",
    location: "Km 24-28, Northern Mwy",
    startDate: "2030-08-15T20:00:00Z",
    startTime: "20:00",
    siteSetupTime: "19:00",
    status: "Upcoming",
    stms: "Harrison Price",
    stmsId: null,
    tcs: [
        { id: "1", name: "Ben Carter" },
        { id: "2", name: "Chloe Williams" }
    ],
  }
];

export type Job = {
  id: string;
  jobNumber: string;
  name: string;
  location: string;
  startDate: Timestamp | Date | string;
  startTime: string;
  siteSetupTime: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
  stms: Staff['name'] | null;
  stmsId: Staff['id'] | null;
  tcs: { id: Staff['id'], name: Staff['name']}[];
};
