#!/usr/bin/env node

// Simple test script to verify Music MCP server
import { spawn } from 'child_process';

console.log('🎵 Testing Music MCP Server...\n');

// Start the MCP server
const server = spawn('node', ['music-mcp-server.js'], {
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

// Test playing a song
setTimeout(() => {
  console.log('🎵 Testing play_song tool...');
  
  const playRequest = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "play_song",
      arguments: {
        query: "Bohemian Rhapsody"
      }
    }
  };

  server.stdin.write(JSON.stringify(playRequest) + '\n');
}, 3000);

// Test music control
setTimeout(() => {
  console.log('🎛️ Testing control_music tool...');
  
  const controlRequest = {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "control_music",
      arguments: {
        action: "volume",
        value: 75
      }
    }
  };

  server.stdin.write(JSON.stringify(controlRequest) + '\n');
}, 4000);

// Test search
setTimeout(() => {
  console.log('🔍 Testing search_music tool...');
  
  const searchRequest = {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "search_music",
      arguments: {
        query: "Queen",
        type: "artist"
      }
    }
  };

  server.stdin.write(JSON.stringify(searchRequest) + '\n');
}, 5000);

// Close the server after testing
setTimeout(() => {
  console.log('🛑 Closing server...');
  server.kill();
}, 7000);

console.log('⏳ Test will run for 7 seconds...');
