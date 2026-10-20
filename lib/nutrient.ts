export interface ExtractionResult {
  markdown: string;
  metadata: {
    pages: number | null;
    processing_time_ms: number | null;
  };
}

export async function extractDocument(file: File | Blob, filename: string): Promise<ExtractionResult> {
  const apiKey = process.env.NUTRIENT_API_KEY || process.env.NUTRIENT_EXTRACTION_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NUTRIENT_API_KEY or NUTRIENT_EXTRACTION_API_KEY");
  }

  const formData = new FormData();
  formData.append("file", file, filename);
  formData.append(
    "instructions",
    JSON.stringify({ mode: "understand", output: { format: "markdown" } })
  );

  let res: Response;
  try {
    res = await fetch("https://api.nutrient.io/extraction/parse", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });
  } catch (err) {
    console.error("Nutrient request failed:", err);
    throw new Error("Could not reach the Nutrient DWS API. Check your network connection.");
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error("Nutrient API error:", res.status, errorText);
    const detail = res.status === 401 || res.status === 403 ? " (check your NUTRIENT_API_KEY)" : "";
    throw new Error(`Nutrient extraction failed: ${res.status} ${res.statusText}${detail}`);
  }

  let data: any;
  try {
    data = await res.json();
  } catch (err) {
    console.error("Nutrient returned invalid JSON:", err);
    throw new Error("Nutrient returned an unexpected response.");
  }

  const markdown: string = data.output?.markdown ?? "";
  if (!markdown.trim()) {
    console.error("Nutrient response contained no markdown:", Object.keys(data));
    throw new Error("Nutrient returned no extractable content for this file.");
  }

  return {
    markdown,
    metadata: {
      pages: data.metrics?.pagesProcessed ?? null,
      processing_time_ms: data.metrics?.processingTimeMs ?? null,
    },
  };
}
