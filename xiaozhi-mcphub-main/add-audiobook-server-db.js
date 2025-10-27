#!/usr/bin/env node

// Script to add the audiobook MCP server to the MCPHub database
import { initializeDbModule } from './dist/db/index.js';
import { getMcpServerService } from './dist/services/mcpServerService.js';

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
    console.log('Initializing database connection...');
    
    // Initialize the database module
    const dbInitialized = await initializeDbModule();
    if (!dbInitialized) {
      throw new Error('Failed to initialize database');
    }
    
    console.log('Database initialized successfully');
    
    // Get the MCP server service
    const mcpServerService = getMcpServerService();
    
    console.log('Adding audiobook server to MCPHub database...');
    
    // Check if server already exists
    const exists = await mcpServerService.serverExists('audiobook-player');
    if (exists) {
      console.log('Audiobook server already exists, updating...');
      await mcpServerService.updateServer('audiobook-player', audiobookServerConfig);
      console.log('✅ Audiobook server updated successfully!');
    } else {
      console.log('Creating new audiobook server...');
      await mcpServerService.createServer('audiobook-player', audiobookServerConfig);
      console.log('✅ Audiobook server created successfully!');
    }
    
    // Verify the server was added
    const server = await mcpServerService.getServerByName('audiobook-player');
    if (server) {
      console.log('✅ Verification successful! Server details:');
      console.log(`  Name: ${server.name}`);
      console.log(`  Type: ${server.type}`);
      console.log(`  Command: ${server.command}`);
      console.log(`  Args: ${server.args?.join(' ')}`);
      console.log(`  Enabled: ${server.enabled}`);
    } else {
      console.log('❌ Verification failed - server not found');
    }
    
  } catch (error) {
    console.error('❌ Error adding audiobook server:', error);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

addAudiobookServer();
