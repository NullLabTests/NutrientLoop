import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT =
  "You are a document analyst. Answer questions using ONLY the provided document content. If the answer isn't in the document, say so.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.user_question !== "string" || !body.user_question.trim()) {
      return NextResponse.json({ error: "A user_question is required." }, { status: 400 });
    }

    const document_markdown = typeof body.document_markdown === "string" ? body.document_markdown : "";
    const user_question = body.user_question;
    const chat_history: { role: string; content: string }[] = Array.isArray(body.chat_history)
      ? body.chat_history.slice(-10)
      : [];

    if (!document_markdown.trim()) {
      return NextResponse.json({ error: "No document content to analyze." }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({
        answer:
          "AI not configured — set OPENAI_API_KEY in your .env to enable document Q&A. " +
          "Extraction and storage are still fully functional.",
      });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `Document content:\n\n${document_markdown}` },
      ...chat_history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: user_question },
    ];

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({ model: "gpt-4o-mini", messages, temperature: 0.3 }),
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
    console.error("Ask error:", err);
    return NextResponse.json({ error: "Failed to process question" }, { status: 500 });
  }
}
