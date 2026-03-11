import React from 'react';
import { Plus, Users, Package, FileText, Settings } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const actions = [
    { icon: Plus, label: 'New Ticket', color: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600' },
    { icon: Users, label: 'Add Customer', color: 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600' },
    { icon: Package, label: 'Update Inventory', color: 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600' },
    { icon: FileText, label: 'Generate Report', color: 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600' },
    { icon: Settings, label: 'Settings', color: 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600' }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Quick Actions</h3>

      <div className="grid grid-cols-1 gap-2 sm:gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              className={`${action.color} text-white p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 transition-colors font-medium text-sm sm:text-base`}
            >
              <Icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};