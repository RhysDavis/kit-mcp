#!/usr/bin/env node

/**
 * Verification script for Kit Marketing Automation MCP
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Kit Marketing Automation MCP...');

try {
  // Check if main entry point exists and can be loaded
  const distPath = path.join(__dirname, 'dist', 'index.js');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build output not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  console.log('✅ Build output exists');
  
  // Check package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  console.log(`✅ Package: ${packageJson.name} v${packageJson.version}`);
  
  // Check environment template
  const envExample = path.join(__dirname, '.env.example');
  if (fs.existsSync(envExample)) {
    console.log('✅ Environment template exists');
  }
  
  // Check README
  const readme = path.join(__dirname, 'README.md');
  if (fs.existsSync(readme)) {
    console.log('✅ Documentation exists');
  }
  
  console.log('');
  console.log('🎉 Kit Marketing Automation MCP is ready!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Copy .env.example to .env');
  console.log('2. Add your Kit API credentials to .env');
  console.log('3. Test with: npm start');
  console.log('4. Add to your MCP client configuration');
  
} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}