import React, { useState, useMemo } from 'react';
import { useLogStore } from '../store/useLogStore';
import { useProjectStore } from '../store/useProjectStore';
import { Search, Pause, Play, Terminal, Copy, CheckCircle2 } from 'lucide-react';

const methodColors = {
  GET: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  POST: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELETE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  PATCH: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const getStatusColor = (status) => {
  if (status >= 500) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  if (status >= 400) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (status >= 300) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
  return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
};

const LogsTable = () => {
  const { logs } = useLogStore();
  const { selectedProject } = useProjectStore();
  const [isPaused, setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [frozenLogs, setFrozenLogs] = useState([]);

  const handlePauseToggle = () => {
    if (isPaused) {
      setIsPaused(false);
      setFrozenLogs([]);
    } else {
      setIsPaused(true);
      setFrozenLogs([...logs]);
    }
  };

  const displayLogs = isPaused ? frozenLogs : logs;

  const filteredLogs = useMemo(() => {
    return displayLogs.filter(log => {
      const term = searchTerm.toLowerCase();
      return (
        log.endpoint?.toLowerCase().includes(term) ||
        log.method?.toLowerCase().includes(term) ||
        log.status_code?.toString().includes(term)
      );
    });
  }, [displayLogs, searchTerm]);

  const snippet = `const sentinel = require('sentinel-sdk');\napp.use(sentinel("${selectedProject?.api_key || 'YOUR_API_KEY'}"));`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-surface border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full min-h-[500px]">
      <div className="px-5 py-3 border-b border-slate-800/80 flex justify-between items-center bg-surfaceLight/30 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-semibold text-white tracking-wide flex items-center">
            <Terminal className="w-4 h-4 mr-2 text-slate-400" />
            Live Traffic
          </h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter route, method..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900/50 border border-slate-700/50 text-slate-300 text-xs rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500/50 w-64 placeholder-slate-600 transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handlePauseToggle}
            className={`flex items-center px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              isPaused 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 mr-1.5" /> : <Pause className="w-3.5 h-3.5 mr-1.5" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-[#0a0f1c]">
        <table className="w-full text-left font-sans">
          <thead className="text-[10px] text-slate-500 uppercase tracking-widest bg-[#0a0f1c] sticky top-0 z-10 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
            <tr>
              <th className="px-5 py-3 font-semibold w-24">Method</th>
              <th className="px-5 py-3 font-semibold">Route</th>
              <th className="px-5 py-3 font-semibold w-24">Status</th>
              <th className="px-5 py-3 font-semibold w-24">Latency</th>
              <th className="px-5 py-3 font-semibold w-32">Risk</th>
              <th className="px-5 py-3 font-semibold w-28 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-16">
                  {logs.length === 0 && !searchTerm ? (
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                      <div className="w-16 h-16 bg-surfaceLight/30 rounded-2xl flex items-center justify-center mb-6 border border-slate-700/50 shadow-lg">
                        <Terminal className="w-8 h-8 text-cyan-500/50" />
                      </div>
                      <h4 className="text-white font-medium text-lg mb-2">Awaiting Telemetry</h4>
                      <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">
                        Your dashboard is ready. Connect your Node.js application by installing the SDK and adding the middleware.
                      </p>
                      
                      <div className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-1">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                          <div className="flex space-x-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono tracking-wider">server.js</span>
                          <button onClick={copySnippet} className="text-slate-500 hover:text-white transition-colors" title="Copy code">
                            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="p-4 overflow-x-auto text-left">
                          <pre className="text-xs font-mono leading-loose">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">sentinel</span> <span className="text-slate-400">=</span> <span className="text-cyan-200">require</span>(<span className="text-emerald-300">'sentinel-sdk'</span>);{'\n'}
                            <span className="text-blue-300">app</span>.<span className="text-cyan-200">use</span>(<span className="text-blue-300">sentinel</span>(<span className="text-emerald-300">"{selectedProject?.api_key || 'YOUR_API_KEY'}"</span>));
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-8">
                      No logs match your filter.
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={log.id || idx} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-2.5">
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border ${methodColors[log.method] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="text-slate-300 font-mono text-xs truncate max-w-sm block group-hover:text-white transition-colors">
                      {log.endpoint}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getStatusColor(log.status_code)}`}>
                      {log.status_code}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`font-mono text-xs ${log.response_time > 1000 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                      {log.response_time} <span className="text-[10px] text-slate-600">ms</span>
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    {(log.risk_score || 0) >= 40 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/30 text-rose-400 bg-rose-500/10">
                        Suspicious ({(log.risk_score || 0)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                        Safe
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <span className="text-slate-500 font-mono text-[10px] tracking-wider">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogsTable;
