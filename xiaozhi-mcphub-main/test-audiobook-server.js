#!/usr/bin/env node

// Simple test for audiobook MCP server
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Audiobook MCP Server...\n');

// Test the server by spawning it and sending a simple request
const serverPath = join(__dirname, 'audiobook-mcp-server.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

server.on('close', (code) => {
  console.log(`✅ Server test completed with code: ${code}`);
  if (errorOutput.includes('Audiobook MCP server running on stdio')) {
    console.log('✅ Server started successfully!');
  } else {
    console.log('❌ Server failed to start properly');
    console.log('Error output:', errorOutput);
  }
});

// Send a test request after a short delay
setTimeout(() => {
  const testRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };
  
  server.stdin.write(JSON.stringify(testRequest) + '\n');
  
  // Close the server after test
  setTimeout(() => {
    server.kill();
  }, 1000);
}, 500);
