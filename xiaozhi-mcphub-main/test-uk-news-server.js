#!/usr/bin/env node

// Simple test script to verify UK News MCP server
import { spawn } from 'child_process';

console.log('📰 Testing UK News MCP Server...\n');

// Start the MCP server
const server = spawn('node', ['uk-news-mcp-server.js'], {
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

// Test getting headlines
setTimeout(() => {
  console.log('📰 Testing get_uk_headlines tool...');
  
  const headlinesRequest = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "get_uk_headlines",
      arguments: {
        source: "bbc",
        limit: 3
      }
    }
  };

  server.stdin.write(JSON.stringify(headlinesRequest) + '\n');
}, 3000);

// Test breaking news
setTimeout(() => {
  console.log('🚨 Testing get_breaking_news tool...');
  
  const breakingRequest = {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "get_breaking_news",
      arguments: {
        limit: 3
      }
    }
  };

  server.stdin.write(JSON.stringify(breakingRequest) + '\n');
}, 4000);

// Test news search
setTimeout(() => {
  console.log('🔍 Testing search_uk_news tool...');
  
  const searchRequest = {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "search_uk_news",
      arguments: {
        query: "climate change",
        limit: 3
      }
    }
  };

  server.stdin.write(JSON.stringify(searchRequest) + '\n');
}, 5000);

// Test regional news
setTimeout(() => {
  console.log('📍 Testing get_news_by_region tool...');
  
  const regionRequest = {
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: "get_news_by_region",
      arguments: {
        region: "scotland",
        limit: 2
      }
    }
  };

  server.stdin.write(JSON.stringify(regionRequest) + '\n');
}, 6000);

// Close the server after testing
setTimeout(() => {
  console.log('🛑 Closing server...');
  server.kill();
}, 8000);

console.log('⏳ Test will run for 8 seconds...');
