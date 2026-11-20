import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Trusted headers, in order of reliability.
 * Vercel's request.ip is separate and handled first.
 */
const TRUSTED_IP_HEADERS = [
  'True-Client-IP',
  'X-Real-IP',
  'X-Forwarded-For',
] as const;

function parseClientIp(request: NextRequest): string {
  // 1. Vercel provides a trusted IP directly
  const ip = (request as any).ip;
  if (ip) {
    return ip;
  }

  // 2. Check other common proxy headers
  for (const header of TRUSTED_IP_HEADERS) {
    const value = request.headers.get(header);
    if (!value) continue;

    // X-Forwarded-For may contain multiple IPs
    if (header === 'X-Forwarded-For') {
      const ips = value.split(',').map(ip => ip.trim());
      // Leftmost non-private IP (skip local/proxy IPs if needed)
      for (const ip of ips) {
        // Simple check to ignore private addresses
        if (!ip.startsWith('10.') && !ip.startsWith('192.168.') &&
            !ip.startsWith('172.16.') && ip !== '127.0.0.1') {
          return ip;
        }
      }
      // Fallback to the first IP even if private (trust the proxy)
      if (ips.length > 0) return ips[0];
    } else {
      // Single IP headers
      return value.trim();
    }
  }

  // Last resort: RemoteAddr (usually the proxy's IP, not the client)
  return '';
}

export function proxy(request: NextRequest) {
  let clientIp = parseClientIp(request);

  // --- Development-only simulation (kept safe by NODE_ENV) ---
  if (process.env.NODE_ENV === 'development') {
    const simulated = request.headers.get('x-simulate-ip');
    if (simulated) clientIp = simulated;
  }

  // Forward the resolved IP to API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-forwarded-for', clientIp);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: '/api/:path*',
};
