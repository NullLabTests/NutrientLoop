# NutrientLoop - Document Intelligence Pipeline

A full-stack Next.js 15 (App Router) + TypeScript application that demonstrates end-to-end document processing using the Nutrient DWS APIs, with an MCP server integration for AI-assisted document work.

## Quick Start

1. Clone the repository:
```bash
git clone <repo-url>
cd nutrient-loop
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Add your API keys to `.env` (NUTRIENT_API_KEY is required)

4. Run with Docker:
```bash
docker-compose up
```

Visit `http://localhost:3000` to get started.

## Screenshot Placeholder

![App Screenshot](./screenshot.png)

## How it works

```
User Uploads PDF
     ↓
Next.js API Route
     ↓
Nutrient DWS /extraction/parse (cloud)
     ↓
Markdown + Spatial Data
     ↓
SQLite (local)
     ↓
UI renders markdown + LLM Q&A
```

## MCP Server

The Nutrient DWS MCP Server allows AI assistants (Cursor, Claude Desktop) to directly interact with document processing capabilities. The real MCP server runs in the AI client environment, not in this app.

Configuration for Cursor/Claude Desktop:

```json
{
  "mcpServers": {
    "nutrient-dws": {
      "command": "npx",
      "args": ["-y", "@nutrient-sdk/dws-mcp-server", "--sandbox", "./documents"],
      "env": {
        "SANDBOX_PATH": "./documents",
        "NUTRIENT_DWS_API_KEY": "YOUR_KEY"
      }
    }
  }
}
```

This app includes a simulation demo at `/mcp-demo` that shows what the MCP server would do.

## Built for

This project demonstrates the integration patterns used in Forward Deployed Engineering engagements with Nutrient — consuming their DWS APIs, building customer-facing UIs, and wiring AI into document workflows.
