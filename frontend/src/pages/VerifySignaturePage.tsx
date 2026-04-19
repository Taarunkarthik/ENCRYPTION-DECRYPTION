import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Upload, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

interface VerifyResult {
  valid: boolean;
  fileName: string;
  message: string;
  timestamp: number;
}

const VerifySignaturePage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [signatureInput, setSignatureInput] = useState('');
  const [publicKeyInput, setPublicKeyInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setError(''); setResult(null); }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) { setFile(selected); setError(''); setResult(null); }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleVerify = async () => {
    if (!file) { setError('Please select the file to verify.'); return; }
    if (!signatureInput.trim()) { setError('Please paste the digital signature.'); return; }
    if (!publicKeyInput.trim()) { setError('Please paste the public key.'); return; }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signatureInput.trim());
      formData.append('publicKey', publicKeyInput.trim());

      const response = await api.post('/signature/verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setSignatureInput(''); setPublicKeyInput('');
    setResult(null); setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 rounded-xl bg-gray-800 border border-gray-700 hover:border-yellow-500/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Verify Signature</h1>
              <p className="text-sm text-gray-400">Confirm a file's authenticity and integrity</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Result Banner */}
        {result && (
          <div className={`flex items-center gap-4 p-5 rounded-2xl border mb-6 ${result.valid
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'}`}>
            {result.valid
              ? <CheckCircle className="w-10 h-10 text-green-400 flex-shrink-0" />
              : <XCircle className="w-10 h-10 text-red-400 flex-shrink-0" />}
            <div>
              <p className={`font-bold text-lg ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
                {result.valid ? 'Signature Valid' : 'Signature Invalid'}
              </p>
              <p className="text-sm text-gray-400">{result.message}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* File Drop */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              <span className="inline-flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-yellow-400" /> File to Verify
              </span>
            </label>
            {file ? (
              <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Upload className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-200 truncate">{file.name}</p>
                  <p className="text-sm text-gray-400">{formatBytes(file.size)}</p>
                </div>
                <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Change</button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300
                  ${isDragging ? 'border-yellow-400 bg-yellow-500/10' : 'border-gray-700 hover:border-yellow-500/50 bg-gray-800/50 hover:bg-gray-800'}`}
              >
                <Upload className={`w-8 h-8 mx-auto mb-3 ${isDragging ? 'text-yellow-400' : 'text-gray-500'}`} />
                <p className="text-gray-400 text-sm">Drop the original file here or click to browse</p>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
              </div>
            )}
          </div>

          {/* Signature Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Digital Signature (Base64)</label>
            <textarea
              value={signatureInput}
              onChange={(e) => setSignatureInput(e.target.value)}
              placeholder="Paste the Base64-encoded signature here..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors resize-none"
            />
          </div>

          {/* Public Key Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Public Key (Base64)</label>
            <textarea
              value={publicKeyInput}
              onChange={(e) => setPublicKeyInput(e.target.value)}
              placeholder="Paste the RSA public key (Base64 encoded, X.509 format) here..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleVerify}
              disabled={isLoading || !file || !signatureInput.trim() || !publicKeyInput.trim()}
              className="flex-1 py-4 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-yellow-500/20"
            >
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <><ShieldCheck className="w-5 h-5" /> Verify Signature</>}
            </button>
            {result && (
              <button onClick={reset} className="px-6 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-medium text-gray-300 transition-all">
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifySignaturePage;
