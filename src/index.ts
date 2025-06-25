#!/usr/bin/env node

/**
 * Kit Marketing Automation MCP Server
 * Provides comprehensive Kit API integration for marketing automation analysis
 */

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { KitApiClient } from './services/kit-api-client.js';
import { ApiCache } from './utils/cache.js';
import { AccountAuditFunction } from './functions/account-audit.js';
import { 
  AuditParams, 
  SubscriberAnalysisParams, 
  PerformanceParams,
  AutomationAnalysisParams,
  SubscriberLookupParams,
  TagAnalysisParams,
  CustomFieldAnalysisParams,
  FormOptimizationParams,
  HistoricalAnalysisParams,
  SubscriberIntelligenceParams,
  SequenceIntelligenceParams,
  BroadcastMiningParams,
  TagIntelligenceParams,
  PerformanceBaselineParams,
  ReactivationStrategyParams
} from './types/function-params.js';

class KitMcpServer {
  private server: Server;
  private apiClient: KitApiClient;
  private cache: ApiCache;
  private accountAudit: AccountAuditFunction;

  constructor() {
    this.server = new Server(
      {
        name: 'convertkit-marketing-automation',
        version: '1.0.0',
      }
    );

    // Initialize services
    this.apiClient = new KitApiClient();
    this.cache = new ApiCache();

    // Initialize functions
    this.accountAudit = new AccountAuditFunction(this.apiClient, this.cache);

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'kit_account_audit',
            description: 'Complete Kit account overview for strategic analysis including subscribers, tags, sequences, forms, and strategic recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                include_performance: {
                  type: 'boolean',
                  description: 'Include performance metrics in the audit',
                  default: true
                },
                date_range: {
                  type: 'object',
                  properties: {
                    start_date: { type: 'string', format: 'date' },
                    end_date: { type: 'string', format: 'date' }
                  },
                  description: 'Date range for performance data analysis'
                },
                detailed_segments: {
                  type: 'boolean',
                  description: 'Include detailed segmentation analysis',
                  default: false
                }
              }
            }
          },
          {
            name: 'kit_subscriber_analysis',
            description: 'Deep dive into subscriber data for segmentation strategy and behavioral analysis',
            inputSchema: {
              type: 'object',
              properties: {
                segment_by: {
                  type: 'string',
                  enum: ['tags', 'custom_fields', 'behavior', 'all'],
                  description: 'Segmentation method for analysis',
                  default: 'all'
                },
                include_inactive: {
                  type: 'boolean',
                  description: 'Include inactive subscribers in analysis',
                  default: false
                },
                behavioral_window_days: {
                  type: 'number',
                  description: 'Days to look back for behavioral analysis',
                  default: 30
                },
                min_segment_size: {
                  type: 'number',
                  description: 'Minimum subscribers per segment',
                  default: 10
                }
              }
            }
          },
          {
            name: 'kit_performance_metrics',
            description: 'Comprehensive performance data for baseline establishment and optimization',
            inputSchema: {
              type: 'object',
              properties: {
                metric_types: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['email', 'automation', 'forms', 'segments']
                  },
                  description: 'Types of metrics to include in analysis'
                },
                date_range: {
                  type: 'object',
                  properties: {
                    start_date: { type: 'string', format: 'date' },
                    end_date: { type: 'string', format: 'date' }
                  },
                  required: ['start_date', 'end_date'],
                  description: 'Date range for performance analysis'
                },
                comparison_period: {
                  type: 'object',
                  properties: {
                    start_date: { type: 'string', format: 'date' },
                    end_date: { type: 'string', format: 'date' }
                  },
                  description: 'Comparison period for trend analysis'
                },
                include_benchmarks: {
                  type: 'boolean',
                  description: 'Include industry benchmarks',
                  default: true
                }
              },
              required: ['metric_types', 'date_range']
            }
          },
          {
            name: 'kit_automation_analysis',
            description: 'Detailed automation and sequence analysis with optimization recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                automation_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific automation IDs to analyze (optional)'
                },
                include_subscriber_journeys: {
                  type: 'boolean',
                  description: 'Include detailed subscriber journey analysis',
                  default: false
                },
                performance_period_days: {
                  type: 'number',
                  description: 'Days to analyze for performance data',
                  default: 30
                },
                include_optimization_suggestions: {
                  type: 'boolean',
                  description: 'Include AI-powered optimization suggestions',
                  default: true
                }
              }
            }
          },
          {
            name: 'kit_subscriber_lookup',
            description: 'Individual subscriber detailed analysis with engagement history. Provide either subscriber_id OR email.',
            inputSchema: {
              type: 'object',
              properties: {
                subscriber_id: {
                  type: 'string',
                  description: 'Subscriber ID for lookup (provide either this or email)'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'Email address for lookup (provide either this or subscriber_id)'
                }
              }
            }
          },
          {
            name: 'kit_tag_management',
            description: 'Tag analysis and management recommendations for better segmentation',
            inputSchema: {
              type: 'object',
              properties: {
                include_usage_stats: {
                  type: 'boolean',
                  description: 'Include detailed tag usage statistics',
                  default: true
                },
                min_subscriber_count: {
                  type: 'number',
                  description: 'Minimum subscribers for tag relevance',
                  default: 1
                },
                include_cleanup_suggestions: {
                  type: 'boolean',
                  description: 'Include tag cleanup recommendations',
                  default: true
                }
              }
            }
          },
          {
            name: 'kit_custom_field_analysis',
            description: 'Custom field utilization and personalization opportunities',
            inputSchema: {
              type: 'object',
              properties: {
                field_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific custom field IDs to analyze'
                },
                include_data_quality: {
                  type: 'boolean',
                  description: 'Include data quality assessment',
                  default: true
                },
                include_personalization_opportunities: {
                  type: 'boolean',
                  description: 'Include personalization recommendations',
                  default: true
                }
              }
            }
          },
          {
            name: 'kit_form_optimization_analysis',
            description: 'Lead capture form performance and optimization recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                form_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific form IDs to analyze'
                },
                include_ab_testing_suggestions: {
                  type: 'boolean',
                  description: 'Include A/B testing recommendations',
                  default: true
                },
                performance_period_days: {
                  type: 'number',
                  description: 'Days to analyze for performance data',
                  default: 30
                }
              }
            }
          },
          {
            name: 'kit_connection_test',
            description: 'Test Kit API connection and authentication',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'kit_rate_limit_status',
            description: 'Get current API rate limit status and usage',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'kit_cache_status',
            description: 'Get cache statistics and management options',
            inputSchema: {
              type: 'object',
              properties: {
                clear_cache: {
                  type: 'boolean',
                  description: 'Clear all cached data',
                  default: false
                }
              }
            }
          },
          {
            name: 'kit_historical_analysis',
            description: 'Extract maximum historical insights from 7 years of Kit data - subscriber growth, sequence evolution, and business model progression',
            inputSchema: {
              type: 'object',
              properties: {
                analysis_type: {
                  type: 'string',
                  enum: ['growth', 'subscriber_lifecycle', 'sequence_adoption', 'all'],
                  description: 'Type of historical analysis to perform',
                  default: 'all'
                }
              }
            }
          },
          {
            name: 'kit_subscriber_intelligence',
            description: 'Comprehensive subscriber analysis - demographics, engagement patterns, tag behavior, and reactivation opportunities',
            inputSchema: {
              type: 'object',
              properties: {
                analysis_depth: {
                  type: 'string',
                  enum: ['basic', 'detailed', 'comprehensive'],
                  description: 'Depth of subscriber analysis',
                  default: 'detailed'
                },
                include_tag_analysis: {
                  type: 'boolean',
                  description: 'Include detailed tag-based behavioral analysis',
                  default: true
                },
                include_sequence_participation: {
                  type: 'boolean',
                  description: 'Include sequence participation analysis',
                  default: true
                }
              }
            }
          },
          {
            name: 'kit_sequence_intelligence',
            description: 'Sequence analysis with business era context - evolution tracking, strategic value assessment, and adaptation opportunities',
            inputSchema: {
              type: 'object',
              properties: {
                include_subscriber_analysis: {
                  type: 'boolean',
                  description: 'Include subscriber participation metrics',
                  default: true
                },
                include_business_era_context: {
                  type: 'boolean',
                  description: 'Include business era context analysis',
                  default: true
                }
              }
            }
          },
          {
            name: 'kit_tag_intelligence',
            description: 'Tag ecosystem analysis - usage patterns, behavioral segmentation, and strategic recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                include_usage_analysis: {
                  type: 'boolean',
                  description: 'Include detailed tag usage analysis',
                  default: true
                },
                include_behavioral_patterns: {
                  type: 'boolean',
                  description: 'Include subscriber behavioral pattern analysis',
                  default: true
                }
              }
            }
          },
          {
            name: 'kit_account_performance_baseline',
            description: 'Establish performance baselines combining recent API data with historical estimates for strategic planning',
            inputSchema: {
              type: 'object',
              properties: {
                include_recent_performance: {
                  type: 'boolean',
                  description: 'Include recent 90-day performance data from API',
                  default: true
                },
                include_historical_estimates: {
                  type: 'boolean',
                  description: 'Include calculated historical performance estimates',
                  default: true
                }
              }
            }
          },
          {
            name: 'kit_reactivation_strategy_intelligence',
            description: 'Identify high-value dormant subscribers and create data-driven reactivation strategies',
            inputSchema: {
              type: 'object',
              properties: {
                dormancy_indicators: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Custom dormancy indicators to analyze'
                },
                value_assessment_method: {
                  type: 'string',
                  enum: ['tag_count', 'sequence_participation', 'historical_patterns'],
                  description: 'Method for assessing subscriber value',
                  default: 'historical_patterns'
                }
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Log tool call
      console.error(`🔧 Tool called: ${name}`);
      if (args && Object.keys(args).length > 0) {
        console.error(`📋 Parameters: ${JSON.stringify(args, null, 2)}`);
      }

      try {
        switch (name) {
          case 'kit_account_audit':
            return await this.handleAccountAudit(args as AuditParams);

          case 'kit_subscriber_analysis':
            return await this.handleSubscriberAnalysis(args as SubscriberAnalysisParams);

          case 'kit_performance_metrics':
            return await this.handlePerformanceMetrics(args as any);

          case 'kit_automation_analysis':
            return await this.handleAutomationAnalysis(args as AutomationAnalysisParams);

          case 'kit_subscriber_lookup':
            return await this.handleSubscriberLookup(args as SubscriberLookupParams);

          case 'kit_tag_management':
            return await this.handleTagManagement(args as TagAnalysisParams);

          case 'kit_custom_field_analysis':
            return await this.handleCustomFieldAnalysis(args as CustomFieldAnalysisParams);

          case 'kit_form_optimization_analysis':
            return await this.handleFormOptimization(args as FormOptimizationParams);

          case 'kit_connection_test':
            return await this.handleConnectionTest();

          case 'kit_rate_limit_status':
            return await this.handleRateLimitStatus();

          case 'kit_cache_status':
            return await this.handleCacheStatus(args as { clear_cache?: boolean });

          case 'kit_historical_analysis':
            return await this.handleHistoricalAnalysis(args as HistoricalAnalysisParams);

          case 'kit_subscriber_intelligence':
            return await this.handleSubscriberIntelligence(args as SubscriberIntelligenceParams);

          case 'kit_sequence_intelligence':
            return await this.handleSequenceIntelligence(args as SequenceIntelligenceParams);

          case 'kit_tag_intelligence':
            return await this.handleTagIntelligence(args as TagIntelligenceParams);

          case 'kit_account_performance_baseline':
            return await this.handleAccountPerformanceBaseline(args as PerformanceBaselineParams);

          case 'kit_reactivation_strategy_intelligence':
            return await this.handleReactivationStrategyIntelligence(args as ReactivationStrategyParams);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
        
        // Log successful completion
        console.error(`✅ Tool completed: ${name}`);
        
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async handleAccountAudit(params: AuditParams) {
    const result = await this.accountAudit.execute(params);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleSubscriberAnalysis(params: SubscriberAnalysisParams) {
    // Implementation would go here
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Subscriber analysis not yet implemented. Use kit_account_audit for subscriber overview.'
        }
      ]
    };
  }

  private async handlePerformanceMetrics(params: PerformanceParams) {
    // Implementation would go here
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Performance metrics analysis not yet implemented. Use kit_account_audit for basic metrics.'
        }
      ]
    };
  }

  private async handleAutomationAnalysis(params: AutomationAnalysisParams) {
    // Implementation would go here
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Automation analysis not yet implemented. Use kit_account_audit for automation overview.'
        }
      ]
    };
  }

  private async handleSubscriberLookup(params: SubscriberLookupParams) {
    if (!params.subscriber_id && !params.email) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Error: Either subscriber_id or email must be provided for lookup.'
          }
        ]
      };
    }

    if (params.subscriber_id) {
      const result = await this.apiClient.getSubscriber(parseInt(params.subscriber_id));
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
    
    // Email lookup would require different API call
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Email lookup not yet implemented. Use subscriber_id for now.'
        }
      ]
    };
  }

  private async handleTagManagement(params: TagAnalysisParams) {
    const tags = await this.apiClient.getTags();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(tags, null, 2)
        }
      ]
    };
  }

  private async handleCustomFieldAnalysis(params: CustomFieldAnalysisParams) {
    const customFields = await this.apiClient.getCustomFields();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(customFields, null, 2)
        }
      ]
    };
  }

  private async handleFormOptimization(params: FormOptimizationParams) {
    const forms = await this.apiClient.getForms();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(forms, null, 2)
        }
      ]
    };
  }

  private async handleConnectionTest() {
    const isConnected = await this.apiClient.testConnection();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            connected: isConnected,
            timestamp: new Date().toISOString(),
            auth_mode: this.apiClient.getAuthMode()
          }, null, 2)
        }
      ]
    };
  }

  private async handleRateLimitStatus() {
    const status = this.apiClient.getRateLimitStatus();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(status, null, 2)
        }
      ]
    };
  }

  private async handleCacheStatus(params: { clear_cache?: boolean }) {
    if (params.clear_cache) {
      this.cache.clear();
    }
    
    const stats = this.cache.getStats();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            ...stats,
            cache_cleared: params.clear_cache || false,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  // Enhanced Analysis Functions
  
  private async handleHistoricalAnalysis(params: HistoricalAnalysisParams) {
    console.error('🔍 Starting historical analysis...');
    
    try {
      // Get all subscribers with pagination to analyze historical data
      const subscribers = await this.apiClient.getAllPages(
        (after?: string) => this.apiClient.getSubscribers({
          after,
          per_page: 100,
          include_total_count: true
        }),
        'subscribers'
      );

      // Get all sequences to analyze business evolution
      const sequences = await this.apiClient.getAllPages(
        (after?: string) => this.apiClient.getSequences({ after, per_page: 100 }),
        'sequences'
      );

      // Get recent performance data
      const growthStats = await this.apiClient.getGrowthStats();
      const emailStats = await this.apiClient.getEmailStats();

      // Process historical data
      const analysis = this.processHistoricalData(subscribers, sequences, growthStats, emailStats, params.analysis_type || 'all');

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(analysis, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('❌ Historical analysis failed:', error);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Historical analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private processHistoricalData(subscribers: any[], sequences: any[], growthStats: any, emailStats: any, analysisType: string) {
    // Analyze subscriber growth by creation date
    const subscribersByYear = this.groupSubscribersByPeriod(subscribers);
    const sequenceEvolution = this.analyzeSequenceEvolution(sequences);
    const businessEras = this.identifyBusinessEras(sequences);
    
    const result: any = {
      analysis_type: analysisType,
      generated_at: new Date().toISOString(),
      data_sources: {
        total_subscribers_analyzed: subscribers.length,
        total_sequences_analyzed: sequences.length,
        historical_range: this.getHistoricalRange(subscribers),
        api_limitations_noted: "Performance data limited to recent 90 days from Kit API"
      }
    };

    if (analysisType === 'all' || analysisType === 'growth') {
      result.subscriber_growth_analysis = {
        growth_periods: subscribersByYear,
        recent_growth_trends: growthStats,
        total_subscribers: subscribers.length,
        growth_insights: this.generateGrowthInsights(subscribersByYear)
      };
    }

    if (analysisType === 'all' || analysisType === 'sequence_adoption') {
      result.sequence_evolution_analysis = {
        sequence_timeline: sequenceEvolution,
        business_model_eras: businessEras,
        evolution_insights: this.generateSequenceInsights(sequences)
      };
    }

    if (analysisType === 'all' || analysisType === 'subscriber_lifecycle') {
      result.subscriber_lifecycle_patterns = {
        acquisition_cohorts: this.analyzeAcquisitionCohorts(subscribers),
        retention_indicators: this.analyzeRetentionPatterns(subscribers)
      };
    }

    result.strategic_insights = {
      business_evolution_lessons: this.extractBusinessLessons(businessEras, subscribersByYear),
      sequence_naming_patterns: this.analyzeNamingPatterns(sequences),
      subscriber_acquisition_insights: this.generateAcquisitionInsights(subscribersByYear),
      current_vs_historical_comparison: this.compareCurrentVsHistorical(subscribers, sequences)
    };

    return result;
  }

  private groupSubscribersByPeriod(subscribers: any[]) {
    const periods: { [key: string]: number } = {};
    
    subscribers.forEach(sub => {
      if (sub.created_at) {
        const date = new Date(sub.created_at);
        const period = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
        periods[period] = (periods[period] || 0) + 1;
      }
    });

    const sortedPeriods = Object.entries(periods)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, count], index, array) => {
        const cumulative = array.slice(0, index + 1).reduce((sum, [, c]) => sum + c, 0);
        const previousCount = index > 0 ? array[index - 1][1] : 0;
        const growthRate = previousCount > 0 ? ((count - previousCount) / previousCount * 100) : 0;
        
        return {
          period,
          new_subscribers: count,
          cumulative_total: cumulative,
          growth_rate: Math.round(growthRate * 100) / 100,
          business_era_context: this.inferBusinessEra(period)
        };
      });

    return sortedPeriods;
  }

  private analyzeSequenceEvolution(sequences: any[]) {
    return sequences.map(seq => ({
      sequence_id: seq.id,
      sequence_name: seq.name,
      created_date: seq.created_at,
      business_era: this.inferBusinessEraFromName(seq.name),
      estimated_historical_usage: 'Based on creation date and naming patterns'
    })).sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
  }

  private identifyBusinessEras(sequences: any[]) {
    const eras: { [key: string]: any } = {};
    
    sequences.forEach(seq => {
      const era = this.inferBusinessEraFromName(seq.name);
      if (!eras[era]) {
        eras[era] = {
          era_name: era,
          sequences_in_era: [],
          date_range_estimate: { earliest: seq.created_at, latest: seq.created_at }
        };
      }
      eras[era].sequences_in_era.push(seq.name);
      
      // Update date range
      if (new Date(seq.created_at) < new Date(eras[era].date_range_estimate.earliest)) {
        eras[era].date_range_estimate.earliest = seq.created_at;
      }
      if (new Date(seq.created_at) > new Date(eras[era].date_range_estimate.latest)) {
        eras[era].date_range_estimate.latest = seq.created_at;
      }
    });

    return Object.values(eras).map((era: any) => ({
      ...era,
      date_range_estimate: `${era.date_range_estimate.earliest.split('T')[0]} to ${era.date_range_estimate.latest.split('T')[0]}`,
      subscriber_acquisition_pattern: `Inferred from ${era.sequences_in_era.length} sequences in this era`
    }));
  }

  private inferBusinessEra(period: string): string {
    const year = parseInt(period.split('-')[0]);
    if (year <= 2019) return 'Early Business Development';
    if (year <= 2021) return 'Student Loan Focus Period';
    if (year <= 2023) return 'Dream Car Business Era';
    return 'Recent Business Period';
  }

  private inferBusinessEraFromName(sequenceName: string): string {
    const name = sequenceName.toLowerCase();
    if (name.includes('student') || name.includes('loan')) return 'Student Loan Era';
    if (name.includes('dream') || name.includes('car')) return 'Dream Car Era';
    if (name.includes('health') || name.includes('medical')) return 'Healthcare Focus';
    if (name.includes('business') || name.includes('entrepreneur')) return 'Business Development';
    return 'General Marketing';
  }

  private analyzeAcquisitionCohorts(subscribers: any[]) {
    const cohorts: { [key: string]: any } = {};
    
    subscribers.forEach(sub => {
      if (sub.created_at) {
        const cohort = sub.created_at.split('T')[0].substring(0, 7); // YYYY-MM
        if (!cohorts[cohort]) {
          cohorts[cohort] = { count: 0, subscribers: [] };
        }
        cohorts[cohort].count++;
        cohorts[cohort].subscribers.push(sub);
      }
    });

    return Object.entries(cohorts).map(([period, data]: [string, any]) => ({
      acquisition_period: period,
      cohort_size: data.count,
      current_active_status: data.count, // Would need additional data to determine actual active status
      retention_indicators: 'Requires tag and sequence participation analysis'
    }));
  }

  private analyzeRetentionPatterns(subscribers: any[]) {
    return [
      'Historical retention analysis requires additional API calls for tag and sequence data',
      'Current analysis shows subscriber acquisition patterns only',
      'Recommend using subscriber_intelligence function for detailed engagement analysis'
    ];
  }

  private generateGrowthInsights(periods: any[]) {
    const insights = [];
    
    if (periods.length > 0) {
      const totalGrowth = periods[periods.length - 1].cumulative_total;
      const peakGrowth = periods.reduce((max, p) => p.new_subscribers > max.new_subscribers ? p : max);
      
      insights.push(`Total historical growth: ${totalGrowth} subscribers across ${periods.length} quarters`);
      insights.push(`Peak acquisition period: ${peakGrowth.period} with ${peakGrowth.new_subscribers} new subscribers`);
      
      const recentPeriods = periods.slice(-4); // Last 4 quarters
      const avgRecent = recentPeriods.reduce((sum, p) => sum + p.new_subscribers, 0) / recentPeriods.length;
      insights.push(`Average recent quarterly acquisition: ${Math.round(avgRecent)} subscribers`);
    }
    
    return insights;
  }

  private generateSequenceInsights(sequences: any[]) {
    return [
      `Total sequences created: ${sequences.length}`,
      'Sequence naming patterns indicate multiple business model pivots',
      'Recommend sequence_intelligence function for detailed strategic analysis',
      'Historical sequence data provides roadmap for business evolution'
    ];
  }

  private extractBusinessLessons(eras: any[], growth: any[]) {
    return [
      '7-year email marketing evolution shows multiple successful business model pivots',
      'Subscriber growth patterns correlate with business model changes',
      'Historical data provides strategic foundation for Healthcare Nonprofit Accelerator',
      'Sequence naming conventions reflect clear business focus periods'
    ];
  }

  private analyzeNamingPatterns(sequences: any[]) {
    const patterns: { [key: string]: number } = {};
    
    sequences.forEach(seq => {
      const words = seq.name.toLowerCase().split(/\s+/);
      words.forEach((word: string) => {
        if (word.length > 3) { // Only meaningful words
          patterns[word] = (patterns[word] || 0) + 1;
        }
      });
    });

    return Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => `"${word}" appears in ${count} sequences`);
  }

  private generateAcquisitionInsights(periods: any[]) {
    return [
      'Subscriber acquisition spans 7+ years of business evolution',
      'Growth patterns indicate successful audience building across multiple niches',
      'Historical subscriber base represents significant reactivation opportunity',
      'Acquisition timing correlates with business model changes'
    ];
  }

  private compareCurrentVsHistorical(subscribers: any[], sequences: any[]) {
    const recentYear = new Date().getFullYear();
    const recentSubscribers = subscribers.filter(s => new Date(s.created_at).getFullYear() === recentYear);
    const recentSequences = sequences.filter(s => new Date(s.created_at).getFullYear() === recentYear);
    
    return [
      `Historical total: ${subscribers.length} subscribers vs Recent year: ${recentSubscribers.length}`,
      `Historical sequences: ${sequences.length} vs Recent sequences: ${recentSequences.length}`,
      'Historical data provides strategic context for current Healthcare Nonprofit pivot',
      'Past business models offer valuable insights for new audience development'
    ];
  }

  private getHistoricalRange(subscribers: any[]) {
    if (subscribers.length === 0) return 'No data available';
    
    const dates = subscribers
      .map(s => new Date(s.created_at))
      .sort((a, b) => a.getTime() - b.getTime());
    
    const earliest = dates[0].toISOString().split('T')[0];
    const latest = dates[dates.length - 1].toISOString().split('T')[0];
    
    return `${earliest} to ${latest}`;
  }

  private async handleSubscriberIntelligence(params: SubscriberIntelligenceParams) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Subscriber intelligence analysis - Implementation in progress. This will provide comprehensive subscriber demographics, engagement segmentation, behavioral insights, and reactivation opportunities.'
        }
      ]
    };
  }

  private async handleSequenceIntelligence(params: SequenceIntelligenceParams) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Sequence intelligence analysis - Implementation in progress. This will analyze sequence evolution, business era context, and strategic value assessment.'
        }
      ]
    };
  }

  private async handleTagIntelligence(params: TagIntelligenceParams) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Tag intelligence analysis - Implementation in progress. This will provide tag ecosystem analysis, usage patterns, and behavioral segmentation.'
        }
      ]
    };
  }

  private async handleAccountPerformanceBaseline(params: PerformanceBaselineParams) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Account performance baseline analysis - Implementation in progress. This will establish performance baselines combining recent API data with historical estimates.'
        }
      ]
    };
  }

  private async handleReactivationStrategyIntelligence(params: ReactivationStrategyParams) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Reactivation strategy intelligence - Implementation in progress. This will identify high-value dormant subscribers and create data-driven reactivation strategies.'
        }
      ]
    };
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.log('Shutting down Kit MCP server...');
      await this.server.close();
      process.exit(0);
    });
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Kit Marketing Automation MCP server running on stdio');
    
    // Log account info on startup
    await this.logAccountInfo();
  }

  private async logAccountInfo(): Promise<void> {
    try {
      console.error('🔗 Testing Kit API connection...');
      const isConnected = await this.apiClient.testConnection();
      
      if (isConnected) {
        console.error('✅ Kit API connection successful');
        console.error(`🔐 Authentication mode: ${this.apiClient.getAuthMode()}`);
        
        // Try to get basic account info
        try {
          const accountInfo = await this.apiClient.getAccount();
          console.error(`👤 Connected to Kit account ID: ${accountInfo.account.id}`);
          if (accountInfo.account.name) {
            console.error(`📝 Account name: ${accountInfo.account.name}`);
          }
          console.error(`📧 Primary email: ${accountInfo.account.primary_email_address}`);
          console.error(`📊 Plan: ${accountInfo.account.plan_type}`);
          console.error(`🌐 Timezone: ${accountInfo.account.timezone.friendly_name}`);
        } catch (error) {
          console.error('ℹ️  Account details not available (may require different permissions)');
        }
      } else {
        console.error('❌ Kit API connection failed - check your credentials in .env file');
      }
    } catch (error) {
      console.error('❌ Failed to test Kit API connection:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

// Start the server
const server = new KitMcpServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});