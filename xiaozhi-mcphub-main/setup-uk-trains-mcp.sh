#!/bin/bash

echo "🚂 Setting up UK Trains MCP Server..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install @modelcontextprotocol/sdk axios

# Make the server executable
chmod +x uk-trains-server.js

echo "✅ UK Trains MCP Server setup complete!"
echo ""
echo "📋 Available tools:"
echo "  - get_train_departures: Get real-time train departure information"
echo "  - get_tfl_status: Get Transport for London service status"
echo "  - search_stations: Search for UK train stations"
echo ""
echo "🚀 To start the server:"
echo "  node uk-trains-server.js"
echo ""
echo "📖 Example usage:"
echo "  - Check departures from Leeds: 'What trains are departing from Leeds?'"
echo "  - Check TfL status: 'Are there any delays on the London Underground?'"
echo "  - Search stations: 'What's the station code for Edinburgh Waverley?'"
echo ""
echo "🔧 To add this to xiaozhi-mcphub:"
echo "  1. Open http://localhost:5173"
echo "  2. Login with admin/admin123"
echo "  3. Add new MCP server with command: node uk-trains-server.js"
echo "  4. Set working directory to: /Users/yliu3y/Desktop/WRO/xiaozhi-mcphub-main"
