#!/usr/bin/env node

/**
 * HTTP Wrapper for UK Buses MCP Server
 * This provides an HTTP interface to the MCP server for Railway deployment
 */

import http from 'http';

const PORT = process.env.PORT || 3000;

// Debug logging
console.log('=== RAILWAY DEBUG INFO ===');
console.log('PORT environment variable:', process.env.PORT);
console.log('Using PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('=========================');

// Sample tool listings that would come from the MCP server
const tools = [
  {
    name: 'get_bus_arrivals',
    description: 'Get real-time bus arrivals for a specific bus stop by stop ID or name',
    inputSchema: {
      type: 'object',
      properties: {
        stop_id: { type: 'string', description: 'Bus stop ID (e.g., "490015840C")' },
        stop_name: { type: 'string', description: 'Bus stop name (e.g., "Victoria Station")' }
      },
      required: ['stop_id']
    }
  },
  {
    name: 'search_bus_stops',
    description: 'Search for bus stops by name or location',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term for bus stop name or location' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_bus_routes',
    description: 'Get information about bus routes',
    inputSchema: {
      type: 'object',
      properties: {
        route_id: { type: 'string', description: 'Route ID or number (e.g., "38")' },
        destination: { type: 'string', description: 'Destination name to filter routes' }
      }
    }
  },
  {
    name: 'get_bus_disruptions',
    description: 'Get current bus service disruptions and alerts',
    inputSchema: {
      type: 'object',
      properties: {
        route_id: { type: 'string', description: 'Optional: Filter by specific route ID' },
        area: { type: 'string', description: 'Optional: Filter by area (e.g., "London", "Manchester")' }
      }
    }
  },
  {
    name: 'get_stop_information',
    description: 'Get detailed information about a bus stop including facilities and nearby points of interest',
    inputSchema: {
      type: 'object',
      properties: {
        stop_id: { type: 'string', description: 'Bus stop ID' }
      },
      required: ['stop_id']
    }
  },
  {
    name: 'find_nearby_stops',
    description: 'Find bus stops near a specific location using latitude and longitude',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Latitude of the location' },
        longitude: { type: 'number', description: 'Longitude of the location' },
        radius: { type: 'number', description: 'Search radius in meters (default: 500)' }
      },
      required: ['latitude', 'longitude']
    }
  }
];

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'uk-buses-mcp-server',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // List tools endpoint
  if (req.url === '/tools' || req.url === '/tools/list') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tools }, null, 2));
    return;
  }

  // Info endpoint
  if (req.url === '/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'uk-buses-mcp',
      version: '1.0.0',
      description: 'Real-time UK bus information including arrivals, stops, routes, and disruptions',
      endpoints: {
        health: '/health',
        tools: '/tools',
        info: '/info'
      }
    }, null, 2));
    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  const address = server.address();
  console.log(`UK Buses MCP Server (HTTP wrapper) running on port ${PORT}`);
  console.log(`Listening on 0.0.0.0:${PORT}`);
  console.log(`Server address:`, address);
  console.log(`Health check available at /health`);
  console.log(`Server ready to accept connections on ${address.address}:${address.port}`);
});

// Handle errors gracefully
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Keep the process alive - prevent immediate exit
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Keep process alive
setInterval(() => {
  // Just keep the event loop running
}, 10000);
