"use client";

import { useState } from "react";
import Link from "next/link";
import McpConfigBlock from "@/components/McpConfigBlock";

export default function McpDemo() {
  const [prompt, setPrompt] = useState("Extract all dates and amounts from the uploaded PDF");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/mcp-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResult(data.answer || data.error || "");
    } catch (err) {
      setResult("Error running simulation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">MCP Server Demo</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="text-blue-600 hover:underline">
            Upload
          </Link>
          <Link href="/library" className="text-blue-600 hover:underline">
            Library
          </Link>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">About the Nutrient DWS MCP Server</h2>
        <p className="text-gray-700 mb-4">
          The Nutrient DWS MCP Server enables AI assistants like Cursor and Claude Desktop to
          interact with document processing capabilities directly. It provides tools for parsing,
          extracting, and analyzing documents through the Nutrient DWS API.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Configuration</h2>
        <p className="text-gray-700 mb-3">Add this to your Cursor or Claude Desktop config:</p>
        <McpConfigBlock />
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Live Demo (Simulation)</h2>
        <p className="text-sm text-orange-600 mb-3">
          Label this clearly as a "simulation" of what the MCP server would do (the real MCP
          server runs in the AI client, not in our app)
        </p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
            placeholder="Enter a prompt..."
          />
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Running..." : "Run"}
          </button>
        </div>
        {result && (
          <div className="bg-gray-50 border p-3 rounded">
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
      </section>
    </main>
  );
}
