/**
 * Unit tests for ApiCache
 */

import { ApiCache, CacheConfig } from '../../src/utils/cache';

describe('ApiCache', () => {
  let cache: ApiCache;

  beforeEach(() => {
    cache = new ApiCache();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic cache operations', () => {
    it('should store and retrieve values', () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      const setResult = cache.set(key, value);
      expect(setResult).toBe(true);

      const retrieved = cache.get(key);
      expect(retrieved).toEqual(value);
    });

    it('should return undefined for non-existent keys', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeUndefined();
    });

    it('should check if key exists', () => {
      const key = 'test-key';
      const value = 'test-value';

      expect(cache.has(key)).toBe(false);
      cache.set(key, value);
      expect(cache.has(key)).toBe(true);
    });

    it('should delete keys', () => {
      const key = 'test-key';
      const value = 'test-value';

      cache.set(key, value);
      expect(cache.has(key)).toBe(true);

      const deleteCount = cache.del(key);
      expect(deleteCount).toBe(1);
      expect(cache.has(key)).toBe(false);
    });

    it('should clear all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.keys()).toHaveLength(2);
      cache.clear();
      expect(cache.keys()).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customConfig: Partial<CacheConfig> = {
        enabled: false,
        ttl: 600,
        maxSize: 500
      };

      const customCache = new ApiCache(customConfig);
      
      // When disabled, operations should return false/undefined
      expect(customCache.set('key', 'value')).toBe(false);
      expect(customCache.get('key')).toBeUndefined();
    });

    it('should respect TTL configuration', (done) => {
      const shortTtlCache = new ApiCache({ ttl: 1 }); // 1 second TTL
      
      shortTtlCache.set('key', 'value');
      expect(shortTtlCache.get('key')).toBe('value');

      setTimeout(() => {
        expect(shortTtlCache.get('key')).toBeUndefined();
        done();
      }, 1100);
    });
  });

  describe('Statistics', () => {
    it('should track cache hits and misses', () => {
      const key = 'test-key';
      const value = 'test-value';

      // Initial stats
      let stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);

      // Miss
      cache.get(key);
      stats = cache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0);

      // Set and hit
      cache.set(key, value);
      cache.get(key);
      stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(50);
    });

    it('should count keys correctly', () => {
      expect(cache.getStats().keys).toBe(0);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.getStats().keys).toBe(2);
    });
  });

  describe('Key generation', () => {
    it('should generate consistent keys', () => {
      const params = { id: 123, type: 'user' };
      const key1 = ApiCache.generateKey('prefix', params);
      const key2 = ApiCache.generateKey('prefix', params);
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different parameters', () => {
      const key1 = ApiCache.generateKey('prefix', { id: 123 });
      const key2 = ApiCache.generateKey('prefix', { id: 456 });
      
      expect(key1).not.toBe(key2);
    });

    it('should handle empty parameters', () => {
      const key = ApiCache.generateKey('prefix');
      expect(key).toBe('prefix');
    });
  });

  describe('Cache strategies', () => {
    it('should set with different TTL strategies', () => {
      const key = 'test-key';
      const value = 'test-value';

      expect(cache.setWithStrategy(key, value, 'short')).toBe(true);
      expect(cache.setWithStrategy(key, value, 'medium')).toBe(true);
      expect(cache.setWithStrategy(key, value, 'long')).toBe(true);
      expect(cache.setWithStrategy(key, value, 'static')).toBe(true);
    });
  });

  describe('Pattern invalidation', () => {
    it('should invalidate keys matching pattern', () => {
      cache.set('user:123', 'data1');
      cache.set('user:456', 'data2');
      cache.set('order:789', 'data3');

      const invalidated = cache.invalidatePattern('user');
      expect(invalidated).toBe(2);
      
      expect(cache.has('user:123')).toBe(false);
      expect(cache.has('user:456')).toBe(false);
      expect(cache.has('order:789')).toBe(true);
    });
  });

  describe('Get or set pattern', () => {
    it('should return cached value if exists', async () => {
      const key = 'test-key';
      const cachedValue = 'cached-value';
      
      cache.set(key, cachedValue);
      
      const fetchFunction = jest.fn().mockResolvedValue('new-value');
      const result = await cache.getOrSet(key, fetchFunction);
      
      expect(result).toBe(cachedValue);
      expect(fetchFunction).not.toHaveBeenCalled();
    });

    it('should fetch and cache value if not exists', async () => {
      const key = 'test-key';
      const fetchedValue = 'fetched-value';
      
      const fetchFunction = jest.fn().mockResolvedValue(fetchedValue);
      const result = await cache.getOrSet(key, fetchFunction);
      
      expect(result).toBe(fetchedValue);
      expect(fetchFunction).toHaveBeenCalledTimes(1);
      expect(cache.get(key)).toBe(fetchedValue);
    });
  });

  describe('TTL management', () => {
    it('should get TTL for key', () => {
      const key = 'test-key';
      cache.set(key, 'value', 300);
      
      const ttl = cache.getTTL(key);
      expect(ttl).toBeGreaterThan(0);
    });

    it('should update TTL for key', () => {
      const key = 'test-key';
      cache.set(key, 'value');
      
      const updated = cache.updateTTL(key, 600);
      expect(updated).toBe(true);
    });
  });
});