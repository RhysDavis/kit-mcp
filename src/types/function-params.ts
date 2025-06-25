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