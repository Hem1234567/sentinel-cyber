import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useProjectStore = create((set, get) => ({
  projects: [],
  selectedProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ projects: data, loading: false });
      if (data.length > 0 && !get().selectedProject) {
        set({ selectedProject: data[0] });
      }
    } catch (err) {
      set({ loading: false });
      console.error('Error fetching projects:', err);
    }
  },

  createProject: async (name, alertEmail) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not found' };

      const { data, error } = await supabase
        .from('projects')
        .insert([{ name, owner_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      set(state => ({ projects: [data, ...state.projects] }));
      if (!get().selectedProject) {
        set({ selectedProject: data });
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  selectProject: (projectId) => {
    const proj = get().projects.find(p => p.id === projectId); // Changed _id to id
    if (proj) {
      set({ selectedProject: proj });
    }
  },

  regenerateKey: async (projectId) => {
    try {
      // In Supabase, we don't have a direct "regenerate key" endpoint without Edge Functions
      // But we can generate a random UUID and update the row since it's just an API Key text
      const newKey = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      
      const { data, error } = await supabase
        .from('projects')
        .update({ api_key: newKey })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        projects: state.projects.map(p => p.id === projectId ? data : p),
        selectedProject: state.selectedProject?.id === projectId ? data : state.selectedProject
      }));
      return { success: true };
    } catch (err) {
      console.error('Error regenerating key:', err);
    }
    return { success: false };
  }
}));
