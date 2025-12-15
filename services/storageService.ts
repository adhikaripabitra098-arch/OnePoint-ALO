import { Task, User, UserPreferences, WalletTransaction, TaskStatus, TaskType, TaskRoute, NegotiationStyle } from '../types';

// Storage Keys
const USERS_KEY = 'op_users_v2'; 
const DATA_PREFIX = 'op_data_v2_';
const SESSION_KEY = 'op_session_v2';
const APP_SECRET_KEY_ID = 'op_master_key';

interface StoredUser {
  email: string;
  name: string;
  passwordHash: string;
}

interface UserData {
  tasks: Task[];
  preferences: UserPreferences;
  balance: number;
  transactions: WalletTransaction[];
}

const DEFAULT_PREFS: UserPreferences = {
  maxSpendingThreshold: 100,
  autoApproveUnder: 25,
  negotiationStyle: NegotiationStyle.NEUTRAL,
  currency: 'USD'
};

// ADDED: Richer Default Data
const DEFAULT_TASKS: Task[] = [
  {
    id: 't-demo-1',
    title: 'Welcome to OnePoint',
    description: 'System initialization complete.',
    status: TaskStatus.COMPLETED,
    type: TaskType.GENERAL,
    estimatedCost: 0,
    confidenceScore: 1,
    createdAt: new Date(),
  },
  {
    id: 't-demo-2',
    title: 'Netflix Subscription',
    description: 'Negotiated 15% discount on monthly plan.',
    status: TaskStatus.COMPLETED,
    type: TaskType.NEGOTIATION,
    vendor: 'Netflix',
    estimatedCost: 15.99,
    confidenceScore: 0.9,
    createdAt: new Date(Date.now() - 86400000), // Yesterday
  },
  {
    id: 't-demo-3',
    title: 'Uber Refund Request',
    description: 'Processing refund for trip #4921 due to driver error.',
    status: TaskStatus.IN_PROGRESS,
    type: TaskType.REFUND,
    vendor: 'Uber',
    estimatedCost: 24.50,
    confidenceScore: 0.85,
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: 't-demo-4',
    title: 'Flight to London',
    description: 'Found business class upgrade for $200.',
    status: TaskStatus.WAITING_APPROVAL,
    type: TaskType.BOOKING,
    vendor: 'British Airways',
    estimatedCost: 200,
    confidenceScore: 0.95,
    createdAt: new Date(Date.now() - 7200000), // 2 hours ago
  }
];

// --- REAL SECURITY: Web Crypto API (AES-256-GCM) ---

const getCryptoKey = async (): Promise<CryptoKey> => {
  let rawKey = localStorage.getItem(APP_SECRET_KEY_ID);
  
  if (!rawKey) {
    const key = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    rawKey = JSON.stringify(exported);
    localStorage.setItem(APP_SECRET_KEY_ID, rawKey);
    return key;
  }

  return window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(rawKey),
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
};

// Encrypt data using AES-GCM
const encryptData = async (data: any): Promise<string> => {
  try {
    const key = await getCryptoKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); 
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );

    const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.error("AES Encryption Failed:", e);
    return "";
  }
};

// Decrypt data using AES-GCM
const decryptData = async (cipherText: string): Promise<any> => {
  try {
    if (!cipherText) return null;
    
    const key = await getCryptoKey();
    const combined = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
    
    const decodedString = new TextDecoder().decode(decrypted);
    return JSON.parse(decodedString);
  } catch (e) {
    return null;
  }
};

const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const storageService = {
  // 1. Auth & Session
  registerUser: async (email: string, password: string, name: string): Promise<boolean> => {
    await delay(500);
    const users = await storageService._getUsersAsync();
    
    if (users[email]) return false;

    const hashedPassword = await hashPassword(password);
    
    users[email] = { email, name, passwordHash: hashedPassword };
    await storageService._saveUsersAsync(users);
    
    const initialData: UserData = {
      tasks: DEFAULT_TASKS,
      preferences: DEFAULT_PREFS,
      balance: 1250.00, // Pre-fill balance for visual demo
      transactions: [
         { id: 'tx-1', title: 'Top Up', amount: 500, date: new Date(), isCredit: true },
         { id: 'tx-2', title: 'Netflix', amount: -15.99, date: new Date(Date.now() - 86400000), isCredit: false }
      ]
    };
    await storageService.saveUserData(email, initialData);
    
    return true;
  },

  loginUser: async (email: string, password: string): Promise<StoredUser | null> => {
    await delay(600);
    const users = await storageService._getUsersAsync();
    const user = users[email];
    
    if (!user) return null;

    const hashInput = await hashPassword(password);
    
    if (user.passwordHash === hashInput) {
      await storageService._setSessionAsync(user);
      return user;
    }
    return null;
  },

  logout: async (): Promise<void> => {
    await delay(100);
    localStorage.removeItem(SESSION_KEY);
  },

  deleteUser: async (email: string): Promise<void> => {
    await delay(800);
    const users = await storageService._getUsersAsync();
    if (users[email]) {
      delete users[email];
      await storageService._saveUsersAsync(users);
    }
    localStorage.removeItem(DATA_PREFIX + email);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(`biometric_setup_${email}`);
    localStorage.removeItem(`biometric_cred_id_${email}`);
    localStorage.removeItem('biometrics_enabled_sim');
  },

  getSession: async (): Promise<StoredUser | null> => {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    return await decryptData(sessionStr);
  },

  getUserData: async (email: string): Promise<UserData> => {
    await delay(200);
    const dataStr = localStorage.getItem(DATA_PREFIX + email);
    if (!dataStr) {
      return { tasks: [], preferences: DEFAULT_PREFS, balance: 0, transactions: [] };
    }
    
    const parsed = await decryptData(dataStr);
    if (!parsed) return { tasks: [], preferences: DEFAULT_PREFS, balance: 0, transactions: [] };

    parsed.tasks = parsed.tasks.map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined
    }));
    parsed.transactions = parsed.transactions.map((t: any) => ({
      ...t,
      date: new Date(t.date)
    }));
    
    return parsed;
  },

  saveUserData: async (email: string, data: UserData): Promise<void> => {
    await delay(100);
    const encrypted = await encryptData(data);
    localStorage.setItem(DATA_PREFIX + email, encrypted);
  },
  
  _getUsersAsync: async (): Promise<Record<string, StoredUser>> => {
    const str = localStorage.getItem(USERS_KEY);
    if (!str) return {};
    const data = await decryptData(str);
    return data || {}; 
  },

  _saveUsersAsync: async (users: Record<string, StoredUser>) => {
    const encrypted = await encryptData(users);
    localStorage.setItem(USERS_KEY, encrypted);
  },

  _setSessionAsync: async (user: StoredUser) => {
    const encrypted = await encryptData(user);
    localStorage.setItem(SESSION_KEY, encrypted);
  }
};