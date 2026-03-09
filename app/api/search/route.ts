import { NextRequest, NextResponse } from "next/server";

// This API route proxies requests to the Python FastAPI backend
// In production, you would configure the BACKEND_URL environment variable

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const k = searchParams.get("k") || "10";

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/search?query=${encodeURIComponent(query)}&k=${k}`
    );

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Search API error:", error);
    
    // Return mock data when backend is unavailable (for demo purposes)
    return NextResponse.json([
      {
        score: 0.85,
        path: "/documents/sample.pdf",
        title: "Sample Document",
      },
    ]);
  }
}
