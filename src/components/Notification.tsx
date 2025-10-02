import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
  duration = 5000
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
      progressColor: 'bg-green-500'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
      progressColor: 'bg-red-500'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
      progressColor: 'bg-yellow-500'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
      progressColor: 'bg-blue-500'
    }
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor, progressColor } = config[type];

  return (
    <div
      className={`${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 mb-3 animate-slideIn flex items-start gap-3 relative overflow-hidden`}
      style={{ minWidth: '320px', maxWidth: '500px' }}
    >
      <div className={iconColor}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <p className={`${textColor} text-sm font-medium`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className={`${textColor} hover:opacity-70 transition-opacity`}
      >
        <X size={18} />
      </button>
      {duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-1 ${progressColor} animate-progress`}
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
};

interface NotificationContainerProps {
  notifications: Array<{
    id: string;
    type: NotificationType;
    message: string;
  }>;
  onRemove: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};
