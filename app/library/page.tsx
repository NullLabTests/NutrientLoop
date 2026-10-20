"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function Library() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/library")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setDocs(data.docs || []))
      .catch(() => setError("Could not load the document library."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <SiteHeader title="Document Library" subtitle="Processed documents stored locally" />

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : docs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No documents yet</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Upload your first document
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
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
                  <td className="p-2 border text-sm">{doc.page_count ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
