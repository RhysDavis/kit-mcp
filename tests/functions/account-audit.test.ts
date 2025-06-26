/**
 * Unit tests for AccountAuditFunction
 */

import { AccountAuditFunction } from '../../src/functions/account-audit';
import { KitApiClient } from '../../src/services/kit-api-client';
import { ApiCache } from '../../src/utils/cache';

// Mock dependencies
jest.mock('../../src/services/kit-api-client');
jest.mock('../../src/utils/cache');

describe('AccountAuditFunction', () => {
  let accountAudit: AccountAuditFunction;
  let mockApiClient: jest.Mocked<KitApiClient>;
  let mockCache: jest.Mocked<ApiCache>;

  beforeEach(() => {
    // Create mock instances
    mockApiClient = new KitApiClient() as jest.Mocked<KitApiClient>;
    mockCache = new ApiCache() as jest.Mocked<ApiCache>;
    
    // Setup default mock implementations
    mockCache.get.mockReturnValue(undefined);
    mockCache.setWithStrategy.mockReturnValue(true);
    
    setupApiClientMocks();
    
    accountAudit = new AccountAuditFunction(mockApiClient, mockCache);
  });

  function setupApiClientMocks() {
    mockApiClient.getAccount.mockResolvedValue({
      user: {
        email: 'test@example.com'
      },
      account: {
        id: 12345,
        name: 'Test Account',
        primary_email_address: 'test@example.com',
        plan_type: 'creator',
        timezone: { 
          name: 'UTC',
          friendly_name: 'UTC',
          utc_offset: '+00:00'
        },
        created_at: '2024-01-01T00:00:00Z'
      }
    });

    mockApiClient.getEmailStats.mockResolvedValue({
      stats: {
        total_sent: 1000,
        total_opened: 800,
        total_clicked: 200
      }
    });

    mockApiClient.getGrowthStats.mockResolvedValue({
      growth_rate: 5.2,
      new_subscribers: 150
    });

    mockApiClient.getSubscribers.mockResolvedValue({
      subscribers: [
        { id: 1, email_address: 'user1@example.com', state: 'active', created_at: '2024-01-01T00:00:00Z' },
        { id: 2, email_address: 'user2@example.com', state: 'active', created_at: '2024-01-02T00:00:00Z' }
      ],
      pagination: { 
        total_count: 250,
        has_previous_page: false,
        has_next_page: true,
        per_page: 25
      }
    });

    mockApiClient.getTags.mockResolvedValue({
      tags: [
        { id: 1, name: 'VIP', created_at: '2024-01-01T00:00:00Z' },
        { id: 2, name: 'Newsletter', created_at: '2024-01-02T00:00:00Z' }
      ],
      pagination: { 
        total_count: 2,
        has_previous_page: false,
        has_next_page: false,
        per_page: 25
      }
    });

    mockApiClient.getSequences.mockResolvedValue({
      sequences: [
        { id: 1, name: 'Welcome Series', hold: false, repeat: false, created_at: '2024-01-01T00:00:00Z' },
        { id: 2, name: 'Nurture Campaign', hold: false, repeat: true, created_at: '2024-01-02T00:00:00Z' }
      ],
      pagination: { 
        total_count: 2,
        has_previous_page: false,
        has_next_page: false,
        per_page: 25
      }
    });

    mockApiClient.getForms.mockResolvedValue({
      forms: [
        { id: 1, name: 'Newsletter Signup', type: 'inline', status: 'active', subscriptions_count: 150, conversion_rate: 0.15 },
        { id: 2, name: 'Lead Magnet', type: 'modal', status: 'active', subscriptions_count: 80, conversion_rate: 0.08 }
      ],
      pagination: { 
        total_count: 2,
        has_previous_page: false,
        has_next_page: false,
        per_page: 25
      }
    });

    mockApiClient.getCustomFields.mockResolvedValue({
      custom_fields: [
        { id: 1, name: 'First Name', key: 'first_name', type: 'text', created_at: '2024-01-01T00:00:00Z' },
        { id: 2, name: 'Company', key: 'company', type: 'text', created_at: '2024-01-01T00:00:00Z' }
      ]
    });

    mockApiClient.getTagSubscribers.mockResolvedValue({
      subscribers: [{ id: 1, email_address: 'user1@example.com', state: 'active', created_at: '2024-01-01T00:00:00Z' }],
      pagination: { 
        total_count: 50,
        has_previous_page: false,
        has_next_page: true,
        per_page: 25
      }
    });

    mockApiClient.getSequenceSubscribers.mockResolvedValue({
      subscribers: [{ id: 1, email_address: 'user1@example.com', state: 'active', created_at: '2024-01-01T00:00:00Z' }],
      pagination: { 
        total_count: 75,
        has_previous_page: false,
        has_next_page: true,
        per_page: 25
      }
    });

    mockApiClient.getFormSubscribers.mockResolvedValue({
      subscribers: [{ id: 1, email_address: 'user1@example.com', state: 'active', created_at: '2024-01-01T00:00:00Z' }],
      pagination: { 
        total_count: 100,
        has_previous_page: false,
        has_next_page: true,
        per_page: 25
      }
    });
  }

  describe('execute', () => {
    it('should generate complete account audit', async () => {
      const params = {
        include_performance: true,
        detailed_segments: true
      };

      const result = await accountAudit.execute(params);

      expect(result).toHaveProperty('account_summary');
      expect(result).toHaveProperty('segmentation_analysis');
      expect(result).toHaveProperty('automation_overview');
      expect(result).toHaveProperty('lead_capture_analysis');
      expect(result).toHaveProperty('custom_fields_usage');
      expect(result).toHaveProperty('strategic_recommendations');

      expect(mockCache.setWithStrategy).toHaveBeenCalled();
    });

    it('should return cached result when available and performance not required', async () => {
      const cachedResult = {
        account_summary: { 
          total_subscribers: 100,
          active_subscribers: 100,
          unsubscribed_count: 0,
          growth_rate_30d: 5.0,
          list_health_score: 90
        },
        segmentation_analysis: {
          total_tags: 5,
          active_segments: [],
          tag_usage_distribution: [],
          behavioral_tracking_status: 'Basic'
        },
        automation_overview: {
          total_sequences: 3,
          active_sequences: [],
          total_automations: 3,
          active_automations: [],
          automation_performance: []
        },
        lead_capture_analysis: {
          total_forms: 2,
          form_performance: [],
          conversion_rates: []
        },
        custom_fields_usage: [],
        strategic_recommendations: []
      };
      
      mockCache.get.mockReturnValue(cachedResult);

      const params = { include_performance: false };
      const result = await accountAudit.execute(params);

      expect(result).toEqual(cachedResult);
      expect(mockApiClient.getAccount).not.toHaveBeenCalled();
    });

    it('should handle API failures gracefully', async () => {
      mockApiClient.getAccount.mockRejectedValue(new Error('API Error'));

      const result = await accountAudit.execute();
      
      // Should still return a valid audit structure even with partial failures
      expect(result).toHaveProperty('account_summary');
      expect(result).toHaveProperty('segmentation_analysis');
      expect(result).toHaveProperty('automation_overview');
      expect(result).toHaveProperty('lead_capture_analysis');
      expect(result).toHaveProperty('custom_fields_usage');
      expect(result).toHaveProperty('strategic_recommendations');
    });
  });

  describe('Account summary building', () => {
    it('should build account summary with correct metrics', async () => {
      const result = await accountAudit.execute();
      const summary = result.account_summary;

      expect(summary).toBeDefined();
      expect(summary.total_subscribers).toBe(250);
      expect(summary.active_subscribers).toBe(250);
      expect(summary.growth_rate_30d).toBe(5.2);
      expect(summary.list_health_score).toBeGreaterThan(0);
      expect(summary.list_health_score).toBeLessThanOrEqual(100);
    });

    it('should calculate health score based on subscriber metrics', async () => {
      // Test with different growth stats
      mockApiClient.getGrowthStats.mockResolvedValue({
        growth_rate: 10.5,
        new_subscribers: 300
      });

      const result = await accountAudit.execute();
      
      expect(result.account_summary.growth_rate_30d).toBe(10.5);
    });
  });

  describe('Segmentation analysis', () => {
    it('should analyze tag usage and distribution', async () => {
      const result = await accountAudit.execute();
      const segmentation = result.segmentation_analysis;

      expect(segmentation).toBeDefined();
      expect(segmentation.total_tags).toBe(2);
      expect(segmentation.tag_usage_distribution).toBeDefined();
      expect(Array.isArray(segmentation.tag_usage_distribution)).toBe(true);
      expect(segmentation.behavioral_tracking_status).toBeDefined();
    });

    it('should handle empty tags gracefully', async () => {
      mockApiClient.getTags.mockResolvedValue({ tags: [] });

      const result = await accountAudit.execute();
      const segmentation = result.segmentation_analysis;

      expect(segmentation.total_tags).toBe(0);
      expect(segmentation.tag_usage_distribution).toHaveLength(0);
    });

    it('should detect behavioral tracking status', async () => {
      mockApiClient.getTags.mockResolvedValue({
        tags: [
          { id: 1, name: 'clicked-email', created_at: '2024-01-01T00:00:00Z' },
          { id: 2, name: 'opened-newsletter', created_at: '2024-01-01T00:00:00Z' },
          { id: 3, name: 'purchased-product', created_at: '2024-01-01T00:00:00Z' }
        ]
      });

      const result = await accountAudit.execute();
      
      expect(['None', 'Basic', 'Advanced']).toContain(result.segmentation_analysis.behavioral_tracking_status);
    });
  });

  describe('Automation overview', () => {
    it('should analyze sequences and automations', async () => {
      const result = await accountAudit.execute();
      const automation = result.automation_overview;

      expect(automation).toBeDefined();
      expect(automation.total_sequences).toBe(2);
      expect(automation.active_sequences).toHaveLength(2);
      expect(Array.isArray(automation.automation_performance)).toBe(true);
    });

    it('should filter out held sequences', async () => {
      mockApiClient.getSequences.mockResolvedValue({
        sequences: [
          { id: 1, name: 'Active', hold: false, repeat: false, created_at: '2024-01-01T00:00:00Z' },
          { id: 2, name: 'Held', hold: true, repeat: true, created_at: '2024-01-01T00:00:00Z' }
        ]
      });

      const result = await accountAudit.execute();
      const automation = result.automation_overview;

      expect(automation.active_sequences).toHaveLength(1);
      expect(automation.active_sequences[0].name).toBe('Active');
    });
  });

  describe('Strategic recommendations', () => {
    it('should generate relevant recommendations', async () => {
      const result = await accountAudit.execute();
      const recommendations = result.strategic_recommendations;

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.every(rec => typeof rec === 'string')).toBe(true);
    });

    it('should recommend segmentation when few tags exist', async () => {
      mockApiClient.getTags.mockResolvedValue({
        tags: [{ id: 1, name: 'Single Tag', created_at: '2024-01-01T00:00:00Z' }]
      });

      const result = await accountAudit.execute();
      const recommendations = result.strategic_recommendations;

      const hasSegmentationRec = recommendations.some(rec => 
        rec.toLowerCase().includes('segmentation') || 
        rec.toLowerCase().includes('tag')
      );
      
      expect(hasSegmentationRec).toBe(true);
    });

    it('should recommend automation expansion when few sequences exist', async () => {
      mockApiClient.getSequences.mockResolvedValue({
        sequences: [{ id: 1, name: 'Single Sequence', hold: false, repeat: false, created_at: '2024-01-01T00:00:00Z' }]
      });

      const result = await accountAudit.execute();
      const recommendations = result.strategic_recommendations;

      const hasAutomationRec = recommendations.some(rec => 
        rec.toLowerCase().includes('automation') || 
        rec.toLowerCase().includes('sequence')
      );
      
      expect(hasAutomationRec).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle partial API failures', async () => {
      // Some APIs fail but audit should still complete with available data
      mockApiClient.getEmailStats.mockRejectedValue(new Error('Stats unavailable'));
      
      const result = await accountAudit.execute();
      
      // Should still return a valid audit structure
      expect(result).toHaveProperty('account_summary');
      expect(result).toHaveProperty('strategic_recommendations');
    });

    it('should handle tag analysis failures gracefully', async () => {
      mockApiClient.getTagSubscribers.mockRejectedValue(new Error('Tag analysis failed'));
      
      const result = await accountAudit.execute();
      
      // Should still complete despite individual tag failures
      expect(result.segmentation_analysis).toBeDefined();
      expect(result.segmentation_analysis.tag_usage_distribution).toBeDefined();
    });
  });
});