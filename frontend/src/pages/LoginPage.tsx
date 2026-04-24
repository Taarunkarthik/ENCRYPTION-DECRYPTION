import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail, ShieldAlert, Loader2, AlertCircle, UserCircle, ArrowRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { continueAsGuest } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleGuestMode = () => {
    continueAsGuest();
    navigate('/');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Email confirmation required. Please check your inbox.');
        }
        if (error.status === 400) {
          throw new Error('Invalid credentials. Please verify your email and password.');
        }
        throw error;
      }

      if (data.user) {
        let role = 'user';
        const maxRetries = 5;

        for (let i = 0; i < maxRetries; i++) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          
          if (!profileError && profile) {
            role = profile.role || 'user';
            break;
          }
          if (i < maxRetries - 1) await new Promise(resolve => setTimeout(resolve, 800));
        }

        navigate(role === 'admin' ? '/admin/dashboard' : '/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* Theme Toggle Button */}
      <div className="fixed top-8 right-8 z-50">
        <button
          onClick={toggleTheme}
          className="p-4 border border-sharp bg-white/5 backdrop-blur-md hover:bg-blue-600/10 transition-all text-muted hover:text-blue-500 group rounded-2xl shadow-xl"
          title={theme === 'light' ? "Activate Dark Protocol" : "Activate Light Protocol"}
        >
          {theme === 'light' ? (
            <Moon className="w-6 h-6 transition-transform group-hover:rotate-12" />
          ) : (
            <Sun className="w-6 h-6 text-amber-500 transition-transform group-hover:rotate-90" />
          )}
        </button>
      </div>

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-mesh opacity-30"></div>
        <div className="absolute inset-0 noise opacity-10"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-scale-in">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-4 group mb-10">
            <div className="relative p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-all duration-500 shadow-2xl shadow-blue-500/10 group-hover:rotate-6">
              <ShieldAlert className="w-10 h-10 text-blue-500" />
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-extrabold tracking-tight leading-none">SecureVault</h2>
              <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500/60 font-bold mt-2">Protocol Access</p>
            </div>
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Identity Verification</h1>
          <p className="text-blue-500/60 font-bold tracking-tight uppercase text-xs">Decrypt your session to access the vault</p>
        </div>

        <div className="glass rounded-[3rem] p-8 sm:p-12 border-blue-500/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          
          {error && (
            <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start text-red-400 animate-slide-up">
              <AlertCircle className="w-5 h-5 mr-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Operational ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                  <Mail className="w-5 h-5 text-blue-500/30 group-focus-within:text-blue-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-blue-500/5 border border-blue-500/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-blue-500/10 transition-all placeholder-blue-500/10 font-bold"
                  placeholder="name@agency.gov"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Access Sequence</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                  <Lock className="w-5 h-5 text-blue-500/30 group-focus-within:text-blue-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-blue-500/5 border border-blue-500/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-blue-500/10 transition-all placeholder-blue-500/10 font-bold"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-5 rounded-2xl transition-all flex items-center justify-center disabled:opacity-30 shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 group active:scale-[0.98] text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Synchronizing...
                </>
              ) : (
                <span className="flex items-center gap-3">
                  Initiate Authorization <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>
              )}
            </button>

            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-blue-500/10"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.3em]">
                <span className="bg-[var(--bg-main)] px-4 text-muted transition-colors duration-500">Protocol Alternative</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGuestMode}
              className="w-full bg-blue-500/5 hover:bg-blue-500/10 text-blue-500 font-extrabold py-5 rounded-2xl border border-blue-500/10 transition-all flex items-center justify-center active:scale-[0.98] shadow-lg shadow-transparent hover:shadow-blue-500/5"
            >
              <UserCircle className="w-6 h-6 mr-3 opacity-60" />
              Continue as Guest Analyst
            </button>
          </form>

          <div className="mt-12 text-center text-sm font-bold">
            <span className="text-muted uppercase tracking-widest text-[10px]">New operator?</span>{' '}
            <Link to="/signup" className="text-blue-500 hover:text-blue-400 transition-colors ml-2 uppercase tracking-widest text-[10px]">
              Initialize secure profile
            </Link>
          </div>
        </div>

        <p className="mt-10 text-center text-[10px] text-blue-500/20 uppercase tracking-[0.4em] font-bold">
          End-to-End Cryptographic Session
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
