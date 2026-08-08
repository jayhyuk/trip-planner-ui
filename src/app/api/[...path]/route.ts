import { NextRequest, NextResponse } from "next/server";

// Server-only env var (no NEXT_PUBLIC_ prefix) so the backend URL and any future
// credentials never reach the browser. Falls back to the known default for local dev.
const API_BASE_URL = process.env.API_BASE_URL || "http://13.214.216.246:9189";

async function proxy(req: NextRequest, path: string[]) {
  const targetUrl = `${API_BASE_URL}/api/${path.join("/")}${req.nextUrl.search}`;

  const init: RequestInit = {
    method: req.method,
    headers: { "Content-Type": "application/json" },
  };

  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "DELETE") {
    const body = await req.text();
    if (body) init.body = body;
  }

  try {
    const upstream = await fetch(targetUrl, init);
    const text = await upstream.text();
    return new NextResponse(text || null, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the trip planner API. Please try again later." },
      { status: 502 },
    );
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
