/**
 * Analytics and strategic insights utilities
 */

import { EngagementMetrics } from '../types/performance.js';

export function calculateEngagementScore(metrics: Partial<EngagementMetrics>): number {
  const {
    open_rate = 0,
    click_rate = 0,
    unsubscribe_rate = 0,
    complaint_rate = 0
  } = metrics;

  // Weighted engagement score
  const positiveScore = (open_rate * 0.4) + (click_rate * 0.6);
  const negativeScore = (unsubscribe_rate * 0.3) + (complaint_rate * 0.7);
  
  const score = Math.max(0, (positiveScore * 100) - (negativeScore * 100));
  return Math.min(100, score);
}

export function generateStrategicRecommendations(
  accountData: any,
  performanceData?: any
): string[] {
  const recommendations: string[] = [];

  // Industry-specific recommendations
  recommendations.push(
    "Implement audience segmentation for targeted industry-specific content"
  );
  
  recommendations.push(
    "Ensure all automation sequences maintain consistent brand positioning and messaging"
  );

  recommendations.push(
    "Track engagement by customer type (New, Returning, Premium) for optimization"
  );

  // Performance-based recommendations
  if (performanceData) {
    if (performanceData.avg_open_rate < 25) {
      recommendations.push(
        "Open rates below industry average. Test subject line personalization and send time optimization"
      );
    }

    if (performanceData.avg_click_rate < 3) {
      recommendations.push(
        "Click rates need improvement. Focus on value-driven content and clear CTAs"
      );
    }
  }

  // High-value customer recommendations
  recommendations.push(
    "Implement lead scoring for premium program qualification tracking"
  );

  recommendations.push(
    "Create automated nurture sequences for high-intent customers and prospects"
  );

  return recommendations;
}

export function analyzeSegmentationOpportunities(
  subscribers: any[],
  tags: any[]
): Array<{
  segment_name: string;
  criteria: Record<string, any>;
  estimated_size: number;
  priority: 'high' | 'medium' | 'low';
}> {
  const opportunities = [];

  // Customer type segmentation
  opportunities.push({
    segment_name: "Enterprise Customers",
    criteria: { company_size: ">100", budget: "high" },
    estimated_size: Math.floor(subscribers.length * 0.4),
    priority: 'high' as const
  });

  opportunities.push({
    segment_name: "Small Business Owners", 
    criteria: { company_size: "<=50", decision_maker: "true" },
    estimated_size: Math.floor(subscribers.length * 0.3),
    priority: 'high' as const
  });

  opportunities.push({
    segment_name: "Individual Professionals",
    criteria: { customer_type: "individual", industry: "services" },
    estimated_size: Math.floor(subscribers.length * 0.2),
    priority: 'medium' as const
  });

  return opportunities;
}

export function calculateListHealthMetrics(stats: any): {
  health_score: number;
  quality_indicators: string[];
  improvement_areas: string[];
} {
  const total = stats.total_subscribers || 1;
  const active = stats.active_subscribers || 0;
  const bounced = stats.bounced_subscribers || 0;
  const complained = stats.complained_subscribers || 0;
  const unconfirmed = stats.unconfirmed_subscribers || 0;

  const activeRate = (active / total) * 100;
  const bounceRate = (bounced / total) * 100;
  const complaintRate = (complained / total) * 100;
  const unconfirmedRate = (unconfirmed / total) * 100;

  // Calculate overall health score
  let healthScore = 100;
  healthScore -= (bounceRate * 2); // Bounces hurt score significantly
  healthScore -= (complaintRate * 5); // Complaints hurt score most
  healthScore -= (unconfirmedRate * 1); // Unconfirmed less critical
  healthScore = Math.max(0, healthScore);

  const qualityIndicators: string[] = [];
  const improvementAreas: string[] = [];

  // Quality indicators
  if (activeRate > 80) qualityIndicators.push("High subscriber engagement");
  if (bounceRate < 5) qualityIndicators.push("Good email deliverability");
  if (complaintRate < 0.5) qualityIndicators.push("Low spam complaints");

  // Improvement areas
  if (bounceRate > 5) improvementAreas.push("Address email deliverability issues");
  if (complaintRate > 0.5) improvementAreas.push("Review content relevance and frequency");
  if (unconfirmedRate > 10) improvementAreas.push("Improve email confirmation process");
  if (activeRate < 60) improvementAreas.push("Implement re-engagement campaigns");

  return {
    health_score: Math.round(healthScore),
    quality_indicators: qualityIndicators,
    improvement_areas: improvementAreas
  };
}

export function identifyAutomationOptimizations(
  sequences: any[]
): Array<{
  sequence_id: number;
  optimization_type: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
}> {
  const optimizations = [];

  for (const sequence of sequences) {
    // Check for common optimization opportunities
    if (sequence.hold) {
      optimizations.push({
        sequence_id: sequence.id,
        optimization_type: "activation",
        impact: 'high' as const,
        description: "Sequence is currently paused - consider reactivating with updated content"
      });
    }

    if (sequence.name.toLowerCase().includes('welcome') && !sequence.repeat) {
      optimizations.push({
        sequence_id: sequence.id,
        optimization_type: "repeat_optimization",
        impact: 'medium' as const,
        description: "Welcome sequence could benefit from repeat settings for ongoing subscribers"
      });
    }

    // Content optimization opportunities
    if (!sequence.name.toLowerCase().includes('optimized')) {
      optimizations.push({
        sequence_id: sequence.id,
        optimization_type: "content_review",
        impact: 'high' as const,
        description: "Review sequence content for brand consistency and messaging optimization"
      });
    }
  }

  return optimizations;
}

export function calculateConversionPotential(
  formData: any,
  subscriberData: any
): {
  current_performance: number;
  optimization_potential: number;
  recommendations: string[];
} {
  const currentRate = formData.conversion_rate || 0;
  const industry_benchmark = 3.5; // Healthcare industry average
  
  const optimizationPotential = Math.max(0, industry_benchmark - currentRate);
  
  const recommendations: string[] = [];
  
  if (currentRate < 2) {
    recommendations.push("Test form placement and messaging for target audience");
    recommendations.push("Implement social proof elements relevant to your industry");
  }
  
  if (currentRate < industry_benchmark) {
    recommendations.push("A/B test value propositions specific to your audience needs");
    recommendations.push("Consider mobile-optimized forms for busy professionals");
  }

  recommendations.push("Highlight credibility factors and unique value proposition for your audience");

  return {
    current_performance: currentRate,
    optimization_potential: optimizationPotential,
    recommendations
  };
}