/**
 * Kit API response types
 */

// Basic entity types for API responses
export interface Subscriber {
  id: number;
  email_address: string;
  first_name?: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  created_at: string;
}

export interface Sequence {
  id: number;
  name: string;
  created_at: string;
}

export interface Form {
  id: number;
  name: string;
  created_at: string;
}

export interface CustomField {
  id: number;
  label: string;
  key: string;
}

export interface Broadcast {
  id: number;
  subject: string;
  created_at: string;
  sent_at?: string;
}

export interface KitPagination {
  has_previous_page: boolean;
  has_next_page: boolean;
  start_cursor?: string;
  end_cursor?: string;
  total_count?: number;
}

export interface KitApiResponse<T = any> {
  data?: T;
  pagination?: KitPagination;
  errors?: string[];
}

export interface SubscribersResponse extends KitApiResponse<Subscriber[]> {}
export interface TagsResponse extends KitApiResponse<Tag[]> {}
export interface SequencesResponse extends KitApiResponse<Sequence[]> {}
export interface FormsResponse extends KitApiResponse<Form[]> {}
export interface CustomFieldsResponse extends KitApiResponse<CustomField[]> {}
export interface BroadcastsResponse extends KitApiResponse<Broadcast[]> {}

export interface AccountResponse {
  account: {
    id: number;
    name?: string;
    primary_email_address: string;
    plan_type: string;
    timezone: {
      friendly_name: string;
    };
  };
}

export interface StatsResponse {
  data: any;
}

export interface BulkOperationResponse {
  data: {
    success: boolean;
    message?: string;
  };
}