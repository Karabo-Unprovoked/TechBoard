import React from 'react';
import { Plus, Users } from 'lucide-react';

interface QuickActionsWidgetProps {
  userRole: string;
  onNavigate: (view: string) => void;
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ userRole, onNavigate }) => {
  const PRIMARY = '#ffb400';

  return (
    <div
      className="rounded-xl p-8 text-white shadow-lg h-full flex flex-col justify-center"
      style={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, #ff9500 100%)`
      }}
    >
      <div>
        <h3 className="text-2xl font-bold mb-2">Hello, Welcome back</h3>
        <p className="text-orange-50 text-sm mb-6">Your dashboard is updated with the latest information</p>
        {userRole !== 'viewer' && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('new-customer')}
              className="flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/30 transition-all text-sm"
            >
              <Users size={18} />
              <span>New Customer</span>
            </button>
            <button
              onClick={() => onNavigate('new-ticket')}
              className="flex items-center gap-2 px-5 py-3 bg-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
              style={{ color: PRIMARY }}
            >
              <Plus size={18} />
              <span>New Ticket</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
