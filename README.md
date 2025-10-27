# UK Buses MCP Server & MCPHub

A Model Context Protocol (MCP) server providing real-time UK bus information and a full MCP management platform.

## 📁 Project Contents

### UK Buses MCP Server
- `uk-buses-mcp-server.js` - Main MCP server providing UK bus information
- `test-uk-buses-server.js` - Test suite
- Features:
  - Real-time bus arrivals
  - Bus stop search
  - Route information
  - Service disruptions
  - Stop details and nearby stops

### xiaozhi-mcphub
A full MCP management platform with web UI, built on Express and React.

## 🚀 Quick Start

### Run Locally

```bash
# Install dependencies
npm install

# Run UK Buses MCP Server
node uk-buses-mcp-server.js
```

## 📚 Documentation

- [Hosting Guide](TRULY_FREE_HOSTING.md) - Free hosting options
- [GitHub Setup Guide](GITHUB_SETUP_GUIDE.md) - Upload to GitHub
- [Railway Deployment](RAILWAY_DEPLOY_GUIDE.md) - Deploy to Railway
- [Render Deployment](RENDER_DEPLOY_GUIDE.md) - Deploy to Render (FREE)
- [Development Log](DEVELOPMENT_LOG.md) - Project history

## 🆓 Free Hosting Options

### Recommended: Render.com (FREE Forever)
- ✅ No credit card needed
- ✅ Free forever
- ⚠️ Services sleep after 15min inactivity

### Alternative: Railway.app
- ✅ Best developer experience
- ⚠️ Requires credit card (free tier: $0-3/month)

## 📋 Requirements

- Node.js 18+ or 20+
- npm or pnpm

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, Vite, Tailwind CSS
- **Database**: PostgreSQL with pgvector
- **Protocol**: Model Context Protocol (MCP)

## 📄 License

See [LICENSE](xiaozhi-mcphub-main/LICENSE) file.

## 🤝 Contributing

Contributions welcome! See [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md) for project history.
