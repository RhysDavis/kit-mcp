/**
 * Kit API Client with rate limiting and error handling
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { KitAuthConfig } from '../config/auth.js';
import { RateLimiter } from '../utils/rate-limiter.js';
import { 
  KitApiResponse, 
  SubscribersResponse, 
  TagsResponse, 
  SequencesResponse, 
  FormsResponse, 
  CustomFieldsResponse, 
  BroadcastsResponse,
  AccountResponse,
  StatsResponse,
  BulkOperationResponse,
  KitPagination
} from '../types/api-responses.js';

export interface KitApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
  retryAfter?: number; // Seconds to wait before retrying (from Retry-After header)
}

export class KitApiClient {
  private axiosInstance: AxiosInstance;
  private authConfig: KitAuthConfig;
  private rateLimiter: RateLimiter;

  constructor() {
    this.authConfig = new KitAuthConfig();
    this.rateLimiter = new RateLimiter(this.authConfig.getRateLimitConfig());
    
    const config = this.authConfig.getConfig();
    
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: this.authConfig.getAuthHeaders()
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for rate limiting and auth
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Wait for rate limiting
        await this.rateLimiter.waitForAvailability();
        
        // Add API key params for non-OAuth requests
        if (!this.authConfig.isOAuthMode()) {
          const authParams = this.authConfig.getAuthParams();
          config.params = { ...config.params, ...authParams };
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.rateLimiter.recordRequest();
        return response;
      },
      async (error: AxiosError) => {
        return this.handleApiError(error);
      }
    );
  }

  private async handleApiError(error: AxiosError): Promise<never> {
    const kitError: KitApiError = {
      status: error.response?.status || 500,
      message: 'API request failed',
      details: error.response?.data
    };

    if (error.response) {
      switch (error.response.status) {
        case 401:
          kitError.message = 'Authentication failed - Invalid API credentials';
          kitError.code = 'AUTH_FAILED';
          break;
        case 403:
          kitError.message = 'Access forbidden - Check plan limits or permissions';
          kitError.code = 'ACCESS_FORBIDDEN';
          break;
        case 404:
          kitError.message = 'Resource not found';
          kitError.code = 'NOT_FOUND';
          break;
        case 413:
          kitError.message = 'Request too large - Exceeds bulk operation limits';
          kitError.code = 'REQUEST_TOO_LARGE';
          break;
        case 422:
          kitError.message = 'Validation error - Invalid request data';
          kitError.code = 'VALIDATION_ERROR';
          break;
        case 429:
          kitError.message = 'Rate limit exceeded';
          kitError.code = 'RATE_LIMIT_EXCEEDED';
          // Retry-After header may contain seconds to wait
          if (error.response.headers['retry-after']) {
            kitError.retryAfter = parseInt(error.response.headers['retry-after']);
          }
          break;
        case 500:
          kitError.message = 'Internal server error';
          kitError.code = 'SERVER_ERROR';
          break;
        default:
          kitError.message = `HTTP ${error.response.status}: ${error.response.statusText}`;
      }
    } else if (error.request) {
      kitError.message = 'Network error - No response received';
      kitError.code = 'NETWORK_ERROR';
    } else {
      kitError.message = `Request setup error: ${error.message}`;
      kitError.code = 'REQUEST_ERROR';
    }

    throw kitError;
  }

  private async makeRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    data?: any,
    params?: any
  ): Promise<T> {
    console.error(`🌐 API ${method.toUpperCase()}: ${endpoint}`);
    
    const config: AxiosRequestConfig = {
      method,
      url: endpoint,
      params,
      data
    };

    const response = await this.axiosInstance.request<T>(config);
    console.error(`📡 API Response: ${response.status} ${endpoint}`);
    
    return response.data;
  }

  // Account operations
  public async getAccount(): Promise<AccountResponse> {
    return this.makeRequest<AccountResponse>('get', '/account');
  }

  public async getEmailStats(): Promise<any> {
    return this.makeRequest('get', '/account/email_stats');
  }

  public async getGrowthStats(): Promise<any> {
    return this.makeRequest('get', '/account/growth_stats');
  }

  public async getCreatorProfile(): Promise<any> {
    return this.makeRequest('get', '/account/creator_profile');
  }

  // Subscriber operations
  public async getSubscribers(params?: {
    after?: string;
    before?: string;
    per_page?: number;
    include_total_count?: boolean;
  }): Promise<SubscribersResponse> {
    return this.makeRequest<SubscribersResponse>('get', '/subscribers', undefined, params);
  }

  public async getSubscriber(id: number): Promise<{ subscriber: any }> {
    return this.makeRequest('get', `/subscribers/${id}`);
  }

  public async createSubscribers(subscribers: Array<{
    email_address: string;
    first_name?: string;
    state?: string;
  }>): Promise<BulkOperationResponse | SubscribersResponse> {
    return this.makeRequest('post', '/bulk/subscribers', { subscribers });
  }

  // Tag operations
  public async getTags(params?: {
    after?: string;
    before?: string;
    per_page?: number;
    include_total_count?: boolean;
  }): Promise<TagsResponse> {
    return this.makeRequest<TagsResponse>('get', '/tags', undefined, params);
  }

  public async createTags(tags: Array<{ name: string }>): Promise<BulkOperationResponse | TagsResponse> {
    return this.makeRequest('post', '/bulk/tags', { tags });
  }

  public async getTagSubscribers(tagId: number, params?: {
    after?: string;
    before?: string;
    per_page?: number;
  }): Promise<SubscribersResponse> {
    return this.makeRequest<SubscribersResponse>('get', `/tags/${tagId}/subscribers`, undefined, params);
  }

  public async bulkTagSubscribers(data: {
    tag_ids: number[];
    subscriber_ids: number[];
  }): Promise<BulkOperationResponse> {
    return this.makeRequest('post', '/bulk/tags/subscribers', data);
  }

  public async bulkUntagSubscribers(data: {
    tag_ids: number[];
    subscriber_ids: number[];
  }): Promise<BulkOperationResponse> {
    return this.makeRequest('delete', '/bulk/tags/subscribers', data);
  }

  // Sequence operations
  public async getSequences(params?: {
    after?: string;
    before?: string;
    per_page?: number;
    include_total_count?: boolean;
  }): Promise<SequencesResponse> {
    return this.makeRequest<SequencesResponse>('get', '/sequences', undefined, params);
  }

  public async getSequenceSubscribers(sequenceId: number, params?: {
    after?: string;
    before?: string;
    per_page?: number;
  }): Promise<SubscribersResponse> {
    return this.makeRequest<SubscribersResponse>('get', `/sequences/${sequenceId}/subscribers`, undefined, params);
  }

  // Form operations
  public async getForms(params?: {
    after?: string;
    before?: string;
    per_page?: number;
    include_total_count?: boolean;
  }): Promise<FormsResponse> {
    return this.makeRequest<FormsResponse>('get', '/forms', undefined, params);
  }

  public async getFormSubscribers(formId: number, params?: {
    after?: string;
    before?: string;
    per_page?: number;
  }): Promise<SubscribersResponse> {
    return this.makeRequest<SubscribersResponse>('get', `/forms/${formId}/subscribers`, undefined, params);
  }

  // Custom field operations
  public async getCustomFields(): Promise<CustomFieldsResponse> {
    return this.makeRequest<CustomFieldsResponse>('get', '/custom_fields');
  }

  public async createCustomFields(customFields: Array<{ label: string }>): Promise<BulkOperationResponse | any> {
    return this.makeRequest('post', '/bulk/custom_fields', { custom_fields: customFields });
  }

  // Broadcast operations
  public async getBroadcasts(params?: {
    after?: string;
    before?: string;
    per_page?: number;
    include_total_count?: boolean;
  }): Promise<BroadcastsResponse> {
    return this.makeRequest<BroadcastsResponse>('get', '/broadcasts', undefined, params);
  }

  public async getBroadcast(id: number): Promise<{ broadcast: any }> {
    return this.makeRequest('get', `/broadcasts/${id}`);
  }

  public async getBroadcastStats(id: number): Promise<any> {
    return this.makeRequest('get', `/broadcasts/${id}/stats`);
  }

  public async getBroadcastClicks(id: number): Promise<any> {
    return this.makeRequest('get', `/broadcasts/${id}/clicks`);
  }

  public async getBroadcastsStats(params?: {
    broadcast_ids?: number[];
  }): Promise<any> {
    return this.makeRequest('get', '/broadcasts/stats', undefined, params);
  }

  // Utility methods
  public getRateLimitStatus() {
    return this.rateLimiter.getStatus();
  }

  public getAuthMode(): string {
    if (this.authConfig.isOAuthMode()) return 'oauth';
    if (this.authConfig.isApiKeyMode()) return 'api_key';
    return 'unknown';
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.getAccount();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Pagination helper
  public async getAllPages<T>(
    fetchFunction: (params: any) => Promise<{ data?: T[]; pagination?: KitPagination }>,
    initialParams: any = {}
  ): Promise<T[]> {
    const allItems: T[] = [];
    let hasMore = true;
    let cursor = initialParams.after;

    while (hasMore) {
      const params = { ...initialParams, after: cursor };
      const response = await fetchFunction(params);
      
      if (response.data) {
        allItems.push(...response.data);
      }
      
      if (response.pagination?.has_next_page && response.pagination?.end_cursor) {
        cursor = response.pagination.end_cursor;
      } else {
        hasMore = false;
      }
    }

    return allItems;
  }
}