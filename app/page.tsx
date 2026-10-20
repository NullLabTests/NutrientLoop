"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FileDrop from "@/components/FileDrop";
import Link from "next/link";

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [hasKeys, setHasKeys] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if keys are configured
    fetch("/api/check-keys")
      .then((res) => res.json())
      .then((data) => setHasKeys(data.hasKeys))
      .catch(() => setHasKeys(false));
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setStatus("Uploading → Processing → Extracting");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Upload failed");
        setIsUploading(false);
        setStatus("");
        return;
      }

      const data = await res.json();
      router.push(`/document/${data.id}`);
    } catch (err) {
      alert("Upload failed");
      setIsUploading(false);
      setStatus("");
    }
  };

  if (!hasKeys) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-4">Document Intelligence Pipeline</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h2 className="font-semibold text-yellow-800 mb-2">Add your API key</h2>
          <p className="text-yellow-700 text-sm">
            Please set NUTRIENT_API_KEY in your .env file to use this app.
          </p>
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <Link href="/library" className="text-blue-600 hover:underline">
            Document Library
          </Link>
          <Link href="/mcp-demo" className="text-blue-600 hover:underline">
            MCP Demo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Document Intelligence Pipeline</h1>
      <p className="text-gray-600 mb-6">Upload a document to extract and query</p>

      <div className="flex justify-center mb-6">
        <FileDrop onFileSelect={handleFileSelect} isUploading={isUploading} />
      </div>

      {isUploading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">{status}</p>
        </div>
      )}

      <div className="mt-8 flex gap-4 text-sm justify-center">
        <Link href="/library" className="text-blue-600 hover:underline">
          Document Library
        </Link>
        <Link href="/mcp-demo" className="text-blue-600 hover:underline">
          MCP Demo
        </Link>
      </div>
    </main>
  );
}
