/**
 * Kit API response types
 */

import { Subscriber, Tag, Sequence, Form, CustomField, Broadcast } from './core.js';

export interface KitPagination {
  has_previous_page: boolean;
  has_next_page: boolean;
  start_cursor?: string;
  end_cursor?: string;
  per_page: number;
  total_count?: number;
}

export interface KitApiResponse<T> {
  data?: T;
  pagination?: KitPagination;
  errors?: string[];
}

export interface SubscribersResponse {
  subscribers: Subscriber[];
  pagination?: KitPagination;
}

export interface TagsResponse {
  tags: Tag[];
  pagination?: KitPagination;
}

export interface SequencesResponse {
  sequences: Sequence[];
  pagination?: KitPagination;
}

export interface FormsResponse {
  forms: Form[];
  pagination?: KitPagination;
}

export interface CustomFieldsResponse {
  custom_fields: CustomField[];
  pagination?: KitPagination;
}

export interface BroadcastsResponse {
  broadcasts: Broadcast[];
  pagination?: KitPagination;
}

export interface BulkOperationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  callback_url?: string;
  failures?: Array<{
    index: number;
    error: string;
    data: any;
  }>;
}

export interface AccountResponse {
  user: {
    email: string;
  };
  account: {
    id: number;
    name: string;
    plan_type: string;
    primary_email_address: string;
    created_at: string;
    timezone: {
      name: string;
      friendly_name: string;
      utc_offset: string;
    };
  };
}

export interface StatsResponse {
  total_subscribers: number;
  active_subscribers: number;
  cancelled_subscribers: number;
  unconfirmed_subscribers: number;
  bounced_subscribers: number;
  complained_subscribers: number;
  growth_rate: number;
  churn_rate: number;
}