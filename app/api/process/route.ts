import { NextRequest, NextResponse } from "next/server";
import { extractDocument } from "@/lib/nutrient";
import { insertDocument } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const { markdown, metadata } = await extractDocument(file, file.name);
    const id = uuidv4();
    insertDocument(id, file.name, markdown, metadata);

    return NextResponse.json({ id });
  } catch (err: any) {
    console.error("Process error:", err);
    const message = err.message || "Failed to process document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
