
export type Certification = {
  name: 'TTM' | 'TMO-NP' | 'TMO' | 'STMS-U' | 'STMS-L1' | 'STMS-L2' | 'STMS-L3' | 'STMS-NP';
  expiryDate: Date;
};

export type Staff = {
  id: string;
  name: string;
  role: 'TC' | 'STMS' | 'Operator';
  avatarUrl: string;
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

export const staffData: Staff[] = [
  {
    id: '1',
    name: 'John Doe',
    role: 'STMS',
    avatarUrl: '/avatars/avatar-1.png',
    certifications: [
      { name: 'STMS-L1', expiryDate: new Date(today.getFullYear() + 1, today.getMonth(), 15) },
      { name: 'TMO', expiryDate: new Date(today.getFullYear(), today.getMonth() + 2, 5) },
    ],
    emergencyContact: {
      name: 'Jane Doe',
      phone: '021 987 6543'
    },
    accessLevel: 'Admin',
  },
  {
    id: '2',
    name: 'Jane Smith',
    role: 'TC',
    avatarUrl: '/avatars/avatar-2.png',
    certifications: [
      { name: 'TTM', expiryDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20) }, // Expiring soon
    ],
    emergencyContact: {
      name: 'John Smith',
      phone: '022 123 4567'
    },
    accessLevel: 'Staff Member',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    role: 'Operator',
    avatarUrl: '/avatars/avatar-3.png',
    certifications: [
       { name: 'TMO-NP', expiryDate: new Date(today.getFullYear() - 1, today.getMonth(), 1) }, // Expired
    ],
    emergencyContact: {
      name: 'Mary Johnson',
      phone: '027 890 1234'
    },
    accessLevel: 'Staff Member',
toc
  },
   {
    id: '4',
    name: 'Emily White',
    role: 'STMS',
    avatarUrl: '/avatars/avatar-4.png',
    certifications: [
      { name: 'STMS-L2', expiryDate: new Date(today.getFullYear() + 2, 5, 20) },
    ],
    emergencyContact: {
      name: 'David White',
      phone: '021 555 8888'
    },
    accessLevel: 'Staff Member',
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
