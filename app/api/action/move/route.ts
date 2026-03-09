import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, dest, k = 20, threshold = 0.4 } = body;

    if (!query || !dest) {
      return NextResponse.json(
        { error: "Query and dest parameters are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/action/move?query=${encodeURIComponent(query)}&dest=${encodeURIComponent(dest)}&k=${k}&threshold=${threshold}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Move action API error:", error);
    
    // Return mock response when backend is unavailable
    return NextResponse.json({
      moved: 0,
      dest: "",
      files: [],
      error: "Backend unavailable - running in demo mode",
    });
  }
}
