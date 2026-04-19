import { useState, useEffect } from 'react';
import { Clock, RefreshCw, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const SESSION_WARNING_THRESHOLD = 5 * 60; // 5 minutes in seconds

const SessionWarning = () => {
  const { session } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!session) {
      setSecondsLeft(null);
      return;
    }

    const checkSession = () => {
      const expiresAt = session.expires_at; // Unix timestamp in seconds
      if (!expiresAt) return;

      const now = Math.floor(Date.now() / 1000);
      const remaining = expiresAt - now;

      if (remaining <= SESSION_WARNING_THRESHOLD && remaining > 0) {
        setSecondsLeft(remaining);
        setDismissed(false);
      } else {
        setSecondsLeft(null);
      }
    };

    checkSession();
  }, [session]);

  // Countdown ticker
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const ticker = setInterval(() => {
      setSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(ticker);
  }, [secondsLeft]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.auth.refreshSession();
      if (!error) {
        setSecondsLeft(null);
        setDismissed(true);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (dismissed || secondsLeft === null) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-yellow-900/90 border border-yellow-500/50 rounded-xl p-4 shadow-2xl backdrop-blur-sm flex items-start gap-3">
        <div className="p-2 bg-yellow-500/20 rounded-lg flex-shrink-0">
          <Clock className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-yellow-300 font-semibold text-sm">Session expiring soon</p>
          <p className="text-yellow-400/80 text-xs mt-0.5">
            Your session expires in{' '}
            <span className="font-bold text-yellow-300">{formatTime(secondsLeft)}</span>
          </p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-2 flex items-center gap-1.5 text-xs text-yellow-300 hover:text-white font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Extend session'}
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-500 hover:text-yellow-300 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SessionWarning;
