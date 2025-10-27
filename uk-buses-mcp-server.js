#!/usr/bin/env node

/**
 * UK Buses MCP Server
 * Provides real-time UK bus information including arrivals, stops, routes, and disruptions
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'uk-buses-mcp',
    version: '1.0.0',
    description: 'Real-time UK bus information including arrivals, stops, routes, and disruptions'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Mock data storage
let mockStops = [
  { id: '490015840C', name: 'Victoria Station', latitude: 51.4948, longitude: -0.1427 },
  { id: '490012080N', name: 'Oxford Circus Station', latitude: 51.5151, longitude: -0.1409 },
  { id: '490018418E', name: 'Piccadilly Circus', latitude: 51.5098, longitude: -0.1341 },
  { id: '490001031K', name: 'Liverpool Street Station', latitude: 51.5170, longitude: -0.0814 },
  { id: '490013486D', name: 'King Cross Station', latitude: 51.5309, longitude: -0.1239 }
];

let mockRoutes = [
  { id: '38', name: '38', destination: 'Victoria', operator: 'Arriva London' },
  { id: '10', name: '10', destination: 'Hammersmith', operator: 'Transport for London' },
  { id: '55', name: '55', destination: 'Leicester Square', operator: 'Stagecoach London' },
  { id: '11', name: '11', destination: 'Liverpool Street', operator: 'Tower Transit' },
  { id: '43', name: '43', destination: 'Friern Barnet', operator: 'Arriva London' }
];

let mockDisruptions = [
  {
    id: '1',
    route: '38',
    type: 'Route Diversion',
    message: 'Buses diverted due to road closure on Oxford Street. Use stops on Regent Street.'
  },
  {
    id: '2',
    route: '10',
    type: 'Delay',
    message: 'Expect delays of up to 10 minutes due to heavy traffic in central London.'
  }
];

// Mock arrivals data
let mockArrivals = [];

// Tool: Get bus arrivals for a stop
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'get_bus_arrivals',
        description: 'Get real-time bus arrivals for a specific bus stop by stop ID or name',
        inputSchema: {
          type: 'object',
          properties: {
            stop_id: {
              type: 'string',
              description: 'Bus stop ID (e.g., "490015840C")'
            },
            stop_name: {
              type: 'string',
              description: 'Bus stop name (e.g., "Victoria Station")'
            }
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
            query: {
              type: 'string',
              description: 'Search term for bus stop name or location'
            }
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
            route_id: {
              type: 'string',
              description: 'Route ID or number (e.g., "38")'
            },
            destination: {
              type: 'string',
              description: 'Destination name to filter routes'
            }
          }
        }
      },
      {
        name: 'get_bus_disruptions',
        description: 'Get current bus service disruptions and alerts',
        inputSchema: {
          type: 'object',
          properties: {
            route_id: {
              type: 'string',
              description: 'Optional: Filter by specific route ID'
            },
            area: {
              type: 'string',
              description: 'Optional: Filter by area (e.g., "London", "Manchester")'
            }
          }
        }
      },
      {
        name: 'get_stop_information',
        description: 'Get detailed information about a bus stop including facilities and nearby points of interest',
        inputSchema: {
          type: 'object',
          properties: {
            stop_id: {
              type: 'string',
              description: 'Bus stop ID'
            }
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
            latitude: {
              type: 'number',
              description: 'Latitude of the location'
            },
            longitude: {
              type: 'number',
              description: 'Longitude of the location'
            },
            radius: {
              type: 'number',
              description: 'Search radius in meters (default: 500)'
            }
          },
          required: ['latitude', 'longitude']
        }
      }
    ]
  };
});

// Tool handler: get_bus_arrivals
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'get_bus_arrivals') {
    const { stop_id, stop_name } = args;
    const stop = mockStops.find(s => s.id === stop_id || s.name === stop_name);
    
    if (!stop) {
      throw new Error(`Bus stop not found: ${stop_id || stop_name}`);
    }

    // Mock arrivals data
    const arrivals = [
      {
        route: '38',
        destination: 'Victoria',
        arrival_time: '2 min',
        scheduled_time: new Date(Date.now() + 2 * 60000).toISOString(),
        vehicle_id: '12345',
        operator: 'Arriva London'
      },
      {
        route: '38',
        destination: 'Victoria',
        arrival_time: '15 min',
        scheduled_time: new Date(Date.now() + 15 * 60000).toISOString(),
        vehicle_id: '12346',
        operator: 'Arriva London'
      },
      {
        route: '55',
        destination: 'Leicester Square',
        arrival_time: '8 min',
        scheduled_time: new Date(Date.now() + 8 * 60000).toISOString(),
        vehicle_id: '54321',
        operator: 'Stagecoach London'
      }
    ];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            stop_id: stop.id,
            stop_name: stop.name,
            arrivals,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  if (name === 'search_bus_stops') {
    const { query } = args;
    const results = mockStops.filter(stop => 
      stop.name.toLowerCase().includes(query.toLowerCase())
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query,
            results: results.map(stop => ({
              id: stop.id,
              name: stop.name,
              coordinates: {
                latitude: stop.latitude,
                longitude: stop.longitude
              }
            }))
          }, null, 2)
        }
      ]
    };
  }

  if (name === 'get_bus_routes') {
    const { route_id, destination } = args;
    let results = mockRoutes;

    if (route_id) {
      results = results.filter(r => r.id === route_id || r.name === route_id);
    }

    if (destination) {
      results = results.filter(r => 
        r.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            routes: results,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  if (name === 'get_bus_disruptions') {
    const { route_id, area } = args;
    let results = mockDisruptions;

    if (route_id) {
      results = results.filter(d => d.route === route_id);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            disruptions: results,
            count: results.length,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  if (name === 'get_stop_information') {
    const { stop_id } = args;
    const stop = mockStops.find(s => s.id === stop_id);

    if (!stop) {
      throw new Error(`Bus stop not found: ${stop_id}`);
    }

    const info = {
      ...stop,
      facilities: ['Shelter', 'Real-time displays', 'Seating'],
      accessibility: 'Wheelchair accessible',
      nearby_landmarks: [
        stop.name.includes('Victoria') ? 'Victoria Station' : 'Various shops',
        'Bus station'
      ]
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2)
        }
      ]
    };
  }

  if (name === 'find_nearby_stops') {
    const { latitude, longitude, radius = 500 } = args;

    // Simple distance calculation (mock)
    const nearbyStops = mockStops
      .map(stop => ({
        ...stop,
        distance: Math.abs(latitude - stop.latitude) + Math.abs(longitude - stop.longitude)
      }))
      .filter(stop => stop.distance * 111000 <= radius) // Rough conversion to meters
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            location: { latitude, longitude },
            radius_meters: radius,
            stops: nearbyStops.map(s => ({
              id: s.id,
              name: s.name,
              distance_meters: Math.round(s.distance * 111000),
              coordinates: {
                latitude: s.latitude,
                longitude: s.longitude
              }
            }))
          }, null, 2)
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('UK Buses MCP server running on stdio');
}

main().catch(console.error);

