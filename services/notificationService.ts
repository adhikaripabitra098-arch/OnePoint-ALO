import { supabase } from './supabaseClient';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;

// Helper to convert VAPID key for browser
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const registerPushNotifications = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("Push messaging is not supported");
    return false;
  }

  // 1. Check if we have the key to go "Real Mode"
  if (!VAPID_PUBLIC_KEY) {
    console.log("[System] Notification permission granted. System ready for VAPID_PUBLIC_KEY to enable remote push.");
    return true; // Return true because the permission itself was successful
  }

  try {
    // 2. "Real Mode": Register Service Worker and Subscribe
    // Note: In a real deploy, ensure a file named 'sw.js' exists in your public folder.
    const registration = await navigator.serviceWorker.ready; 
    
    // If no SW is active, we can't subscribe yet. 
    // This assumes your main app entry point registers the SW (standard in Vite PWA plugins)
    if (!registration) {
      console.log("Service Worker not ready yet. Skipping subscription.");
      return true;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log("[System] Push Notification Subscription generated:", subscription);

    // 3. Save to Backend (Supabase) if available
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         await supabase
           .from('profiles')
           .update({ push_subscription: subscription })
           .eq('id', user.id);
      }
    }

    return true;
  } catch (error) {
    console.error("[System] Failed to subscribe to push notifications:", error);
    return false;
  }
};