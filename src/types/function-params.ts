/**
 * MCP function parameter interfaces
 */

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface AuditParams {
  include_performance?: boolean;
  date_range?: DateRange;
  detailed_segments?: boolean;
}

export interface SubscriberAnalysisParams {
  segment_by?: 'tags' | 'custom_fields' | 'behavior' | 'all';
  include_inactive?: boolean;
  behavioral_window_days?: number;
  min_segment_size?: number;
}

export interface PerformanceParams {
  metric_types: ('email' | 'automation' | 'forms' | 'segments')[];
  date_range: DateRange;
  comparison_period?: DateRange;
  include_benchmarks?: boolean;
}

export interface AutomationAnalysisParams {
  automation_ids?: string[];
  include_subscriber_journeys?: boolean;
  performance_period_days?: number;
  include_optimization_suggestions?: boolean;
}

export interface SubscriberLookupParams {
  subscriber_id?: string;
  email?: string;
}

export interface TagAnalysisParams {
  include_usage_stats?: boolean;
  min_subscriber_count?: number;
  include_cleanup_suggestions?: boolean;
}

export interface CustomFieldAnalysisParams {
  field_ids?: string[];
  include_data_quality?: boolean;
  include_personalization_opportunities?: boolean;
}

export interface FormOptimizationParams {
  form_ids?: string[];
  include_ab_testing_suggestions?: boolean;
  performance_period_days?: number;
}

// New enhanced analysis parameter types
export interface HistoricalAnalysisParams {
  analysis_type?: 'growth' | 'subscriber_lifecycle' | 'sequence_adoption' | 'all';
}

export interface SubscriberIntelligenceParams {
  analysis_depth?: 'basic' | 'detailed' | 'comprehensive';
  include_tag_analysis?: boolean;
  include_sequence_participation?: boolean;
}

export interface SequenceIntelligenceParams {
  include_subscriber_analysis?: boolean;
  include_business_era_context?: boolean;
}

export interface BroadcastMiningParams {
  include_performance_data?: boolean;
  include_click_analysis?: boolean;
  time_period?: DateRange;
}

export interface TagIntelligenceParams {
  include_usage_analysis?: boolean;
  include_behavioral_patterns?: boolean;
}

export interface PerformanceBaselineParams {
  include_recent_performance?: boolean;
  include_historical_estimates?: boolean;
}

export interface ReactivationStrategyParams {
  dormancy_indicators?: string[];
  value_assessment_method?: 'tag_count' | 'sequence_participation' | 'historical_patterns';
}