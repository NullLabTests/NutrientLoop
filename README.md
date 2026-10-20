<p align="center">
  <img src="./nutrient-logo.png" alt="Nutrient" width="260" />
</p>

<h1 align="center">NutrientLoop</h1>

<p align="center">
  <strong>An end-to-end document intelligence pipeline built on the Nutrient DWS APIs</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#mcp-server">MCP server</a>
</p>

---

## What is NutrientLoop?

NutrientLoop is a full-stack **Next.js 15 (App Router) + TypeScript** application that demonstrates a
complete document processing workflow using the [Nutrient DWS](https://www.nutrient.io) APIs.

Drop in a PDF, DOCX, PNG or JPG and the app:

1. **Uploads** the file through a Next.js API route,
2. **Extracts** it with Nutrient's Data Extraction Parse endpoint into clean markdown,
3. **Persists** the result in a local SQLite database,
4. **Renders** the extracted markdown next to an AI chat panel for question-answering,
5. **Exposes** an MCP-style simulation showing how an AI client would drive the same pipeline.

It is a reference implementation for the integration patterns used in Forward Deployed Engineering
engagements with Nutrient — consuming their DWS APIs, building customer-facing UIs, and wiring AI
into document workflows.

## Demo

![NutrientLoop end-to-end demo — upload, extract, browse and ask questions](./demo.gif)

▶️ **[Watch the full-resolution video](https://github.com/NullLabTests/NutrientLoop/blob/main/media/demo.mp4?raw=true)**

The recording shows the complete loop: selecting a PDF, the Nutrient extraction round-trip, the
rendered markdown, a chat question, the document library and the MCP simulation.

## Screenshots

| Upload | Results + chat |
| --- | --- |
| ![Upload page](./screenshot-upload.png) | ![Results page](./screenshot.png) |

## How it works

```
User Uploads PDF
      │
      ▼
Next.js API Route  ──►  Nutrient DWS /extraction/parse (cloud)
      │                         │
      │                         ▼
      │                 Markdown + page metrics
      │                         │
      ▼                         ▼
SQLite (local)  ◄──────  store markdown + metadata
      │
      ▼
UI renders markdown + LLM Q&A
```

**Pipeline stages**

| Stage | What happens |
| --- | --- |
| **Upload** | Drag-and-drop or click; the browser POSTs multipart form data to `/api/process` |
| **Process** | The API route validates the request and calls the Nutrient DWS Parse endpoint |
| **Extract** | Nutrient returns structured markdown plus page/processing metrics |
| **Store** | A generated UUID keys the markdown and metadata into SQLite |
| **Render** | `/document/[id]` shows the markdown in the left pane and a chat panel on the right |
| **Ask** | `/api/ask` answers questions from the document only, with the configured LLM |

### Pages

| Route | Purpose |
| --- | --- |
| `/` | Drag-and-drop upload with live status (`Uploading → Processing → Extracting`) |
| `/document/[id]` | Two-pane results view: rendered markdown + chat Q&A |
| `/library` | Table of every processed document (filename, date, page count) |
| `/mcp-demo` | Explains the MCP server and runs a live simulation against the latest document |

### API routes

| Route | Description |
| --- | --- |
| `POST /api/process` | Accepts the uploaded file, calls Nutrient, stores the result, returns `{ id }` |
| `GET /api/document/[id]` | Returns a stored document |
| `GET /api/library` | Returns the document index |
| `POST /api/ask` | Answers a question using the document markdown and the configured LLM |
| `POST /api/mcp-simulate` | Runs an MCP-style prompt against the most recent document |
| `GET /api/check-keys` | Reports whether the Nutrient key is configured |

## Quick start

```bash
# 1. Clone
git clone https://github.com/NullLabTests/NutrientLoop.git
cd NutrientLoop

# 2. Add your key
cp .env.example .env      # then set NUTRIENT_API_KEY

# 3. Run
docker-compose up
```

Open [http://localhost:3000](http://localhost:3000).

> The app shows a friendly **"Add your API key"** screen when `NUTRIENT_API_KEY` is missing, and
> `OPENAI_API_KEY` is entirely optional — the Q&A panels degrade gracefully without it.

## Architecture

- **Frontend** — Next.js 15 App Router, React 19, TypeScript, Tailwind CSS
- **Backend** — Next.js API routes (no separate server)
- **Storage** — SQLite via `better-sqlite3`; the table is created on first run (no migrations)
- **AI** — OpenAI API with a graceful fallback when unconfigured
- **Documents** — Nutrient DWS REST API (`https://api.nutrient.io`)
- **Infra** — multi-stage Dockerfile + `docker-compose.yml`, port `3000`

## MCP server

The [Nutrient DWS MCP Server](https://www.nutrient.io/guides/mcp-server/) lets AI assistants such as
Cursor and Claude Desktop process documents directly. The real MCP server runs **inside the AI
client**, not in this app — this project demonstrates the configuration and simulates the flow.

Add this to your Cursor or Claude Desktop config:

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

Visit `/mcp-demo` to run a live simulation of that flow against the most recently processed document.

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `NUTRIENT_API_KEY` | Yes | Nutrient DWS API key used for document extraction |
| `NUTRIENT_EXTRACTION_API_KEY` | Yes | Same key; checked as a fallback |
| `OPENAI_API_KEY` | No | Enables LLM Q&A; omitted = graceful fallback |

## Built for

This project demonstrates the integration patterns used in Forward Deployed Engineering engagements
with Nutrient — consuming their DWS APIs, building customer-facing UIs, and wiring AI into document
workflows.
