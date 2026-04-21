
import React, { useState, useRef, useCallback } from 'react';
import { ShieldCheck, Upload, AlertCircle, RefreshCw, Loader2, Key, Eye, EyeOff, Lock, ArrowLeft, FileCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PassphraseStrength from '../components/PassphraseStrength';
import ConfirmModal from '../components/ConfirmModal';

import confetti from 'canvas-confetti';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB


const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileEncryptionPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [algorithm, setAlgorithm] = useState('AES-256-GCM');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const algorithms = ['AES-256-GCM', 'CHACHA20-POLY1305', 'AES-128-CBC'];

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_FILE_SIZE_BYTES) {
      return `FILE_TOO_LARGE: MAX_5GB. CURRENT_${formatBytes(f.size).toUpperCase()}.`;
    }
    return null;
  };

  const handleFileSelect = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) { setError('RESOURCE_REQUIRED: ATTACH_FILE'); return; }
    if (passphrase.length < 8) { setError('MIN_LENGTH_VIOLATION: 8_CHARS'); return; }
    if (passphrase !== confirmPassphrase) { setError('MISMATCH: PASSPHRASE_CONFIRMATION'); return; }

    setShowConfirm(true);
  };

  const handleEncrypt = async () => {
    setShowConfirm(false);
    setIsLoading(true);


    try {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('passphrase', passphrase);

      const response = await api.post('/encrypt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },

      });

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00A3FF', '#0070FF', '#ffffff']
      });

      setSuccess(response.data);
      
      // Download the encrypted file using authenticated api service
      const downloadResponse = await api.get(`/download-encrypted/${response.data.fileId}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([downloadResponse.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `encrypted_${response.data.fileName || 'file'}.bin`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setFile(null);
      setPassphrase('');
      setConfirmPassphrase('');

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.response?.data?.error || 'PROTOCOL_FAILURE: ENCRYPTION_ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <Link to="/" className="inline-flex items-center text-blue-500/40 hover:text-blue-500 mb-8 transition-all group font-bold text-sm tracking-widest uppercase">
          <div className="p-2 bg-blue-500/10 rounded-lg mr-3 group-hover:bg-blue-500/20 transition-colors border border-blue-500/10">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Return to Infrastructure
        </Link>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-4 block w-fit">
            Module: CRYPTO_VAULT_ENCRYPT
          </div>
          <h1 className="text-4xl font-black tech-font tracking-tighter uppercase">Vault_Encryption</h1>
          <p className="text-description text-sm font-medium mt-2">Initialize secure data encapsulation protocols for system resources.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-600/10 border border-red-500/30 text-red-500 text-xs font-bold tech-font flex items-center gap-3">
          <AlertCircle className="w-4 h-4" />
          {error.toUpperCase()}
        </div>
      )}

      {success && (
        <div className="p-8 bg-blue-600/10 border border-blue-500/30 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-blue-600/20 border border-blue-500/30">
                  <ShieldCheck className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tech-font text-blue-500">ENCRYPTION_SUCCESS</h3>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Resource encapsulated and secured.</p>
                </div>
              </div>
              <button 
                onClick={() => setSuccess(null)}
                className="px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                Close_Report
              </button>
            </div>

            <div className="bg-black/40 border border-blue-500/20 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500"></div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">Resource_Identifier</span>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(success.fileId);
                    const btn = document.getElementById('copy-id-btn');
                    if (btn) btn.innerText = 'COPIED_TO_SYSTEM';
                    setTimeout(() => { if (btn) btn.innerText = 'COPY_IDENTIFIER'; }, 2000);
                  }}
                  id="copy-id-btn"
                  className="text-[9px] font-bold text-blue-500 hover:text-white transition-colors uppercase tracking-widest"
                >
                  COPY_IDENTIFIER
                </button>
              </div>
              <div className="font-mono text-lg text-white font-bold tracking-wider break-all select-all">
                {success.fileId}
              </div>
              <p className="text-[9px] text-muted font-medium uppercase tracking-widest italic">
                IMPORTANT: SAVE THIS ID. IT IS REQUIRED FOR DECRYPTION AND AUDIT LOG RETRIEVAL.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Upload */}
        <div className="lg:col-span-7 space-y-8">
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="upload-zone group aspect-video flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden bg-card border-sharp rounded-none"
            >
              <div className="absolute inset-0 bg-grid opacity-10"></div>
              <div className="relative z-10">
                <div className="p-6 bg-blue-600/10 border border-blue-500/20 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <Upload className={`w-10 h-10 ${isDragging ? 'animate-bounce' : ''}`} />
                </div>
                <h2 className="text-2xl font-bold tech-font mb-2 uppercase">Load_Payload</h2>
                <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em]">Drag system asset or click to scan</p>
              </div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            </div>
          ) : (
            <div className="border-sharp bg-card p-10 animate-in fade-in duration-500 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-12 bg-blue-600/5 blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="p-6 bg-blue-600/10 border border-blue-500/20">
                    <FileCode className="w-12 h-12 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-black tech-font text-2xl tracking-tighter truncate max-w-sm">{file.name.toUpperCase()}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{formatBytes(file.size)}</span>
                      <div className="w-1 h-1 bg-blue-500/30"></div>
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{file.type || 'SYSTEM_OBJECT'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="p-4 border border-red-500/20 hover:bg-red-600/10 text-red-500 transition-all">
                  <RefreshCw className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {file && (
            <div className="border-sharp bg-card p-8">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-6">Security_Algorithm_Override</p>
              <div className="flex flex-wrap gap-3">
                {algorithms.map((alg) => (
                  <button
                    key={alg}
                    type="button"
                    onClick={() => setAlgorithm(alg)}
                    className={`px-4 py-3 text-[10px] font-bold transition-all border rounded-none ${
                      algorithm === alg 
                        ? 'chip-active' 
                        : 'border-sharp bg-card text-muted hover:border-blue-500/30'
                    }`}
                  >
                    {alg}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Security Config */}
        <div className="lg:col-span-5 space-y-8">
          <div className="border-sharp bg-card p-8 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 bg-blue-600/5 blur-3xl -mr-16 -mt-16" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-600/10 border border-blue-500/20">
                  <Key className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-bold tech-font uppercase tracking-tight">Access_Protocol</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 block">Master_Passphrase</label>
                  <div className="relative group">
                    <input
                      type={showPassphrase ? 'text' : 'password'}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="ENTER_SECURE_KEY..."
                      className="w-full bg-[var(--bg-main)] border border-sharp px-6 py-5 text-xs font-mono focus:outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-placeholder"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute inset-y-0 right-0 pr-6 flex items-center text-muted hover:text-blue-500 transition-colors"
                    >
                      {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 block">Verify_Passphrase</label>
                  <div className="relative group">
                    <input
                      type={showConfirmPassphrase ? 'text' : 'password'}
                      value={confirmPassphrase}
                      onChange={(e) => setConfirmPassphrase(e.target.value)}
                      placeholder="RE_ENTER_SECURE_KEY..."
                      className="w-full bg-[var(--bg-main)] border border-sharp px-6 py-5 text-xs font-mono focus:outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-placeholder"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassphrase(!showConfirmPassphrase)}
                      className="absolute inset-y-0 right-0 pr-6 flex items-center text-muted hover:text-blue-500 transition-colors"
                    >
                      {showConfirmPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <PassphraseStrength passphrase={passphrase} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !file || passphrase.length < 8 || passphrase !== confirmPassphrase}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black py-6 text-sm uppercase tracking-[0.3em] transition-all glow-blue hover:glow-blue-strong active:scale-[0.99] group"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                EXECUTING_ENC...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <Lock className="w-5 h-5" />
                INIT_ENCRYPTION
              </span>
            )}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showConfirm}
        title="PROTOCOL_CONFIRMATION"
        message={`AUTHORIZE ENCRYPTION OF "${file?.name?.toUpperCase()}". ACTION IS IRREVERSIBLE WITHOUT MASTER PASSPHRASE.`}
        confirmLabel="Confirm_Protocol"
        onConfirm={handleEncrypt}
        onCancel={() => setShowConfirm(false)}
        variant="info"
      />
    </div>
  );
};

export default FileEncryptionPage;
