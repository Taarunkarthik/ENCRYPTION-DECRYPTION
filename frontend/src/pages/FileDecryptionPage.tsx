import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { FileDown, Unlock, ArrowLeft, Loader2, Download, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import confetti from 'canvas-confetti';

const FileDecryptionPage = () => {
  const [fileId, setFileId] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const location = useLocation();

  const normalizeFileId = (value: string) => {
    const trimmed = value.trim();
    const encryptedFileMatch = trimmed.match(/(encrypted_[0-9a-fA-F-]{36}(?:\.[a-zA-Z0-9]{1,10})?\.bin)/);
    return encryptedFileMatch ? encryptedFileMatch[1] : trimmed;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setFileId(id);
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedFileId = normalizeFileId(fileId);

    if (!normalizedFileId) { setError('Please enter a valid File ID.'); return; }
    if (passphrase.length < 8) { setError('Passphrase must be at least 8 characters long.'); return; }

    if (normalizedFileId !== fileId) {
      setFileId(normalizedFileId);
    }

    setShowConfirm(true);
  };

  const handleDecrypt = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    setProgress(0);

    const normalizedFileId = normalizeFileId(fileId);

    try {
      const response = await api.post(
        `/decrypt/${normalizedFileId}`,
        { passphrase },
        {
          responseType: 'blob',
          headers: { 'Content-Type': 'application/json' },
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress(pct);
            }
          },
        }
      );

      // Celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd']
      });

      // Extract filename from Content-Disposition header
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'decrypted_file';
      if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          fileName = matches[1].replace(/['"]/g, '');
        }
      }

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setFileId('');
      setPassphrase('');
      setProgress(0);
    } catch (err: any) {
      if (err.response && err.response.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const jsonError = JSON.parse(text);
          setError(jsonError.error || 'Failed to decrypt file. Check your passphrase.');
        } catch {
          setError('Failed to decrypt file. Check your File ID and passphrase.');
        }
      } else {
        setError(err.response?.data?.error || 'Failed to decrypt file. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up max-w-2xl mx-auto">
      <Link to="/" className="inline-flex items-center text-blue-500/40 hover:text-blue-500 mb-8 transition-all group font-bold text-sm tracking-widest uppercase">
        <div className="p-2 bg-blue-500/10 rounded-lg mr-3 group-hover:bg-blue-500/20 transition-colors border border-blue-500/10">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Return to Infrastructure
      </Link>

      <div className="glass rounded-[2.5rem] p-6 sm:p-12 border-blue-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>
        
        <div className="flex items-center mb-10 pb-8 border-b border-blue-500/10 relative z-10">
          <div className="p-5 bg-blue-500/10 rounded-3xl border border-blue-500/20 shadow-xl shadow-blue-500/5">
            <FileDown className="w-10 h-10 text-blue-500" />
          </div>
          <div className="ml-6">
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Upload & Decrypt File</h1>
            <p className="text-blue-500/60 font-bold tracking-tight uppercase text-xs">Recover your files securely from the vault</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start text-red-400">
            <AlertCircle className="w-5 h-5 mr-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File ID */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1 block">Resource identifier</label>
            <input
              type="text"
              value={fileId}
              onChange={(e) => setFileId(e.target.value)}
              placeholder="Paste encrypted file ID (example: encrypted_xxx.bin)"
              className="w-full bg-blue-500/5 border border-blue-500/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-blue-500/10 transition-all font-mono placeholder-blue-500/20 text-sm font-bold"
            />
          </div>

          {/* Passphrase with toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1 block">Decryption sequence</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                <Unlock className="w-5 h-5 text-blue-500/40 group-focus-within:text-blue-500" />
              </div>
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter the encryption key"
                className="w-full bg-blue-500/5 border border-blue-500/10 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-blue-500/10 transition-all font-bold placeholder-blue-500/20 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-blue-500/40 hover:text-blue-500 transition-colors"
              >
                {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {isLoading && (
            <div className="animate-fade-in pt-4">
              <div className="flex justify-between text-[10px] font-bold text-muted uppercase tracking-widest mb-3">
                <span>Synchronizing Protocol...</span>
                {progress > 0 && <span className="text-blue-500">{progress}%</span>}
              </div>
              <div className="w-full bg-blue-500/10 rounded-full h-3 overflow-hidden border border-blue-500/10">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-300"
                  style={{ width: progress > 0 ? `${progress}%` : '30%', animation: progress === 0 ? 'pulse 1.5s ease-in-out infinite' : 'none' }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !fileId || !passphrase}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-[2rem] transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-blue-600/20 hover:shadow-blue-600/40 group active:scale-[0.98] text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Executing Recovery...
              </>
            ) : (
              <span className="flex items-center gap-3">
                <Download className="w-6 h-6" />
                Initiate Decryption
              </span>
            )}
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Protocol Authorization"
        message={`Authorize the recovery of asset "${fileId.slice(0, 12)}..."? The decrypted data will be streamed to your device.`}
        confirmLabel="Authorize Sequence"
        onConfirm={handleDecrypt}
        onCancel={() => setShowConfirm(false)}
        variant="info"
      />
    </div>
  );
};

export default FileDecryptionPage;

