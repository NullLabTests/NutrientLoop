import { NextRequest, NextResponse } from "next/server";
import { answerFromDocument } from "@/lib/answer";

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
      // No model configured: answer deterministically from the document instead
      // of returning a dead end, so the demo stays useful out of the box.
      return NextResponse.json({ answer: answerFromDocument(user_question, document_markdown) });
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
            "The LLM backend could not be reached, so here is what the document itself says:\n\n" +
            answerFromDocument(user_question, document_markdown),
        });
      }

      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content;
      if (!answer) {
        return NextResponse.json({ answer: answerFromDocument(user_question, document_markdown) });
      }
      return NextResponse.json({ answer });
    } catch (err) {
      console.error("OpenAI request failed:", err);
      return NextResponse.json({
        answer:
          "The LLM backend could not be reached, so here is what the document itself says:\n\n" +
          answerFromDocument(user_question, document_markdown),
      });
    }
  } catch (err) {
    console.error("Ask error:", err);
    return NextResponse.json({ error: "Failed to process question" }, { status: 500 });
  }
}
