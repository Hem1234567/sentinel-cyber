import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      set({ user: data.user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, error: err.message };
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      // Pass name in user_metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) throw error;
      
      set({ user: data.user, isAuthenticated: !!data.session, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, error: err.message };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        set({ user: session.user, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
      
      // Setup auth state listener
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          set({ user: session.user, isAuthenticated: true });
        } else {
          set({ user: null, isAuthenticated: false });
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
}));
