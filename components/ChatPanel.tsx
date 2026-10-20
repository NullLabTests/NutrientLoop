"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPanel({
  documentMarkdown,
}: {
  documentMarkdown: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_markdown: documentMarkdown,
          user_question: input,
          chat_history: messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not answer that question.");
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || "No answer returned." },
      ]);
    } catch (err) {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white">
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Ask about this document</h3>
        <span className="text-xs text-gray-400">
          {messages.length ? `${messages.length} messages` : "grounded in the document"}
        </span>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400">
            Answers come only from this document. Try &ldquo;What is the total due?&rdquo;,
            &ldquo;When is it dated?&rdquo;, or &ldquo;Who is it billed to?&rdquo;
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded text-sm ${
              msg.role === "user" ? "bg-blue-50 ml-4" : "bg-gray-50 mr-4"
            }`}
          >
            <div className="font-semibold text-xs mb-1 text-gray-500">
              {msg.role === "user" ? "You" : "Assistant"}
            </div>
            {msg.role === "user" ? (
              <div className="whitespace-pre-wrap">{msg.content}</div>
            ) : (
              <div className="prose prose-sm max-w-none prose-p:my-1 prose-blockquote:my-1 prose-blockquote:border-blue-300">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}
        {loading && <div className="text-sm text-gray-500">Thinking...</div>}
      </div>
      <form onSubmit={sendMessage} className="p-2 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 px-2 py-1 border rounded text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
