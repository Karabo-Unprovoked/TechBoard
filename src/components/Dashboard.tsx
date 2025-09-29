import React from 'react';
import { DashboardHeader } from './DashboardHeader';
import { StatCard } from './StatCard';
import { QuickActions } from './QuickActions';
import { RevenueChart } from './RevenueChart';
import { TicketsOverview } from './TicketsOverview';
import { TechniciansPanel } from './TechniciansPanel';
import { InventoryAlert } from './InventoryAlert';
import { LogOut, ArrowLeft, Ticket, CheckCircle, DollarSign, Clock } from 'lucide-react';
import { mockStats, mockInventory, mockTickets, mockTechnicians } from '../data/mockData';

interface DashboardProps {
  onLogout: () => void;
  onNavigateToTracking: () => void;
}

export function Dashboard({ onLogout, onNavigateToTracking }: DashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Guardian Assist</h1>
              <span className="text-sm text-gray-500">Repair Management Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateToTracking}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Track Customer
              </button>
              <button
                onClick={onLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 hover:shadow-md transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader />
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Tickets"
            value={mockStats.activeTickets}
            changeType="positive"
            change="+12%"
            icon={Ticket}
            color="blue"
          />
          <StatCard
            title="Completed Today"
            value={mockStats.completedToday}
            changeType="positive"
            change="+5%"
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Revenue (Month)"
            value={`R${mockStats.monthlyRevenue.toLocaleString()}`}
            changeType="positive"
            change="+8%"
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Avg. Repair Time"
            value={`${mockStats.avgRepairTime} days`}
            changeType="negative"
            change="-15%"
            icon={Clock}
            color="orange"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <QuickActions />
            <RevenueChart />
            <TicketsOverview tickets={mockTickets} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <TechniciansPanel technicians={mockTechnicians} />
            <InventoryAlert inventory={mockInventory} />
          </div>
        </div>
      </div>
    </div>
  );
}