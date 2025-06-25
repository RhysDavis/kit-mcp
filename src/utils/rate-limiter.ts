/**
 * Rate limiting utility for Kit API
 */

import { RateLimitConfig } from '../config/auth.js';

interface RequestRecord {
  timestamp: number;
  count: number;
}

export class RateLimiter {
  private requests: RequestRecord[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a request can be made without exceeding rate limits
   */
  public canMakeRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean up old requests
    this.requests = this.requests.filter(req => req.timestamp > oneMinuteAgo);

    // Count requests in the last minute
    const requestsInLastMinute = this.requests.reduce((sum, req) => sum + req.count, 0);

    return requestsInLastMinute < this.config.requestsPerMinute;
  }

  /**
   * Record a request and wait if necessary
   */
  public async waitForAvailability(): Promise<void> {
    if (this.canMakeRequest()) {
      this.recordRequest();
      return;
    }

    // Calculate wait time
    const oldestRequest = this.requests[0];
    const waitTime = oldestRequest ? 60000 - (Date.now() - oldestRequest.timestamp) : 1000;
    
    await this.delay(Math.min(waitTime, this.config.maxRetryDelay));
    
    // Recursively check again
    return this.waitForAvailability();
  }

  /**
   * Record a successful request
   */
  public recordRequest(count: number = 1): void {
    const now = Date.now();
    this.requests.push({
      timestamp: now,
      count
    });
  }

  /**
   * Get delay time for exponential backoff
   */
  public getBackoffDelay(attempt: number): number {
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
    
    return Math.min(exponentialDelay + jitter, this.config.maxRetryDelay);
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  public getStatus(): {
    requestsInLastMinute: number;
    remainingRequests: number;
    resetTime: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean up old requests
    this.requests = this.requests.filter(req => req.timestamp > oneMinuteAgo);
    
    const requestsInLastMinute = this.requests.reduce((sum, req) => sum + req.count, 0);
    const remainingRequests = Math.max(0, this.config.requestsPerMinute - requestsInLastMinute);
    
    // Calculate when the oldest request will expire
    const oldestRequest = this.requests[0];
    const resetTime = oldestRequest ? oldestRequest.timestamp + 60000 : now;
    
    return {
      requestsInLastMinute,
      remainingRequests,
      resetTime
    };
  }
}