import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ 
      isAuthenticated: !!session,
      user: session?.user ?? null 
    });
  },

  signIn: async (email: string, password: string) => {
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    set({ 
      isAuthenticated: true,
      user: session?.user ?? null 
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ 
      isAuthenticated: false,
      user: null 
    });
  },
}));