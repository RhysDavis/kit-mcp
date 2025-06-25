/**
 * Analysis and strategic insights data models
 */

import { Tag, Subscriber, Sequence, Automation, CustomField } from './core.js';
import { SequenceMetrics, AutomationPerformance, FormMetrics, EngagementMetrics } from './performance.js';

export interface TagUsage {
  tag: Tag;
  subscriber_count: number;
  engagement_metrics: EngagementMetrics;
  usage_frequency: number;
}

export interface AutomationMetrics {
  automation: Automation;
  performance: AutomationPerformance;
  optimization_score: number;
}

export interface ConversionData {
  form_id: string;
  conversion_rate: number;
  subscriber_quality_score: number;
}

export interface CustomFieldAnalysis {
  field: CustomField;
  usage_percentage: number;
  data_quality_score: number;
  personalization_opportunity: string;
}

export interface AccountAudit {
  account_summary: {
    total_subscribers: number;
    active_subscribers: number;
    unsubscribed_count: number;
    growth_rate_30d: number;
    list_health_score: number;
  };
  segmentation_analysis: {
    total_tags: number;
    active_segments: Tag[];
    tag_usage_distribution: TagUsage[];
    behavioral_tracking_status: string;
  };
  automation_overview: {
    total_sequences: number;
    active_sequences: Sequence[];
    total_automations: number;
    active_automations: Automation[];
    automation_performance: AutomationMetrics[];
  };
  lead_capture_analysis: {
    total_forms: number;
    form_performance: FormMetrics[];
    conversion_rates: ConversionData[];
  };
  custom_fields_usage: CustomFieldAnalysis[];
  strategic_recommendations: string[];
}

export interface SubscriberGroup {
  count: number;
  percentage: number;
  avg_engagement_score: number;
  subscribers: Subscriber[];
}

export interface SegmentMetrics {
  segment_name: string;
  subscriber_count: number;
  engagement_metrics: EngagementMetrics;
  conversion_rate: number;
}

export interface FieldDistribution {
  field_name: string;
  value_distribution: Record<string, number>;
  completion_rate: number;
}

export interface LocationData {
  country?: string;
  state?: string;
  subscriber_count: number;
  engagement_metrics: EngagementMetrics;
}

export interface JourneyStageData {
  stage: string;
  subscriber_count: number;
  avg_time_in_stage: number;
  conversion_rate_to_next: number;
}

export interface ContentEngagement {
  content_type: string;
  engagement_score: number;
  preferred_topics: string[];
}

export interface ScoreRange {
  min_score: number;
  max_score: number;
  subscriber_count: number;
  conversion_rate: number;
}

export interface CorrelationData {
  factor: string;
  correlation_coefficient: number;
  statistical_significance: number;
}

export interface SegmentationRecommendation {
  recommended_segment: string;
  criteria: Record<string, any>;
  expected_size: number;
  expected_engagement_lift: number;
  priority_score: number;
}

export interface SubscriberAnalysis {
  demographic_breakdown: {
    by_tags: SegmentMetrics[];
    by_custom_fields: FieldDistribution[];
    geographic_distribution?: LocationData[];
  };
  behavioral_analysis: {
    engagement_segments: {
      highly_engaged: SubscriberGroup;
      moderately_engaged: SubscriberGroup;
      at_risk: SubscriberGroup;
      inactive: SubscriberGroup;
    };
    journey_stage_distribution: JourneyStageData[];
    content_preferences: ContentEngagement[];
  };
  lead_scoring_data: {
    score_distribution: ScoreRange[];
    top_scoring_subscribers: Subscriber[];
    conversion_correlation: CorrelationData;
  };
  segmentation_opportunities: SegmentationRecommendation[];
}