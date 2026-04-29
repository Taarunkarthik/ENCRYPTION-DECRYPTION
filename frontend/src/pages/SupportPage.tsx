
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Send, ArrowLeft, ShieldCheck, Loader2, User, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const SupportPage = () => {
  const { user, isGuest } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await api.post('/support', {
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      setIsSuccess(true);
      setSubject('');
      setMessage('');
      if (isGuest) {
        setEmail('');
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-slide-up max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center text-muted hover:text-blue-500 mb-10 transition-all group font-bold text-sm tracking-widest uppercase">
        <div className="p-2 bg-blue-100/10 rounded-lg mr-3 group-hover:bg-blue-600/10 transition-colors border border-blue-500/20">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Return to Infrastructure
      </Link>

      <div className="glass rounded-[2.5rem] p-8 sm:p-12 border-blue-100 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-12 relative z-10">
          <div className="p-5 bg-blue-100 rounded-3xl border border-blue-200 shadow-xl shadow-blue-500/5">
            <HelpCircle className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-main)] mb-1">Support & Feedback</h1>
            <p className="text-muted font-bold tracking-tight uppercase text-xs">Direct communication line to SecureVault specialists</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center text-center animate-scale-in">
            <div className="w-24 h-24 bg-blue-100 rounded-[2.5rem] flex items-center justify-center border border-blue-200 mb-8 shadow-2xl shadow-blue-500/5">
              <ShieldCheck className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-[var(--text-main)] mb-4 tracking-tight">Transmission Received</h3>
            <p className="text-muted mb-10 max-w-sm font-bold leading-relaxed">
              Your feedback has been securely transmitted. Our security specialists will review your message shortly.
            </p>
            <Link 
              to="/" 
              className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              Back to Infrastructure
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 font-bold text-sm">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Identity Information</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-blue-300 group-focus-within:text-blue-600 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={!isGuest}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-blue-500/5 border border-sharp rounded-2xl pl-12 pr-4 py-4 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white/5 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-placeholder"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Subject Protocol</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-blue-300 group-focus-within:text-blue-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Topic of inquiry"
                    className="w-full bg-blue-500/5 border border-sharp rounded-2xl pl-12 pr-4 py-4 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white/5 transition-all font-bold placeholder:text-placeholder"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Message Payload</label>
              <div className="relative group">
                <div className="absolute top-5 left-5 pointer-events-none text-blue-300 group-focus-within:text-blue-600 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your feedback or technical inquiry..."
                  rows={6}
                  className="w-full bg-blue-500/5 border border-sharp rounded-2xl pl-12 pr-6 py-4 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white/5 transition-all font-bold resize-none placeholder:text-placeholder"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !message || !subject || !email}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-[2rem] transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-blue-600/20 hover:shadow-blue-600/40 group active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Transmitting Payload...
                </>
              ) : (
                <span className="flex items-center gap-3 text-lg">
                  Submit Feedback <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="glass p-8 rounded-[2rem] border-blue-100 flex flex-col items-center text-center shadow-xl shadow-blue-500/5">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5 text-blue-600 border border-blue-200">
            <Mail className="w-6 h-6" />
          </div>
          <h4 className="text-[10px] font-black text-[var(--text-main)] mb-1 uppercase tracking-[0.2em]">Secure Email</h4>
          <p className="text-xs font-bold text-muted">karthiktaarun@gmail.com</p>
        </div>
        <div className="glass p-8 rounded-[2rem] border-blue-100 flex flex-col items-center text-center shadow-xl shadow-blue-500/5">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5 text-blue-600 border border-blue-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="text-[10px] font-black text-[var(--text-main)] mb-1 uppercase tracking-[0.2em]">Operational Uptime</h4>
          <p className="text-xs font-bold text-muted">99.9% Infrastructure Availability</p>
        </div>
        <div className="glass p-8 rounded-[2rem] border-blue-100 flex flex-col items-center text-center shadow-xl shadow-blue-500/5">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5 text-blue-600 border border-blue-200">
            <Loader2 className="w-6 h-6" />
          </div>
          <h4 className="text-[10px] font-black text-[var(--text-main)] mb-1 uppercase tracking-[0.2em]">Response Latency</h4>
          <p className="text-xs font-bold text-muted">&lt; 2 Hour Rapid Response</p>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
