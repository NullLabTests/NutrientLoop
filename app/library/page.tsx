"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Library() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/library")
      .then((res) => res.json())
      .then((data) => setDocs(data.docs || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Document Library</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="text-blue-600 hover:underline">
            Upload
          </Link>
          <Link href="/mcp-demo" className="text-blue-600 hover:underline">
            MCP Demo
          </Link>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : docs.length === 0 ? (
        <p className="text-gray-600">No documents yet</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border">Filename</th>
              <th className="text-left p-2 border">Date</th>
              <th className="text-left p-2 border">Page count</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="p-2 border">
                  <Link href={`/document/${doc.id}`} className="text-blue-600 hover:underline">
                    {doc.filename}
                  </Link>
                </td>
                <td className="p-2 border text-sm">{doc.created_at}</td>
                <td className="p-2 border text-sm">
                  {doc.metadata?.pages || doc.metadata?.page_count || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
