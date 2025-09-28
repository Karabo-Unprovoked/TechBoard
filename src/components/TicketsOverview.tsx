import React from 'react';
import { Clock, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { RepairTicket } from '../types';

interface TicketsOverviewProps {
  tickets: RepairTicket[];
}

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'in-progress': { color: 'bg-blue-100 text-blue-800', icon: Wrench },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'waiting-parts': { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
};

const priorityConfig = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

export const TicketsOverview: React.FC<TicketsOverviewProps> = ({ tickets }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {tickets.slice(0, 5).map((ticket) => {
          const StatusIcon = statusConfig[ticket.status].icon;
          
          return (
            <div key={ticket.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">{ticket.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[ticket.status].color}`}>
                      <StatusIcon size={12} className="inline mr-1" />
                      {ticket.status.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{ticket.customerName} - {ticket.deviceType}</p>
                  <p className="text-sm text-gray-500">{ticket.issue}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${ticket.estimatedCost}</p>
                  <p className="text-xs text-gray-500">{ticket.assignedTechnician}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};