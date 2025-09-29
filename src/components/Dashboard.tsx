@@ .. @@
 import React from 'react';
-import { DashboardHeader } from './DashboardHeader';
-import { StatCard } from './StatCard';
-import { QuickActions } from './QuickActions';
-import { RevenueChart } from './RevenueChart';
-import { TicketsOverview } from './TicketsOverview';
-import { TechniciansPanel } from './TechniciansPanel';
-import { InventoryAlert } from './InventoryAlert';
-import { 
-  DollarSign, 
-  FileText, 
-  Clock, 
-  CheckCircle, 
-  Users, 
-  Star 
-} from 'lucide-react';
-import { mockStats, mockTickets, mockTechnicians, mockInventory } from '../data/mockData';
+import { ArrowLeft, LogOut, User, Plus, FileText, Users, Package, Settings, DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';
+import { StatCard } from './StatCard';
+import { QuickActions } from './QuickActions';
+import { RevenueChart } from './RevenueChart';
+import { TicketsOverview } from './TicketsOverview';
+import { TechniciansPanel } from './TechniciansPanel';
+import { InventoryAlert } from './InventoryAlert';
+import { mockStats, mockTickets, mockTechnicians, mockInventory } from '../data/mockData';

-export const Dashboard: React.FC = () => {
+interface DashboardProps {
+  onBack: () => void;
+  onLogout: () => void;
+  onTrackCustomer: () => void;
+}
+
+export const Dashboard: React.FC<DashboardProps> = ({ onBack, onLogout, onTrackCustomer }) => {
+  const handleLogout = async () => {
+    onLogout();
+  };
+
+  const PRIMARY = '#ffb400';
+  const SECONDARY = '#5d5d5d';
+
   return (
-    <div className="min-h-screen bg-gray-50">
-      <DashboardHeader />
+    <>
+      {/* Load Montserrat from Google Fonts */}
+      <link
+        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
+        rel="stylesheet"
+      />
+
+      <div
+        className="min-h-screen bg-gray-50"
+        style={{ fontFamily: 'Montserrat, sans-serif' }}
+      >
+        {/* Header */}
+        <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
+          <div className="flex items-center justify-between">
+            <div className="flex items-center gap-4">
+              <button
+                onClick={onBack}
+                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
+              >
+                <ArrowLeft size={20} />
+              </button>
+              <div className="flex items-center gap-3">
+                <img
+                  src="/Untitled-CG.png"
+                  alt="Guardian Assist Logo"
+                  className="w-10 h-10 rounded-lg"
+                />
+                <div>
+                  <h1 className="text-xl font-bold" style={{ color: SECONDARY }}>
+                    Guardian Assist Dashboard
+                  </h1>
+                  <p className="text-sm" style={{ color: SECONDARY }}>
+                    Computer Repair Management System
+                  </p>
+                </div>
+              </div>
+            </div>
+            
+            <div className="flex items-center gap-2">
+              <button
+                onClick={onTrackCustomer}
+                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100"
+                style={{ color: SECONDARY }}
+              >
+                <FileText size={16} />
+                <span>Track Customer</span>
+              </button>
+              <button
+                onClick={handleLogout}
+                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100"
+                style={{ color: SECONDARY }}
+              >
+                <LogOut size={16} />
+                <span>Logout</span>
+              </button>
+            </div>
+          </div>
+        </header>
       
-      <main className="p-6">
-        <div className="max-w-7xl mx-auto">
-          {/* Stats Grid */}
-          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
-            <StatCard
-              title="Total Revenue"
-              value={`$${mockStats.totalRevenue.toLocaleString()}`}
-              change="+12.5%"
-              changeType="positive"
-              icon={DollarSign}
-              color="green"
-            />
-            <StatCard
-              title="Active Tickets"
-              value={mockStats.pendingTickets}
-              change="+3 today"
-              changeType="positive"
-              icon={FileText}
-              color="blue"
-            />
-            <StatCard
-              title="Avg. Repair Time"
-              value={`${mockStats.averageRepairTime} days`}
-              change="-0.5 days"
-              changeType="positive"
-              icon={Clock}
-              color="orange"
-            />
-            <StatCard
-              title="Completed Today"
-              value={mockStats.completedTickets}
-              change="+8%"
-              changeType="positive"
-              icon={CheckCircle}
-              color="purple"
-            />
-          </div>
+        <main className="p-6">
+          <div className="max-w-7xl mx-auto">
+            {/* Stats Grid */}
+            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
+              <StatCard
+                title="Total Revenue"
+                value={`$${mockStats.totalRevenue.toLocaleString()}`}
+                change="+12.5%"
+                changeType="positive"
+                icon={DollarSign}
+                color="green"
+              />
+              <StatCard
+                title="Active Tickets"
+                value={mockStats.pendingTickets}
+                change="+3 today"
+                changeType="positive"
+                icon={FileText}
+                color="blue"
+              />
+              <StatCard
+                title="Avg. Repair Time"
+                value={`${mockStats.averageRepairTime} days`}
+                change="-0.5 days"
+                changeType="positive"
+                icon={Clock}
+                color="orange"
+              />
+              <StatCard
+                title="Completed Today"
+                value={mockStats.completedTickets}
+                change="+8%"
+                changeType="positive"
+                icon={CheckCircle}
+                color="purple"
+              />
+            </div>
           
-          {/* Main Content Grid */}
-          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
-            {/* Left Column */}
-            <div className="lg:col-span-2 space-y-6">
-              <TicketsOverview tickets={mockTickets} />
-              <RevenueChart />
+            {/* Main Content Grid */}
+            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
+              {/* Left Column */}
+              <div className="lg:col-span-2 space-y-6">
+                <TicketsOverview tickets={mockTickets} />
+                <RevenueChart />
+              </div>
+              
+              {/* Right Column */}
+              <div className="space-y-6">
+                <QuickActions />
+                <TechniciansPanel technicians={mockTechnicians} />
+                <InventoryAlert inventory={mockInventory} />
+              </div>
             </div>
-            
-            {/* Right Column */}
-            <div className="space-y-6">
-              <QuickActions />
-              <TechniciansPanel technicians={mockTechnicians} />
-              <InventoryAlert inventory={mockInventory} />
-            </div>
           </div>
-        </div>
-      </main>
-    </div>
+        </main>
+      </div>
+    </>
   );
 };