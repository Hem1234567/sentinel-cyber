import React, { useEffect, useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useLogStore } from '../store/useLogStore';
import LogsTable from '../components/LogsTable';
import AlertsFeed from '../components/AlertsFeed';
import { Activity, Zap, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MetricCard = ({ title, value, icon: Icon, colorClass, delta, isPositive }) => (
  <div className="bg-surface/60 backdrop-blur-sm border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500`}></div>
    <div className="flex items-center justify-between mb-4 relative z-10">
      <h4 className="text-slate-400 text-xs font-semibold tracking-widest uppercase">{title}</h4>
      <div className={`p-2 rounded-lg bg-surfaceLight/50 border border-slate-700/50 ${colorClass} shadow-inner`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-end justify-between relative z-10">
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
      <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {delta}
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surfaceLight/90 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-slate-400 text-xs font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-bold flex items-center" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: {entry.value} {entry.name === 'Latency' ? 'ms' : 'req/s'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Generate dummy time-series data for the chart to showcase the UI
const generateChartData = () => {
  const data = [];
  const now = new Date();
  for (let i = 12; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60000); // every 5 mins
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      Requests: Math.floor(Math.random() * 500) + 100,
      Latency: Math.floor(Math.random() * 100) + 20,
    });
  }
  return data;
};

const DashboardPage = () => {
  const { selectedProject } = useProjectStore();
  const { metrics, fetchInitialLogs, fetchInitialAlerts, alerts } = useLogStore();

  const chartData = useMemo(() => generateChartData(), []);

  useEffect(() => {
    if (selectedProject?.id) {
      fetchInitialLogs(selectedProject.id);
      fetchInitialAlerts(selectedProject.id);
    }
  }, [selectedProject?.id, fetchInitialLogs, fetchInitialAlerts]);

  const activeAlerts = alerts.filter(a => a.status === 'OPEN').length;

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full flex-col py-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="bg-surface/50 p-6 rounded-full mb-6 border border-slate-700/50 shadow-2xl relative z-10">
          <Activity className="w-16 h-16 text-cyan-500/50" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 tracking-wide relative z-10">No Environment Selected</h2>
        <p className="text-slate-400 relative z-10 max-w-sm text-center">Select an existing project from the top navigation or create a new one to begin monitoring.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col font-sans">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 shrink-0">
        <MetricCard title="Total Requests" value={metrics.totalRequests || '0'} icon={Activity} colorClass="text-cyan-400" delta="+12.5%" isPositive={true} />
        <MetricCard title="Avg Latency" value={`${metrics.avgLatency || '0'}ms`} icon={Zap} colorClass="text-emerald-400" delta="-4.2%" isPositive={true} />
        <MetricCard title="Error Rate" value={`${metrics.errorRate || '0'}%`} icon={ShieldCheck} colorClass="text-purple-400" delta="+0.8%" isPositive={false} />
        <MetricCard title="Active Incidents" value={activeAlerts} icon={AlertTriangle} colorClass="text-rose-400" delta={activeAlerts > 0 ? '+2' : '0'} isPositive={activeAlerts === 0} />
      </div>

      {/* Analytics Chart Row */}
      <div className="bg-surface border border-slate-800/80 rounded-xl p-5 shadow-xl shrink-0">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-semibold text-white tracking-wide">Traffic Volume & Performance</h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="left" type="monotone" dataKey="Requests" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
              <Area yAxisId="right" type="monotone" dataKey="Latency" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
        <div className="lg:col-span-2 h-full overflow-hidden">
          <LogsTable />
        </div>
        <div className="lg:col-span-1 h-full overflow-hidden">
          <AlertsFeed />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
