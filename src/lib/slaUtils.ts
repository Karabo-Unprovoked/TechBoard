interface Ticket {
  status_changed_at: string;
  sla_hours: number;
  status: string;
}

export interface SLAStatus {
  isOverdue: boolean;
  hoursElapsed: number;
  hoursRemaining: number;
  percentageUsed: number;
  urgencyLevel: 'normal' | 'warning' | 'critical' | 'overdue';
}

export function calculateSLAStatus(ticket: Ticket): SLAStatus {
  const statusChangedAt = new Date(ticket.status_changed_at);
  const now = new Date();
  const msElapsed = now.getTime() - statusChangedAt.getTime();
  const hoursElapsed = msElapsed / (1000 * 60 * 60);
  const slaHours = ticket.sla_hours || 72;
  const hoursRemaining = slaHours - hoursElapsed;
  const percentageUsed = (hoursElapsed / slaHours) * 100;

  let urgencyLevel: 'normal' | 'warning' | 'critical' | 'overdue' = 'normal';

  if (percentageUsed >= 100) {
    urgencyLevel = 'overdue';
  } else if (percentageUsed >= 90) {
    urgencyLevel = 'critical';
  } else if (percentageUsed >= 75) {
    urgencyLevel = 'warning';
  }

  return {
    isOverdue: hoursElapsed >= slaHours,
    hoursElapsed: Math.floor(hoursElapsed),
    hoursRemaining: Math.max(0, Math.ceil(hoursRemaining)),
    percentageUsed: Math.min(100, percentageUsed),
    urgencyLevel,
  };
}

export function getSLAColor(urgencyLevel: 'normal' | 'warning' | 'critical' | 'overdue'): string {
  switch (urgencyLevel) {
    case 'overdue':
      return '#dc2626';
    case 'critical':
      return '#ea580c';
    case 'warning':
      return '#f59e0b';
    default:
      return '#10b981';
  }
}

export function getSLALabel(status: SLAStatus): string {
  if (status.isOverdue) {
    return `Overdue by ${status.hoursElapsed - (status.hoursElapsed - status.hoursRemaining)} hours`;
  }
  return `${status.hoursRemaining}h remaining`;
}

export function formatSLATime(hours: number): string {
  if (hours < 1) {
    return `${Math.floor(hours * 60)}m`;
  } else if (hours < 24) {
    return `${Math.floor(hours)}h`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
}
