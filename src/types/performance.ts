/**
 * Performance and metrics data models
 */

export interface EngagementMetrics {
  open_rate: number;
  click_rate: number;
  unsubscribe_rate: number;
  complaint_rate: number;
  engagement_score: number;
}

export interface SequenceMetrics {
  sequence_id: number;
  total_subscribers: number;
  completion_rate: number;
  avg_open_rate: number;
  avg_click_rate: number;
  conversion_rate: number;
  revenue_attribution?: number;
}

export interface AutomationPerformance {
  automation_id: number;
  triggers_fired: number;
  subscribers_entered: number;
  completion_rate: number;
  goal_completion_rate: number;
  avg_time_to_complete: number;
}

export interface SourceMetrics {
  source: string;
  subscriptions: number;
  conversion_rate: number;
}

export interface DeviceMetrics {
  device_type: string;
  subscriptions: number;
  percentage: number;
}

export interface FormMetrics {
  form_id: number;
  impressions: number;
  subscriptions: number;
  conversion_rate: number;
  traffic_sources: SourceMetrics[];
  device_breakdown: DeviceMetrics[];
}

export interface CampaignMetrics {
  campaign_id: number;
  subject: string;
  sent_at: string;
  recipients: number;
  open_rate: number;
  click_rate: number;
  unsubscribe_rate: number;
  revenue_attribution?: number;
}

export interface TrendData {
  date: string;
  metric_value: number;
  comparison_value?: number;
}

export interface BenchmarkData {
  metric_name: string;
  current_value: number;
  industry_average: number;
  percentile_rank: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}