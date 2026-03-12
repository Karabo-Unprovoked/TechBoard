import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Mail } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { RepairTicket } from '../lib/supabase';

interface OverdueTicketsAlertProps {
  tickets: RepairTicket[];
  onViewTicket: (ticket: RepairTicket) => void;
}

export const OverdueTicketsAlert: React.FC<OverdueTicketsAlertProps> = ({ tickets, onViewTicket }) => {
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [sendingEmails, setSendingEmails] = useState(false);

  const overdueTickets = tickets.filter(ticket => {
    if (ticket.status === 'completed' || ticket.status === 'void' || ticket.status === 'unrepairable') return false;
    if (!ticket.status_changed_at || !ticket.sla_hours) return false;

    const statusChangedAt = new Date(ticket.status_changed_at);
    const now = new Date();
    const msElapsed = now.getTime() - statusChangedAt.getTime();
    const hoursElapsed = msElapsed / (1000 * 60 * 60);
    return hoursElapsed >= ticket.sla_hours;
  });

  const checkAndSendAlerts = async () => {
    if (!isSupabaseConfigured) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-overdue-tickets', {
        body: {}
      });

      if (error) {
        console.error('Error checking overdue tickets:', error);
        return;
      }

      console.log('Overdue check result:', data);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Error invoking check-overdue-tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndSendAlerts();
    }, 5 * 60 * 1000);

    checkAndSendAlerts();

    return () => clearInterval(interval);
  }, [tickets]);

  const calculateHoursOverdue = (ticket: RepairTicket): number => {
    if (!ticket.status_changed_at || !ticket.sla_hours) return 0;

    const statusChangedAt = new Date(ticket.status_changed_at);
    const now = new Date();
    const msElapsed = now.getTime() - statusChangedAt.getTime();
    const hoursElapsed = msElapsed / (1000 * 60 * 60);
    return Math.max(0, hoursElapsed - ticket.sla_hours);
  };

  return (
    <div className={`rounded-2xl shadow-lg border-2 overflow-hidden ${
      overdueTickets.length > 0
        ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
        : 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'
    }`}>
      <div className={`text-white px-6 py-4 ${
        overdueTickets.length > 0 ? 'bg-red-600' : 'bg-green-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              {overdueTickets.length > 0 ? (
                <AlertTriangle size={24} />
              ) : (
                <Clock size={24} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {overdueTickets.length > 0 ? 'SLA BREACH ALERT' : 'SLA MONITORING'}
              </h3>
              <p className={`text-sm ${overdueTickets.length > 0 ? 'text-red-100' : 'text-green-100'}`}>
                {overdueTickets.length > 0
                  ? `${overdueTickets.length} ${overdueTickets.length === 1 ? 'ticket is' : 'tickets are'} overdue`
                  : 'All tickets are within SLA limits'
                }
              </p>
            </div>
          </div>
          <button
            onClick={checkAndSendAlerts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
            title="Check and send email alerts"
          >
            <Mail size={16} />
            {loading ? 'Checking...' : 'Send Alerts'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {lastCheck && (
          <div className="mb-4 text-xs text-gray-600 flex items-center gap-1">
            <Clock size={12} />
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        )}

        {overdueTickets.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {overdueTickets.map((ticket) => {
            const hoursOverdue = calculateHoursOverdue(ticket);

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer border-l-4 border-red-500"
                onClick={() => onViewTicket(ticket)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900">{ticket.ticket_number}</h4>
                    <p className="text-sm text-gray-600">{ticket.customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                      {hoursOverdue.toFixed(1)}h overdue
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Device</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.device_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{ticket.status.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">SLA Limit</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.sla_hours}h</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status changed:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(ticket.status_changed_at!).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Clock size={32} className="text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Overdue Tickets</h4>
            <p className="text-sm text-gray-600">
              All tickets are being handled within their SLA timeframes
            </p>
          </div>
        )}

        <div className={`mt-4 pt-4 ${overdueTickets.length > 0 ? 'border-t border-red-200' : 'border-t border-green-200'}`}>
          <p className="text-xs text-gray-600 text-center">
            Email alerts are automatically sent to administrators every 5 minutes for overdue tickets
          </p>
        </div>
      </div>
    </div>
  );
};
