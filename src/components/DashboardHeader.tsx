import React from 'react';
import { Monitor, Bell, Search, User } from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
              <Monitor className="text-white" size={20} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-bold text-gray-900">TechFix Pro</h1>
              <p className="text-xs md:text-sm text-gray-600">Computer Repair Dashboard</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tickets, customers..."
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 lg:w-80"
            />
          </div>

          <button className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell size={18} className="sm:w-5 sm:h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs">
              3
            </span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <div className="bg-gray-300 p-1.5 sm:p-2 rounded-full">
              <User size={16} className="sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <div className="text-xs sm:text-sm hidden lg:block">
              <p className="font-medium text-gray-900">Admin User</p>
              <p className="text-gray-600">Manager</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};