import React, { useState } from 'react';
import { textService } from '../services/api';
import { Unlock, Copy, ArrowLeft, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TextDecryptionPage = () => {
  const [encryptedText, setEncryptedText] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [decryptedText, setDecryptedText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDecryptedText('');

    if (!encryptedText.trim()) { setError('Please enter the encrypted text.'); return; }
    if (passphrase.length < 8) { setError('Passphrase must be at least 8 characters long.'); return; }

    try {
      setLoading(true);
      const response = await textService.decryptText(encryptedText, passphrase);
      setDecryptedText(response.decryptedText);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Decryption failed. Invalid passphrase or corrupted data.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(decryptedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setEncryptedText('');
    setPassphrase('');
    setDecryptedText('');
    setError('');
  };

  return (
    <div className="animate-slide-up flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <Link to="/" className="inline-flex items-center text-muted hover:text-blue-500 mb-8 transition-all group font-bold text-sm tracking-widest uppercase">
          <div className="p-2 bg-white/5 rounded-lg mr-3 group-hover:bg-blue-600/10 transition-colors border border-sharp">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Return to Infrastructure
        </Link>

        <div className="border-sharp bg-card rounded-[2.5rem] p-6 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>
          
          <div className="flex items-center mb-10 pb-8 border-b border-sharp relative z-10">
            <div className="p-5 bg-blue-600/10 rounded-3xl border border-blue-500/20 shadow-xl shadow-blue-500/5">
              <Unlock className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-main)] mb-1">
                Decrypt Text
              </h1>
              <p className="text-muted font-bold tracking-tight uppercase text-xs">Decrypt your secure AES-256-GCM messages.</p>
            </div>
          </div>

          <form onSubmit={handleDecrypt} className="space-y-5">
            {/* Encrypted Input */}
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1 block mb-2">Encrypted Text (Base64)</label>
              <textarea
                className="w-full bg-[var(--bg-main)] border border-sharp rounded-2xl p-4 text-blue-400 font-mono text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:outline-none transition-all h-40 resize-none font-medium placeholder:text-placeholder"
                placeholder="Paste the encrypted Base64 string here..."
                value={encryptedText}
                onChange={(e) => setEncryptedText(e.target.value)}
                required
              />
            </div>

            {/* Passphrase with visibility toggle */}
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1 block mb-2">Decryption Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                  <Unlock className="w-5 h-5 text-muted group-focus-within:text-blue-500" />
                </div>
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  className="w-full bg-[var(--bg-main)] border border-sharp rounded-2xl pl-12 pr-12 py-4 text-[var(--text-main)] focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:outline-none transition-all font-bold placeholder:text-placeholder"
                  placeholder="Enter the original passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-muted hover:text-blue-500 transition-colors"
                >
                  {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !encryptedText.trim() || passphrase.length < 8}
                className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                {loading ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> Processing...</>
                ) : (
                  <><Unlock className="w-5 h-5" /> Initiate Decryption</>
                )}
              </button>
              {(encryptedText || decryptedText) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-8 py-5 bg-white/5 hover:bg-blue-600/10 text-muted hover:text-blue-500 rounded-2xl font-bold transition-all border border-sharp active:scale-95"
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Decrypted Result */}
          {decryptedText && (
            <div className="mt-10 pt-10 border-t border-sharp">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-widest">Decrypted Plain Text</label>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center text-xs font-bold text-muted uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-sharp hover:bg-blue-600/10 hover:text-blue-500 transition-all active:scale-95"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
              <div className="w-full bg-[var(--bg-main)] border border-sharp rounded-2xl p-6 text-[var(--text-main)] font-medium min-h-[10rem] whitespace-pre-wrap text-sm leading-relaxed">
                {decryptedText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextDecryptionPage;
