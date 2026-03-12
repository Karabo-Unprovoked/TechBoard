import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, TrendingUp, CheckCircle, Eye, Filter, Calendar } from 'lucide-react';
import type { RepairTicket } from '../lib/supabase';
import { calculateSLAStatus, getSLAColor, formatSLATime } from '../lib/slaUtils';
import { getStatusLabel, getStatusDisplayColors } from '../lib/statusUtils';

interface SLADashboardProps {
  tickets: RepairTicket[];
  onViewTicket: (ticket: RepairTicket) => void;
  statuses: any[];
}

type SLAFilter = 'all' | 'overdue' | 'critical' | 'warning' | 'normal';
type TimeRange = 'all' | 'today' | 'week' | 'month';

export function SLADashboard({ tickets, onViewTicket, statuses }: SLADashboardProps) {
  const [filter, setFilter] = useState<SLAFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const activeTickets = tickets.filter(
    ticket => ticket.status !== 'completed' && ticket.status !== 'void' && ticket.status_changed_at && ticket.sla_hours
  );

  const filterByTimeRange = (ticket: RepairTicket) => {
    if (timeRange === 'all') return true;

    const now = new Date();
    const statusChangedAt = new Date(ticket.status_changed_at);

    if (timeRange === 'today') {
      return statusChangedAt.toDateString() === now.toDateString();
    } else if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return statusChangedAt >= weekAgo;
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return statusChangedAt >= monthAgo;
    }

    return true;
  };

  const ticketsWithSLA = activeTickets
    .map(ticket => ({
      ticket,
      slaStatus: calculateSLAStatus(ticket)
    }))
    .filter(({ slaStatus }) => {
      if (filter === 'all') return true;
      return slaStatus.urgencyLevel === filter;
    })
    .filter(({ ticket }) => filterByTimeRange(ticket))
    .sort((a, b) => {
      if (a.slaStatus.urgencyLevel === 'overdue' && b.slaStatus.urgencyLevel !== 'overdue') return -1;
      if (a.slaStatus.urgencyLevel !== 'overdue' && b.slaStatus.urgencyLevel === 'overdue') return 1;
      if (a.slaStatus.urgencyLevel === 'critical' && b.slaStatus.urgencyLevel !== 'critical') return -1;
      if (a.slaStatus.urgencyLevel !== 'critical' && b.slaStatus.urgencyLevel === 'critical') return 1;
      return a.slaStatus.hoursRemaining - b.slaStatus.hoursRemaining;
    });

  const overdueCount = activeTickets.filter(ticket => {
    const sla = calculateSLAStatus(ticket);
    return sla.urgencyLevel === 'overdue';
  }).length;

  const criticalCount = activeTickets.filter(ticket => {
    const sla = calculateSLAStatus(ticket);
    return sla.urgencyLevel === 'critical';
  }).length;

  const warningCount = activeTickets.filter(ticket => {
    const sla = calculateSLAStatus(ticket);
    return sla.urgencyLevel === 'warning';
  }).length;

  const normalCount = activeTickets.filter(ticket => {
    const sla = calculateSLAStatus(ticket);
    return sla.urgencyLevel === 'normal';
  }).length;

  const averageSLAUsage = activeTickets.length > 0
    ? activeTickets.reduce((sum, ticket) => {
        const sla = calculateSLAStatus(ticket);
        return sum + sla.percentageUsed;
      }, 0) / activeTickets.length
    : 0;

  const upcomingBreaches = activeTickets
    .map(ticket => ({
      ticket,
      slaStatus: calculateSLAStatus(ticket)
    }))
    .filter(({ slaStatus }) => slaStatus.urgencyLevel === 'critical' || slaStatus.urgencyLevel === 'warning')
    .sort((a, b) => a.slaStatus.hoursRemaining - b.slaStatus.hoursRemaining)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-200">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-100 p-3 rounded-xl">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
              Urgent
            </span>
          </div>
          <h4 className="text-gray-600 text-sm font-medium mb-1">Overdue Tickets</h4>
          <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
          <p className="text-xs text-gray-500 mt-2">Immediate attention required</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-orange-100 p-3 rounded-xl">
              <Clock size={24} className="text-orange-600" />
            </div>
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Critical
            </span>
          </div>
          <h4 className="text-gray-600 text-sm font-medium mb-1">Critical Tickets</h4>
          <p className="text-3xl font-bold text-orange-600">{criticalCount}</p>
          <p className="text-xs text-gray-500 mt-2">90%+ SLA time used</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-amber-100 p-3 rounded-xl">
              <TrendingUp size={24} className="text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              Warning
            </span>
          </div>
          <h4 className="text-gray-600 text-sm font-medium mb-1">Warning Tickets</h4>
          <p className="text-3xl font-bold text-amber-600">{warningCount}</p>
          <p className="text-xs text-gray-500 mt-2">75-90% SLA time used</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
              Normal
            </span>
          </div>
          <h4 className="text-gray-600 text-sm font-medium mb-1">Normal Tickets</h4>
          <p className="text-3xl font-bold text-green-600">{normalCount}</p>
          <p className="text-xs text-gray-500 mt-2">Less than 75% used</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">SLA Status Overview</h3>
              <div className="flex items-center gap-2">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as SLAFilter)}
                  className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Status ({ticketsWithSLA.length})</option>
                  <option value="overdue">Overdue ({overdueCount})</option>
                  <option value="critical">Critical ({criticalCount})</option>
                  <option value="warning">Warning ({warningCount})</option>
                  <option value="normal">Normal ({normalCount})</option>
                </select>
              </div>
            </div>

            {ticketsWithSLA.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No tickets found matching your filters</p>
                <p className="text-sm text-gray-500 mt-1">All tickets are within acceptable SLA limits</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ticketsWithSLA.map(({ ticket, slaStatus }) => {
                  const statusLabel = getStatusLabel(statuses, ticket.status);
                  const statusColors = getStatusDisplayColors(ticket.status);
                  const slaColor = getSLAColor(slaStatus.urgencyLevel);

                  return (
                    <div
                      key={ticket.id}
                      className="bg-white border-2 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                      style={{ borderColor: `${slaColor}40` }}
                    >
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900">{ticket.ticket_number}</span>
                            <span className="text-sm font-medium text-gray-700">{ticket.customer?.name}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors.bg} ${statusColors.text}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <button
                            onClick={() => onViewTicket(ticket)}
                            className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
                            title="View Ticket"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Device</p>
                            <p className="text-sm font-medium text-gray-900">
                              {ticket.device_type?.replace('-laptop', '').replace('-', ' ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Status Changed</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(ticket.status_changed_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">SLA Progress</span>
                            <span className="font-bold" style={{ color: slaColor }}>
                              {Math.min(100, Math.round(slaStatus.percentageUsed))}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, slaStatus.percentageUsed)}%`,
                                backgroundColor: slaColor
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              {slaStatus.hoursElapsed}h elapsed
                            </span>
                            <span className="font-semibold" style={{ color: slaColor }}>
                              {slaStatus.isOverdue
                                ? `Overdue by ${formatSLATime(slaStatus.hoursElapsed - (ticket.sla_hours || 72))}`
                                : `${formatSLATime(slaStatus.hoursRemaining)} remaining`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-4">Average SLA Usage</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={
                      averageSLAUsage >= 90 ? '#dc2626' :
                      averageSLAUsage >= 75 ? '#f59e0b' :
                      '#10b981'
                    }
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(averageSLAUsage / 100) * 351.86} 351.86`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-gray-900">
                    {Math.round(averageSLAUsage)}%
                  </span>
                  <span className="text-xs text-gray-500">Average</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-center text-gray-500 mt-4">
              Average SLA time used across all active tickets
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-orange-600" />
              <h3 className="text-base font-bold text-gray-900">Upcoming Breaches</h3>
            </div>

            {upcomingBreaches.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No tickets at risk</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBreaches.map(({ ticket, slaStatus }) => {
                  const slaColor = getSLAColor(slaStatus.urgencyLevel);
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => onViewTicket(ticket)}
                      className="w-full text-left p-3 rounded-lg border-2 hover:shadow-md transition-all"
                      style={{ borderColor: `${slaColor}30` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900">{ticket.ticket_number}</span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: `${slaColor}20`, color: slaColor }}>
                          {Math.round(slaStatus.percentageUsed)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, slaStatus.percentageUsed)}%`,
                            backgroundColor: slaColor
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatSLATime(slaStatus.hoursRemaining)} remaining
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
