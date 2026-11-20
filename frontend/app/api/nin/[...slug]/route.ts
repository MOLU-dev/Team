// app/api/nin/[...slug]/route.ts
// Proxies mock NIN & phone verification requests to the backend.
// Defaults to BACKEND_API_URL (/api/v1/nin) or MOCK_KYC_URL if running standalone.

import { NextRequest, NextResponse } from "next/server"

const BACKEND_BASE = process.env.MOCK_KYC_URL || process.env.BACKEND_API_URL || "http://localhost:8080/api/v1"

function buildTargetUrl(slug: string[], search: string): string {
  // If using standalone mock KYC server directly (e.g. http://localhost:8089/v1)
  if (process.env.MOCK_KYC_URL) {
    const base = process.env.MOCK_KYC_URL.replace(/\/+$/, "")
    return `${base}/${slug.join("/")}${search}`
  }
  // If using main wallet backend (http://localhost:8080/api/v1/nin/...)
  const base = BACKEND_BASE.replace(/\/+$/, "")
  return `${base}/nin/${slug.join("/")}${search}`
}

async function proxyRequest(req: NextRequest, params: { slug: string[] }) {
  const url = buildTargetUrl(params.slug, req.nextUrl.search)

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  const authHeader = req.headers.get("authorization")
  if (authHeader) {
    headers["Authorization"] = authHeader
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const body = await req.text()
      if (body) init.body = body
    } catch {
      // Empty body
    }
  }

  try {
    const upstream = await fetch(url, init)
    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status })
  } catch (err: any) {
    // If primary failed (e.g. main backend port 8080 is down), try standalone mock KYC server on port 8089
    const fallbackBase = "http://localhost:8089/v1"
    const fallbackUrl = `${fallbackBase}/${params.slug.join("/")}${req.nextUrl.search}`
    if (url !== fallbackUrl) {
      try {
        const upstream = await fetch(fallbackUrl, init)
        const data = await upstream.json().catch(() => ({}))
        return NextResponse.json(data, { status: upstream.status })
      } catch (fallbackErr: any) {
        console.error("Mock KYC Proxy Fallback Error:", fallbackErr)
      }
    }

    console.error("Mock KYC Proxy Error:", err)
    return NextResponse.json(
      {
        error: "Mock KYC upstream service unavailable. Ensure backend or standalone mock server is running.",
        details: err?.message,
      },
      { status: 502 }
    )
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolved = await params
  return proxyRequest(req, resolved)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolved = await params
  return proxyRequest(req, resolved)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolved = await params
  return proxyRequest(req, resolved)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
