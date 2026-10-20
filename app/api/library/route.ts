import { NextResponse } from "next/server";
import { getAllDocuments } from "@/lib/db";

export async function GET() {
  try {
    const docs = getAllDocuments();
    return NextResponse.json({ docs });
  } catch (err) {
    console.error("Library error:", err);
    return NextResponse.json({ docs: [] });
  }
}
