
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
  startDate: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'On Hold';
  stms: string;
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


export const jobData: Job[] = [
  {
    id: "JOB-001",
    name: "SH1 Motorway Closure",
    location: "Km 24-28, Northern Mwy",
    startDate: "2024-08-15T20:00:00Z",
    status: "Upcoming",
    stms: "Harrison Price",
  },
  {
    id: "JOB-002",
    name: "Local Road Maintenance",
    location: "Smith Street, Suburbia",
    startDate: "2024-07-20T08:00:00Z",
    status: "In Progress",
    stms: "Harrison Price",
  },
  {
    id: "JOB-003",
    name: "Event Traffic Control",
    location: "City Stadium",
    startDate: "2024-07-12T16:00:00Z",
    status: "Completed",
    stms: "Jane Doe",
  },
  {
    id: "JOB-004",
    name: "Emergency Watermain Repair",
    location: "Main & First Ave",
    startDate: "2024-07-22T10:00:00Z",
    status: "On Hold",
    stms: "Harrison Price",
  },
];
