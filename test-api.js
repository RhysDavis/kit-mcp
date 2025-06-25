#!/usr/bin/env node

/**
 * Test script to verify Kit API connection and pull real data
 */

import fs from 'fs';
import path from 'path';
import { KitApiClient } from './dist/services/kit-api-client.js';
import { ApiCache } from './dist/utils/cache.js';
import { AccountAuditFunction } from './dist/functions/account-audit.js';

// Load environment variables from .env file
try {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]*?)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      process.env[key.trim()] = value.trim();
    }
  });
  
  console.log('✅ Environment variables loaded from .env');
} catch (error) {
  console.log('⚠️ Could not load .env file:', error.message);
}

console.log('🧪 Testing Kit API with real credentials...\n');

async function testKitApi() {
  try {
    // Initialize the API client
    const apiClient = new KitApiClient();
    const cache = new ApiCache();
    
    console.log('✅ MCP components initialized');
    
    // Test 1: Connection test
    console.log('\n🔗 Testing API connection...');
    const isConnected = await apiClient.testConnection();
    console.log(`Connection status: ${isConnected ? '✅ Connected' : '❌ Failed'}`);
    
    if (!isConnected) {
      console.log('❌ Cannot proceed with data tests - connection failed');
      return;
    }
    
    // Test 2: Get account info
    console.log('\n👤 Fetching account information...');
    try {
      const account = await apiClient.getAccount();
      console.log(`✅ Account: ${account.account?.name || 'No name'}`);
      console.log(`📧 Email: ${account.account?.primary_email_address || account.user?.email}`);
      console.log(`📊 Plan: ${account.account?.plan_type}`);
      console.log(`🆔 Account ID: ${account.account?.id}`);
    } catch (error) {
      console.log(`⚠️ Account info error: ${error.message}`);
    }
    
    // Test 3: Get email stats
    console.log('\n📊 Fetching email statistics...');
    try {
      const emailStats = await apiClient.getEmailStats();
      console.log(`✅ Email stats retrieved:`, Object.keys(emailStats).join(', '));
    } catch (error) {
      console.log(`⚠️ Email stats error: ${error.message}`);
    }

    // Test 4: Get growth stats
    console.log('\n📈 Fetching growth statistics...');
    try {
      const growthStats = await apiClient.getGrowthStats();
      console.log(`✅ Growth stats retrieved:`, Object.keys(growthStats).join(', '));
    } catch (error) {
      console.log(`⚠️ Growth stats error: ${error.message}`);
    }
    
    // Test 5: Get some subscribers
    console.log('\n👥 Fetching subscriber list (first 5)...');
    try {
      const subscribers = await apiClient.getSubscribers({ per_page: 5 });
      console.log(`✅ Found ${subscribers.subscribers?.length || 0} subscribers`);
      if (subscribers.subscribers?.length > 0) {
        subscribers.subscribers.forEach((sub, i) => {
          console.log(`  ${i + 1}. ${sub.first_name || 'No name'} (${sub.email_address}) - ${sub.state}`);
        });
      }
    } catch (error) {
      console.log(`⚠️ Subscribers error: ${error.message}`);
    }
    
    // Test 6: Get tags
    console.log('\n🏷️ Fetching tags (first 5)...');
    try {
      const tags = await apiClient.getTags({ per_page: 5 });
      console.log(`✅ Found ${tags.tags?.length || 0} tags`);
      if (tags.tags?.length > 0) {
        tags.tags.forEach((tag, i) => {
          console.log(`  ${i + 1}. ${tag.name} (ID: ${tag.id})`);
        });
      }
    } catch (error) {
      console.log(`⚠️ Tags error: ${error.message}`);
    }
    
    // Test 7: Get sequences
    console.log('\n📧 Fetching sequences...');
    try {
      const sequences = await apiClient.getSequences({ per_page: 5 });
      console.log(`✅ Found ${sequences.sequences?.length || 0} sequences`);
      if (sequences.sequences?.length > 0) {
        sequences.sequences.forEach((seq, i) => {
          console.log(`  ${i + 1}. ${seq.name} (${seq.hold ? 'Paused' : 'Active'})`);
        });
      }
    } catch (error) {
      console.log(`⚠️ Sequences error: ${error.message}`);
    }
    
    // Test 8: Get forms
    console.log('\n📝 Fetching forms...');
    try {
      const forms = await apiClient.getForms({ per_page: 5 });
      console.log(`✅ Found ${forms.forms?.length || 0} forms`);
      if (forms.forms?.length > 0) {
        forms.forms.forEach((form, i) => {
          console.log(`  ${i + 1}. ${form.name} (${form.status})`);
        });
      }
    } catch (error) {
      console.log(`⚠️ Forms error: ${error.message}`);
    }

    // Test 9: Get broadcasts
    console.log('\n📮 Fetching broadcasts...');
    try {
      const broadcasts = await apiClient.getBroadcasts({ per_page: 3 });
      console.log(`✅ Found ${broadcasts.broadcasts?.length || 0} broadcasts`);
      if (broadcasts.broadcasts?.length > 0) {
        broadcasts.broadcasts.forEach((broadcast, i) => {
          console.log(`  ${i + 1}. ${broadcast.subject || 'No subject'} (ID: ${broadcast.id})`);
        });
      }
    } catch (error) {
      console.log(`⚠️ Broadcasts error: ${error.message}`);
    }
    
    // Test 10: Account audit function
    console.log('\n🔍 Running account audit...');
    try {
      const audit = new AccountAuditFunction(apiClient, cache);
      const result = await audit.execute({ include_performance: false });
      
      console.log(`✅ Account Audit Complete:`);
      console.log(`  📊 Total subscribers: ${result.account_summary.total_subscribers}`);
      console.log(`  ✅ Active: ${result.account_summary.active_subscribers}`);
      console.log(`  📈 List health score: ${result.account_summary.list_health_score}/100`);
      console.log(`  🏷️ Total tags: ${result.segmentation_analysis.total_tags}`);
      console.log(`  🤖 Total sequences: ${result.automation_overview.total_sequences}`);
      console.log(`  📝 Total forms: ${result.lead_capture_analysis.total_forms}`);
      
      if (result.strategic_recommendations.length > 0) {
        console.log(`  💡 Top recommendations:`);
        result.strategic_recommendations.slice(0, 3).forEach((rec, i) => {
          console.log(`    ${i + 1}. ${rec}`);
        });
      }
    } catch (error) {
      console.log(`⚠️ Account audit error: ${error.message}`);
    }
    
    // Test 11: Rate limit status
    console.log('\n⏱️ Rate limit status:');
    const rateLimitStatus = apiClient.getRateLimitStatus();
    console.log(`  Requests in last minute: ${rateLimitStatus.requestsInLastMinute}`);
    console.log(`  Remaining requests: ${rateLimitStatus.remainingRequests}`);
    
    console.log('\n🎉 Kit API testing complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
  }
}

// Run the tests
testKitApi();