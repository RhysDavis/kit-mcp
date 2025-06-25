/**
 * Kit API authentication configuration
 */

export interface AuthConfig {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
  retryDelay: number;
  maxRetryDelay: number;
}

export class KitAuthConfig {
  private config: AuthConfig;
  private rateLimitConfig: RateLimitConfig;

  constructor() {
    // Load from environment variables
    this.config = {
      apiKey: process.env.CONVERTKIT_API_KEY,
      apiSecret: process.env.CONVERTKIT_API_SECRET,
      accessToken: process.env.CONVERTKIT_ACCESS_TOKEN,
      baseUrl: process.env.CONVERTKIT_BASE_URL || 'https://api.kit.com/v4',
      timeout: parseInt(process.env.CONVERTKIT_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.CONVERTKIT_MAX_RETRIES || '3')
    };

    // Set rate limits based on authentication method per Kit API docs
    // OAuth: 600 requests per minute, API Keys: 120 requests per minute
    const defaultRequestsPerMinute = this.config.accessToken ? '600' : '120';
    
    this.rateLimitConfig = {
      requestsPerMinute: parseInt(process.env.CONVERTKIT_REQUESTS_PER_MINUTE || defaultRequestsPerMinute),
      burstLimit: parseInt(process.env.CONVERTKIT_BURST_LIMIT || '10'),
      retryDelay: parseInt(process.env.CONVERTKIT_RETRY_DELAY || '1000'),
      maxRetryDelay: parseInt(process.env.CONVERTKIT_MAX_RETRY_DELAY || '10000')
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.accessToken && !this.config.apiKey) {
      throw new Error(
        'Kit authentication required: Either CONVERTKIT_ACCESS_TOKEN (OAuth) or CONVERTKIT_API_KEY must be provided'
      );
    }

    if (this.config.apiKey && !this.config.apiSecret) {
      console.warn(
        'CONVERTKIT_API_SECRET not provided. Some API endpoints may require it for authentication.'
      );
    }
  }

  public getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Kit-MCP/1.0.0'
    };

    if (this.config.accessToken) {
      // Kit API v4 uses X-Kit-Api-Key header for API key authentication
      headers['X-Kit-Api-Key'] = this.config.accessToken;
    }

    return headers;
  }

  public getAuthParams(): Record<string, string> {
    const params: Record<string, string> = {};

    // For endpoints that require API key/secret in query params
    if (this.config.apiKey && !this.config.accessToken) {
      params['api_key'] = this.config.apiKey;
      if (this.config.apiSecret) {
        params['api_secret'] = this.config.apiSecret;
      }
    }

    return params;
  }

  public getConfig(): AuthConfig {
    return { ...this.config };
  }

  public getRateLimitConfig(): RateLimitConfig {
    return { ...this.rateLimitConfig };
  }

  public isOAuthMode(): boolean {
    return !!this.config.accessToken;
  }

  public isApiKeyMode(): boolean {
    return !!this.config.apiKey && !this.config.accessToken;
  }
}