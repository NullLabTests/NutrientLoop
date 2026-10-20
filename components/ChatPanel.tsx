"use client";

import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPanel({
  documentMarkdown,
  documentId,
}: {
  documentMarkdown: string;
  documentId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

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
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer || data.error }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error sending question" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white">
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-semibold text-sm">Ask about this document</h3>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded text-sm ${
              msg.role === "user" ? "bg-blue-100 ml-4" : "bg-gray-100 mr-4"
            }`}
          >
            <div className="font-semibold text-xs mb-1">
              {msg.role === "user" ? "You" : "Assistant"}
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
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
