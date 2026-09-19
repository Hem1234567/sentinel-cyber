import React, { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Key, Copy, RefreshCw, Mail, CheckCircle2, Code } from 'lucide-react';

const ProjectSettingsPage = () => {
  const { selectedProject, regenerateKey, createProject } = useProjectStore();
  const [copied, setCopied] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectEmail, setNewProjectEmail] = useState('');

  const handleCopy = () => {
    if (selectedProject?.api_key) {
      navigator.clipboard.writeText(selectedProject.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    if (window.confirm("Are you sure? This will invalidate the current SDK configuration.")) {
      await regenerateKey(selectedProject.id);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProjectName) return;
    await createProject(newProjectName, newProjectEmail);
    setNewProjectName('');
    setNewProjectEmail('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-3">Project Settings</h2>
        <p className="text-slate-400">Manage your active environments, API keys, and configurations.</p>
      </div>

      {selectedProject ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Key className="w-6 h-6 mr-3 text-blue-500" />
            Integration Key
          </h3>
          <p className="text-sm text-slate-400 mb-8">
            Use this API key in your Node.js backend SDK to authenticate and securely stream logs to this project environment. Keep it secret.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 tracking-wide uppercase">Secret API Key</label>
              <div className="flex items-center shadow-inner">
                <input 
                  type="text" 
                  readOnly 
                  value={selectedProject.api_key || ''} 
                  className="bg-slate-900 border-y border-l border-slate-700 text-emerald-400 text-sm font-mono rounded-l-xl block w-full p-4 focus:outline-none tracking-widest"
                />
                <button 
                  onClick={handleCopy}
                  className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-r-xl border border-slate-700 transition-colors flex items-center"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-700/50 flex justify-end">
              <button 
                onClick={handleRegenerate}
                className="flex items-center text-sm font-bold tracking-wide text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors bg-rose-500/10 px-5 py-3 rounded-lg border border-rose-500/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                ROLL KEY
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedProject && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-sm mt-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Code className="w-6 h-6 mr-3 text-emerald-500" />
            Node.js Integration Guide
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Copy and paste this middleware into your target application's <code>server.js</code> file (right before your routes) to automatically stream live telemetry to this environment.
          </p>
          <div className="bg-slate-900 rounded-lg p-5 border border-slate-700 overflow-x-auto relative group">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`const axios = require('axios'); // npm install axios\n\n// --- 🛡️ SENTINEL SDK MIDDLEWARE ---\nconst SENTINEL_API_KEY = "${selectedProject.api_key}";\n// Replace with your actual Supabase Edge Function URL\nconst SENTINEL_INGEST_URL = "https://jsnxmaczrtswyksjozsl.supabase.co/functions/v1/ingest-log";\n\napp.use((req, res, next) => {\n    const startTime = Date.now();\n    res.on('finish', () => {\n        const logData = {\n            api_key: SENTINEL_API_KEY,\n            method: req.method,\n            endpoint: req.originalUrl,\n            status_code: res.statusCode,\n            response_time: Date.now() - startTime,\n            ip_address: req.ip || req.connection.remoteAddress,\n            user_agent: req.headers['user-agent'] || 'Unknown',\n            payload: { queryParams: req.query, requestBody: req.body || {} }\n        };\n        axios.post(SENTINEL_INGEST_URL, logData).catch(() => {});\n    });\n    next();\n});\n// --- END SENTINEL SDK ---`);
              }}
              className="absolute top-4 right-4 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copy Code"
            >
              <Copy className="w-4 h-4" />
            </button>
            <pre className="text-[13px] text-emerald-400 font-mono leading-relaxed whitespace-pre-wrap">
{`const express = require('express');
const axios = require('axios'); // Run: npm install axios
const app = express();

// --- 🛡️ SENTINEL SDK MIDDLEWARE ---
const SENTINEL_API_KEY = "${selectedProject.api_key}";
// Replace with your actual Supabase Edge Function URL
const SENTINEL_INGEST_URL = "https://jsnxmaczrtswyksjozsl.supabase.co/functions/v1/ingest-log";

app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const logData = {
            api_key: SENTINEL_API_KEY, // Note: For this hackathon, we use api_key for ingestion auth
            method: req.method,
            endpoint: req.originalUrl,
            status_code: res.statusCode,
            response_time: Date.now() - startTime,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent'] || 'Unknown',
            payload: { queryParams: req.query, requestBody: req.body || {} }
        };
        // Fire & Forget background telemetry
        axios.post(SENTINEL_INGEST_URL, logData).catch(() => {});
    });
    next();
});
// --- END SENTINEL SDK ---

// Your normal application routes...`}
            </pre>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-sm mt-8">
        <h3 className="text-xl font-bold text-white mb-6">Create New Environment</h3>
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold tracking-wide uppercase text-slate-400 mb-2">Environment Name</label>
            <input 
              type="text" 
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg block w-full p-3.5 focus:border-blue-500 focus:outline-none"
              placeholder="e.g., Production API v2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold tracking-wide uppercase text-slate-400 mb-2">Alert Notification Email (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <input 
                type="email" 
                value={newProjectEmail}
                onChange={(e) => setNewProjectEmail(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg block w-full pl-11 p-3.5 focus:border-blue-500 focus:outline-none"
                placeholder="oncall@company.com"
              />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide py-3 px-8 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
              Provision Environment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectSettingsPage;
