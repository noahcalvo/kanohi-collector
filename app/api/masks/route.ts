import { NextResponse } from "next/server";
import { db } from "../../../lib/store";

export async function GET() {
  try {
    return NextResponse.json({ masks: db.masks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
