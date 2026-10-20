"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FileDrop from "@/components/FileDrop";
import SiteHeader from "@/components/SiteHeader";

const ALLOWED_EXTENSIONS = ["pdf", "docx", "png", "jpg", "jpeg"];
const MAX_BYTES = 25 * 1024 * 1024;

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [stage, setStage] = useState<"uploading" | "extracting">("uploading");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [hasKeys, setHasKeys] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if keys are configured
    fetch("/api/check-keys")
      .then((res) => res.json())
      .then((data) => setHasKeys(data.hasKeys))
      .catch(() => setHasKeys(false));
  }, []);

  const upload = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/process");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.upload.onload = () => setStage("extracting");
      xhr.onload = () => {
        let data: any = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = null;
        }
        if (xhr.status >= 200 && xhr.status < 300 && data?.id) resolve(data.id);
        else reject(new Error(data?.error || `Upload failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Could not reach the server."));
      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    });

  const handleFileSelect = async (file: File) => {
    setError("");
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(
        `Unsupported file type “.${ext || "unknown"}”. Please upload a PDF, DOCX, PNG or JPG.`
      );
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 25 MB.`
      );
      return;
    }

    setIsUploading(true);
    setStage("uploading");
    setProgress(0);
    try {
      const id = await upload(file);
      router.push(`/document/${id}`);
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <SiteHeader
        title="NutrientLoop"
        subtitle="Upload a document to extract and query"
      />

      <div className="flex justify-center mb-6">
        <FileDrop onFileSelect={handleFileSelect} isUploading={isUploading} />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      {isUploading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">
            {stage === "uploading"
              ? `Uploading… ${progress}%`
              : "Processing → Extracting…"}
          </p>
          <div className="w-64 h-2 bg-gray-200 rounded mx-auto mt-2 overflow-hidden">
            <div
              className="h-2 bg-blue-600 transition-all"
              style={{ width: `${stage === "uploading" ? progress : 100}%` }}
            />
          </div>
        </div>
      )}

      {!hasKeys && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h2 className="font-semibold text-yellow-800 mb-2">Add your API key</h2>
          <p className="text-yellow-700 text-sm">
            Please set NUTRIENT_API_KEY in your .env file to use this app.
          </p>
        </div>
      )}
    </main>
  );
}
