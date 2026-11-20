// app/api/kyc/[...slug]/route.ts
// Thin proxy — forwards KYC requests to the Go backend with the user's JWT.
// This avoids CORS issues and keeps the backend URL server-side only.

import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/api/v1'

async function proxy(req: NextRequest, params: { slug: string[] }) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const path = "/kyc/" + params.slug.join("/")
  const url = `${BACKEND_URL}${path}${req.nextUrl.search}`

  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const body = await req.text()
      if (body) init.body = body
    } catch (err) {
      // ignore body parsing error for empty bodies
    }
  }

  try {
    const upstream = await fetch(url, init)
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err: any) {
    console.error("KYC Proxy Error:", err)
    return NextResponse.json({ error: "Upstream service unavailable" }, { status: 502 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  return proxy(req, resolvedParams);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  return proxy(req, resolvedParams);
}
