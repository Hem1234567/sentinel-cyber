import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useProjectStore } from '../store/useProjectStore';
import { useRealtime } from '../hooks/useRealtime';
import { Activity, ShieldAlert, Settings, LogOut, Copy, CheckCircle2 } from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const { projects, selectedProject, selectProject, fetchProjects } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  useRealtime(selectedProject?.id);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const copyApiKey = () => {
    if (selectedProject?.api_key) {
      navigator.clipboard.writeText(selectedProject.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const NavLink = ({ to, icon: Icon, children }) => {
    const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to.split('/settings')[0]));
    const isActive = location.pathname.includes(to.replace('/new', ''));

    return (
      <Link 
        to={to} 
        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 border ${
          isActive 
            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
            : 'border-transparent text-slate-400 hover:bg-surfaceLight/50 hover:text-slate-200'
        }`}
      >
        <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
        <span className="font-medium tracking-wide text-sm">{children}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-slate-300 flex font-sans">
      <aside className="w-64 bg-surface border-r border-slate-800/80 flex flex-col shadow-2xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
          <div className="relative mr-3">
            <Activity className="w-6 h-6 text-cyan-400 relative z-10" />
            <div className="absolute inset-0 bg-cyan-400 blur-md opacity-40 animate-pulse rounded-full"></div>
          </div>
          <span className="text-xl font-bold text-white tracking-widest">SENTINEL</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink to="/dashboard" icon={Activity}>Overview</NavLink>
          <NavLink to={`/projects/${selectedProject?.id || 'new'}/settings`} icon={Settings}>Settings</NavLink>
        </nav>

        <div className="p-4 border-t border-slate-800/80 bg-surfaceLight/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold mr-3">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="text-slate-200 font-medium tracking-wide">{user?.name}</p>
                <p className="text-slate-500 text-xs truncate max-w-[120px]">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-500/20" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-8 shrink-0 sticky top-0 z-10">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-3">Project</span>
              {projects.length > 0 ? (
                <div className="relative">
                  <select 
                    className="appearance-none bg-surfaceLight border border-slate-700/50 text-slate-200 text-sm rounded-lg focus:ring-cyan-500/50 focus:border-cyan-500/50 block w-48 py-2 pl-3 pr-8 font-medium cursor-pointer transition-colors hover:border-slate-600 outline-none"
                    value={selectedProject?.id || ''}
                    onChange={(e) => selectProject(e.target.value)}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-md">No Projects</span>
              )}
            </div>

            {selectedProject && (
              <div className="flex items-center border-l border-slate-700/50 pl-6">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-3">API Key</span>
                <div className="flex items-center bg-surfaceLight/50 border border-slate-700/50 rounded-md p-1 pl-3">
                  <code className="text-xs font-mono text-slate-300 mr-3 truncate max-w-[120px]">
                    {selectedProject.api_key?.substring(0, 8)}...
                  </code>
                  <button 
                    onClick={copyApiKey}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white group relative"
                    title="Copy API Key"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied && (
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/20">
                        Copied!
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live Feed Connected</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-transparent p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
