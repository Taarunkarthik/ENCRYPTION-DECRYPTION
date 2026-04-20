import React, { useState, useRef, useCallback } from 'react';
import { ShieldCheck, Upload, Download, AlertCircle, RefreshCw, Loader2, Key, Unlock, Eye, EyeOff, Lock } from 'lucide-react';
import api from '../services/api';
import PassphraseStrength from '../components/PassphraseStrength';
import ConfirmModal from '../components/ConfirmModal';
import FileIcon from '../components/FileIcon';
import confetti from 'canvas-confetti';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
const WARN_FILE_SIZE_BYTES = 100 * 1024 * 1024;      // 100 MB warn threshold

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
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_FILE_SIZE_BYTES) {
      return `File too large. Maximum size is 5 GB. Your file is ${formatBytes(f.size)}.`;
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

    if (!file) { setError('Please select a file to encrypt.'); return; }
    if (passphrase.length < 8) { setError('Passphrase must be at least 8 characters long.'); return; }
    if (passphrase !== confirmPassphrase) { setError('Passphrases do not match.'); return; }

    setShowConfirm(true);
  };

  const handleEncrypt = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('passphrase', passphrase);

      const response = await api.post('/encrypt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(pct);
          }
        },
      });

      // Celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd']
      });

      setSuccess(response.data);
      
      const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/download-encrypted/${response.data.fileId}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `encrypted_${response.data.fileName || 'file'}.bin`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setFile(null);
      setPassphrase('');
      setConfirmPassphrase('');
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to encrypt file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const isLargeFile = file && file.size > WARN_FILE_SIZE_BYTES;

  return (
    <div className="animate-slide-up max-w-4xl mx-auto py-10 px-6">
      {/* Header section with glassmorphism */}
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-blue-600/10 rounded-3xl border border-blue-500/20 shadow-xl shadow-blue-500/5">
            <ShieldCheck className="w-10 h-10 text-blue-500" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Upload & Encrypt File</h1>
            <p className="text-blue-500/40 font-bold tracking-tight uppercase text-xs">Military-grade AES-256-GCM data protection</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-6 py-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
          <Lock className="w-5 h-5 text-blue-500" />
          <div className="text-left">
            <p className="text-[10px] font-bold text-blue-500/40 uppercase tracking-widest leading-tight">Security Level</p>
            <p className="text-sm font-bold text-blue-500">Maximum (E2EE)</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start text-red-400 animate-scale-in">
          <AlertCircle className="w-5 h-5 mr-4 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-8 p-6 bg-blue-600/10 border border-blue-500/30 rounded-3xl animate-scale-in relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-500/20 rounded-xl">
                  <Download className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Encryption Protocol Complete</h3>
                  <p className="text-xs text-blue-500/40 font-bold uppercase tracking-widest">Resource encrypted successfully</p>
                </div>
              </div>
              <button 
                onClick={() => setSuccess(null)}
                className="text-blue-500/40 hover:text-blue-500 transition-colors p-2"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="px-5 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <p className="text-[10px] font-bold text-blue-500/40 uppercase tracking-widest mb-1">Asset ID</p>
                <p className="text-sm font-mono font-bold text-blue-500">{success.fileId}</p>
              </div>
              <div className="px-5 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <p className="text-[10px] font-bold text-blue-500/40 uppercase tracking-widest mb-1">Size</p>
                <p className="text-sm font-bold text-blue-500">{formatBytes(success.fileSize)}</p>
              </div>
            </div>
            
            <p className="mt-6 text-sm text-blue-500/60 font-medium bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
              <span className="font-bold">Important:</span> Save the Asset ID to recover your file later. The download has been initiated automatically.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: File Upload */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-bold text-blue-500/40 uppercase tracking-[0.2em] ml-1 block">Resource Acquisition</label>
            
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[3rem] p-16 text-center cursor-pointer transition-all duration-500 glass group
                  ${isDragging ? 'border-blue-500 bg-blue-500/5 scale-[1.02] shadow-2xl shadow-blue-500/10' : 'border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/5'}`}
              >
                <div className="w-20 h-20 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <Upload className={`w-10 h-10 ${isDragging ? 'text-blue-500' : 'text-blue-500/40'}`} />
                </div>
                <h3 className="text-xl font-bold mb-2">Drop asset into the vault</h3>
                <p className="text-blue-500/40 font-bold uppercase text-[10px] tracking-[0.2em]">or browse secure filesystem</p>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
              </div>
            ) : (
              <div className="glass rounded-[3rem] p-8 border-blue-500/20 animate-scale-in relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="p-5 bg-blue-500/10 rounded-[2rem] border border-blue-500/20 shadow-xl shadow-blue-500/5">
                      <FileIcon fileName={file.name} className="w-10 h-10 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xl mb-1 truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-blue-500/40 uppercase tracking-widest">{formatBytes(file.size)}</span>
                        <span className="w-1 h-1 bg-blue-500/20 rounded-full" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{file.type || 'Binary Data'}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-400 transition-all border border-red-500/10 active:scale-90"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {isLargeFile && (
            <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-4 animate-slide-up">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-1">Large Payload Detected</p>
                <p className="text-xs text-amber-500/60 font-medium">This asset exceeds 100MB. Processing may take longer depending on your infrastructure capacity.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass rounded-[3rem] p-8 space-y-8 border-blue-500/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <Key className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-extrabold">Encryption Protocol</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-blue-500/40 uppercase tracking-[0.2em] ml-1 block">Master Passphrase</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors">
                      <Unlock className="w-5 h-5 text-blue-500/30 group-focus-within:text-blue-500" />
                    </div>
                    <input
                      type={showPassphrase ? 'text' : 'password'}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Define security key"
                      className="w-full bg-blue-500/5 border border-blue-500/10 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-blue-500/10 transition-all font-bold placeholder-blue-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-blue-500/30 hover:text-blue-500 transition-colors"
                    >
                      {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-blue-500/40 uppercase tracking-[0.2em] ml-1 block">Confirm Sequence</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors">
                      <Unlock className="w-5 h-5 text-blue-300 group-focus-within:text-blue-500" />
                    </div>
                    <input
                      type={showConfirmPassphrase ? 'text' : 'password'}
                      value={confirmPassphrase}
                      onChange={(e) => setConfirmPassphrase(e.target.value)}
                      placeholder="Repeat security key"
                      className="w-full bg-blue-500/5 border border-blue-500/10 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-blue-500/10 transition-all font-bold placeholder-blue-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassphrase(!showConfirmPassphrase)}
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-blue-500/30 hover:text-blue-500 transition-colors"
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
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-extrabold py-6 rounded-[2rem] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-blue-600/30 group active:scale-[0.98] text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin" />
                Encrypting Resource...
              </>
            ) : (
              <>
                <ShieldCheck className="w-7 h-7 group-hover:scale-110 transition-transform" />
                Authorize & Encrypt
              </>
            )}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showConfirm}
        title="Encryption Authorization"
        message={`Confirming the encryption of "${file?.name}". This process utilizes AES-256-GCM and will generate a downloadable resource.`}
        confirmLabel="Initiate Protocol"
        onConfirm={handleEncrypt}
        onCancel={() => setShowConfirm(false)}
        variant="info"
      />
    </div>
  );
};

export default FileEncryptionPage;
