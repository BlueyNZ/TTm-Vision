export type Staff = {
  id: string;
  name: string;
  role: 'TC' | 'STMS' | 'Operator';
  avatarUrl: string;
  certifications: {
    name: 'TC' | 'STMS Level 1' | 'First Aid';
    expiryDate: Date;
  }[];
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

export const staffData: Staff[] = [
  {
    id: '1',
    name: 'John Doe',
    role: 'STMS',
    avatarUrl: '/avatars/avatar-1.png',
    certifications: [
      { name: 'STMS Level 1', expiryDate: new Date(today.getFullYear() + 1, today.getMonth(), 15) },
      { name: 'First Aid', expiryDate: new Date(today.getFullYear(), today.getMonth() + 2, 5) },
    ],
  },
  {
    id: '2',
    name: 'Jane Smith',
    role: 'TC',
    avatarUrl: '/avatars/avatar-2.png',
    certifications: [
      { name: 'TC', expiryDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20) }, // Expiring soon
    ],
  },
  {
    id: '3',
    name: 'Mike Johnson',
    role: 'Operator',
    avatarUrl: '/avatars/avatar-3.png',
    certifications: [
       { name: 'TC', expiryDate: new Date(today.getFullYear() - 1, today.getMonth(), 1) }, // Expired
    ],
  },
   {
    id: '4',
    name: 'Emily White',
    role: 'STMS',
    avatarUrl: '/avatars/avatar-4.png',
    certifications: [
      { name: 'STMS Level 1', expiryDate: new Date(today.getFullYear() + 2, 5, 20) },
    ],
  },
];

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
