#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// UK Train MCP Server
class UKTrainsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'uk-trains-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_train_departures',
            description: 'Get real-time train departure information from a UK station',
            inputSchema: {
              type: 'object',
              properties: {
                station: {
                  type: 'string',
                  description: 'Station code or name (e.g., "LDS" for Leeds, "PAD" for Paddington)',
                },
                destination: {
                  type: 'string',
                  description: 'Optional destination station code or name',
                },
                count: {
                  type: 'number',
                  description: 'Number of departures to return (default: 10)',
                  default: 10,
                },
              },
              required: ['station'],
            },
          },
          {
            name: 'get_tfl_status',
            description: 'Get Transport for London service status including Underground, Overground, and DLR',
            inputSchema: {
              type: 'object',
              properties: {
                line: {
                  type: 'string',
                  description: 'Optional specific line to check (e.g., "central", "northern", "dlr")',
                },
              },
            },
          },
          {
            name: 'search_stations',
            description: 'Search for UK train stations by name or partial name',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Station name or partial name to search for',
                },
              },
              required: ['query'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_train_departures':
            return await this.getTrainDepartures(args);
          case 'get_tfl_status':
            return await this.getTfLStatus(args);
          case 'search_stations':
            return await this.searchStations(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async getTrainDepartures(args) {
    const { station, destination, count = 10 } = args;
    
    try {
      // Mock data for demonstration
      const mockDepartures = [
        {
          time: '14:30',
          destination: 'London Kings Cross',
          platform: '1',
          status: 'On time',
          operator: 'LNER'
        },
        {
          time: '14:45',
          destination: 'Manchester Piccadilly',
          platform: '2',
          status: '2 min delay',
          operator: 'TransPennine Express'
        },
        {
          time: '15:00',
          destination: 'Edinburgh Waverley',
          platform: '3',
          status: 'On time',
          operator: 'LNER'
        }
      ];

      let result = `🚂 Train departures from ${station}:\n\n`;
      mockDepartures.slice(0, count).forEach(dep => {
        result += `⏰ ${dep.time} - ${dep.destination}\n`;
        result += `   Platform: ${dep.platform} | Status: ${dep.status} | Operator: ${dep.operator}\n\n`;
      });

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get train departures: ${error.message}`);
    }
  }

  async getTfLStatus(args) {
    const { line } = args;
    
    try {
      // Mock TfL status data
      const mockStatus = {
        'central': { status: 'Good Service', description: 'No delays reported' },
        'northern': { status: 'Minor Delays', description: 'Delays due to signal failure at Camden Town' },
        'dlr': { status: 'Good Service', description: 'No delays reported' },
        'overground': { status: 'Part Closure', description: 'Reduced service between Gospel Oak and Barking' }
      };

      if (line && mockStatus[line.toLowerCase()]) {
        const status = mockStatus[line.toLowerCase()];
        return {
          content: [
            {
              type: 'text',
              text: `🚇 TfL ${line.toUpperCase()} Line Status: ${status.status}\nDescription: ${status.description}`,
            },
          ],
        };
      } else {
        let result = '🚇 TfL Service Status:\n\n';
        Object.entries(mockStatus).forEach(([lineName, status]) => {
          result += `${lineName.toUpperCase()}: ${status.status}\n`;
          result += `${status.description}\n\n`;
        });
        
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }
    } catch (error) {
      throw new Error(`Failed to get TfL status: ${error.message}`);
    }
  }

  async searchStations(args) {
    const { query } = args;
    
    try {
      // Mock station search results
      const mockStations = [
        { code: 'LDS', name: 'Leeds', operator: 'Northern' },
        { code: 'MAN', name: 'Manchester Piccadilly', operator: 'Virgin Trains' },
        { code: 'EDB', name: 'Edinburgh Waverley', operator: 'ScotRail' },
        { code: 'PAD', name: 'London Paddington', operator: 'Great Western Railway' },
        { code: 'KGX', name: 'London Kings Cross', operator: 'LNER' }
      ];

      const results = mockStations.filter(station => 
        station.name.toLowerCase().includes(query.toLowerCase()) ||
        station.code.toLowerCase().includes(query.toLowerCase())
      );

      let result = `🔍 Station search results for "${query}":\n\n`;
      if (results.length > 0) {
        results.forEach(station => {
          result += `🚉 ${station.name} (${station.code}) - ${station.operator}\n`;
        });
      } else {
        result += 'No stations found matching your search.';
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search stations: ${error.message}`);
    }
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('UK Trains MCP server running on stdio');
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

const server = new UKTrainsMCPServer();
server.run().catch(console.error);
