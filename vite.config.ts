import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Ensure we use process.cwd() and cast process to any to avoid strict type issues with 'Process' interface
    const cwd = (process as any).cwd();
    const env = loadEnv(mode, cwd, '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // We map these variables so they are available globally via process.env
        // This allows you to just add the keys to .env later and it works immediately.
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
        'process.env.RESEND_API_KEY': JSON.stringify(env.RESEND_API_KEY),
        'process.env.VAPID_PUBLIC_KEY': JSON.stringify(env.VAPID_PUBLIC_KEY), // Added for Push Notifications
      },
      resolve: {
        alias: {
          '@': path.resolve(cwd, './src'),
        }
      }
    };
});