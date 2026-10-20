import { NextRequest, NextResponse } from "next/server";
import { extractDocument } from "@/lib/nutrient";
import { insertDocument } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_EXTENSIONS = ["pdf", "docx", "png", "jpg", "jpeg"];
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file type “.${ext || "unknown"}”. Please upload a PDF, DOCX, PNG or JPG.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). The limit is 25 MB.` },
        { status: 400 }
      );
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
