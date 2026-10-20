import { NextRequest, NextResponse } from "next/server";
import { getDocument } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = getDocument(id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (err) {
    console.error("Get document error:", err);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}
