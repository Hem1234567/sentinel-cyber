import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useLogStore = create((set, get) => ({
  logs: [],
  alerts: [],
  metrics: {
    totalRequests: 0,
    avgLatency: 0,
    errorRate: 0
  },

  fetchInitialLogs: async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('project_id', projectId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      set({ logs: data });
      get().calculateMetrics(data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  },

  fetchInitialAlerts: async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('project_id', projectId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      set({ alerts: data });
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  },

  addLiveLog: (log) => {
    set(state => {
      const updatedLogs = [log, ...state.logs].slice(0, 100);
      get().calculateMetrics(updatedLogs);
      return { logs: updatedLogs };
    });
  },

  addLiveAlert: (alert) => {
    set(state => ({
      alerts: [alert, ...state.alerts].slice(0, 50)
    }));
  },

  calculateMetrics: (logsArray) => {
    if (!logsArray.length) {
      set({ metrics: { totalRequests: 0, avgLatency: 0, errorRate: 0 } });
      return;
    }
    const totalRequests = logsArray.length;
    // Map status_code because Supabase uses snake_case, but the app might expect statusCode
    const errors = logsArray.filter(l => (l.status_code || l.statusCode) >= 400).length;
    const errorRate = ((errors / totalRequests) * 100).toFixed(1);
    const avgLatency = (logsArray.reduce((acc, l) => acc + (l.response_time || l.responseTime || 0), 0) / totalRequests).toFixed(0);

    set({ metrics: { totalRequests, avgLatency, errorRate } });
  }
}));
