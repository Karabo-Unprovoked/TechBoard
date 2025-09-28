import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { CustomerForm } from './components/CustomerForm';
import { TicketsView } from './components/TicketsView';
import { TicketLabel } from './components/TicketLabel';
import { supabase } from './lib/supabase';
import type { Customer, RepairTicket } from './lib/supabase';

type AppState = 'login' | 'dashboard' | 'new-ticket' | 'view-tickets' | 'ticket-created';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [currentTicket, setCurrentTicket] = useState<(RepairTicket & { customer: Customer }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAppState('dashboard');
      }
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setAppState('dashboard');
      } else if (event === 'SIGNED_OUT') {
        setAppState('login');
        setCurrentTicket(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setAppState('login');
    setCurrentTicket(null);
  };

  const handleNewTicket = () => {
    setAppState('new-ticket');
    setCurrentTicket(null);
  };

  const handleViewTickets = () => {
    setAppState('view-tickets');
    setCurrentTicket(null);
  };

  const handleTicketCreated = (ticket: RepairTicket & { customer: Customer }) => {
    setCurrentTicket(ticket);
    setAppState('ticket-created');
  };

  const handleViewTicket = (ticket: RepairTicket & { customer: Customer }) => {
    setCurrentTicket(ticket);
    setAppState('ticket-created');
  };

  const handleBackToDashboard = () => {
    setAppState('dashboard');
    setCurrentTicket(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  switch (appState) {
    case 'login':
      return <LoginForm onLogin={handleLogin} />;
    
    case 'dashboard':
      return (
        <Dashboard 
          onNewTicket={handleNewTicket}
          onViewTickets={handleViewTickets}
          onLogout={handleLogout}
        />
      );
    
    case 'new-ticket':
      return (
        <CustomerForm 
          onTicketCreated={handleTicketCreated}
          onBack={handleBackToDashboard}
        />
      );
    
    case 'view-tickets':
      return (
        <TicketsView 
          onBack={handleBackToDashboard}
          onViewTicket={handleViewTicket}
        />
      );
    
    case 'ticket-created':
      return currentTicket ? (
        <TicketLabel 
          ticket={currentTicket}
          onBack={handleBackToDashboard}
          onNewTicket={handleNewTicket}
        />
      ) : null;
    
    default:
      return null;
  }
}

export default App;