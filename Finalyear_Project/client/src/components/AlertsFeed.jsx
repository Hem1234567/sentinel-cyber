import React, { useState } from 'react';
import { useLogStore } from '../store/useLogStore';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, ShieldAlert, X, ShieldOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const severityConfig = {
  CRITICAL: { icon: AlertOctagon, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  HIGH: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  MEDIUM: { icon: Info, color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  LOW: { icon: Info, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
};

const AlertsFeed = () => {
  const { alerts, setAlerts } = useLogStore();
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);

  const handleRevokeAccess = async (alert) => {
    if (!alert.metadata?.user_identifier) return;

    try {
      // Block the user
      await supabase
        .from('user_baselines')
        .update({ is_blocked: true })
        .eq('project_id', alert.project_id)
        .eq('user_identifier', alert.metadata.user_identifier);

      // Resolve the alert
      await supabase
        .from('alerts')
        .update({ status: 'RESOLVED' })
        .eq('id', alert.id);

      // We don't update state directly if Realtime will catch it, but it's safe to close drawer
      setSelectedAnomaly(null);
    } catch (err) {
      console.error("Failed to revoke access", err);
    }
  };

  return (
    <div className="bg-surface border border-slate-800/80 rounded-xl shadow-2xl flex flex-col h-full min-h-[500px]">
      <div className="px-5 py-4 border-b border-slate-800/80 flex justify-between items-center bg-surfaceLight/30 backdrop-blur-md sticky top-0 rounded-t-xl z-10">
        <h3 className="text-sm font-semibold text-white flex items-center tracking-wide">
          <ShieldAlert className="w-4 h-4 mr-2 text-rose-500" />
          Threat Alerts
        </h3>
        {alerts.filter(a => a.status === 'OPEN').length > 0 && (
          <span className="flex items-center text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5 animate-pulse"></span>
            {alerts.filter(a => a.status === 'OPEN').length} Active
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
            <div className="w-16 h-16 bg-emerald-500/5 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/10 shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
            </div>
            <p className="text-sm font-semibold text-white tracking-wide">No Threats Detected</p>
            <p className="text-xs mt-2 text-slate-400 text-center max-w-xs">Your endpoints are secure and running smoothly. Sentinel is actively monitoring for incidents.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.LOW;
            const Icon = config.icon;
            const isOpen = alert.status === 'OPEN';
            const isAnomaly = alert.type === 'BEHAVIORAL_ANOMALY';
            
            return (
              <div 
                key={alert.id} 
                onClick={() => isAnomaly ? setSelectedAnomaly(alert) : null}
                className={`relative p-4 rounded-xl border bg-surfaceLight/20 flex flex-col shadow-lg overflow-hidden group ${isOpen ? config.border : 'border-slate-800'} ${isAnomaly ? 'cursor-pointer hover:bg-surfaceLight/40' : ''} transition-all`}
              >
                {isOpen && <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bg.replace('/10', '/50')}`}></div>}
                <div className="flex items-start justify-between z-10">
                  <div className="flex items-start w-full">
                    <div className={`mt-0.5 p-2 rounded-lg bg-surface mr-3 border border-slate-700/50 shadow-inner`}>
                      <Icon className={`w-4 h-4 ${isOpen ? config.color : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-xs font-bold tracking-widest uppercase ${isOpen ? config.color : 'text-slate-400'}`}>
                          {alert.type.replace(/_/g, ' ')}
                        </h4>
                        <span className="text-slate-200 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/50 text-[11px] font-mono tracking-wider shadow-sm">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-300 mt-2 leading-relaxed font-mono bg-slate-900/50 p-2 rounded border border-slate-800">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-end items-center z-10">
                  {isOpen ? (
                    <button className="text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-widest bg-surface px-3 py-1.5 rounded border border-slate-700 hover:border-emerald-500/50 flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Resolve Incident
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* UEBA Drawer Overlay */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface border-l border-slate-700 h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right">
            
            <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-surfaceLight/50">
              <div className="flex items-center">
                <ShieldOff className="w-5 h-5 text-rose-500 mr-3" />
                <h3 className="text-lg font-bold text-white tracking-wide">Behavioral Anomaly</h3>
              </div>
              <button onClick={() => setSelectedAnomaly(null)} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Target Identity</p>
                  <p className="text-lg font-mono text-cyan-400 font-bold">{selectedAnomaly.metadata?.user_identifier}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Risk Score</p>
                  <p className={`text-2xl font-black ${selectedAnomaly.metadata?.risk_score >= 80 ? 'text-rose-500' : 'text-amber-500'}`}>
                    {selectedAnomaly.metadata?.risk_score} <span className="text-sm text-slate-600">/ 100</span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-300 mb-3 tracking-wide flex items-center">
                  <AlertOctagon className="w-4 h-4 mr-2 text-rose-500" />
                  Triggered Reasons
                </h4>
                <ul className="space-y-2">
                  {selectedAnomaly.metadata?.reasons?.map((r, i) => (
                    <li key={i} className="text-xs text-rose-200 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg font-mono">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-300 mb-3 tracking-wide">Telemetry Comparison</h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3 border-b border-slate-800">Parameter</th>
                        <th className="px-4 py-3 border-b border-slate-800 border-l">Expected Baseline</th>
                        <th className="px-4 py-3 border-b border-slate-800 border-l">Observed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-surfaceLight/30 font-mono">
                      <tr>
                        <td className="px-4 py-3 text-slate-300">Activity Window</td>
                        <td className="px-4 py-3 text-slate-400 border-l border-slate-800">{selectedAnomaly.metadata?.expected?.hours}</td>
                        <td className="px-4 py-3 text-rose-400 font-bold border-l border-slate-800 bg-rose-500/5">{selectedAnomaly.metadata?.observed?.hour}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-slate-300">Endpoint Access</td>
                        <td className="px-4 py-3 text-slate-400 border-l border-slate-800 break-all">{selectedAnomaly.metadata?.expected?.endpoints?.join(', ')}</td>
                        <td className={`px-4 py-3 border-l border-slate-800 ${selectedAnomaly.metadata?.expected?.endpoints?.includes(selectedAnomaly.metadata?.observed?.endpoint) ? 'text-emerald-400' : 'text-rose-400 font-bold bg-rose-500/5'}`}>
                          {selectedAnomaly.metadata?.observed?.endpoint}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-slate-300">Payload Volume</td>
                        <td className="px-4 py-3 text-slate-400 border-l border-slate-800">&lt;= {selectedAnomaly.metadata?.expected?.max_bytes} B</td>
                        <td className={`px-4 py-3 border-l border-slate-800 ${selectedAnomaly.metadata?.observed?.bytes > selectedAnomaly.metadata?.expected?.max_bytes * 2 ? 'text-rose-400 font-bold bg-rose-500/5' : 'text-emerald-400'}`}>
                          {selectedAnomaly.metadata?.observed?.bytes} B
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800/80 bg-surfaceLight/30 flex justify-end">
              <button 
                onClick={() => setSelectedAnomaly(null)}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors mr-3"
              >
                Dismiss
              </button>
              {selectedAnomaly.status === 'OPEN' && (
                <button 
                  onClick={() => handleRevokeAccess(selectedAnomaly)}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors flex items-center shadow-lg shadow-rose-500/20"
                >
                  <ShieldOff className="w-4 h-4 mr-2" />
                  Revoke Identity Access
                </button>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsFeed;
