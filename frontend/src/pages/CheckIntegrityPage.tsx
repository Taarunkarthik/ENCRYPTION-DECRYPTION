import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Upload, AlertCircle, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import api from '../services/api';
import confetti from 'canvas-confetti';

interface HashResult {
  fileName: string;
  fileSize: number;
  hashes: Record<string, string>;
  message: string;
  timestamp: number;
}

const ALGO_COLORS: Record<string, string> = {
  'MD5': 'text-red-500',
  'SHA-1': 'text-amber-500',
  'SHA-256': 'text-blue-500',
  'SHA-512': 'text-indigo-500',
};

const ALGO_WARNINGS: Record<string, string | null> = {
  'MD5': 'Cryptographically broken',
  'SHA-1': 'Deprecated for security',
  'SHA-256': null,
  'SHA-512': null,
};

const CheckIntegrityPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [compareHash, setCompareHash] = useState('');
  const [compareAlgo, setCompareAlgo] = useState('SHA-256');
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<HashResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
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

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleCompute = async () => {
    if (!file) { setError('Please select a file first.'); return; }
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/integrity/hash', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Hash computation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchStatus = () => {
    if (!result || !compareHash.trim()) return null;
    const hash = result.hashes[compareAlgo];
    if (!hash) return null;
    return hash.toLowerCase() === compareHash.trim().toLowerCase() ? 'match' : 'mismatch';
  };
  const matchStatus = getMatchStatus();

  useEffect(() => {
    if (matchStatus === 'match') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd']
      });
    }
  }, [matchStatus]);

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
            <Activity className="w-10 h-10 text-blue-500" />
          </div>
          <div className="ml-6">
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Check File Integrity</h1>
            <p className="text-blue-500/40 font-bold tracking-tight uppercase text-xs">Compute and compare cryptographic hashes</p>
          </div>
        </div>
      </div>


        {/* Error */}
        {error && (
          <div className="flex items-center gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl mb-10 animate-slide-up">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* File Drop */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-blue-500/40 uppercase tracking-[0.2em] ml-1 block">Resource analysis target</label>
            {file ? (
              <div className="flex items-center gap-5 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 animate-scale-in">
                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <Upload className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">{file.name}</p>
                  <p className="text-xs font-bold text-blue-500/40 uppercase tracking-widest">{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={() => { setFile(null); setResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-xs font-bold text-blue-500 transition-all border border-blue-500/10 uppercase tracking-widest active:scale-95"
                >
                  Change
                </button>
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
                  <Activity className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-blue-500/40'}`} />
                </div>
                <p className="text-lg font-bold mb-2">Drop asset for analysis</p>
                <p className="text-blue-500/40 font-bold uppercase text-[10px] tracking-widest">or browse local filesystem</p>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
              </div>
            )}
          </div>

          {/* Compute Button */}
          <button
            onClick={handleCompute}
            disabled={isLoading || !file}
            className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-3xl font-extrabold text-white text-lg transition-all flex items-center justify-center gap-4 shadow-2xl shadow-blue-600/30 active:scale-[0.98]"
          >
            {isLoading ? <><Loader2 className="w-6 h-6 animate-spin" /> Synchronizing Hashes...</> : <><Activity className="w-7 h-7" /> Execute Integrity Protocol</>}
          </button>

          {/* Results */}
          {result && (
            <div className="glass rounded-[3rem] border border-blue-500/10 overflow-hidden shadow-2xl animate-scale-in">
              <div className="p-8 border-b border-blue-500/10 flex items-center justify-between bg-blue-500/5">
                <div>
                  <p className="font-extrabold text-xl mb-1">{result.fileName}</p>
                  <p className="text-xs font-bold text-blue-500/40 uppercase tracking-widest">{formatBytes(result.fileSize)} · Metadata Analyzed</p>
                </div>
                <button onClick={handleCompute} className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 hover:bg-blue-500/20 transition-all active:scale-90 border border-blue-500/10 shadow-lg shadow-blue-500/5" title="Recompute">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="divide-y divide-blue-500/10">
                {Object.entries(result.hashes).map(([algo, hash]) => (
                  <div key={algo} className="p-8 hover:bg-blue-500/5 transition-colors group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <span className={`text-[10px] font-bold font-mono px-4 py-2 rounded-xl ${ALGO_COLORS[algo]} bg-blue-500/5 border border-blue-500/10 tracking-[0.2em] uppercase`}>{algo}</span>
                        {ALGO_WARNINGS[algo] && (
                          <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/10">{ALGO_WARNINGS[algo]}</span>
                        )}
                      </div>
                      <button onClick={() => copyToClipboard(hash, algo)} className="flex items-center gap-2 text-[10px] font-extrabold text-blue-500 hover:bg-blue-500/10 px-4 py-2.5 rounded-xl transition-all border border-blue-500/10 uppercase tracking-widest active:scale-95">
                        {copiedField === algo ? <><Check className="w-4 h-4 text-green-500" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Hash</>}
                      </button>
                    </div>
                    <div className="bg-blue-500/5 p-5 rounded-2xl border border-blue-500/5 group-hover:border-blue-500/20 transition-all">
                      <p className={`text-xs font-mono break-all font-bold leading-relaxed ${ALGO_COLORS[algo]}`}>{hash}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hash Comparison */}
          {result && (
            <div className="glass rounded-[3rem] border border-blue-500/10 p-10 shadow-2xl relative overflow-hidden animate-slide-up">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full -mr-32 -mt-32" />
              
              <div className="relative z-10">
                <h3 className="text-xs font-bold text-blue-500/60 uppercase tracking-[0.2em] mb-8 ml-1">Cross-Reference Authentication</h3>
                <div className="flex flex-col sm:flex-row gap-5 mb-8">
                  <select
                    value={compareAlgo}
                    onChange={(e) => setCompareAlgo(e.target.value)}
                    className="px-6 py-5 bg-blue-500/10 border border-blue-500/10 rounded-2xl text-xs font-bold text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-blue-500/20 transition-all uppercase tracking-widest cursor-pointer"
                  >
                    {Object.keys(result.hashes).map(a => <option key={a} value={a} className="bg-slate-900 text-white">{a}</option>)}
                  </select>
                  <input
                    type="text"
                    value={compareHash}
                    onChange={(e) => setCompareHash(e.target.value)}
                    placeholder="Enter reference hash sequence..."
                    className="flex-1 px-6 py-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-blue-500/10 transition-all font-bold placeholder-blue-500/20"
                  />
                </div>

                {matchStatus && (
                  <div className={`flex items-start gap-6 p-8 rounded-[2.5rem] animate-scale-in border-2 transition-all ${matchStatus === 'match' ? 'bg-blue-500/5 border-blue-500/20 shadow-xl shadow-blue-500/10' : 'bg-red-500/5 border-red-500/20 shadow-xl shadow-red-500/10'}`}>
                    <div className={`p-4 rounded-2xl border ${matchStatus === 'match' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {matchStatus === 'match' ? <Check className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                    </div>
                    <div>
                      <h4 className={`text-xl font-extrabold mb-2 ${matchStatus === 'match' ? 'text-blue-500' : 'text-red-400'}`}>
                        {matchStatus === 'match' ? 'Protocol Verified' : 'Integrity Violation'}
                      </h4>
                      <p className={`text-sm font-semibold leading-relaxed ${matchStatus === 'match' ? 'text-blue-500/60' : 'text-red-400/60'}`}>
                        {matchStatus === 'match' 
                          ? 'Cryptographic sequence identified as an identical match. Resource integrity is guaranteed.' 
                          : 'Asset mismatch detected. The resource may have been altered or tampered with.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default CheckIntegrityPage;
