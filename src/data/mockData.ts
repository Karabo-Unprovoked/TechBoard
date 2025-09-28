import { RepairTicket, Customer, Technician, InventoryItem, DashboardStats } from '../types';

export const mockTickets: RepairTicket[] = [
  {
    id: 'TK-001',
    customerName: 'John Smith',
    deviceType: 'Laptop',
    issue: 'Screen replacement',
    status: 'in-progress',
    priority: 'high',
    assignedTechnician: 'Mike Johnson',
    estimatedCost: 250,
    createdAt: '2025-01-15T09:30:00Z',
    updatedAt: '2025-01-15T14:20:00Z',
    estimatedCompletion: '2025-01-16T16:00:00Z'
  },
  {
    id: 'TK-002',
    customerName: 'Sarah Davis',
    deviceType: 'Desktop',
    issue: 'Won\'t boot up',
    status: 'pending',
    priority: 'medium',
    assignedTechnician: 'Alex Chen',
    estimatedCost: 150,
    createdAt: '2025-01-15T11:15:00Z',
    updatedAt: '2025-01-15T11:15:00Z'
  },
  {
    id: 'TK-003',
    customerName: 'Robert Wilson',
    deviceType: 'Phone',
    issue: 'Water damage',
    status: 'waiting-parts',
    priority: 'low',
    assignedTechnician: 'Emma Rodriguez',
    estimatedCost: 180,
    createdAt: '2025-01-14T15:45:00Z',
    updatedAt: '2025-01-15T10:30:00Z'
  },
  {
    id: 'TK-004',
    customerName: 'Lisa Brown',
    deviceType: 'Laptop',
    issue: 'Virus removal',
    status: 'completed',
    priority: 'medium',
    assignedTechnician: 'Mike Johnson',
    estimatedCost: 80,
    actualCost: 80,
    createdAt: '2025-01-14T08:00:00Z',
    updatedAt: '2025-01-15T12:00:00Z'
  }
];

export const mockCustomers: Customer[] = [
  {
    id: 'C-001',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: '123 Main St, City, State',
    totalSpent: 450,
    repairHistory: 3
  },
  {
    id: 'C-002',
    name: 'Sarah Davis',
    email: 'sarah.davis@email.com',
    phone: '(555) 234-5678',
    address: '456 Oak Ave, City, State',
    totalSpent: 320,
    repairHistory: 2
  }
];

export const mockTechnicians: Technician[] = [
  {
    id: 'T-001',
    name: 'Mike Johnson',
    specialties: ['Laptops', 'Desktops', 'Hardware'],
    activeTickets: 3,
    completedToday: 2,
    rating: 4.8,
    status: 'busy'
  },
  {
    id: 'T-002',
    name: 'Alex Chen',
    specialties: ['Software', 'Virus Removal', 'Data Recovery'],
    activeTickets: 2,
    completedToday: 1,
    rating: 4.9,
    status: 'available'
  },
  {
    id: 'T-003',
    name: 'Emma Rodriguez',
    specialties: ['Mobile Devices', 'Tablets', 'Water Damage'],
    activeTickets: 1,
    completedToday: 3,
    rating: 4.7,
    status: 'available'
  }
];

export const mockInventory: InventoryItem[] = [
  {
    id: 'I-001',
    name: 'Laptop Screen 15.6"',
    category: 'Screens',
    quantity: 12,
    minStock: 5,
    cost: 85,
    supplier: 'TechParts Inc'
  },
  {
    id: 'I-002',
    name: 'Hard Drive 1TB',
    category: 'Storage',
    quantity: 3,
    minStock: 10,
    cost: 65,
    supplier: 'Storage Solutions'
  },
  {
    id: 'I-003',
    name: 'RAM 8GB DDR4',
    category: 'Memory',
    quantity: 25,
    minStock: 15,
    cost: 45,
    supplier: 'Memory World'
  }
];

export const mockStats: DashboardStats = {
  totalRevenue: 12450,
  monthlyRevenue: 3200,
  totalTickets: 147,
  completedTickets: 128,
  pendingTickets: 19,
  averageRepairTime: 2.3,
  customerSatisfaction: 4.6
};