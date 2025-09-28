export interface RepairTicket {
  id: string;
  customerName: string;
  deviceType: string;
  issue: string;
  status: 'pending' | 'in-progress' | 'completed' | 'waiting-parts';
  priority: 'low' | 'medium' | 'high';
  assignedTechnician: string;
  estimatedCost: number;
  actualCost?: number;
  createdAt: string;
  updatedAt: string;
  estimatedCompletion?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalSpent: number;
  repairHistory: number;
}

export interface Technician {
  id: string;
  name: string;
  specialties: string[];
  activeTickets: number;
  completedToday: number;
  rating: number;
  status: 'available' | 'busy' | 'off-duty';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  cost: number;
  supplier: string;
}

export interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalTickets: number;
  completedTickets: number;
  pendingTickets: number;
  averageRepairTime: number;
  customerSatisfaction: number;
}