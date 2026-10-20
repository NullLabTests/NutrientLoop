export async function extractDocument(file: File | Blob, filename: string) {
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

  try {
    const res = await fetch("https://api.nutrient.io/extraction/parse", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Nutrient API error:", res.status, errorText);
      throw new Error(`Nutrient API failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    // Extract markdown content - structure may vary
    const markdown = data.markdown || data.content || data.text || JSON.stringify(data);
    return { markdown, raw: data };
  } catch (err) {
    console.error("Nutrient extraction failed:", err);
    throw err;
  }
}
