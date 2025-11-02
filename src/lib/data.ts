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

export type Job = {
  id: string;
  jobId: string;
  client: string;
  siteAddress: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  permitUrl?: string;
  hazards: {
    description: string;
    photoUrl: string;
    reportedBy: string;
  }[];
  completionDetails?: {
    photoUrl: string;
    signatureUrl: string;
    clientName: string;
  };
  staff: Staff[];
  date: Date;
  startTime: string;
  onSiteTime: string;
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

export const jobData: Job[] = [
  {
    id: '101',
    jobId: 'J-2024-001',
    client: 'City Council',
    siteAddress: '123 Main St, Anytown',
    status: 'In Progress',
    permitUrl: '/path/to/permit.pdf',
    staff: [staffData[0], staffData[1]],
    date: new Date(),
    startTime: '09:00',
    onSiteTime: '08:45',
    hazards: [
      {
        description: 'Deep pothole near entrance.',
        photoUrl: 'https://picsum.photos/seed/hazard1/400/300',
        reportedBy: 'Jane Smith',
      },
    ],
  },
  {
    id: '102',
    jobId: 'J-2024-002',
    client: 'ConstructCo',
    siteAddress: '456 Oak Ave, Anytown',
    status: 'Scheduled',
    permitUrl: '/path/to/permit.pdf',
    staff: [staffData[3]],
    date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    startTime: '10:00',
    onSiteTime: '09:30',
    hazards: [],
  },
  {
    id: '103',
    jobId: 'J-2023-159',
    client: 'Power Line Inc.',
    siteAddress: '789 Pine Ln, Anytown',
    status: 'Completed',
    staff: [staffData[2]],
    date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    startTime: '08:00',
    onSiteTime: '07:50',
    hazards: [],
    completionDetails: {
      photoUrl: 'https://picsum.photos/seed/complete1/400/300',
      signatureUrl: '/path/to/signature.png',
      clientName: 'Foreman Bob',
    },
  },
];