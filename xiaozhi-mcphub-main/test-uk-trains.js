#!/usr/bin/env node

// Simple test script to verify UK Trains MCP server
import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

console.log('🧪 Testing UK Trains MCP Server...\n');

// Start the MCP server
const server = spawn('node', ['uk-trains-esm.js'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe']
});

let response = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  response += data.toString();
  console.log('📤 Server output:', data.toString());
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('📥 Server error:', data.toString());
});

server.on('close', (code) => {
  console.log(`\n✅ Server process exited with code: ${code}`);
  console.log('📋 Full response:', response);
  if (errorOutput) {
    console.log('⚠️ Error output:', errorOutput);
  }
});

// Send MCP initialization request
setTimeout(() => {
  console.log('📨 Sending MCP initialization request...');
  
  const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  };

  server.stdin.write(JSON.stringify(initRequest) + '\n');
}, 1000);

// Send tools list request
setTimeout(() => {
  console.log('🔧 Requesting tools list...');
  
  const toolsRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };

  server.stdin.write(JSON.stringify(toolsRequest) + '\n');
}, 2000);

// Test a tool call
setTimeout(() => {
  console.log('🚂 Testing get_train_departures tool...');
  
  const toolRequest = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "get_train_departures",
      arguments: {
        station: "LDS",
        count: 3
      }
    }
  };

  server.stdin.write(JSON.stringify(toolRequest) + '\n');
}, 3000);

// Close the server after testing
setTimeout(() => {
  console.log('🛑 Closing server...');
  server.kill();
}, 5000);

console.log('⏳ Test will run for 5 seconds...');
