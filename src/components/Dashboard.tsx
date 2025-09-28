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

  const PRIMARY = '#ffb400';
  const SECONDARY = '#5d5d5d';

  return (
    <>
      {/* Load Montserrat from Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen"
        style={{
          fontFamily: 'Montserrat, sans-serif',
          background: `linear-gradient(135deg, rgba(255,180,0,0.06) 0%, rgba(93,93,93,0.03) 100%)`,
        }}
      >
        <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/Untitled-CG.png"
                alt="Guardian Assist Logo"
                className="w-10 h-10 rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold" style={{ color: SECONDARY }}>
                  Guardian Assist
                </h1>
                <p className="text-sm" style={{ color: SECONDARY }}>
                  Computer Repair Management
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
              style={{
                color: SECONDARY,
                background: 'transparent',
              }}
            >
              <LogOut size={16} style={{ color: SECONDARY }} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 inline-block">
                <div
                  className="p-4 rounded-xl inline-block mb-6"
                  style={{ background: 'rgba(255,180,0,0.12)' }}
                >
                  <Plus size={48} style={{ color: PRIMARY }} />
                </div>

                <h2 className="text-2xl font-bold mb-4" style={{ color: SECONDARY }}>
                  Ready to Create a New Repair Ticket?
                </h2>

                <p className="mb-8 max-w-md" style={{ color: SECONDARY }}>
                  Start by entering customer information and device details. 
                  We'll generate a QR code label for easy tracking.
                </p>

                <button
                  onClick={onNewTicket}
                  className="px-8 py-4 rounded-xl transition-colors font-semibold text-lg shadow-lg transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: PRIMARY,
                    color: '#1f1f1f',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                  }}
                >
                  Create New Ticket
                </button>

                <div className="mt-4">
                  <button
                    onClick={onViewTickets}
                    className="px-8 py-4 rounded-xl transition-colors font-semibold text-lg shadow-lg transform hover:-translate-y-0.5"
                    style={{
                      backgroundColor: SECONDARY,
                      color: '#ffffff',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                    }}
                  >
                    View All Tickets
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="p-3 rounded-lg inline-block mb-4" style={{ background: 'rgba(34,197,94,0.08)' }}>
                  <Monitor size={24} style={{ color: '#22c55e' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: SECONDARY }}>
                  Quick Intake
                </h3>
                <p className="text-sm" style={{ color: SECONDARY }}>
                  Capture customer and device information in under 2 minutes
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="p-3 rounded-lg inline-block mb-4" style={{ background: 'rgba(139,92,246,0.08)' }}>
                  <FileText size={24} style={{ color: '#8b5cf6' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: SECONDARY }}>
                  View Tickets
                </h3>
                <p className="text-sm" style={{ color: SECONDARY }}>
                  Search and view all created repair tickets with detailed information
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="p-3 rounded-lg inline-block mb-4" style={{ background: 'rgba(255,165,0,0.08)' }}>
                  <Plus size={24} style={{ color: 'rgb(255,165,0)' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: SECONDARY }}>
                  QR Code Labels
                </h3>
                <p className="text-sm" style={{ color: SECONDARY }}>
                  Automatically generate printable labels with QR codes for tracking
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};