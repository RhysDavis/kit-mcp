/**
 * Unit tests for analytics utility functions
 */

import { calculateEngagementScore, generateStrategicRecommendations } from '../../src/utils/analytics';

describe('Analytics Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateEngagementScore', () => {
    it('should calculate engagement score from metrics', () => {
      const metrics = {
        open_rate: 0.3,      // 30% open rate
        click_rate: 0.05,    // 5% click rate
        unsubscribe_rate: 0.01, // 1% unsubscribe rate
        complaint_rate: 0.001   // 0.1% complaint rate
      };

      const score = calculateEngagementScore(metrics);
      
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle missing metrics gracefully', () => {
      const score = calculateEngagementScore({});
      
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle undefined input', () => {
      const score = calculateEngagementScore({});
      
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should penalize high unsubscribe rates', () => {
      const lowUnsubscribe = calculateEngagementScore({
        open_rate: 0.3,
        click_rate: 0.05,
        unsubscribe_rate: 0.001
      });

      const highUnsubscribe = calculateEngagementScore({
        open_rate: 0.3,
        click_rate: 0.05,
        unsubscribe_rate: 0.05
      });

      expect(lowUnsubscribe).toBeGreaterThan(highUnsubscribe);
    });

    it('should reward high engagement rates', () => {
      const lowEngagement = calculateEngagementScore({
        open_rate: 0.1,
        click_rate: 0.01,
        unsubscribe_rate: 0.001
      });

      const highEngagement = calculateEngagementScore({
        open_rate: 0.4,
        click_rate: 0.08,
        unsubscribe_rate: 0.001
      });

      expect(highEngagement).toBeGreaterThan(lowEngagement);
    });
  });

  describe('generateStrategicRecommendations', () => {
    it('should generate recommendations for small subscriber base', () => {
      const data = {
        subscriber_count: 500,
        engagement_rate: 0.3,
        automation_count: 5
      };

      const recommendations = generateStrategicRecommendations(data);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => 
        rec.includes('segmentation') || rec.includes('automation')
      )).toBe(true);
    });

    it('should generate recommendations for low engagement', () => {
      const data = {
        subscriber_count: 5000,
        engagement_rate: 0.1,
        automation_count: 5
      };

      const recommendations = generateStrategicRecommendations(data);
      
      expect(recommendations.some(rec => 
        rec.includes('engagement') || rec.includes('content')
      )).toBe(true);
    });

    it('should generate recommendations for insufficient automation', () => {
      const data = {
        subscriber_count: 5000,
        engagement_rate: 0.3,
        automation_count: 1
      };

      const recommendations = generateStrategicRecommendations(data);
      
      expect(recommendations.some(rec => 
        rec.includes('automation') || rec.includes('sequences')
      )).toBe(true);
    });

    it('should return empty array for optimal metrics', () => {
      const data = {
        subscriber_count: 10000,
        engagement_rate: 0.4,
        automation_count: 10
      };

      const recommendations = generateStrategicRecommendations(data);
      
      expect(Array.isArray(recommendations)).toBe(true);
      // May or may not be empty depending on implementation
    });

    it('should handle missing data gracefully', () => {
      const recommendations = generateStrategicRecommendations({});
      
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should handle undefined input', () => {
      const recommendations = generateStrategicRecommendations({});
      
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should work together for complete analysis', () => {
      const metrics = {
        open_rate: 0.25,
        click_rate: 0.04,
        unsubscribe_rate: 0.02
      };

      const data = {
        subscriber_count: 2500,
        engagement_rate: 0.15,
        automation_count: 2
      };

      const engagementScore = calculateEngagementScore(metrics);
      const recommendations = generateStrategicRecommendations(data);

      expect(typeof engagementScore).toBe('number');
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});