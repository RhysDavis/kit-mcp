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

class KitMcpServer {
  private server: Server;
  private apiClient: KitApiClient;
  private cache: ApiCache;

  constructor() {
    this.server = new Server(
      {
        name: 'kit-marketing-automation',
        version: '2.0.0',
      }
    );

    // Initialize services
    this.apiClient = new KitApiClient();
    this.cache = new ApiCache();

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Account Operations
          {
            name: 'kit_get_account',
            description: 'Get current account details',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'kit_get_email_stats',
            description: 'Get email statistics for the account',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'kit_get_growth_stats',
            description: 'Get growth statistics for the account',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'kit_get_creator_profile',
            description: 'Get creator profile information',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },

          // Subscriber Operations
          {
            name: 'kit_get_subscribers',
            description: 'Get paginated list of subscribers',
            inputSchema: {
              type: 'object',
              properties: {
                after: { type: 'string', description: 'Cursor for pagination' },
                before: { type: 'string', description: 'Cursor for pagination' },
                per_page: { type: 'number', description: 'Number per page (max 100)', default: 50 },
                include_total_count: { type: 'boolean', description: 'Include total count', default: false }
              }
            }
          },
          {
            name: 'kit_get_subscriber',
            description: 'Get a specific subscriber by ID',
            inputSchema: {
              type: 'object',
              properties: {
                subscriber_id: { type: 'string', description: 'Subscriber ID' }
              },
              required: ['subscriber_id']
            }
          },
          {
            name: 'kit_create_subscriber',
            description: 'Create a new subscriber',
            inputSchema: {
              type: 'object',
              properties: {
                email_address: { type: 'string', format: 'email', description: 'Email address' },
                first_name: { type: 'string', description: 'First name' },
                state: { type: 'string', enum: ['active', 'inactive'], description: 'Subscriber state' }
              },
              required: ['email_address']
            }
          },
          {
            name: 'kit_update_subscriber',
            description: 'Update a subscriber',
            inputSchema: {
              type: 'object',
              properties: {
                subscriber_id: { type: 'string', description: 'Subscriber ID' },
                email_address: { type: 'string', format: 'email', description: 'New email' },
                first_name: { type: 'string', description: 'First name' }
              },
              required: ['subscriber_id']
            }
          },
          {
            name: 'kit_unsubscribe',
            description: 'Unsubscribe a subscriber by ID',
            inputSchema: {
              type: 'object',
              properties: {
                subscriber_id: { type: 'string', description: 'Subscriber ID' }
              },
              required: ['subscriber_id']
            }
          },
          {
            name: 'kit_get_subscriber_tags',
            description: 'Get tags for a specific subscriber',
            inputSchema: {
              type: 'object',
              properties: {
                subscriber_id: { type: 'string', description: 'Subscriber ID' }
              },
              required: ['subscriber_id']
            }
          },

          // Tag Operations
          {
            name: 'kit_get_tags',
            description: 'Get paginated list of tags',
            inputSchema: {
              type: 'object',
              properties: {
                after: { type: 'string', description: 'Cursor for pagination' },
                before: { type: 'string', description: 'Cursor for pagination' },
                per_page: { type: 'number', description: 'Number per page (max 100)', default: 50 },
                include_total_count: { type: 'boolean', description: 'Include total count', default: false }
              }
            }
          },
          {
            name: 'kit_create_tag',
            description: 'Create a new tag',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Tag name' }
              },
              required: ['name']
            }
          },
          {
            name: 'kit_get_tag_subscribers',
            description: 'Get subscribers for a specific tag',
            inputSchema: {
              type: 'object',
              properties: {
                tag_id: { type: 'string', description: 'Tag ID' },
                after: { type: 'string', description: 'Cursor for pagination' },
                before: { type: 'string', description: 'Cursor for pagination' },
                per_page: { type: 'number', description: 'Number per page', default: 50 }
              },
              required: ['tag_id']
            }
          },
          {
            name: 'kit_tag_subscriber',
            description: 'Add tag to a subscriber',
            inputSchema: {
              type: 'object',
              properties: {
                tag_ids: { type: 'array', items: { type: 'number' }, description: 'Tag IDs' },
                subscriber_ids: { type: 'array', items: { type: 'number' }, description: 'Subscriber IDs' }
              },
              required: ['tag_ids', 'subscriber_ids']
            }
          },
          {
            name: 'kit_untag_subscriber',
            description: 'Remove tag from a subscriber',
            inputSchema: {
              type: 'object',
              properties: {
                tag_ids: { type: 'array', items: { type: 'number' }, description: 'Tag IDs' },
                subscriber_ids: { type: 'array', items: { type: 'number' }, description: 'Subscriber IDs' }
              },
              required: ['tag_ids', 'subscriber_ids']
            }
          },

          // Sequence Operations
          {
            name: 'kit_get_sequences',
            description: 'Get paginated list of sequences',
            inputSchema: {
              type: 'object',
              properties: {
                after: { type: 'string', description: 'Cursor for pagination' },
                before: { type: 'string', description: 'Cursor for pagination' },
                per_page: { type: 'number', description: 'Number per page (max 100)', default: 50 },
                include_total_count: { type: 'boolean', description: 'Include total count', default: false }
              }
            }
          },
          {
            name: 'kit_get_sequence_subscribers',
            description: 'Get subscribers in a specific sequence',
            inputSchema: {
              type: 'object',
              properties: {
                sequence_id: { type: 'string', description: 'Sequence ID' },
                after: { type: 'string', description: 'Cursor for pagination' },
                before: { type: 'string', description: 'Cursor for pagination' },
                per_page: { type: 'number', description: 'Number per page', default: 50 }
              },
              required: ['sequence_id']
            }
          },

          // Form Operations
          {
            name: 'kit_get_forms',
            description: 'Get paginated list of forms',
            inputSchema: {
              type: 'object',
              properties: {
                after: { type: 'string', description: 'Cursor for pagination' },
                before: { type: 'string', description: 'Cursor for pagination' },
                per_page: { type: 'number', description: 'Number per page (max 100)', default: 50 },
                include_total_count: { type: 'boolean', description: 'Include total count', default: false }
              }
            }
          },
          {
            name: 'kit_get_form_subscribers',
            description: 'Get subscribers for a specific form',
            inputSchema: {
              type: 'object',
              properties: {
                form_id: { type: 'string', description: 'Form ID' },
                after: { type: 'string', description: 'Cursor for pagination' },
                before: { type: 'string', description: 'Cursor for pagination' },
                per_page: { type: 'number', description: 'Number per page', default: 50 }
              },
              required: ['form_id']
            }
          },

          // Broadcast Operations
          {
            name: 'kit_get_broadcasts',
            description: 'Get paginated list of broadcasts',
            inputSchema: {
              type: 'object',
              properties: {
                after: { type: 'string', description: 'Cursor for pagination' },
                before: { type: 'string', description: 'Cursor for pagination' },
                per_page: { type: 'number', description: 'Number per page (max 100)', default: 50 },
                include_total_count: { type: 'boolean', description: 'Include total count', default: false }
              }
            }
          },
          {
            name: 'kit_get_broadcast',
            description: 'Get a specific broadcast',
            inputSchema: {
              type: 'object',
              properties: {
                broadcast_id: { type: 'string', description: 'Broadcast ID' }
              },
              required: ['broadcast_id']
            }
          },
          {
            name: 'kit_get_broadcast_stats',
            description: 'Get stats for a specific broadcast',
            inputSchema: {
              type: 'object',
              properties: {
                broadcast_id: { type: 'string', description: 'Broadcast ID' }
              },
              required: ['broadcast_id']
            }
          },
          {
            name: 'kit_get_broadcast_clicks',
            description: 'Get link clicks for a broadcast',
            inputSchema: {
              type: 'object',
              properties: {
                broadcast_id: { type: 'string', description: 'Broadcast ID' }
              },
              required: ['broadcast_id']
            }
          },

          // Custom Fields
          {
            name: 'kit_get_custom_fields',
            description: 'Get list of custom fields',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },

          // Utility Operations
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
          // Account Operations
          case 'kit_get_account':
            return await this.handleGetAccount();
          case 'kit_get_email_stats':
            return await this.handleGetEmailStats();
          case 'kit_get_growth_stats':
            return await this.handleGetGrowthStats();
          case 'kit_get_creator_profile':
            return await this.handleGetCreatorProfile();

          // Subscriber Operations
          case 'kit_get_subscribers':
            return await this.handleGetSubscribers(args as any);
          case 'kit_get_subscriber':
            return await this.handleGetSubscriber(args as any);
          case 'kit_create_subscriber':
            return await this.handleCreateSubscriber(args as any);
          case 'kit_update_subscriber':
            return await this.handleUpdateSubscriber(args as any);
          case 'kit_unsubscribe':
            return await this.handleUnsubscribe(args as any);
          case 'kit_get_subscriber_tags':
            return await this.handleGetSubscriberTags(args as any);

          // Tag Operations
          case 'kit_get_tags':
            return await this.handleGetTags(args as any);
          case 'kit_create_tag':
            return await this.handleCreateTag(args as any);
          case 'kit_get_tag_subscribers':
            return await this.handleGetTagSubscribers(args as any);
          case 'kit_tag_subscriber':
            return await this.handleTagSubscriber(args as any);
          case 'kit_untag_subscriber':
            return await this.handleUntagSubscriber(args as any);

          // Sequence Operations
          case 'kit_get_sequences':
            return await this.handleGetSequences(args as any);
          case 'kit_get_sequence_subscribers':
            return await this.handleGetSequenceSubscribers(args as any);

          // Form Operations
          case 'kit_get_forms':
            return await this.handleGetForms(args as any);
          case 'kit_get_form_subscribers':
            return await this.handleGetFormSubscribers(args as any);

          // Broadcast Operations
          case 'kit_get_broadcasts':
            return await this.handleGetBroadcasts(args as any);
          case 'kit_get_broadcast':
            return await this.handleGetBroadcast(args as any);
          case 'kit_get_broadcast_stats':
            return await this.handleGetBroadcastStats(args as any);
          case 'kit_get_broadcast_clicks':
            return await this.handleGetBroadcastClicks(args as any);

          // Custom Fields
          case 'kit_get_custom_fields':
            return await this.handleGetCustomFields(args as any);

          // Utility Operations
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

  // Account Operations
  private async handleGetAccount() {
    const result = await this.apiClient.getAccount();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetEmailStats() {
    const result = await this.apiClient.getEmailStats();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetGrowthStats() {
    const result = await this.apiClient.getGrowthStats();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetCreatorProfile() {
    const result = await this.apiClient.getCreatorProfile();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Subscriber Operations
  private async handleGetSubscribers(params: any) {
    try {
      const result = await this.apiClient.getSubscribers({
        after: params.after,
        before: params.before,
        per_page: params.per_page || 50,
        include_total_count: params.include_total_count || false
      });
      
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Get subscribers failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private async handleGetSubscriber(params: any) {
    if (!params.subscriber_id) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Error: subscriber_id is required'
          }
        ]
      };
    }

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

  private async handleCreateSubscriber(params: any) {
    const result = await this.apiClient.createSubscribers([{
      email_address: params.email_address,
      first_name: params.first_name,
      state: params.state
    }]);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleUpdateSubscriber(params: any) {
    // Note: Kit API client would need an update method
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Update subscriber not yet implemented in API client'
        }
      ]
    };
  }

  private async handleUnsubscribe(params: any) {
    // Note: Kit API client would need an unsubscribe method
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Unsubscribe not yet implemented in API client'
        }
      ]
    };
  }

  private async handleGetSubscriberTags(params: any) {
    if (!params.subscriber_id) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Error: subscriber_id is required'
          }
        ]
      };
    }

    const result = await this.apiClient.getSubscriberTags(parseInt(params.subscriber_id));
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Tag Operations
  private async handleGetTags(params: any) {
    try {
      const result = await this.apiClient.getTags({
        after: params.after,
        before: params.before,
        per_page: params.per_page || 50,
        include_total_count: params.include_total_count || false
      });
      
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Get tags failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private async handleCreateTag(params: any) {
    const result = await this.apiClient.createTags([{ name: params.name }]);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetTagSubscribers(params: any) {
    const result = await this.apiClient.getTagSubscribers(parseInt(params.tag_id), {
      after: params.after,
      before: params.before,
      per_page: params.per_page || 50
    });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleTagSubscriber(params: any) {
    const result = await this.apiClient.bulkTagSubscribers({
      tag_ids: params.tag_ids,
      subscriber_ids: params.subscriber_ids
    });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleUntagSubscriber(params: any) {
    const result = await this.apiClient.bulkUntagSubscribers({
      tag_ids: params.tag_ids,
      subscriber_ids: params.subscriber_ids
    });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Sequence Operations
  private async handleGetSequences(params: any) {
    try {
      const result = await this.apiClient.getSequences({
        after: params.after,
        before: params.before,
        per_page: params.per_page || 50,
        include_total_count: params.include_total_count || false
      });
      
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Get sequences failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private async handleGetSequenceSubscribers(params: any) {
    const result = await this.apiClient.getSequenceSubscribers(parseInt(params.sequence_id), {
      after: params.after,
      before: params.before,
      per_page: params.per_page || 50
    });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Form Operations
  private async handleGetForms(params: any) {
    try {
      const result = await this.apiClient.getForms({
        after: params.after,
        before: params.before,
        per_page: params.per_page || 50,
        include_total_count: params.include_total_count || false
      });
      
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Get forms failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private async handleGetFormSubscribers(params: any) {
    const result = await this.apiClient.getFormSubscribers(parseInt(params.form_id), {
      after: params.after,
      before: params.before,
      per_page: params.per_page || 50
    });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Broadcast Operations
  private async handleGetBroadcasts(params: any) {
    try {
      const result = await this.apiClient.getBroadcasts({
        after: params.after,
        before: params.before,
        per_page: params.per_page || 50,
        include_total_count: params.include_total_count || false
      });
      
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Get broadcasts failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private async handleGetBroadcast(params: any) {
    const result = await this.apiClient.getBroadcast(parseInt(params.broadcast_id));
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetBroadcastStats(params: any) {
    const result = await this.apiClient.getBroadcastStats(parseInt(params.broadcast_id));
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetBroadcastClicks(params: any) {
    const result = await this.apiClient.getBroadcastClicks(parseInt(params.broadcast_id));
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Custom Fields
  private async handleGetCustomFields(params: any) {
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

  // Utility Operations
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