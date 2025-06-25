/**
 * Type definitions index
 */

// Core types
export * from './core.js';
export * from './performance.js';
export * from './analysis.js';
export * from './function-params.js';
export * from './api-responses.js';

// Additional response types for MCP functions
export interface PerformanceMetrics {
  email_performance: {
    overall_metrics: {
      avg_open_rate: number;
      avg_click_rate: number;
      avg_unsubscribe_rate: number;
      deliverability_rate: number;
    };
    sequence_performance: SequenceMetrics[];
    campaign_performance: CampaignMetrics[];
    trend_analysis: TrendData[];
  };
  automation_performance: {
    automation_metrics: AutomationPerformance[];
    conversion_rates: ConversionMetrics[];
    drop_off_analysis: DropOffData[];
  };
  form_performance: {
    conversion_rates: FormConversion[];
    traffic_sources: SourceAnalysis[];
    optimization_opportunities: FormOptimization[];
  };
  segment_performance: {
    engagement_by_segment: SegmentEngagement[];
    conversion_by_segment: SegmentConversion[];
    growth_by_segment: SegmentGrowth[];
  };
  benchmarking: {
    industry_comparison: BenchmarkData[];
    performance_grade: string;
    improvement_priorities: string[];
  };
}

export interface ConversionMetrics {
  metric_name: string;
  current_rate: number;
  previous_rate?: number;
  change_percentage?: number;
}

export interface DropOffData {
  stage: string;
  drop_off_rate: number;
  subscribers_lost: number;
  primary_reasons: string[];
}

export interface FormConversion {
  form_id: number;
  form_name: string;
  conversion_rate: number;
  total_views: number;
  total_conversions: number;
}

export interface SourceAnalysis {
  source_type: string;
  conversion_rate: number;
  volume: number;
  quality_score: number;
}

export interface FormOptimization {
  form_id: number;
  optimization_type: string;
  potential_improvement: number;
  implementation_difficulty: 'low' | 'medium' | 'high';
  priority_score: number;
}

export interface SegmentEngagement {
  segment_name: string;
  avg_engagement_score: number;
  open_rate: number;
  click_rate: number;
  subscriber_count: number;
}

export interface SegmentConversion {
  segment_name: string;
  conversion_rate: number;
  revenue_per_subscriber: number;
  total_revenue: number;
}

export interface SegmentGrowth {
  segment_name: string;
  growth_rate: number;
  new_subscribers: number;
  churned_subscribers: number;
}

import { 
  SequenceMetrics, 
  AutomationPerformance, 
  CampaignMetrics, 
  TrendData, 
  BenchmarkData 
} from './performance.js';