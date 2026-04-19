import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Upload, AlertCircle, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import api from '../services/api';

interface HashResult {
  fileName: string;
  fileSize: number;
  hashes: Record<string, string>;
  message: string;
  timestamp: number;
}

const ALGO_COLORS: Record<string, string> = {
  'MD5': 'text-red-400',
  'SHA-1': 'text-yellow-400',
  'SHA-256': 'text-green-400',
  'SHA-512': 'text-cyan-400',
};

const ALGO_WARNINGS: Record<string, string | null> = {
  'MD5': 'Cryptographically broken — use only for non-security checksums.',
  'SHA-1': 'Deprecated for security use — prefer SHA-256 or higher.',
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 rounded-xl bg-gray-800 border border-gray-700 hover:border-cyan-500/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Check File Integrity</h1>
              <p className="text-sm text-gray-400">Compute and compare cryptographic hashes</p>
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

        <div className="space-y-6">
          {/* File Drop */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              <span className="inline-flex items-center gap-1.5"><Upload className="w-4 h-4 text-cyan-400" /> Select File</span>
            </label>
            {file ? (
              <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <Upload className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-200 truncate">{file.name}</p>
                  <p className="text-sm text-gray-400">{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={() => { setFile(null); setResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
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
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
                  ${isDragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-gray-700 hover:border-cyan-500/50 bg-gray-800/50 hover:bg-gray-800'}`}
              >
                <Activity className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-cyan-400' : 'text-gray-500'}`} />
                <p className="text-gray-400 text-sm">Drop your file here or click to browse</p>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
              </div>
            )}
          </div>

          {/* Compute Button */}
          <button
            onClick={handleCompute}
            disabled={isLoading || !file}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/20"
          >
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Computing...</> : <><Activity className="w-5 h-5" /> Compute Hashes</>}
          </button>

          {/* Results */}
          {result && (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-200">{result.fileName}</p>
                  <p className="text-xs text-gray-400">{formatBytes(result.fileSize)}</p>
                </div>
                <button onClick={handleCompute} className="p-2 text-gray-500 hover:text-gray-300 transition-colors" title="Recompute">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-gray-700/50">
                {Object.entries(result.hashes).map(([algo, hash]) => (
                  <div key={algo} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${ALGO_COLORS[algo]} bg-gray-900`}>{algo}</span>
                        {ALGO_WARNINGS[algo] && (
                          <span className="text-xs text-amber-400/70 italic">{ALGO_WARNINGS[algo]}</span>
                        )}
                      </div>
                      <button onClick={() => copyToClipboard(hash, algo)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                        {copiedField === algo ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                      </button>
                    </div>
                    <p className={`text-xs font-mono break-all ${ALGO_COLORS[algo]}`}>{hash}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hash Comparison */}
          {result && (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              <h3 className="font-semibold text-gray-200 mb-4">Compare Against Known Hash</h3>
              <div className="flex gap-3 mb-4">
                <select
                  value={compareAlgo}
                  onChange={(e) => setCompareAlgo(e.target.value)}
                  className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50"
                >
                  {Object.keys(result.hashes).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <input
                  type="text"
                  value={compareHash}
                  onChange={(e) => setCompareHash(e.target.value)}
                  placeholder="Paste hash to compare..."
                  className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              {matchStatus && (
                <div className={`flex items-center gap-3 p-3 rounded-xl ${matchStatus === 'match' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                  {matchStatus === 'match'
                    ? <><Check className="w-5 h-5 text-green-400" /><span className="text-sm text-green-400 font-semibold">✅ Hashes match — file is intact!</span></>
                    : <><AlertCircle className="w-5 h-5 text-red-400" /><span className="text-sm text-red-400 font-semibold">❌ Hashes do NOT match — file may be corrupted or tampered!</span></>
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckIntegrityPage;
