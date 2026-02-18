import React, { useState, useEffect, useRef } from 'react';
import { Responsive } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { Settings, Eye, EyeOff, RotateCcw, Lock, Unlock } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { RepairTicket, TicketStatus } from '../lib/supabase';
import { StatsWidget } from './widgets/StatsWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { RecentTicketsWidget } from './widgets/RecentTicketsWidget';
import { StatusOverviewWidget } from './widgets/StatusOverviewWidget';
import { RevenueChartWidget } from './widgets/RevenueChartWidget';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface CustomizableDashboardProps {
  tickets: RepairTicket[];
  customers: any[];
  pendingRequests: number;
  statuses: TicketStatus[];
  userRole: string;
  onNavigate: (view: string) => void;
  onViewLabel: (ticket: RepairTicket) => void;
  onManageTicket: (ticket: RepairTicket) => void;
  onUpdateStatus: (ticketId: string, newStatus: string, internalStatus?: string) => void;
}

interface Widget {
  id: string;
  name: string;
  component: string;
  defaultLayout: Layout;
}

const defaultWidgets: Widget[] = [
  {
    id: 'stats',
    name: 'Statistics',
    component: 'StatsWidget',
    defaultLayout: { i: 'stats', x: 0, y: 0, w: 12, h: 3, minW: 6, minH: 2 },
  },
  {
    id: 'quick-actions',
    name: 'Quick Actions',
    component: 'QuickActionsWidget',
    defaultLayout: { i: 'quick-actions', x: 0, y: 3, w: 12, h: 2, minW: 4, minH: 2 },
  },
  {
    id: 'recent-tickets',
    name: 'Recent Tickets',
    component: 'RecentTicketsWidget',
    defaultLayout: { i: 'recent-tickets', x: 0, y: 5, w: 8, h: 4, minW: 6, minH: 3 },
  },
  {
    id: 'status-overview',
    name: 'Status Overview',
    component: 'StatusOverviewWidget',
    defaultLayout: { i: 'status-overview', x: 8, y: 5, w: 4, h: 4, minW: 3, minH: 3 },
  },
  {
    id: 'revenue-chart',
    name: 'Revenue Chart',
    component: 'RevenueChartWidget',
    defaultLayout: { i: 'revenue-chart', x: 0, y: 9, w: 12, h: 3, minW: 6, minH: 2 },
  },
];

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  tickets,
  customers,
  pendingRequests,
  statuses,
  userRole,
  onNavigate,
  onViewLabel,
  onManageTicket,
  onUpdateStatus,
}) => {
  const [layouts, setLayouts] = useState<{ lg: Layout[] }>({ lg: [] });
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(
    defaultWidgets.map(w => w.id)
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDashboardLayout();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDashboardLayout = async () => {
    try {
      if (!isSupabaseConfigured) {
        setLayouts({ lg: defaultWidgets.map(w => w.defaultLayout) });
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLayouts({ lg: defaultWidgets.map(w => w.defaultLayout) });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading dashboard layout:', error);
      }

      if (data) {
        setLayouts({ lg: data.layout_config as Layout[] });
        setVisibleWidgets(data.visible_widgets);
      } else {
        setLayouts({ lg: defaultWidgets.map(w => w.defaultLayout) });
      }
    } catch (error) {
      console.error('Error loading dashboard layout:', error);
      setLayouts({ lg: defaultWidgets.map(w => w.defaultLayout) });
    } finally {
      setLoading(false);
    }
  };

  const saveDashboardLayout = async (newLayouts: Layout[], newVisibleWidgets: string[]) => {
    try {
      if (!isSupabaseConfigured) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('dashboard_layouts')
        .upsert({
          user_id: user.id,
          layout_config: newLayouts,
          visible_widgets: newVisibleWidgets,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving dashboard layout:', error);
      }
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
    }
  };

  const handleLayoutChange = (newLayout: Layout[]) => {
    const updatedLayouts = { lg: newLayout };
    setLayouts(updatedLayouts);
    saveDashboardLayout(newLayout, visibleWidgets);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const newVisibleWidgets = visibleWidgets.includes(widgetId)
      ? visibleWidgets.filter(id => id !== widgetId)
      : [...visibleWidgets, widgetId];

    setVisibleWidgets(newVisibleWidgets);
    saveDashboardLayout(layouts.lg, newVisibleWidgets);
  };

  const resetLayout = () => {
    const defaultLayout = defaultWidgets.map(w => w.defaultLayout);
    const allWidgetIds = defaultWidgets.map(w => w.id);
    setLayouts({ lg: defaultLayout });
    setVisibleWidgets(allWidgetIds);
    saveDashboardLayout(defaultLayout, allWidgetIds);
  };

  const renderWidget = (widgetId: string) => {
    const widget = defaultWidgets.find(w => w.id === widgetId);
    if (!widget) return null;

    switch (widget.component) {
      case 'StatsWidget':
        return (
          <StatsWidget
            tickets={tickets}
            customers={customers}
            pendingRequests={pendingRequests}
            statuses={statuses}
            onNavigate={onNavigate}
          />
        );
      case 'QuickActionsWidget':
        return (
          <QuickActionsWidget
            userRole={userRole}
            onNavigate={onNavigate}
          />
        );
      case 'RecentTicketsWidget':
        return (
          <RecentTicketsWidget
            tickets={tickets}
            statuses={statuses}
            onViewLabel={onViewLabel}
            onManageTicket={onManageTicket}
            onUpdateStatus={onUpdateStatus}
            onNavigate={onNavigate}
          />
        );
      case 'StatusOverviewWidget':
        return (
          <StatusOverviewWidget
            tickets={tickets}
            statuses={statuses}
          />
        );
      case 'RevenueChartWidget':
        return (
          <RevenueChartWidget
            tickets={tickets}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#ffb400' }}></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const visibleLayouts = layouts.lg.filter(layout => visibleWidgets.includes(layout.i));

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isLocked
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
            <span className="text-sm">{isLocked ? 'Locked' : 'Unlocked'}</span>
          </button>
          <p className="text-sm text-gray-600">
            {isLocked ? 'Unlock to customize your dashboard' : 'Drag widgets to rearrange'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetLayout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
            title="Reset to default layout"
          >
            <RotateCcw size={16} />
            <span className="text-sm">Reset</span>
          </button>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-medium"
          >
            <Settings size={16} />
            <span className="text-sm">Widgets</span>
          </button>
        </div>
      </div>

      {settingsOpen && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Widget Visibility</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {defaultWidgets.map(widget => {
              const isVisible = visibleWidgets.includes(widget.id);
              return (
                <button
                  key={widget.id}
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                    isVisible
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                  <span className="font-medium text-sm">{widget.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <Responsive
          className="layout"
          layouts={{ lg: visibleLayouts }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={80}
          onLayoutChange={handleLayoutChange}
          isDraggable={!isLocked}
          isResizable={!isLocked}
          compactType="vertical"
          preventCollision={false}
          width={containerWidth}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {visibleLayouts.map(layout => (
            <div
              key={layout.i}
              className={`${!isLocked ? 'cursor-move' : ''}`}
              style={{ overflow: 'visible' }}
            >
              <div className={`h-full w-full ${!isLocked ? 'ring-2 ring-blue-400 ring-opacity-50 rounded-xl' : ''}`}>
                {renderWidget(layout.i)}
              </div>
            </div>
          ))}
        </Responsive>
      </div>
    </div>
  );
};
