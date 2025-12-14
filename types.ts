
export enum TaskStatus {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

export enum TaskType {
  REFUND = 'REFUND',
  NEGOTIATION = 'NEGOTIATION',
  BOOKING = 'BOOKING',
  PICKUP = 'PICKUP',
  GENERAL = 'GENERAL'
}

export enum TaskRoute {
  AI_AUTOMATED = 'AI_AUTOMATED',
  HUMAN_OPERATOR = 'HUMAN_OPERATOR',
  HYBRID = 'HYBRID'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  type: TaskType;
  route?: TaskRoute;
  estimatedCost: number;
  confidenceScore: number;
  createdAt: Date;
  dueDate?: Date;
  aiAnalysis?: string;
  progress?: number; // 0-100 for progress bar
  vendor?: string;
  vendorLogo?: string; // URL or placeholder char
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  savings?: number;
}

export interface PredictiveAlert {
  id: string;
  title: string;
  message: string;
  type: 'WARNING' | 'INFO' | 'OPPORTUNITY';
  date: Date;
  actionLabel?: string;
}

export interface UserPreferences {
  maxSpendingThreshold: number;
  autoApproveUnder: number;
  negotiationStyle: NegotiationStyle;
  currency: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export enum NegotiationStyle {
  FRIENDLY = 'FRIENDLY',
  NEUTRAL = 'NEUTRAL',
  FIRM = 'FIRM',
  LEGAL = 'LEGAL'
}

export interface WalletTransaction {
  id: string;
  title: string;
  amount: number;
  date: Date;
  isCredit: boolean; // true = top up/refund, false = payment
}
