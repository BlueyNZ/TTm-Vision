
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

const today = new Date();

export const truckData: Truck[] = [
  {
    id: 'T-01',
    name: 'Big Bertha',
    plate: 'TRUCK1',
    status: 'Operational',
    service: {
      lastServiceDate: new Date(today.getFullYear(), today.getMonth() - 2, 10),
      nextServiceDate: new Date(today.getFullYear(), today.getMonth() + 4, 10),
      nextServiceKms: 150000,
    },
    currentKms: 145000,
    fuelLog: [
      { date: new Date(today.getFullYear(), today.getMonth(), 2), volumeLiters: 120, cost: 240.50 },
    ],
  },
  {
    id: 'T-02',
    name: 'The Workhorse',
    plate: 'TRUCK2',
    status: 'Check Required',
    service: {
      lastServiceDate: new Date(today.getFullYear(), today.getMonth() - 1, 20),
      nextServiceDate: new Date(today.getFullYear(), today.getMonth() + 5, 20),
      nextServiceKms: 160000,
    },
    currentKms: 158500, // Close to service KMs
    fuelLog: [],
  },
  {
    id: 'T-03',
    name: 'Old Reliable',
    plate: 'TRUCK3',
    status: 'In Service',
    service: {
      lastServiceDate: new Date(today.getFullYear(), today.getMonth() - 6, 1),
      nextServiceDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), // Service due soon
      nextServiceKms: 120000,
    },
    currentKms: 119800,
    fuelLog: [],
  },
];
