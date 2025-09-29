import React from 'react';
import { DashboardHeader } from './DashboardHeader';
import { StatCard } from './StatCard';
import { QuickActions } from './QuickActions';
import { RevenueChart } from './RevenueChart';
import { TicketsOverview } from './TicketsOverview';
import { TechniciansPanel } from './TechniciansPanel';
import { InventoryAlert } from './InventoryAlert';
import { LogOut, ArrowLeft } from 'lucide-react';

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
            value="24"
            change="+12%"
            trend="up"
            icon="ticket"
          />
          <StatCard
            title="Completed Today"
            value="8"
            change="+5%"
            trend="up"
            icon="check"
          />
          <StatCard
            title="Revenue (Month)"
            value="R15,420"
            change="+8%"
            trend="up"
            icon="currency"
          />
          <StatCard
            title="Avg. Repair Time"
            value="2.3 days"
            change="-15%"
            trend="down"
            icon="clock"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <QuickActions />
            <RevenueChart />
            <TicketsOverview />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <TechniciansPanel />
            <InventoryAlert />
          </div>
        </div>
      </div>
    </div>
  );
}