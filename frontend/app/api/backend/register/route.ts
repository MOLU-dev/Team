import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for') || '';

    // Extract the body from the incoming request
    const body = await request.json();

    // Forward to your Golang backend
    // Note: Adjust the URL if your backend is running on a different port or host in production
    const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:8080';
    const backendRes = await fetch(`${BACKEND_URL}/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Forwarded-For': clientIp 
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    console.error('Proxy register error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
