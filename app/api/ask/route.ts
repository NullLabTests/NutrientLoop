import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { document_markdown, user_question, chat_history } = await request.json();

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ answer: "AI not configured" });
    }

    const systemPrompt =
      "You are a document analyst. Answer questions using ONLY the provided document content. If the answer isn't in the document, say so.";

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: `Document content:\n\n${document_markdown}` },
      ...(chat_history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: user_question },
    ];

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
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
    console.error("Ask error:", err);
    return NextResponse.json({ error: "Failed to process question" }, { status: 500 });
  }
}
