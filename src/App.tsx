import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { CustomerTracking } from './components/CustomerTracking';
import { Dashboard } from './components/Dashboard';
import { supabase } from './lib/supabase';
import { NotificationContainer } from './components/Notification';
import type { NotificationType } from './components/Notification';

type AppState = 'login' | 'track-customer' | 'dashboard';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; type: NotificationType; message: string }>
  >([]);

  const showNotification = (type: NotificationType, message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const hash = window.location.hash;
      if (hash && hash.startsWith('#track-')) {
        setAppState('track-customer');
        setLoading(false);
        return;
      }

      if (session) {
        setIsAuthenticated(true);
        setAppState('dashboard');
      }
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setAppState('dashboard');
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setAppState('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAppState('login');
  };

  const handleTrackCustomer = () => {
    setAppState('track-customer');
  };

  const handleDashboard = () => {
    setAppState('dashboard');
  };

  const handleBackToLogin = () => {
    setAppState('login');
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
      return <LoginForm onTrackCustomer={handleTrackCustomer} onDashboard={handleDashboard} />;
    
    case 'track-customer':
      return (
        <CustomerTracking 
          onBack={isAuthenticated ? handleDashboard : handleBackToLogin}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
          onDashboard={isAuthenticated ? handleDashboard : undefined}
        />
      );
    
    case 'dashboard':
      if (!isAuthenticated) {
        setAppState('login');
        return null;
      }
      return (
        <>
          <Dashboard
            onBack={handleBackToLogin}
            onLogout={handleLogout}
            onTrackCustomer={handleTrackCustomer}
            onNotification={showNotification}
          />
          <NotificationContainer
            notifications={notifications}
            onRemove={removeNotification}
          />
        </>
      );

    default:
      return null;
  }
}

export default App;