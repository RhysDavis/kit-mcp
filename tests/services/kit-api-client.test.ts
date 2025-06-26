/**
 * Unit tests for KitApiClient
 */

import axios, { AxiosError } from 'axios';

// Mock axios first with a factory function
const mockAxiosInstance = {
  request: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance)
}));

// Create mock instances that will be used
const mockKitAuthConfigInstance = {
  getConfig: jest.fn().mockReturnValue({
    baseUrl: 'https://api.kit.com/v4',
    timeout: 30000,
    maxRetries: 3
  }),
  getAuthHeaders: jest.fn().mockReturnValue({
    'Content-Type': 'application/json',
    'User-Agent': 'Kit-MCP/1.0.0',
    'X-Kit-Api-Key': 'test-access-token'
  }),
  getAuthParams: jest.fn().mockReturnValue({}),
  getRateLimitConfig: jest.fn().mockReturnValue({
    requestsPerMinute: 120,
    burstLimit: 10,
    retryDelay: 1000,
    maxRetryDelay: 10000
  }),
  isOAuthMode: jest.fn().mockReturnValue(false),
  isApiKeyMode: jest.fn().mockReturnValue(true)
};

const mockRateLimiterInstance = {
  waitForAvailability: jest.fn().mockResolvedValue(undefined),
  recordRequest: jest.fn().mockReturnValue(undefined),
  getStatus: jest.fn().mockReturnValue({
    requestsInLastMinute: 0,
    remainingRequests: 120,
    resetTime: Date.now() + 60000
  })
};

// Mock the config module (use module name without .js - Jest will resolve it)
jest.mock('../../src/config/auth', () => ({
  KitAuthConfig: jest.fn().mockImplementation(() => mockKitAuthConfigInstance)
}));

// Mock the rate limiter module (use module name without .js - Jest will resolve it)
jest.mock('../../src/utils/rate-limiter', () => ({
  RateLimiter: jest.fn().mockImplementation(() => mockRateLimiterInstance)
}));

// Import after mocking
import { KitApiClient } from '../../src/services/kit-api-client';

describe('KitApiClient', () => {
  let apiClient: KitApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Re-setup axios mock after clearing
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
    
    // Reset and re-setup mock implementations with proper return values
    mockKitAuthConfigInstance.getConfig.mockClear().mockReturnValue({
      baseUrl: 'https://api.kit.com/v4',
      timeout: 30000,
      maxRetries: 3
    });
    mockKitAuthConfigInstance.getAuthHeaders.mockClear().mockReturnValue({
      'Content-Type': 'application/json',
      'User-Agent': 'Kit-MCP/1.0.0',
      'X-Kit-Api-Key': 'test-access-token'
    });
    mockKitAuthConfigInstance.getAuthParams.mockClear().mockReturnValue({});
    mockKitAuthConfigInstance.getRateLimitConfig.mockClear().mockReturnValue({
      requestsPerMinute: 120,
      burstLimit: 10,
      retryDelay: 1000,
      maxRetryDelay: 10000
    });
    mockKitAuthConfigInstance.isOAuthMode.mockClear().mockReturnValue(false);
    mockKitAuthConfigInstance.isApiKeyMode.mockClear().mockReturnValue(true);
    
    mockRateLimiterInstance.waitForAvailability.mockClear().mockResolvedValue(undefined);
    mockRateLimiterInstance.recordRequest.mockClear().mockReturnValue(undefined);
    mockRateLimiterInstance.getStatus.mockClear().mockReturnValue({
      requestsInLastMinute: 0,
      remainingRequests: 120,
      resetTime: Date.now() + 60000
    });
    
    // Create the client with injected dependencies
    apiClient = new KitApiClient(mockKitAuthConfigInstance as any, mockRateLimiterInstance as any);
  });

  describe('API Request Success Cases', () => {
    it('should successfully get account information', async () => {
      const mockAccountData = {
        account: {
          id: 12345,
          name: 'Test Account',
          primary_email_address: 'test@example.com',
          plan_type: 'creator',
          timezone: { friendly_name: 'UTC' }
        }
      };

      // Setup the mock request response
      mockAxiosInstance.request.mockResolvedValueOnce({
        status: 200,
        data: mockAccountData
      });

      const result = await apiClient.getAccount();

      expect(result).toEqual(mockAccountData);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: '/account'
        })
      );
    });

    it('should successfully get subscribers with pagination', async () => {
      const mockSubscribers = {
        subscribers: [
          { id: 1, email_address: 'user1@example.com' },
          { id: 2, email_address: 'user2@example.com' }
        ],
        pagination: {
          has_previous_page: false,
          has_next_page: true,
          start_cursor: 'abc123',
          end_cursor: 'def456',
          total_count: 100
        }
      };

      mockAxiosInstance.request.mockResolvedValueOnce({
        status: 200,
        data: mockSubscribers
      });

      const params = { per_page: 25, include_total_count: true };
      const result = await apiClient.getSubscribers(params);

      expect(result).toEqual(mockSubscribers);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: '/subscribers',
          params: params
        })
      );
    });

    it('should successfully create tags in bulk', async () => {
      const mockResponse = {
        tags: [
          { id: 1, name: 'New Tag 1' },
          { id: 2, name: 'New Tag 2' }
        ]
      };

      mockAxiosInstance.request.mockResolvedValueOnce({
        status: 201,
        data: mockResponse
      });

      const tagsToCreate = [{ name: 'New Tag 1' }, { name: 'New Tag 2' }];
      const result = await apiClient.createTags(tagsToCreate);

      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: '/bulk/tags',
          data: { tags: tagsToCreate }
        })
      );
    });
  });

  describe('Error Handling', () => {
    // For error handling, we need to test the actual error transformation
    // Since the interceptor is set up in the constructor, we'll test the final behavior
    
    it('should handle 401 authentication errors', async () => {
      
      // Mock the axios error structure
      const error = new Error('Request failed with status code 401') as AxiosError;
      error.response = {
        status: 401,
        statusText: 'Unauthorized',
        data: { error: 'Invalid credentials' },
        headers: {},
        config: {} as any
      } as any;
      
      mockAxiosInstance.request.mockRejectedValueOnce(error);

      // The actual implementation transforms this error through the interceptor
      // For unit testing, we verify that the method throws with the original error
      await expect(apiClient.getAccount()).rejects.toThrow();
    });

    it('should handle 429 rate limit errors', async () => {
      
      const error = new Error('Request failed with status code 429') as AxiosError;
      error.response = {
        status: 429,
        statusText: 'Too Many Requests',
        data: { error: 'Rate limit exceeded' },
        headers: { 'retry-after': '60' },
        config: {} as any
      } as any;
      
      mockAxiosInstance.request.mockRejectedValueOnce(error);

      await expect(apiClient.getAccount()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      
      const error = new Error('Network Error') as AxiosError;
      error.request = {}; // Network error has request but no response
      
      mockAxiosInstance.request.mockRejectedValueOnce(error);

      await expect(apiClient.getAccount()).rejects.toThrow();
    });
  });

  describe('Utility Methods', () => {
    it('should test connection successfully', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        status: 200,
        data: { account: { id: 123 } }
      });

      const result = await apiClient.testConnection();
      
      expect(result).toBe(true);
    });

    it('should return false for failed connection test', async () => {
      mockAxiosInstance.request.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await apiClient.testConnection();
      
      expect(result).toBe(false);
    });

    it('should get rate limit status', () => {
      const status = apiClient.getRateLimitStatus();
      
      expect(status).toEqual({
        requestsInLastMinute: 0,
        remainingRequests: 120,
        resetTime: expect.any(Number)
      });
    });

    it('should get auth mode', () => {
      const mode = apiClient.getAuthMode();
      
      expect(mode).toBe('api_key');
    });
  });

  describe('Pagination Helper', () => {
    it('should fetch all pages', async () => {
      
      // First page
      mockAxiosInstance.request.mockResolvedValueOnce({
        status: 200,
        data: {
          data: [{ id: 1 }, { id: 2 }],
          pagination: {
            has_next_page: true,
            end_cursor: 'cursor1'
          }
        }
      });

      // Second page
      mockAxiosInstance.request.mockResolvedValueOnce({
        status: 200,
        data: {
          data: [{ id: 3 }, { id: 4 }],
          pagination: {
            has_next_page: false,
            end_cursor: 'cursor2'
          }
        }
      });

      const fetchFunction = (params: any) => apiClient.getSubscribers(params);
      const result = await apiClient.getAllPages(fetchFunction);

      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
    });
  });
});