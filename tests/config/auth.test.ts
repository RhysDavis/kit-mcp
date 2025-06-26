/**
 * Unit tests for KitAuthConfig
 */

import { KitAuthConfig } from '../../src/config/auth';

describe('KitAuthConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Configuration loading', () => {
    it('should load configuration from environment variables', () => {
      process.env.CONVERTKIT_API_KEY = 'test-api-key';
      process.env.CONVERTKIT_API_SECRET = 'test-api-secret';
      process.env.CONVERTKIT_BASE_URL = 'https://test.example.com';
      process.env.CONVERTKIT_TIMEOUT = '15000';
      process.env.CONVERTKIT_MAX_RETRIES = '5';

      const authConfig = new KitAuthConfig();
      const config = authConfig.getConfig();

      expect(config.apiKey).toBe('test-api-key');
      expect(config.apiSecret).toBe('test-api-secret');
      expect(config.baseUrl).toBe('https://test.example.com');
      expect(config.timeout).toBe(15000);
      expect(config.maxRetries).toBe(5);
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.CONVERTKIT_BASE_URL;
      delete process.env.CONVERTKIT_TIMEOUT;
      delete process.env.CONVERTKIT_MAX_RETRIES;

      const authConfig = new KitAuthConfig();
      const config = authConfig.getConfig();

      expect(config.baseUrl).toBe('https://api.kit.com/v4');
      expect(config.timeout).toBe(30000);
      expect(config.maxRetries).toBe(3);
    });

    it('should throw error when no authentication is provided', () => {
      delete process.env.CONVERTKIT_API_KEY;
      delete process.env.CONVERTKIT_ACCESS_TOKEN;

      expect(() => new KitAuthConfig()).toThrow(
        'Kit authentication required: Either CONVERTKIT_ACCESS_TOKEN (OAuth) or CONVERTKIT_API_KEY must be provided'
      );
    });

    it('should warn when API key is provided without secret', () => {
      process.env.CONVERTKIT_API_KEY = 'test-api-key';
      delete process.env.CONVERTKIT_API_SECRET;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      new KitAuthConfig();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'CONVERTKIT_API_SECRET not provided. Some API endpoints may require it for authentication.'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Rate limit configuration', () => {
    it('should use OAuth rate limits when access token is provided', () => {
      process.env.CONVERTKIT_ACCESS_TOKEN = 'test-token';
      delete process.env.CONVERTKIT_REQUESTS_PER_MINUTE;

      const authConfig = new KitAuthConfig();
      const rateLimitConfig = authConfig.getRateLimitConfig();

      expect(rateLimitConfig.requestsPerMinute).toBe(600);
    });

    it('should use API key rate limits when only API key is provided', () => {
      process.env.CONVERTKIT_API_KEY = 'test-key';
      delete process.env.CONVERTKIT_ACCESS_TOKEN;
      delete process.env.CONVERTKIT_REQUESTS_PER_MINUTE;

      const authConfig = new KitAuthConfig();
      const rateLimitConfig = authConfig.getRateLimitConfig();

      expect(rateLimitConfig.requestsPerMinute).toBe(120);
    });

    it('should respect custom rate limit configuration', () => {
      process.env.CONVERTKIT_API_KEY = 'test-key';
      process.env.CONVERTKIT_REQUESTS_PER_MINUTE = '300';
      process.env.CONVERTKIT_BURST_LIMIT = '20';
      process.env.CONVERTKIT_RETRY_DELAY = '2000';
      process.env.CONVERTKIT_MAX_RETRY_DELAY = '20000';

      const authConfig = new KitAuthConfig();
      const rateLimitConfig = authConfig.getRateLimitConfig();

      expect(rateLimitConfig.requestsPerMinute).toBe(300);
      expect(rateLimitConfig.burstLimit).toBe(20);
      expect(rateLimitConfig.retryDelay).toBe(2000);
      expect(rateLimitConfig.maxRetryDelay).toBe(20000);
    });
  });

  describe('Authentication headers', () => {
    it('should include OAuth header when access token is provided', () => {
      process.env.CONVERTKIT_ACCESS_TOKEN = 'test-access-token';

      const authConfig = new KitAuthConfig();
      const headers = authConfig.getAuthHeaders();

      expect(headers['X-Kit-Api-Key']).toBe('test-access-token');
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['User-Agent']).toBe('Kit-MCP/1.0.0');
    });

    it('should not include OAuth header when only API key is provided', () => {
      process.env.CONVERTKIT_API_KEY = 'test-api-key';
      delete process.env.CONVERTKIT_ACCESS_TOKEN;

      const authConfig = new KitAuthConfig();
      const headers = authConfig.getAuthHeaders();

      expect(headers['X-Kit-Api-Key']).toBeUndefined();
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['User-Agent']).toBe('Kit-MCP/1.0.0');
    });
  });

  describe('Authentication parameters', () => {
    it('should include API key params when using API key authentication', () => {
      process.env.CONVERTKIT_API_KEY = 'test-api-key';
      process.env.CONVERTKIT_API_SECRET = 'test-api-secret';
      delete process.env.CONVERTKIT_ACCESS_TOKEN;

      const authConfig = new KitAuthConfig();
      const params = authConfig.getAuthParams();

      expect(params.api_key).toBe('test-api-key');
      expect(params.api_secret).toBe('test-api-secret');
    });

    it('should not include API key params when using OAuth', () => {
      process.env.CONVERTKIT_ACCESS_TOKEN = 'test-access-token';

      const authConfig = new KitAuthConfig();
      const params = authConfig.getAuthParams();

      expect(params.api_key).toBeUndefined();
      expect(params.api_secret).toBeUndefined();
    });

    it('should include only API key when secret is not provided', () => {
      process.env.CONVERTKIT_API_KEY = 'test-api-key';
      delete process.env.CONVERTKIT_API_SECRET;
      delete process.env.CONVERTKIT_ACCESS_TOKEN;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const authConfig = new KitAuthConfig();
      const params = authConfig.getAuthParams();

      expect(params.api_key).toBe('test-api-key');
      expect(params.api_secret).toBeUndefined();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Authentication mode detection', () => {
    it('should detect OAuth mode', () => {
      process.env.CONVERTKIT_ACCESS_TOKEN = 'test-access-token';

      const authConfig = new KitAuthConfig();

      expect(authConfig.isOAuthMode()).toBe(true);
      expect(authConfig.isApiKeyMode()).toBe(false);
    });

    it('should detect API key mode', () => {
      process.env.CONVERTKIT_API_KEY = 'test-api-key';
      delete process.env.CONVERTKIT_ACCESS_TOKEN;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const authConfig = new KitAuthConfig();

      expect(authConfig.isOAuthMode()).toBe(false);
      expect(authConfig.isApiKeyMode()).toBe(true);
      
      consoleSpy.mockRestore();
    });

    it('should prioritize OAuth when both tokens are provided', () => {
      process.env.CONVERTKIT_ACCESS_TOKEN = 'test-access-token';
      process.env.CONVERTKIT_API_KEY = 'test-api-key';

      const authConfig = new KitAuthConfig();

      expect(authConfig.isOAuthMode()).toBe(true);
      expect(authConfig.isApiKeyMode()).toBe(false);
    });
  });
});