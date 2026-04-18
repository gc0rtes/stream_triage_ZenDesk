export interface ZDTicket {
  id: number;
  subject: string;
  status: 'open' | 'hold' | 'pending' | 'solved';
  tier: 'enterprise' | 'pro' | 'free';
  holdType: 'linear' | 'feature_request' | null;
  tags: string[];
  updatedAt: number;
  replies: number;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  assignee: string;
  linear: string | null;
  customer: string;
}

export type Ticket = ZDTicket;

export const COLUMN_KEYS = ['priority', 'standard', 'hold_dev', 'hold_fr', 'pending', 'solved'] as const;

export type ColumnKey = typeof COLUMN_KEYS[number];
