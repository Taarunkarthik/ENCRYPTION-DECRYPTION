import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Upload, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import confetti from 'canvas-confetti';
import FileIcon from '../components/FileIcon';

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
    if (!publicKeyInput.trim()) { setError('Please paste the public key.'); return; }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (signatureInput.trim()) {
        formData.append('signature', signatureInput.trim());
      }
      formData.append('publicKey', publicKeyInput.trim());

      const response = await api.post('/signature/verify', formData, {
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (result?.valid) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd']
      });
    }
  }, [result]);

  const reset = () => {
    setFile(null); setSignatureInput(''); setPublicKeyInput('');
    setResult(null); setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="animate-slide-up max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center text-blue-500/40 hover:text-blue-500 mb-8 transition-all group font-bold text-sm tracking-widest uppercase">
        <div className="p-2 bg-blue-500/10 rounded-lg mr-3 group-hover:bg-blue-500/20 transition-colors border border-blue-500/10">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Return to Infrastructure
      </Link>

      <div className="glass rounded-[2.5rem] p-6 sm:p-12 border-blue-500/20 shadow-2xl relative overflow-hidden mb-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>
        
        <div className="flex items-center mb-10 pb-8 border-b border-blue-500/10 relative z-10">
          <div className="p-5 bg-blue-500/10 rounded-3xl border border-blue-500/20 shadow-xl shadow-blue-500/5">
            <ShieldCheck className="w-10 h-10 text-blue-500" />
          </div>
          <div className="ml-6">
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Verify File Signature</h1>
            <p className="text-blue-500/40 font-bold tracking-tight uppercase text-xs">Confirm a file's cryptographic signature</p>
          </div>
        </div>

        <div className="mb-10 p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl relative z-10">
          <p className="text-sm font-bold text-blue-400 whitespace-pre-line leading-relaxed">
            📋 To verify the signature, please paste the following:{"\n\n"}
            <span className="text-blue-500">Public Key (mandatory)</span> — The public key of the signer.{"\n"}
            <span className="text-blue-500">Signature ID (mandatory)</span> — The signature generated during the signing process.{"\n\n"}
            Both fields are required to proceed with verification.
          </p>
        </div>
      </div>


        {/* Error */}
        {error && (
          <div className="flex items-center gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl mb-10 animate-slide-up">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-400">{error}</p>
          </div>
        )}

        {/* Result Banner */}
        {result && (
          <div className={`flex items-start gap-6 p-10 rounded-[3rem] border-2 mb-12 animate-scale-in shadow-2xl transition-all ${result.valid
            ? 'bg-blue-500/5 border-blue-500/20 shadow-blue-500/5'
            : 'bg-red-500/5 border-red-500/20 shadow-red-500/5'}`}>
            <div className={`p-4 rounded-2xl border ${result.valid ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {result.valid
                ? <CheckCircle className="w-10 h-10 flex-shrink-0" />
                : <XCircle className="w-10 h-10 flex-shrink-0" />}
            </div>
            <div className="flex-1">
              <p className={`font-extrabold text-2xl tracking-tight mb-2 ${result.valid ? 'text-blue-500' : 'text-red-400'}`}>
                {result.valid ? 'Signature Authenticated' : 'Verification Denied'}
              </p>
              <p className={`text-sm font-semibold leading-relaxed ${result.valid ? 'text-blue-500/60' : 'text-red-400/60'}`}>{result.message}</p>
              <p className="mt-4 text-[10px] text-blue-500/20 font-bold uppercase tracking-[0.3em]">{new Date(result.timestamp).toUTCString()}</p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* File Drop */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-blue-500/40 uppercase tracking-[0.2em] ml-1 block">Resource for validation</label>
            {file ? (
              <div className="flex items-center gap-5 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 animate-scale-in shadow-lg">
                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <FileIcon fileName={file.name} className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">{file.name}</p>
                  <p className="text-xs font-bold text-blue-500/40 uppercase tracking-widest">{formatBytes(file.size)}</p>
                </div>
                <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-xs font-bold text-blue-500 transition-all border border-blue-500/10 uppercase tracking-widest active:scale-95">Change</button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[2.5rem] p-16 text-center cursor-pointer transition-all duration-500 glass
                  ${isDragging ? 'border-blue-500 bg-blue-500/5 scale-[1.02] shadow-2xl shadow-blue-500/10' : 'border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/5'}`}
              >
                <div className="w-16 h-16 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all border border-blue-500/20">
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-blue-500/40'}`} />
                </div>
                <p className="text-lg font-bold mb-2">Drop asset for verification</p>
                <p className="text-blue-500/40 font-bold uppercase text-[10px] tracking-widest">or browse local filesystem</p>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
              </div>
            )}
          </div>

          {/* Signature Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-blue-500/40 uppercase tracking-[0.2em] ml-1 block">
              Signature ID (mandatory)
            </label>
            <textarea
              value={signatureInput}
              onChange={(e) => setSignatureInput(e.target.value)}
              placeholder="Paste the Base64-encoded signature here..."
              rows={4}
              className="w-full px-6 py-5 bg-blue-500/5 border border-blue-500/10 rounded-3xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-blue-500/10 transition-all resize-none font-bold placeholder-blue-500/10"
            />
          </div>

          {/* Public Key Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-blue-500/40 uppercase tracking-[0.2em] ml-1 block">Public Key (mandatory)</label>
            <textarea
              value={publicKeyInput}
              onChange={(e) => setPublicKeyInput(e.target.value)}
              placeholder="Paste the RSA public key (Base64 encoded, X.509 format) here..."
              rows={4}
              className="w-full px-6 py-5 bg-blue-500/5 border border-blue-500/10 rounded-3xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-blue-500/10 transition-all resize-none font-bold placeholder-blue-500/10"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-5 pt-4">
            <button
              onClick={handleVerify}
              disabled={isLoading || !file || !publicKeyInput.trim()}
              className="flex-[2] py-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-3xl font-extrabold text-white text-lg transition-all flex items-center justify-center gap-4 shadow-2xl shadow-blue-600/30 active:scale-[0.98]"
            >
              {isLoading ? <><Loader2 className="w-6 h-6 animate-spin" /> Analyzing Authority...</> : <><ShieldCheck className="w-7 h-7" /> Authenticate Signature</>}
            </button>
            {(result || file || signatureInput || publicKeyInput) && (
              <button 
                onClick={reset} 
                className="flex-1 py-6 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/10 rounded-3xl font-extrabold text-blue-500 transition-all active:scale-95 text-xs uppercase tracking-[0.2em]"
              >
                Reset Sequence
              </button>
            )}
          </div>
        </div>
    </div>
  );
};

export default VerifySignaturePage;
