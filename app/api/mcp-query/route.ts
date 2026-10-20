import { NextRequest, NextResponse } from "next/server";
import { getAllDocuments, getDocument } from "@/lib/db";
import { answerFromDocument } from "@/lib/answer";

const SYSTEM_PROMPT =
  "You are a document analysis tool. Use ONLY the provided document content. " +
  "If the answer is not present, say so.";

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

    // Always targets the most recently processed document.
    const latest = getDocument(docs[0].id);
    if (!latest) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ answer: answerFromDocument(prompt, latest.markdown) });
    }

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
            { role: "system", content: SYSTEM_PROMPT },
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
            "The LLM backend could not be reached, so here is what the document itself says:\n\n" +
            answerFromDocument(prompt, latest.markdown),
        });
      }

      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content;
      if (!answer) {
        return NextResponse.json({ answer: answerFromDocument(prompt, latest.markdown) });
      }
      return NextResponse.json({ answer });
    } catch (err) {
      console.error("OpenAI request failed:", err);
      return NextResponse.json({
        answer:
          "The LLM backend could not be reached, so here is what the document itself says:\n\n" +
          answerFromDocument(prompt, latest.markdown),
      });
    }
  } catch (err) {
    console.error("MCP query error:", err);
    return NextResponse.json({ error: "Failed to process the prompt" }, { status: 500 });
  }
}
