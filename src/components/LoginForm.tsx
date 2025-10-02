import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Search, User, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginFormProps {
  onTrackCustomer: () => void;
  onDashboard: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onTrackCustomer, onDashboard }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Supabase is not configured. Please set up your database connection.');
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide more helpful error messages
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials or create an account if you don\'t have one.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else {
          setError(error.message);
        }
      } else {
        // Authentication state change will be handled by App component automatically
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Supabase is not configured. Please set up your database connection.');
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Provide more helpful error messages for sign up
        if (error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          setError('Password must be at least 6 characters long.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Account created successfully! You can now sign in with your credentials.');
        setIsSignUp(false);
        // Clear the form
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const PRIMARY = '#ffb400';
  const SECONDARY = '#5d5d5d';

  return (
    <>
      {/* Load Montserrat from Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen flex"
        style={{
          fontFamily: 'Montserrat, sans-serif',
          backgroundColor: '#f8f9fa',
        }}
      >
        {/* Left Sidebar */}
        <div
          className="w-80 flex flex-col"
          style={{ backgroundColor: PRIMARY }}
        >
          {/* Logo and Brand */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <img 
                src="/FinalWhite.png" 
                alt="Guardian Assist Logo" 
                className="w-12 h-12 rounded-xl bg-white/10 p-1"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Guardian Assist</h1>
                <p className="text-sm text-white/80">Computer Repair Management</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 px-6">
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 cursor-pointer group">
                <User size={20} />
                <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">Log in</span>
              </div>
              <button
                onClick={onTrackCustomer}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 group"
              >
                <Search size={20} />
                <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">Track Customer</span>
              </button>
              <button
                onClick={() => window.open('mailto:support@guardianassist.co.za', '_blank')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 group"
              >
                <HelpCircle size={20} />
                <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">Help centre</span>
              </button>
            </nav>
          </div>

          {/* Footer */}
          <div className="p-6 text-center">
            <p className="text-xs text-white/60">
              © 2025 Guardian Assist. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Welcome Header */}
            <div className="text-center mb-8">
              <img 
                src="/Untitled-CG.png" 
                alt="Guardian Assist Logo" 
                className="w-16 h-16 mx-auto mb-4 rounded-xl"
              />
              <h2 className="text-2xl font-bold mb-2" style={{ color: SECONDARY }}>
                Welcome to Guardian Assist
              </h2>
              <p className="text-gray-600">
                {isSignUp ? 'Create your account to get started' : 'Sign in to your account to continue'}
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6 text-center" style={{ color: SECONDARY }}>
                {isSignUp ? 'Create Account' : 'Log in'}
              </h3>

              {!isSignUp && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>First time user?</strong> Click "Register here" below to create your account.
                  </p>
                </div>
              )}

              <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: SECONDARY }}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent outline-none bg-gray-50"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: SECONDARY }}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent outline-none bg-gray-50"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {!isSignUp && (
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm font-medium hover:underline"
                      style={{ color: PRIMARY }}
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors text-white"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Log in')}
                </button>

                <div className="text-center">
                  <span className="text-gray-600 text-sm">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                    }}
                    className="font-medium hover:underline text-sm"
                    style={{ color: PRIMARY }}
                  >
                    {isSignUp ? 'Sign in here.' : 'Register here.'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};