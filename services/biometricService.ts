// This service handles Biometric Authentication using the Web Authentication API (WebAuthn).
// It works on modern browsers (Chrome, Safari, Edge) and triggers the native OS FaceID/TouchID/Windows Hello.

const isWebAuthnSupported = () => {
  return window.crypto && window.navigator && !!window.navigator.credentials;
};

// Check if device actually has a sensor (FaceID/TouchID)
export const isAuthenticatorAvailable = async (): Promise<boolean> => {
  if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (e) {
      console.warn("Availability check failed", e);
      return false;
    }
  }
  return false;
};

// Helper to convert string to Uint8Array for challenges
const bufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const registerBiometrics = async (username: string): Promise<boolean | string> => {
  // 1. Check Secure Context
  if (!window.isSecureContext) {
    console.warn("Biometrics require a secure context (HTTPS).");
    return "secure_context_required";
  }

  // 2. Check Browser Support
  if (!isWebAuthnSupported()) {
    return "not_supported_browser";
  }

  // 3. Check Hardware Availability (Async)
  const available = await isAuthenticatorAvailable();
  if (!available) {
    console.warn("No platform authenticator available.");
    return "no_hardware";
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "OnePoint Life OS",
      },
      user: {
        id: userId,
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Forces TouchID/FaceID
        userVerification: "required",
        requireResidentKey: false
      },
      timeout: 60000,
      attestation: "none"
    };

    console.log("Starting WebAuthn Registration...");
    const credential = await navigator.credentials.create({ publicKey });
    
    if (credential) {
      console.log("WebAuthn Registration Successful");
      localStorage.setItem(`biometric_setup_${username}`, 'true');
      localStorage.setItem(`biometric_cred_id_${username}`, bufferToBase64((credential as PublicKeyCredential).rawId));
      return true;
    }
    return false;

  } catch (error: any) {
    console.error("Biometric Registration Failed:", error);
    
    // Detect Iframe / Permission Policy Block / Feature Policy
    const msg = error.message || "";
    if (
        msg.includes("Permissions Policy") || 
        msg.includes("document") || 
        msg.includes("publickey-credentials-create") ||
        msg.includes("NotAllowedError") && !msg.includes("user") // Sometimes checking for generic not allowed if it's instant
    ) {
        return "iframe_blocked";
    }

    if (error.name === 'NotAllowedError') {
        return "cancelled"; // User cancelled or timed out
    }
    if (error.name === 'NotSupportedError') {
        return "not_supported_error";
    }
    return "failed";
  }
};

export const authenticateBiometrics = async (username: string): Promise<{ success: boolean; error?: string }> => {
  const isSetup = localStorage.getItem(`biometric_setup_${username}`);
  
  if (!isSetup) {
     // Check for simulation flag
     if (localStorage.getItem('biometrics_enabled_sim') === 'true') {
        return simulateAuth();
     }
     return { success: false, error: "not_setup" };
  }

  if (!isWebAuthnSupported()) {
    return { success: false, error: "not_supported" };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge,
      userVerification: "required",
      timeout: 60000,
    };

    console.log("Starting WebAuthn Authentication...");
    const assertion = await navigator.credentials.get({ publicKey });

    if (assertion) {
      console.log("WebAuthn Authentication Successful");
      return { success: true };
    }
    return { success: false, error: "failed" };

  } catch (error: any) {
    console.error("Biometric Auth Failed:", error);
    
    const msg = error.message || "";
    if (msg.includes("Permissions Policy") || msg.includes("document") || msg.includes("publickey-credentials-create")) {
        return { success: false, error: "iframe_blocked" };
    }
    if (error.name === 'NotAllowedError') {
       return { success: false, error: "no_match" };
    }
    return { success: false, error: "failed" };
  }
};

// Simulation Fallback
export const enableSimulation = () => {
    localStorage.setItem('biometrics_enabled_sim', 'true');
    return true;
}

const simulateAuth = async (): Promise<{ success: boolean; error?: string }> => {
  return new Promise(resolve => {
    setTimeout(() => {
       resolve({ success: true });
    }, 1200);
  });
};