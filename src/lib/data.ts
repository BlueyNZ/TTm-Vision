
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
    lastServiceDate: string;
    nextServiceDate: string;
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

export const truckData: Truck[] = [
  {
    id: 'T-01',
    name: 'Big Bertha',
    plate: 'TRUCK1',
    status: 'Operational',
    service: {
      lastServiceDate: '2024-05-10T00:00:00Z',
      nextServiceDate: '2024-11-10T00:00:00Z',
      nextServiceKms: 150000,
    },
    currentKms: 145000,
    fuelLog: [
      { date: '2024-07-02T00:00:00Z', volumeLiters: 120, cost: 240.50 },
    ],
  },
  {
    id: 'T-02',
    name: 'The Workhorse',
    plate: 'TRUCK2',
    status: 'Check Required',
    service: {
      lastServiceDate: '2024-06-20T00:00:00Z',
      nextServiceDate: '2024-12-20T00:00:00Z',
      nextServiceKms: 160000,
    },
    currentKms: 158500, 
    fuelLog: [],
  },
  {
    id: 'T-03',
    name: 'Old Reliable',
    plate: 'TRUCK3',
    status: 'In Service',
    service: {
      lastServiceDate: '2024-01-01T00:00:00Z',
      nextServiceDate: '2024-07-25T00:00:00Z', 
      nextServiceKms: 120000,
    },
    currentKms: 119800,
    fuelLog: [],
  },
];


export const jobData: Omit<Job, 'id'>[] = [
  {
    name: "SH1 Motorway Closure",
    location: "Km 24-28, Northern Mwy",
    startDate: "2024-08-15T20:00:00Z",
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
