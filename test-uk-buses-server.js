#!/usr/bin/env node

/**
 * Test script for UK Buses MCP Server
 */

import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚍 UK Buses MCP Server Test\n');

// Test 1: Search bus stops
console.log('Test 1: Search bus stops');
const searchData = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list'
};

console.log('Sending:', JSON.stringify(searchData, null, 2));
console.log('✅ Tools list request sent\n');

// Test 2: Get bus arrivals
console.log('Test 2: Get bus arrivals');
const arrivalsData = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'get_bus_arrivals',
    arguments: {
      stop_id: '490015840C'
    }
  }
};

console.log('Sending:', JSON.stringify(arrivalsData, null, 2));
console.log('✅ Arrivals request sent\n');

// Test 3: Search stops
console.log('Test 3: Search stops');
const searchStopsData = {
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: {
    name: 'search_bus_stops',
    arguments: {
      query: 'Victoria'
    }
  }
};

console.log('Sending:', JSON.stringify(searchStopsData, null, 2));
console.log('✅ Search request sent\n');

// Test 4: Get disruptions
console.log('Test 4: Get disruptions');
const disruptionsData = {
  jsonrpc: '2.0',
  id: 4,
  method: 'tools/call',
  params: {
    name: 'get_bus_disruptions',
    arguments: {}
  }
};

console.log('Sending:', JSON.stringify(disruptionsData, null, 2));
console.log('✅ Disruptions request sent\n');

console.log('\n✅ All test requests prepared');
console.log('To run the actual server: node uk-buses-mcp-server.js');

