import { NextResponse, type NextRequest } from 'next/server';

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];

function getAllowedOrigin(origin: string | null) {
  if (!origin) {
    return null;
  }

  const allowedOrigins = (process.env.CORS_ORIGIN ?? defaultOrigins.join(','))
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  if (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin)) {
    return origin;
  }

  return null;
}

function isLocalDevOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const isLoopbackHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const isHttp = url.protocol === 'http:';

    return isHttp && isLoopbackHost && Boolean(url.port);
  } catch {
    return false;
  }
}

function applyCorsHeaders(response: NextResponse, origin: string | null) {
  const allowedOrigin = getAllowedOrigin(origin);

  if (!allowedOrigin) {
    return response;
  }

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Vary', 'Origin');

  return response;
}

export function proxy(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), request.headers.get('origin'));
  }

  return applyCorsHeaders(NextResponse.next(), request.headers.get('origin'));
}

export const config = {
  matcher: '/api/:path*',
};
