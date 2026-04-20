import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail, ShieldAlert, Loader2, AlertCircle, CheckCircle, UserCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { continueAsGuest } = useAuth();

  const handleGuestMode = () => {
    continueAsGuest();
    navigate('/');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { role: role } }
      });

      if (error) throw error;

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('An account with this email already exists.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 5000);
      
    } catch (err: any) {
      setError(err.message || 'Account creation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
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
              <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500/40 font-bold mt-2">Protocol Genesis</p>
            </div>
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Initialize Profile</h1>
          <p className="text-blue-500/40 font-bold tracking-tight uppercase text-xs">Begin your journey into secure communication</p>
        </div>

        <div className="glass rounded-[3rem] p-8 sm:p-12 border-blue-500/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-br-[5rem] -ml-8 -mt-8 transition-transform group-hover:scale-110"></div>
          
          {error && (
            <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start text-red-400 animate-slide-up">
              <AlertCircle className="w-5 h-5 mr-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {success ? (
            <div className="py-10 flex flex-col items-center text-center animate-scale-in">
              <div className="w-24 h-24 bg-blue-500/10 rounded-[2rem] flex items-center justify-center border border-blue-500/20 mb-8 shadow-2xl shadow-blue-500/10 animate-bounce-slow">
                <CheckCircle className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-3xl font-extrabold mb-4">Profile Created</h3>
              <p className="text-blue-500/60 font-bold mb-10 leading-relaxed">Check your terminal for the activation sequence link.</p>
              <div className="w-full bg-blue-500/10 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full animate-[progress_5s_linear_forwards]" style={{ width: '100%' }}></div>
              </div>
              <p className="text-[10px] text-blue-500/40 uppercase tracking-[0.4em] mt-6 font-bold">Auto-Redirect Protocol Active</p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-blue-500/40 uppercase tracking-[0.2em] ml-1">Identity Identifier</label>
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
                    placeholder="operator@nexus.com"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-blue-500/40 uppercase tracking-[0.2em] ml-1">Establish Secret Key</label>
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
                    placeholder="Entropy-rich sequence"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-blue-500/40 uppercase tracking-[0.2em] ml-1">Confirm Sequence</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                    <Lock className="w-5 h-5 text-blue-500/30 group-focus-within:text-blue-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-blue-500/5 border border-blue-500/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-blue-500/10 transition-all placeholder-blue-500/10 font-bold"
                    placeholder="Verify secret key"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password || !confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-5 rounded-2xl transition-all flex items-center justify-center disabled:opacity-30 shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 group active:scale-[0.98] mt-4 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Initializing Genesis...
                  </>
                ) : (
                  <span className="flex items-center gap-3">
                    Activate Profile <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                )}
              </button>

              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-blue-500/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.3em]">
                  <span className="bg-[#f8fafc] dark:bg-[#020617] px-4 text-blue-500/40 transition-colors duration-500">Protocol Alternative</span>
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
          )}

          <div className="mt-12 text-center text-sm font-bold">
            <span className="text-blue-500/40 uppercase tracking-widest text-[10px]">Known identity?</span>{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-400 transition-colors ml-2 uppercase tracking-widest text-[10px]">
              Access existing vault
            </Link>
          </div>
        </div>

        <p className="mt-10 text-center text-[10px] text-blue-500/20 uppercase tracking-[0.4em] font-bold">
          Military-Grade Genesis Protocol
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
