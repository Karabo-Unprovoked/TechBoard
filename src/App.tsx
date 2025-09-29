import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { CustomerTracking } from './components/CustomerTracking';
import { supabase } from './lib/supabase';

type AppState = 'login' | 'dashboard' | 'track-customer';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
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
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setAppState('login');
  };

  const handleTrackCustomer = () => {
    setAppState('track-customer');
  };

  const handleBackToDashboard = () => {
    setAppState('dashboard');
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
      return <LoginForm onLogin={handleLogin} onTrackCustomer={handleTrackCustomer} />;
    
    case 'dashboard':
      return (
        <Dashboard 
          onTrackCustomer={handleTrackCustomer}
          onLogout={handleLogout}
        />
      );
    
    case 'track-customer':
      return (
        <CustomerTracking 
          onBack={handleBackToDashboard}
        />
      );
    
    default:
      return null;
  }
}

export default App;