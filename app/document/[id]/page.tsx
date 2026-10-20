"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MarkdownView from "@/components/MarkdownView";
import ChatPanel from "@/components/ChatPanel";

export default function DocumentPage() {
  const params = useParams();
  const id = params?.id as string;
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/document/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setDoc(data))
      .catch((err) => setError("Failed to load document"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!doc) return <div className="p-4">Not found</div>;

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold truncate">{doc.filename}</h1>
          <p className="text-xs text-gray-500">{doc.created_at}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/library" className="text-blue-600 hover:underline">
            Library
          </Link>
          <Link href="/" className="text-blue-600 hover:underline">
            Upload
          </Link>
          <Link href="/mcp-demo" className="text-blue-600 hover:underline">
            MCP Demo
          </Link>
        </div>
      </header>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
        <div className="border rounded bg-white overflow-hidden">
          <MarkdownView content={doc.markdown} />
        </div>
        <div className="overflow-hidden">
          <ChatPanel documentMarkdown={doc.markdown} documentId={doc.id} />
        </div>
      </div>
      <footer className="p-2 text-center text-xs text-gray-500 border-t bg-white">
        This is a demo - results are stored locally
      </footer>
    </div>
  );
}
