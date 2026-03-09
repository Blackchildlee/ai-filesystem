import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/folders`);

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Folders API error:", error);
    
    return NextResponse.json(
      { 
        error: "Backend unavailable",
        folders: []
      },
      { status: 503 }
    );
  }
}
