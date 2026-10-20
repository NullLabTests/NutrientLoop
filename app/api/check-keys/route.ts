import { NextResponse } from "next/server";

export async function GET() {
  const hasKeys = !!(process.env.NUTRIENT_API_KEY || process.env.NUTRIENT_EXTRACTION_API_KEY);
  return NextResponse.json({ hasKeys });
}
