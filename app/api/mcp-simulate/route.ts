import { NextRequest, NextResponse } from "next/server";
import { getAllDocuments } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    const docs = getAllDocuments();
    if (docs.length === 0) {
      return NextResponse.json({ error: "No documents uploaded yet" }, { status: 400 });
    }

    // Get most recent document's full content
    const { getDocument } = await import("@/lib/db");
    const latest = getDocument(docs[0].id);
    if (!latest) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ answer: "AI not configured" });
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
        console.error("OpenAI error:", res.status);
        return NextResponse.json({ answer: "AI not configured" });
      }

      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content || "No response";
      return NextResponse.json({ answer });
    } catch (err) {
      console.error("OpenAI request failed:", err);
      return NextResponse.json({ answer: "AI not configured" });
    }
  } catch (err) {
    console.error("MCP simulate error:", err);
    return NextResponse.json({ error: "Failed to simulate" }, { status: 500 });
  }
}
