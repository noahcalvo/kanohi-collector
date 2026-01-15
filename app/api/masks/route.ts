import { NextResponse } from "next/server";
import { masks } from "../../../lib/staticData";

export async function GET() {
  try {
    return NextResponse.json({ masks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
