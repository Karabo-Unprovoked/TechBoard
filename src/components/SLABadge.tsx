import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { calculateSLAStatus, getSLAColor, formatSLATime } from '../lib/slaUtils';

interface SLABadgeProps {
  ticket: {
    status_changed_at: string;
    sla_hours: number;
    status: string;
  };
  size?: 'small' | 'medium' | 'large';
}

export function SLABadge({ ticket, size = 'medium' }: SLABadgeProps) {
  const slaStatus = calculateSLAStatus(ticket);
  const color = getSLAColor(slaStatus.urgencyLevel);

  if (ticket.status === 'completed' || ticket.status === 'void') {
    return null;
  }

  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-xs px-2.5 py-1',
    large: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    small: 12,
    medium: 14,
    large: 16,
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {slaStatus.urgencyLevel === 'overdue' ? (
        <AlertTriangle size={iconSizes[size]} />
      ) : (
        <Clock size={iconSizes[size]} />
      )}
      <span>
        {slaStatus.isOverdue ? (
          <>Overdue {formatSLATime(slaStatus.hoursElapsed - slaStatus.hoursRemaining)}</>
        ) : (
          <>{formatSLATime(slaStatus.hoursRemaining)} left</>
        )}
      </span>
    </div>
  );
}
