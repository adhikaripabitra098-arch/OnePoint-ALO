
import { supabase, isOnlineMode } from './supabaseClient';
import { storageService } from './storageService';
import { User } from '../types';

/**
 * AUTH SERVICE
 * This is the "Brain" that decides whether to use the Real Backend (Supabase)
 * or the Local Sandbox (LocalStorage).
 * 
 * It switches automatically based on whether you have provided API keys.
 */

export const authService = {
  
  // --- SESSION MANAGEMENT ---
  
  getSession: async (): Promise<User | null> => {
    if (isOnlineMode() && supabase) {
      // Production: Check Supabase Session
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        return {
          email: data.session.user.email!,
          name: data.session.user.user_metadata.full_name || 'User',
          id: data.session.user.id
        };
      }
      return null;
    } else {
      // Dev: Check LocalStorage
      const localSession = await storageService.getSession();
      if (localSession) {
        return {
          email: localSession.email,
          name: localSession.name,
          // Generate a fake ID for local users
          id: `local_${localSession.email}`
        };
      }
      return null;
    }
  },

  // --- LOGIN ---

  login: async (email: string, pass: string): Promise<User | null> => {
    if (isOnlineMode() && supabase) {
      // Production: Login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) throw error;
      if (data.user) {
        return {
          email: data.user.email!,
          name: data.user.user_metadata.full_name || 'User',
          id: data.user.id
        };
      }
      return null;
    } else {
      // Dev: Login with LocalStorage
      const user = await storageService.loginUser(email, pass);
      if (user) {
        return { 
          email: user.email, 
          name: user.name,
          id: `local_${user.email}` 
        };
      }
      return null;
    }
  },

  // --- REGISTER ---

  register: async (email: string, pass: string, name: string): Promise<boolean> => {
    if (isOnlineMode() && supabase) {
      // Production: Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;
      // If auto-confirm is on (default for Supabase dev), we get a session immediately.
      // If email confirmation is on, data.user is created but session is null.
      return !!data.user;
    } else {
      // Dev: Register locally
      return await storageService.registerUser(email, pass, name);
    }
  },

  // --- LOGOUT ---

  logout: async (): Promise<void> => {
    if (isOnlineMode() && supabase) {
      await supabase.auth.signOut();
    }
    // Always clear local storage too just in case
    await storageService.logout();
  },

  // --- PASSWORD RESET (The feature you requested) ---

  resetPassword: async (email: string): Promise<void> => {
    if (isOnlineMode() && supabase) {
      // Production: Sends a REAL email using Supabase's built-in email provider (Resend/SendGrid)
      // You configure the SMTP keys in the Supabase Dashboard, NOT in the frontend code.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password', // Redirects back to your app
      });
      if (error) throw error;
    } else {
      // Dev: Just mock it
      await new Promise(r => setTimeout(r, 1000));
      console.log(`[Dev Mode] Password reset email simulated for ${email}`);
    }
  },

  // --- DELETE ACCOUNT ---

  deleteAccount: async (userId?: string): Promise<void> => {
    if (isOnlineMode() && supabase) {
        // Note: Supabase Client SDK usually doesn't allow deleting OWN user for security.
        // You usually need a Cloud Function for this.
        // For now, we will sign them out, but in a real 100% setup, call an Edge Function here.
        await supabase.auth.signOut();
    } 
    // Execute local cleanup
    if (userId && userId.startsWith('local_')) {
        await storageService.deleteUser(userId.replace('local_', ''));
    } else {
        await storageService.logout();
    }
  }
};