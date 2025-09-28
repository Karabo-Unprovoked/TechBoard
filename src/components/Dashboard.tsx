import React from 'react';
import { Plus, LogOut, FileText, Monitor } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onNewTicket: () => void;
  onViewTickets: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNewTicket, onViewTickets, onLogout }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/Untitled-CG.png" 
              alt="Guardian Assist Logo" 
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Guardian Assist</h1>
              <p className="text-sm text-gray-600">Computer Repair Management</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 inline-block">
              <div className="bg-blue-100 p-4 rounded-xl inline-block mb-6">
                <Plus size={48} className="text-blue-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Create a New Repair Ticket?
              </h2>
              
              <p className="text-gray-600 mb-8 max-w-md">
                Start by entering customer information and device details. 
                We'll generate a QR code label for easy tracking.
              </p>
              
              <button
                onClick={onNewTicket}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Create New Ticket
              </button>
              
              <button
                onClick={onViewTickets}
                className="bg-gray-600 text-white px-8 py-4 rounded-xl hover:bg-gray-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-4"
              >
                View All Tickets
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="bg-green-100 p-3 rounded-lg inline-block mb-4">
                <Monitor size={24} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Intake</h3>
              <p className="text-sm text-gray-600">
                Capture customer and device information in under 2 minutes
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="bg-purple-100 p-3 rounded-lg inline-block mb-4">
                <FileText size={24} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">View Tickets</h3>
              <p className="text-sm text-gray-600">
                Search and view all created repair tickets with detailed information
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="bg-orange-100 p-3 rounded-lg inline-block mb-4">
                <Plus size={24} className="text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">QR Code Labels</h3>
              <p className="text-sm text-gray-600">
                Automatically generate printable labels with QR codes for tracking
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};