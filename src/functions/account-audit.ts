/**
 * Account Audit Function - Complete Kit account overview for strategic analysis
 */

import { KitApiClient } from '../services/kit-api-client.js';
import { ApiCache } from '../utils/cache.js';
import { 
  AccountAudit, 
  AuditParams,
  Tag,
  Sequence,
  Automation,
  CustomFieldAnalysis,
  TagUsage,
  AutomationMetrics,
  ConversionData
} from '../types/index.js';
import { calculateEngagementScore, generateStrategicRecommendations } from '../utils/analytics.js';

export class AccountAuditFunction {
  private apiClient: KitApiClient;
  private cache: ApiCache;

  constructor(apiClient: KitApiClient, cache: ApiCache) {
    this.apiClient = apiClient;
    this.cache = cache;
  }

  public async execute(params: AuditParams = {}): Promise<AccountAudit> {
    const cacheKey = ApiCache.generateKey('account_audit', params);
    
    // Try cache first for non-real-time requests
    if (!params.include_performance) {
      const cached = this.cache.get<AccountAudit>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Fetch all required data in parallel
      const [
        account,
        emailStats,
        growthStats,
        subscribers,
        tags,
        sequences,
        forms,
        customFields
      ] = await Promise.allSettled([
        this.apiClient.getAccount(),
        this.apiClient.getEmailStats(),
        this.apiClient.getGrowthStats(),
        this.apiClient.getSubscribers({ per_page: 100, include_total_count: true }),
        this.apiClient.getTags({ per_page: 100, include_total_count: true }),
        this.apiClient.getSequences({ per_page: 100, include_total_count: true }),
        this.apiClient.getForms({ per_page: 100, include_total_count: true }),
        this.apiClient.getCustomFields()
      ]);

      // Extract successful results
      const getResult = (result: any) => 
        result.status === 'fulfilled' ? result.value : null;

      const accountData = getResult(account);
      const emailStatsData = getResult(emailStats);
      const growthStatsData = getResult(growthStats);
      const subscribersData = getResult(subscribers);
      const tagsData = getResult(tags);
      const sequencesData = getResult(sequences);
      const formsData = getResult(forms);
      const customFieldsData = getResult(customFields);

      // Build comprehensive audit
      const audit: AccountAudit = {
        account_summary: await this.buildAccountSummary(
          { emailStats: emailStatsData, growthStats: growthStatsData }, 
          subscribersData?.pagination?.total_count || subscribersData?.subscribers?.length || 0
        ),
        segmentation_analysis: await this.buildSegmentationAnalysis(tagsData || { tags: [] }),
        automation_overview: await this.buildAutomationOverview(sequencesData || { sequences: [] }),
        lead_capture_analysis: await this.buildLeadCaptureAnalysis(formsData || { forms: [] }),
        custom_fields_usage: await this.buildCustomFieldsAnalysis(customFieldsData?.custom_fields || []),
        strategic_recommendations: await this.generateRecommendations(
          { emailStats: emailStatsData, growthStats: growthStatsData }, 
          tagsData || { tags: [] }, 
          sequencesData || { sequences: [] }, 
          formsData || { forms: [] }
        )
      };

      // Cache the result
      this.cache.setWithStrategy(cacheKey, audit, 'medium');

      return audit;

    } catch (error) {
      console.error('Account audit failed:', error);
      throw new Error(`Failed to generate account audit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async buildAccountSummary(stats: any, totalSubscribers: number) {
    // Extract data from email stats and growth stats
    const emailStats = stats.emailStats || {};
    const growthStats = stats.growthStats || {};
    
    // Calculate metrics based on available data
    const activeSubscribers = totalSubscribers; // Most subscribers returned are typically active
    const unsubscribedCount = 0; // Would need subscriber state analysis for accurate count
    const listHealthScore = this.calculateListHealthScore({
      total_subscribers: totalSubscribers,
      active_subscribers: activeSubscribers,
      bounced_subscribers: 0,
      complained_subscribers: 0
    });
    
    // Extract growth rate from growth stats if available
    const growthRate30d = growthStats.growth_rate || 0;

    return {
      total_subscribers: totalSubscribers,
      active_subscribers: activeSubscribers,
      unsubscribed_count: unsubscribedCount,
      growth_rate_30d: growthRate30d,
      list_health_score: listHealthScore
    };
  }

  private async buildSegmentationAnalysis(tagsResponse: any) {
    const tags = tagsResponse.tags || [];
    const tagUsageDistribution: TagUsage[] = [];

    // Analyze tag usage and engagement
    for (const tag of tags.slice(0, 20)) { // Limit for performance
      try {
        const subscribers = await this.apiClient.getTagSubscribers(tag.id, { per_page: 10 });
        const usageData: TagUsage = {
          tag,
          subscriber_count: subscribers.pagination?.total_count || 0,
          engagement_metrics: {
            open_rate: 0, // Would need performance data
            click_rate: 0,
            unsubscribe_rate: 0,
            complaint_rate: 0,
            engagement_score: 0
          },
          usage_frequency: this.calculateTagUsageFrequency(tag)
        };
        tagUsageDistribution.push(usageData);
      } catch (error) {
        console.warn(`Failed to analyze tag ${tag.id}:`, error);
      }
    }

    return {
      total_tags: tags.length,
      active_segments: tags.filter((tag: any) => tag.created_at > this.getDateDaysAgo(90)),
      tag_usage_distribution: tagUsageDistribution,
      behavioral_tracking_status: this.assessBehavioralTracking(tags)
    };
  }

  private async buildAutomationOverview(sequencesResponse: any) {
    const sequences = sequencesResponse.sequences || [];
    const activeSequences = sequences.filter((seq: any) => !seq.hold);
    const automationPerformance: AutomationMetrics[] = [];

    // Note: Automations are different from sequences in Kit API
    // This is a simplified version focusing on sequences
    for (const sequence of activeSequences.slice(0, 10)) {
      try {
        const subscribers = await this.apiClient.getSequenceSubscribers(sequence.id, { per_page: 1 });
        const metrics: AutomationMetrics = {
          automation: {
            id: sequence.id,
            name: sequence.name,
            status: sequence.hold ? 'archived' : 'active',
            trigger_type: 'manual', // Would need more API data
            subscriber_count: subscribers.pagination?.total_count || 0,
            conversion_rate: 0, // Would need conversion tracking
            performance_data: {
              automation_id: sequence.id,
              triggers_fired: 0,
              subscribers_entered: subscribers.pagination?.total_count || 0,
              completion_rate: 0,
              goal_completion_rate: 0,
              avg_time_to_complete: 0
            }
          },
          performance: {
            automation_id: sequence.id,
            triggers_fired: 0,
            subscribers_entered: subscribers.pagination?.total_count || 0,
            completion_rate: 0,
            goal_completion_rate: 0,
            avg_time_to_complete: 0
          },
          optimization_score: this.calculateOptimizationScore(sequence)
        };
        automationPerformance.push(metrics);
      } catch (error) {
        console.warn(`Failed to analyze sequence ${sequence.id}:`, error);
      }
    }

    return {
      total_sequences: sequences.length,
      active_sequences: activeSequences,
      total_automations: sequences.length, // Simplified
      active_automations: activeSequences,
      automation_performance: automationPerformance
    };
  }

  private async buildLeadCaptureAnalysis(formsResponse: any) {
    const forms = formsResponse.forms || [];
    const conversionRates: ConversionData[] = [];

    for (const form of forms.slice(0, 10)) {
      try {
        const subscribers = await this.apiClient.getFormSubscribers(form.id, { per_page: 1 });
        conversionRates.push({
          form_id: form.id,
          conversion_rate: form.conversion_rate || 0,
          subscriber_quality_score: this.calculateSubscriberQualityScore(form)
        });
      } catch (error) {
        console.warn(`Failed to analyze form ${form.id}:`, error);
      }
    }

    return {
      total_forms: forms.length,
      form_performance: [], // Would need more detailed form metrics
      conversion_rates: conversionRates
    };
  }

  private async buildCustomFieldsAnalysis(customFields: any[]): Promise<CustomFieldAnalysis[]> {
    return customFields.map(field => ({
      field: {
        id: field.id,
        name: field.name,
        key: field.key,
        type: field.type || 'text',
        created_at: field.created_at
      },
      usage_percentage: 0, // Would need subscriber data analysis
      data_quality_score: this.calculateDataQualityScore(field),
      personalization_opportunity: this.assessPersonalizationOpportunity(field)
    }));
  }

  private async generateRecommendations(
    stats: any, 
    tags: any, 
    sequences: any, 
    forms: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // List health recommendations
    const listHealthScore = this.calculateListHealthScore(stats);
    if (listHealthScore < 70) {
      recommendations.push("List health is below optimal. Consider implementing re-engagement campaigns and improving signup quality.");
    }

    // Segmentation recommendations
    if (tags.tags?.length < 5) {
      recommendations.push("Limited segmentation detected. Implement behavioral tags to improve targeting and personalization.");
    }

    // Automation recommendations
    const activeSequences = sequences.sequences?.filter((seq: any) => !seq.hold) || [];
    if (activeSequences.length < 3) {
      recommendations.push("Expand automation strategy. Consider welcome series, nurture sequences, and re-engagement campaigns.");
    }

    // Form optimization recommendations
    if (forms.forms?.length < 2) {
      recommendations.push("Diversify lead capture strategy. Test multiple form types and placements to maximize conversions.");
    }

    // Content and segmentation recommendations
    recommendations.push("Ensure all automation content maintains consistent brand positioning and messaging.");
    recommendations.push("Implement advanced segment tracking (Customer type, engagement level, lifecycle stage) for targeted messaging.");

    return recommendations;
  }

  // Helper methods
  private calculateListHealthScore(stats: any): number {
    const total = stats.total_subscribers || 1;
    const active = stats.active_subscribers || 0;
    const bounced = stats.bounced_subscribers || 0;
    const complained = stats.complained_subscribers || 0;

    const healthRatio = active / total;
    const negativeRatio = (bounced + complained) / total;
    
    return Math.max(0, Math.min(100, (healthRatio * 100) - (negativeRatio * 50)));
  }

  private calculateTagUsageFrequency(tag: any): number {
    // Simplified frequency calculation
    const daysSinceCreation = this.getDaysSince(tag.created_at);
    return daysSinceCreation > 0 ? 1 / daysSinceCreation : 1;
  }

  private assessBehavioralTracking(tags: any[]): string {
    const behavioralKeywords = ['clicked', 'opened', 'purchased', 'engaged', 'visited'];
    const behavioralTags = tags.filter(tag => 
      behavioralKeywords.some(keyword => 
        (tag as any).name.toLowerCase().includes(keyword)
      )
    );

    if (behavioralTags.length >= 5) return 'Advanced';
    if (behavioralTags.length >= 2) return 'Basic';
    return 'None';
  }

  private calculateOptimizationScore(sequence: any): number {
    // Simplified scoring based on sequence characteristics
    let score = 50; // Base score

    if (sequence.name.includes('welcome')) score += 10;
    if (sequence.name.includes('nurture')) score += 10;
    if (!sequence.hold) score += 20;
    if (sequence.repeat) score += 10;

    return Math.min(100, score);
  }

  private calculateSubscriberQualityScore(form: any): number {
    // Simplified quality score
    return form.conversion_rate ? Math.min(100, form.conversion_rate * 10) : 50;
  }

  private calculateDataQualityScore(field: any): number {
    // Simplified quality assessment
    let score = 50;
    
    if (field.name.length > 3) score += 20;
    if (field.key && field.key.length > 0) score += 20;
    if (field.type === 'text') score += 10;

    return Math.min(100, score);
  }

  private assessPersonalizationOpportunity(field: any): string {
    const fieldName = field.name.toLowerCase();
    
    if (fieldName.includes('name')) return 'High - Use for email personalization';
    if (fieldName.includes('location') || fieldName.includes('state')) return 'Medium - Geographic targeting';
    if (fieldName.includes('specialty') || fieldName.includes('industry')) return 'High - Professional/industry segmentation';
    
    return 'Low - General data field';
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}