"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import SiteHeader from "@/components/SiteHeader";
import McpConfigBlock from "@/components/McpConfigBlock";

export default function McpDemo() {
  const [prompt, setPrompt] = useState("Extract all dates and amounts from the uploaded PDF");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setResult("");
    setError("");
    try {
      const res = await fetch("/api/mcp-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not run the prompt.");
        return;
      }
      setResult(data.answer || "No result returned.");
    } catch (err) {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <SiteHeader title="MCP Server Demo" subtitle="Nutrient DWS MCP integration walkthrough" />

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
        <h2 className="text-xl font-semibold mb-2">Live Demo</h2>
        <p className="text-sm text-gray-600 mb-3">
          This panel issues the same kind of request the MCP server would handle, against this
          app&rsquo;s own backend. The real MCP server runs inside your AI client (Cursor, Claude
          Desktop) rather than inside a web app, so running it here lets you see the whole flow
          end to end.
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
            onClick={handleRun}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Running..." : "Run"}
          </button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
            {error}
          </div>
        )}
        {result && (
          <div className="bg-gray-50 border p-3 rounded">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
