import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail, ShieldCheck, Loader2, AlertCircle, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const normalizedEmail = email.toLowerCase().trim();
    console.log('Attempting admin login for:', normalizedEmail);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      console.log('Auth successful, checking profile for user:', data.user?.id);

      if (data.user) {
        // Try to fetch profile with retries to account for trigger delay
        let profile = null;
        let profileError = null;
        const maxRetries = 5;

        for (let i = 0; i < maxRetries; i++) {
          console.log(`Checking profile for admin role (attempt ${i + 1}/${maxRetries})...`);
          const response = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          
          if (!response.error && response.data) {
            profile = response.data;
            break;
          }
          
          profileError = response.error;
          // Wait longer between retries
          await new Promise(resolve => setTimeout(resolve, 800 * (i + 1)));
        }

        console.log('Profile fetch result:', { profile, profileError });

        if (!profile) {
          console.error('Profile error:', profileError);
          await supabase.auth.signOut();
          throw new Error('Could not verify admin status. Your account might be still being set up, please try again in a few seconds.');
        }

        if (profile.role?.toLowerCase() !== 'admin') {
          console.warn('User is not an admin. Role:', profile.role);
          await supabase.auth.signOut();
          throw new Error('Access denied. Admin privileges required.');
        }

        console.log('Admin verified, navigating to dashboard...');
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error('Login catch block:', err);
      setError(err.message || 'Failed to log in as admin.');
    } finally {
      console.log('Login flow finished, setting isLoading to false');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-outfit bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-500">
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
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-mesh opacity-30"></div>
        <div className="absolute inset-0 noise opacity-10"></div>
      </div>
      <div className="max-w-md w-full relative z-10 animate-scale-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-blue-100 border border-blue-200 mb-8 shadow-2xl shadow-blue-500/10 transform rotate-12">
            <ShieldCheck className="w-12 h-12 text-blue-600 transform -rotate-12" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-blue-950 mb-3">Admin Portal</h1>
          <p className="text-blue-900/40 font-bold uppercase text-xs tracking-widest">Elevated access required</p>
        </div>

        <div className="glass rounded-[3rem] p-12 border-blue-100 shadow-[0_32px_64px_-16px_rgba(37,99,235,0.15)] backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>

          {error && (
            <div className="mb-10 p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start text-red-600 animate-slide-up">
              <AlertCircle className="w-5 h-5 mr-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold uppercase tracking-tight leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div>
              <label className="text-xs font-bold text-blue-900/40 uppercase tracking-widest ml-1 block mb-3">Admin Identity</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-blue-300 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl pl-12 pr-6 py-4 text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all placeholder-blue-900/20 font-bold"
                  placeholder="admin@securevault.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-blue-900/40 uppercase tracking-widest ml-1 block mb-3">Authentication Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-blue-300 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl pl-12 pr-6 py-4 text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all placeholder-blue-900/20 font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center disabled:opacity-50 shadow-2xl shadow-blue-500/20 active:scale-[0.98] mt-4 uppercase tracking-[0.2em] text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Authorizing...
                </>
              ) : (
                'Initialize Session'
              )}
            </button>
          </form>

          <div className="mt-10 text-center relative z-10">
            <Link to="/login" className="text-blue-900/40 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95">
              <ArrowRight className="w-4 h-4 rotate-180" /> Return to Infrastructure
            </Link>
          </div>

          <div className="mt-12 text-center text-blue-900/20 text-[10px] font-black uppercase tracking-[0.3em] relative z-10">
            Managed by SecureVault Infrastructure
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
