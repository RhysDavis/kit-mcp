/**
 * Caching system for Kit API responses
 */

import NodeCache from 'node-cache';

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  checkPeriod: number;
}

export interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export class ApiCache {
  private cache: NodeCache;
  private config: CacheConfig;
  private stats = { hits: 0, misses: 0 };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      ttl: config.ttl ?? 300, // 5 minutes default
      maxSize: config.maxSize ?? 1000,
      checkPeriod: config.checkPeriod ?? 60 // Check for expired keys every minute
    };

    this.cache = new NodeCache({
      stdTTL: this.config.ttl,
      checkperiod: this.config.checkPeriod,
      maxKeys: this.config.maxSize,
      useClones: false // For performance
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.cache.on('set', (key, value) => {
      console.debug(`Cache: Set key ${key}`);
    });

    this.cache.on('del', (key, value) => {
      console.debug(`Cache: Deleted key ${key}`);
    });

    this.cache.on('expired', (key, value) => {
      console.debug(`Cache: Key ${key} expired`);
    });
  }

  public get<T>(key: string): T | undefined {
    if (!this.config.enabled) {
      return undefined;
    }

    const value = this.cache.get<T>(key);
    
    if (value !== undefined) {
      this.stats.hits++;
      console.debug(`Cache: Hit for key ${key}`);
      return value;
    } else {
      this.stats.misses++;
      console.debug(`Cache: Miss for key ${key}`);
      return undefined;
    }
  }

  public set<T>(key: string, value: T, ttl?: number): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const success = this.cache.set(key, value, ttl || this.config.ttl);
    console.debug(`Cache: Set key ${key} with TTL ${ttl || this.config.ttl}s`);
    return success;
  }

  public del(key: string): number {
    if (!this.config.enabled) {
      return 0;
    }

    const deleted = this.cache.del(key);
    console.debug(`Cache: Deleted ${deleted} key(s) for pattern ${key}`);
    return deleted;
  }

  public clear(): void {
    this.cache.flushAll();
    this.stats = { hits: 0, misses: 0 };
    console.debug('Cache: Cleared all keys');
  }

  public has(key: string): boolean {
    if (!this.config.enabled) {
      return false;
    }
    return this.cache.has(key);
  }

  public keys(): string[] {
    return this.cache.keys();
  }

  public getStats(): CacheStats {
    const keys = this.cache.keys().length;
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      keys,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  public getTTL(key: string): number | undefined {
    if (!this.config.enabled) {
      return undefined;
    }
    return this.cache.getTtl(key);
  }

  public updateTTL(key: string, ttl: number): boolean {
    if (!this.config.enabled) {
      return false;
    }
    return this.cache.ttl(key, ttl);
  }

  // Generate cache keys
  public static generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    
    return sortedParams ? `${prefix}:${sortedParams}` : prefix;
  }

  // Cache with different TTL strategies
  public setWithStrategy<T>(key: string, value: T, strategy: 'short' | 'medium' | 'long' | 'static' = 'medium'): boolean {
    const ttlMap = {
      short: 300,    // 5 minutes - for real-time data
      medium: 900,   // 15 minutes - for dashboard data
      long: 1800,    // 30 minutes - for account summaries
      static: 86400  // 24 hours - for historical data
    };

    return this.set(key, value, ttlMap[strategy]);
  }

  // Invalidate related cache entries
  public invalidatePattern(pattern: string): number {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    let deleted = 0;
    matchingKeys.forEach(key => {
      deleted += this.cache.del(key);
    });

    console.debug(`Cache: Invalidated ${deleted} keys matching pattern ${pattern}`);
    return deleted;
  }

  // Get or set pattern
  public async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetchFunction();
    this.set(key, value, ttl);
    return value;
  }
}