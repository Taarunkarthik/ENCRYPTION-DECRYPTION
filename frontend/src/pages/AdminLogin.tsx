import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail, ShieldCheck, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

        if (profile.role !== 'admin') {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-outfit">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-6 shadow-lg shadow-blue-500/20 transform rotate-12">
            <ShieldCheck className="w-10 h-10 text-white transform -rotate-12" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-3">Admin Portal</h1>
          <p className="text-slate-400 font-medium">Elevated access required</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start text-red-400 animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2 ml-1">Admin Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-600"
                placeholder="admin@securevault.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2 ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center disabled:opacity-50 shadow-xl shadow-blue-900/20 active:scale-[0.98] mt-4 uppercase tracking-widest text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Authorizing...
              </>
            ) : (
              'Enter Secure Zone'
            )}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <Link to="/login" className="text-slate-500 hover:text-blue-400 font-bold text-sm transition-colors flex items-center justify-center gap-2">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to User Portal
          </Link>
        </div>

        <div className="mt-10 text-center text-slate-500 text-xs font-bold uppercase tracking-widest relative z-10">
          Managed by SecureVault Infrastructure
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
