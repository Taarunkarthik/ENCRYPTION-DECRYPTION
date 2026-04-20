import React, { useState } from 'react';
import { textService } from '../services/api';
import { Lock, Copy, ArrowLeft, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import PassphraseStrength from '../components/PassphraseStrength';

const TextEncryptionPage = () => {
  const [text, setText] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [encryptedText, setEncryptedText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEncrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!text.trim()) { setError('Please enter text to encrypt.'); return; }
    if (passphrase.length < 8) { setError('Passphrase must be at least 8 characters long.'); return; }

    try {
      setLoading(true);
      const response = await textService.encryptText(text, passphrase);
      setEncryptedText(response.encryptedTextBase64);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to encrypt text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(encryptedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setText('');
    setPassphrase('');
    setEncryptedText('');
    setError('');
  };

  return (
    <div className="animate-slide-up flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <Link to="/" className="inline-flex items-center text-blue-900/40 hover:text-blue-600 mb-8 transition-all group font-bold text-sm tracking-widest uppercase">
          <div className="p-2 bg-blue-50 rounded-lg mr-3 group-hover:bg-blue-100 transition-colors border border-blue-100">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Return to Infrastructure
        </Link>

        <div className="glass rounded-[2.5rem] p-6 sm:p-12 border-blue-100 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>
          
          <div className="flex items-center mb-10 pb-8 border-b border-blue-100 relative z-10">
            <div className="p-5 bg-blue-100 rounded-3xl border border-blue-200 shadow-xl shadow-blue-500/5">
              <Lock className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-blue-950 mb-1">
                Encrypt Text
              </h1>
              <p className="text-blue-900/40 font-bold tracking-tight uppercase text-xs">Secure your sensitive text messages with AES-256-GCM.</p>
            </div>
          </div>

          <form onSubmit={handleEncrypt} className="space-y-5">
            {/* Plain Text Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-blue-900/40 uppercase tracking-[0.2em] ml-1">Plain Text Input</label>
                <span className="text-[10px] font-bold text-blue-900/20 uppercase tracking-widest">{text.length} characters</span>
              </div>
              <textarea
                className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-blue-950 focus:ring-2 focus:ring-blue-500/40 focus:bg-white focus:outline-none transition-all h-40 resize-none font-medium placeholder-blue-900/20"
                placeholder="Enter the text you want to encrypt..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />
            </div>

            {/* Passphrase with visibility toggle */}
            <div>
              <label className="text-xs font-bold text-blue-900/40 uppercase tracking-[0.2em] ml-1 block mb-2">Encryption Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                  <Lock className="w-5 h-5 text-blue-300 group-focus-within:text-blue-500" />
                </div>
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl pl-12 pr-12 py-4 text-blue-950 focus:ring-2 focus:ring-blue-500/40 focus:bg-white focus:outline-none transition-all font-bold placeholder-blue-900/20"
                  placeholder="Must be at least 8 characters"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-blue-300 hover:text-blue-500 transition-colors"
                >
                  {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PassphraseStrength passphrase={passphrase} />
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
                disabled={loading || !text.trim() || passphrase.length < 8}
                className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                {loading ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> Processing...</>
                ) : (
                  <><Lock className="w-5 h-5" /> Initiate Encryption</>
                )}
              </button>
              {(text || encryptedText) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-8 py-5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-2xl font-bold transition-all border border-blue-100 active:scale-95"
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Encrypted Result */}
          {encryptedText && (
            <div className="mt-10 pt-10 border-t border-blue-100">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-widest">Encrypted Result (Base64)</label>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center text-xs font-bold text-blue-900 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all active:scale-95"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
              <textarea
                className="w-full bg-blue-50/50 border border-blue-200 rounded-2xl p-6 text-blue-600 font-mono text-sm break-all h-40 focus:outline-none resize-none shadow-inner"
                value={encryptedText}
                readOnly
              />
              <p className="text-[10px] text-blue-900/40 mt-4 font-bold uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Store this ciphertext and your passphrase securely.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextEncryptionPage;
