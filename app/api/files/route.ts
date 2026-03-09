import { NextRequest, NextResponse } from "next/server";

// This API route proxies requests to the Python FastAPI backend
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get("path") || "/";
  const section = searchParams.get("section") || "home";

  try {
    const response = await fetch(
      `${BACKEND_URL}/files?path=${encodeURIComponent(path)}&section=${encodeURIComponent(section)}`
    );

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Files API error:", error);
    
    // Return error when backend is unavailable
    return NextResponse.json(
      { 
        error: "Backend unavailable", 
        message: "Please ensure the Python backend is running on port 8000. Run: python -m runtime.cli serve",
        files: []
      },
      { status: 503 }
    );
  }
}
