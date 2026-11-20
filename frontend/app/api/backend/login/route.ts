import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for') || '';
    const userAgent = headersList.get('user-agent') || '';

    const body = await request.json();

    const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:8080';
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Forwarded-For': clientIp,
        'User-Agent': userAgent
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    console.error('Proxy login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
