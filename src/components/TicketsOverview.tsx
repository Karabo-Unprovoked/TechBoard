import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { RepairTicket } from '../types';
import type { TicketStatus } from '../lib/supabase';
import { loadStatuses, getStatusColor, getStatusLabel } from '../lib/statusUtils';

interface TicketsOverviewProps {
  tickets: RepairTicket[];
}

const priorityConfig = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const getIconForStatus = (statusKey: string) => {
  if (statusKey === 'completed' || statusKey === 'invoiced') return CheckCircle;
  if (statusKey === 'in-progress') return Wrench;
  if (statusKey === 'unrepairable' || statusKey === 'pending-customer-action') return AlertTriangle;
  return Clock;
};

export const TicketsOverview: React.FC<TicketsOverviewProps> = ({ tickets }) => {
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);

  useEffect(() => {
    const fetchStatuses = async () => {
      const data = await loadStatuses();
      setStatuses(data);
    };
    fetchStatuses();
  }, []);

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
          const StatusIcon = getIconForStatus(ticket.status);
          const statusColor = getStatusColor(ticket.status);
          const statusLabel = getStatusLabel(statuses, ticket.status);

          return (
            <div key={ticket.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">{ticket.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                      <StatusIcon size={12} className="inline mr-1" />
                      {statusLabel}
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