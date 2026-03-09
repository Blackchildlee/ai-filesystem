import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, trashed } = body;

    const response = await fetch(`${BACKEND_URL}/files/trash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId, trashed }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Trash API error:", error);
    return NextResponse.json(
      { error: "Failed to update trash status" },
      { status: 500 }
    );
  }
}
