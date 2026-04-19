import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileUp, Lock, ArrowLeft, Loader2, ShieldCheck,
  AlertCircle, Eye, EyeOff, X, FileText, Upload
} from 'lucide-react';
import api from '../services/api';
import PassphraseStrength from '../components/PassphraseStrength';
import ConfirmModal from '../components/ConfirmModal';

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

      setSuccess(response.data);
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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-700 shadow-xl">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-emerald-500/20 rounded-xl mr-4 border border-emerald-500/20">
              <FileUp className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Encrypt File</h1>
              <p className="text-gray-400 text-sm">Secure your files with AES-256-GCM encryption</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start text-red-400">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-6 bg-emerald-500/10 border border-emerald-500/50 rounded-xl flex flex-col items-center text-center">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mb-3" />
              <h3 className="text-xl font-bold text-emerald-400 mb-2">Encryption Successful!</h3>
              <p className="text-gray-300 mb-4 text-sm">Your file has been securely encrypted and stored.</p>
              <div className="bg-gray-900 p-4 rounded-lg w-full text-left font-mono text-sm break-all border border-gray-700 space-y-1">
                <p><span className="text-gray-500">File ID:</span> <span className="text-emerald-400">{success.fileId}</span></p>
                <p><span className="text-gray-500">File Name:</span> {success.fileName}</p>
              </div>
              <p className="text-xs text-gray-500 mt-3">⚠️ Save the File ID — you'll need it to decrypt.</p>
              <button
                onClick={() => setSuccess(null)}
                className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Encrypt another file
              </button>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Drag & Drop Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select File</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200 text-center ${
                    isDragging
                      ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                      : file
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-900/50 hover:bg-gray-900'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        <div className="p-2 bg-emerald-500/20 rounded-lg mr-3 flex-shrink-0">
                          <FileText className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="ml-3 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">
                        <span className="text-emerald-400 font-semibold">Click to upload</span> or drag & drop
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Any file type • Max 5 GB</p>
                    </div>
                  )}
                </div>

                {isLargeFile && (
                  <div className="mt-2 flex items-center gap-2 text-yellow-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Large file detected ({formatBytes(file!.size)}). Encryption may take a while.</span>
                  </div>
                )}
              </div>

              {/* Passphrase */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Encryption Passphrase
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter a strong passphrase (min 8 characters)"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-12 pr-12 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder-gray-600 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PassphraseStrength passphrase={passphrase} />
              </div>

              {/* Confirm Passphrase */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Confirm Passphrase
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {confirmPassphrase && passphrase === confirmPassphrase
                      ? <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      : <Lock className="w-5 h-5 text-gray-500" />
                    }
                  </div>
                  <input
                    type={showConfirmPassphrase ? 'text' : 'password'}
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    placeholder="Re-enter your passphrase"
                    className={`w-full bg-gray-900 border rounded-xl pl-12 pr-12 py-3 text-gray-100 focus:outline-none focus:ring-2 transition-all placeholder-gray-600 text-sm ${
                      confirmPassphrase && passphrase !== confirmPassphrase
                        ? 'border-red-500/50 focus:ring-red-500/30'
                        : confirmPassphrase && passphrase === confirmPassphrase
                        ? 'border-emerald-500/50 focus:ring-emerald-500/30'
                        : 'border-gray-700 focus:ring-emerald-500/50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassphrase(!showConfirmPassphrase)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassphrase && passphrase !== confirmPassphrase && (
                  <p className="mt-1 text-xs text-red-400">Passphrases do not match</p>
                )}
              </div>

              {/* Progress Bar */}
              {isLoading && progress > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Uploading & encrypting...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !file || !passphrase || passphrase !== confirmPassphrase}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.6)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Encrypt File
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Confirm Encryption"
        message={`Are you sure you want to encrypt "${file?.name}"? Make sure to save your passphrase safely — it cannot be recovered.`}
        confirmLabel="Yes, Encrypt"
        onConfirm={handleEncrypt}
        onCancel={() => setShowConfirm(false)}
        variant="warning"
      />
    </div>
  );
};

export default FileEncryptionPage;
