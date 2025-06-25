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
  FormOptimizationParams
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
            description: 'Individual subscriber detailed analysis with engagement history',
            inputSchema: {
              type: 'object',
              properties: {
                subscriber_id: {
                  type: 'string',
                  description: 'Subscriber ID for lookup'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'Email address for lookup'
                }
              },
              oneOf: [
                { required: ['subscriber_id'] },
                { required: ['email'] }
              ]
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
          console.error(`👤 Connected to Kit account: ${accountInfo.name || 'Unknown'}`);
          if (accountInfo.email_address) {
            console.error(`📧 Primary email: ${accountInfo.email_address}`);
          }
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