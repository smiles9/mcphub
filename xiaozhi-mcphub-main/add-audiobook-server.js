#!/usr/bin/env node

// Script to add the audiobook MCP server to the MCPHub database
import { addOrUpdateServer } from './dist/services/mcpService.js';

const audiobookServerConfig = {
  type: 'stdio',
  command: 'node',
  args: ['audiobook-mcp-server.js'],
  env: {},
  headers: {},
  enabled: true,
  owner: 'admin',
  keepAliveInterval: 30000,
  tools: [],
  prompts: [],
  options: {},
  openapi: null
};

async function addAudiobookServer() {
  try {
    console.log('Adding audiobook server to MCPHub database...');
    
    const result = await addOrUpdateServer('audiobook-player', audiobookServerConfig, true);
    
    if (result.success) {
      console.log('✅ Audiobook server added successfully!');
      console.log('Message:', result.message);
    } else {
      console.log('❌ Failed to add audiobook server');
      console.log('Error:', result.message);
    }
  } catch (error) {
    console.error('❌ Error adding audiobook server:', error);
  }
}

addAudiobookServer();
