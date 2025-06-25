/**
 * Core Kit data models - Aligned with Kit API v4
 */

import { SequenceMetrics, AutomationPerformance, FormMetrics, EngagementMetrics } from './performance.js';

export interface ConversionEvent {
  id: string;
  event_type: string;
  timestamp: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface Subscriber {
  id: number;
  email_address: string;
  first_name?: string;
  state: 'active' | 'cancelled' | 'bounced' | 'complained' | 'inactive';
  created_at: string;
  tags?: Tag[];
  custom_fields?: Record<string, any>;
  engagement_score?: number;
  last_activity?: string;
  conversion_events?: ConversionEvent[];
}

export interface Tag {
  id: number;
  name: string;
  created_at: string;
  subscriber_count?: number;
  engagement_metrics?: EngagementMetrics;
}

export interface SequenceEmail {
  id: number;
  subject: string;
  position: number;
  delay_days: number;
  performance_metrics?: EngagementMetrics;
}

export interface Sequence {
  id: number;
  name: string;
  created_at: string;
  hold: boolean;
  repeat: boolean;
  subscriber_count?: number;
  emails?: SequenceEmail[];
  performance_metrics?: SequenceMetrics;
}

export interface Automation {
  id: number;
  name: string;
  status: 'active' | 'draft' | 'archived';
  trigger_type: string;
  subscriber_count: number;
  conversion_rate?: number;
  performance_data?: AutomationPerformance;
}

export interface Form {
  id: number;
  name: string;
  type: 'inline' | 'modal' | 'slide_in' | 'sticky_bar';
  status: 'active' | 'archived';
  conversion_rate?: number;
  subscriptions_count: number;
  performance_data?: FormMetrics;
}

export interface CustomField {
  id: number;
  name: string;
  key: string;
  type: string;
  created_at: string;
}

export interface Broadcast {
  id: number;
  created_at: string;
  subject: string;
  content: string;
  public: boolean;
  published_at?: string;
  send_at?: string;
  thumbnail_alt?: string;
  thumbnail_url?: string;
  performance_metrics?: BroadcastMetrics;
}

export interface BroadcastMetrics {
  broadcast_id: number;
  recipients: number;
  open_rate: number;
  click_rate: number;
  unsubscribe_rate: number;
  complaint_rate: number;
  bounce_rate: number;
  revenue?: number;
}

