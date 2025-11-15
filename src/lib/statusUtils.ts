import { supabase } from './supabase';
import type { TicketStatus } from './supabase';

const statusColorMap: Record<string, string> = {
  'in-transit': 'bg-indigo-100 text-indigo-800',
  'received': 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  'invoiced': 'bg-teal-100 text-teal-800',
  'completed': 'bg-green-100 text-green-800',
  'unrepairable': 'bg-red-100 text-red-800',
  'pending-customer-action': 'bg-purple-100 text-purple-800'
};

const statusDisplayColorMap: Record<string, { bg: string; dot: string }> = {
  'in-transit': { bg: 'bg-indigo-50', dot: 'bg-indigo-500' },
  'received': { bg: 'bg-blue-50', dot: 'bg-blue-500' },
  'in-progress': { bg: 'bg-yellow-50', dot: 'bg-yellow-500' },
  'invoiced': { bg: 'bg-teal-50', dot: 'bg-teal-500' },
  'completed': { bg: 'bg-green-50', dot: 'bg-green-500' },
  'unrepairable': { bg: 'bg-red-50', dot: 'bg-red-500' },
  'pending-customer-action': { bg: 'bg-purple-50', dot: 'bg-purple-500' }
};

export const loadStatuses = async (): Promise<TicketStatus[]> => {
  try {
    const { data, error } = await supabase
      .from('ticket_statuses')
      .select('*')
      .eq('is_active', true)
      .order('status_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading statuses:', error);
    return [];
  }
};

export const getStatusColor = (statusKey: string): string => {
  return statusColorMap[statusKey] || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (statuses: TicketStatus[], statusKey: string): string => {
  const status = statuses.find(s => s.status_key === statusKey);
  return status?.status_label || statusKey.replace('-', ' ').toUpperCase();
};

export const getStatusDisplayColors = (statusKey: string): { bg: string; dot: string } => {
  return statusDisplayColorMap[statusKey] || { bg: 'bg-gray-50', dot: 'bg-gray-500' };
};
