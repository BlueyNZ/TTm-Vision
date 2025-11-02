
import { Timestamp } from "firebase/firestore";

export type Certification = {
  name: 'TTM' | 'TMO-NP' | 'TMO' | 'STMS-U' | 'STMS-L1' | 'STMS-L2' | 'STMS-L3' | 'STMS-NP';
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
    lastServiceDate: Date;
    nextServiceDate: Date;
    nextServiceKms: number;
  };
  currentKms: number;
  fuelLog: {
    date: Date;
    volumeLiters: number;
    cost: number;
  }[];
};

export const truckData: Truck[] = [
  {
    id: 'T-01',
    name: 'Big Bertha',
    plate: 'TRUCK1',
    status: 'Operational',
    service: {
      lastServiceDate: new Date('2024-05-10T00:00:00Z'),
      nextServiceDate: new Date('2024-11-10T00:00:00Z'),
      nextServiceKms: 150000,
    },
    currentKms: 145000,
    fuelLog: [
      { date: new Date('2024-07-02T00:00:00Z'), volumeLiters: 120, cost: 240.50 },
    ],
  },
  {
    id: 'T-02',
    name: 'The Workhorse',
    plate: 'TRUCK2',
    status: 'Check Required',
    service: {
      lastServiceDate: new Date('2024-06-20T00:00:00Z'),
      nextServiceDate: new Date('2024-12-20T00:00:00Z'),
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
      lastServiceDate: new Date('2024-01-01T00:00:00Z'),
      nextServiceDate: new Date('2024-07-25T00:00:00Z'), 
      nextServiceKms: 120000,
    },
    currentKms: 119800,
    fuelLog: [],
  },
];
