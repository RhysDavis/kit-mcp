/**
 * Unit tests for RateLimiter
 */

import { RateLimiter } from '../../src/utils/rate-limiter';
import { RateLimitConfig } from '../../src/config/auth';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let config: RateLimitConfig;

  beforeEach(() => {
    config = {
      requestsPerMinute: 60,
      burstLimit: 10,
      retryDelay: 1000,
      maxRetryDelay: 10000
    };
    rateLimiter = new RateLimiter(config);
  });

  describe('Request validation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should allow requests within rate limit', () => {
      expect(rateLimiter.canMakeRequest()).toBe(true);
      
      // Record some requests within limit
      for (let i = 0; i < 50; i++) {
        rateLimiter.recordRequest();
      }
      
      expect(rateLimiter.canMakeRequest()).toBe(true);
    });

    it('should deny requests exceeding rate limit', () => {
      // Record requests up to limit
      for (let i = 0; i < config.requestsPerMinute; i++) {
        rateLimiter.recordRequest();
      }
      
      expect(rateLimiter.canMakeRequest()).toBe(false);
    });

    it('should reset rate limit after time window', () => {
      // Use a shorter window for testing
      const testConfig = { ...config, requestsPerMinute: 2 };
      const testLimiter = new RateLimiter(testConfig);
      
      // Fill up the rate limit
      testLimiter.recordRequest();
      testLimiter.recordRequest();
      
      expect(testLimiter.canMakeRequest()).toBe(false);
      
      // Fast-forward time by just over 1 minute
      jest.advanceTimersByTime(61000);
      
      expect(testLimiter.canMakeRequest()).toBe(true);
    });
  });

  describe('Request recording', () => {
    it('should record single requests', () => {
      const initialStatus = rateLimiter.getStatus();
      
      rateLimiter.recordRequest();
      
      const newStatus = rateLimiter.getStatus();
      expect(newStatus.requestsInLastMinute).toBe(initialStatus.requestsInLastMinute + 1);
    });

    it('should record multiple requests', () => {
      const initialStatus = rateLimiter.getStatus();
      
      rateLimiter.recordRequest(5);
      
      const newStatus = rateLimiter.getStatus();
      expect(newStatus.requestsInLastMinute).toBe(initialStatus.requestsInLastMinute + 5);
    });
  });

  describe('Backoff delay calculation', () => {
    it('should calculate exponential backoff', () => {
      const delay1 = rateLimiter.getBackoffDelay(1);
      const delay2 = rateLimiter.getBackoffDelay(2);
      const delay3 = rateLimiter.getBackoffDelay(3);
      
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('should respect maximum retry delay', () => {
      const delay = rateLimiter.getBackoffDelay(10);
      expect(delay).toBeLessThanOrEqual(config.maxRetryDelay);
    });

    it('should include jitter in delay calculation', () => {
      const delays = [];
      for (let i = 0; i < 10; i++) {
        delays.push(rateLimiter.getBackoffDelay(3));
      }
      
      // Check that not all delays are exactly the same (jitter is working)
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('Status reporting', () => {
    it('should report correct status', () => {
      const status = rateLimiter.getStatus();
      
      expect(status).toHaveProperty('requestsInLastMinute');
      expect(status).toHaveProperty('remainingRequests');
      expect(status).toHaveProperty('resetTime');
      
      expect(status.requestsInLastMinute).toBe(0);
      expect(status.remainingRequests).toBe(config.requestsPerMinute);
    });

    it('should update status after recording requests', () => {
      rateLimiter.recordRequest(10);
      
      const status = rateLimiter.getStatus();
      expect(status.requestsInLastMinute).toBe(10);
      expect(status.remainingRequests).toBe(config.requestsPerMinute - 10);
    });
  });

  describe('Wait for availability', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should resolve immediately when under rate limit', async () => {
      const startTime = Date.now();
      const waitPromise = rateLimiter.waitForAvailability();
      const endTime = Date.now();
      
      await waitPromise;
      
      // Should complete almost immediately
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should wait when over rate limit', async () => {
      // Fill up the rate limit
      for (let i = 0; i < config.requestsPerMinute; i++) {
        rateLimiter.recordRequest();
      }
      
      // Start the wait promise
      const waitPromise = rateLimiter.waitForAvailability();
      
      // Fast-forward time to see if it resolves after rate limit window
      jest.advanceTimersByTime(61000);
      
      // Should resolve now that the rate limit window has passed
      await expect(waitPromise).resolves.toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle zero requests per minute', () => {
      const zeroConfig = { ...config, requestsPerMinute: 0 };
      const zeroLimiter = new RateLimiter(zeroConfig);
      
      expect(zeroLimiter.canMakeRequest()).toBe(false);
    });

    it('should handle very high request limits', () => {
      const highConfig = { ...config, requestsPerMinute: 1000000 };
      const highLimiter = new RateLimiter(highConfig);
      
      for (let i = 0; i < 1000; i++) {
        highLimiter.recordRequest();
      }
      
      expect(highLimiter.canMakeRequest()).toBe(true);
    });
  });
});