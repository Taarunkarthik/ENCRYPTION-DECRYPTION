import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PenTool, Upload, Key, RefreshCw, Copy, Check, Download, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

type Step = 'upload' | 'key' | 'result';

interface SignResult {
  signature: string;
  fileName: string;
  fileSize: number;
  algorithm: string;
  message: string;
  timestamp: number;
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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 rounded-xl bg-gray-800 border border-gray-700 hover:border-orange-500/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <PenTool className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Sign a File</h1>
              <p className="text-sm text-gray-400">Apply a digital signature using RSA-SHA256</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {(['upload', 'key', 'result'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${step === s ? 'bg-orange-500 text-white' : 
                  (step === 'key' && s === 'upload') || step === 'result' ? 'bg-orange-500/30 text-orange-400' : 
                  'bg-gray-700 text-gray-500'}`}>
                {i + 1}
              </div>
              <span className={`text-sm capitalize ${step === s ? 'text-orange-400' : 'text-gray-500'}`}>
                {s === 'upload' ? 'Select File' : s === 'key' ? 'Private Key' : 'Signature'}
              </span>
              {i < 2 && <div className={`flex-1 h-px ${step === 'result' || (step === 'key' && s === 'upload') ? 'bg-orange-500/30' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Step 1: File Upload */}
        {step === 'upload' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300
              ${isDragging ? 'border-orange-400 bg-orange-500/10' : 'border-gray-700 hover:border-orange-500/50 bg-gray-800/50 hover:bg-gray-800'}`}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-orange-400' : 'text-gray-500'}`} />
            <p className="text-xl font-semibold text-gray-300 mb-2">Drop your file here</p>
            <p className="text-gray-500 text-sm">or click to browse</p>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {/* Step 2: Key Input */}
        {step === 'key' && file && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Upload className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-200 truncate">{file.name}</p>
                <p className="text-sm text-gray-400">{formatBytes(file.size)}</p>
              </div>
              <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Change</button>
            </div>

            {/* Key Generation */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-orange-400" />
                  <h3 className="font-semibold text-gray-200">RSA Key Pair</h3>
                </div>
                <button
                  onClick={generateKeyPair}
                  disabled={isGeneratingKey}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isGeneratingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Generate New Key Pair
                </button>
              </div>

              {generatedKeyPair && (
                <div className="space-y-4 mb-4">
                  <div className="bg-gray-900 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-mono">PUBLIC KEY (share this)</span>
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(generatedKeyPair.publicKey, 'pubkey')} className="text-gray-500 hover:text-gray-300 transition-colors">
                          {copiedField === 'pubkey' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => downloadText(generatedKeyPair.publicKey, 'public_key.txt')} className="text-gray-500 hover:text-gray-300 transition-colors">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-green-400 font-mono break-all line-clamp-3">{generatedKeyPair.publicKey}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 border border-red-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-red-400 font-mono">PRIVATE KEY (keep secret!)</span>
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(generatedKeyPair.privateKey, 'privkey')} className="text-gray-500 hover:text-gray-300 transition-colors">
                          {copiedField === 'privkey' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => downloadText(generatedKeyPair.privateKey, 'private_key.txt')} className="text-gray-500 hover:text-gray-300 transition-colors">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-red-400/80 font-mono break-all line-clamp-3">{generatedKeyPair.privateKey}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Paste Your Private Key (Base64)</label>
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Paste your RSA private key (Base64 encoded, PKCS#8 format)..."
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-sm font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSign}
              disabled={isLoading || !privateKey.trim()}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20"
            >
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing...</> : <><PenTool className="w-5 h-5" /> Sign File</>}
            </button>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && result && (
          <div className="space-y-6">
            <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
              <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-green-400 mb-1">File Signed Successfully!</h2>
              <p className="text-sm text-gray-400">{result.fileName} · {formatBytes(result.fileSize)} · {result.algorithm}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-300">Digital Signature (Base64)</span>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(result.signature, 'sig')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors">
                    {copiedField === 'sig' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'sig' ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={() => downloadText(result.signature, `${result.fileName}.sig.txt`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-xs font-mono text-orange-400 break-all leading-relaxed">{result.signature}</p>
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500/50 rounded-xl font-medium text-gray-300 transition-all duration-200"
            >
              Sign Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignFilePage;
