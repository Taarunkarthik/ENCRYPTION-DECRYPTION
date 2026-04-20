import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PenTool, Upload, Key, RefreshCw, Copy, Check, Download, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import confetti from 'canvas-confetti';

type Step = 'upload' | 'key' | 'result';

interface SignResult {
  signature: string;
  fileName: string;
  fileSize: number;
  algorithm: string;
  message: string;
  timestamp: number;
  signedFile?: string; // Base64 encoded embedded signed file
}

interface KeyPair {
  privateKey: string;
  publicKey: string;
  algorithm: string;
}

const SignFilePage = () => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [generatedKeyPair, setGeneratedKeyPair] = useState<KeyPair | null>(null);
  const [result, setResult] = useState<SignResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setStep('key'); setError(''); }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) { setFile(selected); setStep('key'); setError(''); }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBase64File = (base64: string, filename: string) => {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    const blob = new Blob([array], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadFile = (f: File) => {
    const url = URL.createObjectURL(f);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateKeyPair = async () => {
    setIsGeneratingKey(true);
    setError('');
    try {
      const response = await api.get('/signature/generate-keypair');
      setGeneratedKeyPair(response.data);
      setPrivateKey(response.data.privateKey);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Key generation failed');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleSign = async () => {
    if (!file || !privateKey.trim()) {
      setError('Please provide both a file and a private key.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('privateKey', privateKey.trim());
      const response = await api.post('/signature/sign', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd']
      });

      setResult(response.data);
      setStep('result');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signing failed. Check your private key.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const reset = () => {
    setStep('upload'); setFile(null); setPrivateKey('');
    setGeneratedKeyPair(null); setResult(null); setError('');
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
            <PenTool className="w-10 h-10 text-blue-500" />
          </div>
          <div className="ml-6">
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Sign a File</h1>
            <p className="text-blue-500/40 font-bold tracking-tight uppercase text-xs">Apply a digital signature using RSA-SHA256</p>
          </div>
        </div>


        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-12">
          {(['upload', 'key', 'result'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all border
                ${step === s ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-110' : 
                  (step === 'key' && s === 'upload') || step === 'result' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' : 
                  'bg-blue-500/5 text-blue-500/20 border-blue-500/10'}`}>
                {i + 1}
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest hidden sm:inline ${step === s ? 'text-blue-500' : 'text-blue-500/20'}`}>
                {s === 'upload' ? 'Resource' : s === 'key' ? 'Authority' : 'Proof'}
              </span>
              {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${step === 'result' || (step === 'key' && s === 'upload') ? 'bg-blue-500/30' : 'bg-blue-500/10'}`} />}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl mb-10 animate-slide-up">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-400">{error}</p>
          </div>
        )}

        {/* Step 1: File Upload */}
        {step === 'upload' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[2.5rem] p-20 text-center cursor-pointer transition-all duration-500 glass
              ${isDragging ? 'border-blue-500 bg-blue-500/5 scale-[1.02] shadow-2xl shadow-blue-500/10' : 'border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/5'}`}
          >
            <div className="w-16 h-16 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all border border-blue-500/20">
              <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-blue-500/40'}`} />
            </div>
            <p className="text-xl font-bold mb-2">Drop asset for signature</p>
            <p className="text-blue-500/40 font-bold uppercase text-[10px] tracking-widest">or browse local filesystem</p>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {/* Step 2: Key Input */}
        {step === 'key' && file && (
          <div className="space-y-8 animate-slide-up">
            {/* File Info */}
            <div className="flex items-center gap-5 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10">
              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Upload className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg truncate">{file.name}</p>
                <p className="text-xs font-bold text-blue-500/40 uppercase tracking-widest">{formatBytes(file.size)}</p>
              </div>
              <button onClick={reset} className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-xs font-bold text-blue-500 transition-all border border-blue-500/10 uppercase tracking-widest active:scale-95">Change</button>
            </div>

            {/* Key Generation */}
            <div className="glass rounded-[2.5rem] p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <Key className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg">RSA Key Authority</h3>
                    <p className="text-xs text-blue-500/40 font-bold uppercase tracking-widest">Generate or provide your secure key</p>
                  </div>
                </div>
                <button
                  onClick={generateKeyPair}
                  disabled={isGeneratingKey}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-blue-600/20"
                >
                  {isGeneratingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Generate Protocol Keypair
                </button>
              </div>

              {generatedKeyPair && (
                <div className="space-y-5 mb-10 animate-slide-up">
                  <div className="bg-blue-500/5 rounded-2xl p-5 border border-blue-500/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-blue-500/60 font-bold uppercase tracking-widest font-mono">PUBLIC IDENTIFIER (Share this)</span>
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(generatedKeyPair.publicKey, 'pubkey')} className="p-2 hover:bg-blue-500/10 rounded-xl transition-colors text-blue-500">
                          {copiedField === 'pubkey' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button onClick={() => downloadText(generatedKeyPair.publicKey, 'public_key.txt')} className="p-2 hover:bg-blue-500/10 rounded-xl transition-colors text-blue-500">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-blue-500 font-mono break-all line-clamp-2 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">{generatedKeyPair.publicKey}</p>
                  </div>
                  <div className="bg-red-500/5 rounded-2xl p-5 border border-red-500/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest font-mono">PRIVATE AUTHORITY (Keep secret!)</span>
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(generatedKeyPair.privateKey, 'privkey')} className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-red-400">
                          {copiedField === 'privkey' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button onClick={() => downloadText(generatedKeyPair.privateKey, 'private_key.txt')} className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-red-400">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-red-400 font-mono break-all line-clamp-2 bg-red-500/5 p-3 rounded-lg border border-red-500/10">{generatedKeyPair.privateKey}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-bold text-blue-500/40 uppercase tracking-[0.2em] ml-1 block">Authority Key Input</label>
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Paste your RSA private key (Base64 encoded, PKCS#8 format)..."
                  rows={5}
                  className="w-full px-6 py-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-blue-500/10 transition-all resize-none font-bold placeholder-blue-500/10"
                />
              </div>
            </div>

            <button
              onClick={handleSign}
              disabled={isLoading || !privateKey.trim()}
              className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-3xl font-extrabold text-white text-lg transition-all flex items-center justify-center gap-4 shadow-2xl shadow-blue-600/30 active:scale-[0.98]"
            >
              {isLoading ? <><Loader2 className="w-6 h-6 animate-spin" /> Executing Signature Sequence...</> : <><PenTool className="w-7 h-7" /> Authorize Signature</>}
            </button>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && result && (
          <div className="space-y-8 animate-scale-in">
            <div className="p-10 glass rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full -mt-32" />
               <div className="relative z-10">
                <div className="w-20 h-20 bg-blue-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-blue-500/30 shadow-xl shadow-blue-500/10">
                  <Check className="w-10 h-10 text-blue-500" />
                </div>
                <h2 className="text-3xl font-extrabold mb-3">Signature Sequence Complete</h2>
                <p className="text-blue-500/40 font-bold uppercase text-[10px] tracking-[0.3em]">{result.fileName} · {formatBytes(result.fileSize)} · {result.algorithm}</p>
              </div>
            </div>

            <div className="glass rounded-[2.5rem] p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 border-b border-blue-500/10 pb-8">
                <span className="text-xs font-bold text-blue-500/60 uppercase tracking-widest">Cryptographic proof output</span>
                <div className="flex flex-wrap justify-center gap-3">
                  <button 
                    onClick={() => copyToClipboard(result.signature, 'sig')} 
                    className="flex items-center gap-2 px-5 py-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-[10px] font-bold text-blue-500 transition-all border border-blue-500/10 uppercase tracking-widest active:scale-95"
                  >
                    {copiedField === 'sig' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copiedField === 'sig' ? 'Copied' : 'Copy'}
                  </button>
                  <button 
                    onClick={() => downloadText(result.signature, `${result.fileName}.sig`)} 
                    className="flex items-center gap-2 px-5 py-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-[10px] font-bold text-blue-500 transition-all border border-blue-500/10 uppercase tracking-widest active:scale-95"
                  >
                    <Download className="w-4 h-4" /> Save Signature
                  </button>
                  <button 
                    onClick={() => result.signedFile ? downloadBase64File(result.signedFile, `signed_${result.fileName}`) : downloadFile(file!)} 
                    className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-bold text-white transition-all shadow-xl shadow-blue-600/30 uppercase tracking-widest active:scale-95"
                  >
                    <Download className="w-4 h-4" /> Download Signed Asset
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-500/5 rounded-[2rem] p-8 border border-blue-500/10 relative group shadow-inner">
                  <p className="text-[11px] font-mono text-blue-500/90 break-all leading-relaxed max-h-48 overflow-y-auto custom-scrollbar pr-4">
                    {result.signature}
                  </p>
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none rounded-b-[2rem]" />
                </div>
                
                <div className="flex items-start gap-4 p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-500/60 font-medium leading-relaxed">
                    This digital signature provides authenticity and non-repudiation for your asset. Anyone with your public key can verify the integrity of <span className="font-bold text-blue-500">"{result.fileName}"</span>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full py-6 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-3xl font-extrabold text-blue-500 transition-all duration-300 active:scale-95 uppercase tracking-[0.2em] text-xs"
            >
              Initialize New Signing Protocol
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignFilePage;
