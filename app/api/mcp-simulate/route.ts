import { NextRequest, NextResponse } from "next/server";
import { getAllDocuments, getDocument } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const prompt = body?.prompt;
    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
    }

    const docs = getAllDocuments();
    if (docs.length === 0) {
      return NextResponse.json(
        { error: "No documents uploaded yet — process a document first." },
        { status: 400 }
      );
    }

    // The simulation always targets the most recently processed document.
    const latest = getDocument(docs[0].id);
    if (!latest) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({
        answer:
          "AI not configured — set OPENAI_API_KEY in your .env to run this simulation. " +
          "Extraction and storage are still fully functional.",
      });
    }

    const systemPrompt =
      "You are simulating an MCP tool that processes documents. Use ONLY the provided document content.";

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "system", content: `Document content:\n\n${latest.markdown}` },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        console.error("OpenAI error:", res.status, await res.text().catch(() => ""));
        return NextResponse.json({
          answer:
            "AI service unavailable — the Q&A backend could not be reached. " +
            "Extraction and storage are still fully functional.",
        });
      }

      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content;
      if (!answer) {
        return NextResponse.json({ answer: "The model returned an empty response." });
      }
      return NextResponse.json({ answer });
    } catch (err) {
      console.error("OpenAI request failed:", err);
      return NextResponse.json({
        answer:
          "AI service unavailable — the Q&A backend could not be reached. " +
          "Extraction and storage are still fully functional.",
      });
    }
  } catch (err) {
    console.error("MCP simulate error:", err);
    return NextResponse.json({ error: "Failed to simulate" }, { status: 500 });
  }
}
