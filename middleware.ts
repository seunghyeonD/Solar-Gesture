import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
    default-src 'none';
    script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' blob: data:;
    media-src 'self' blob: mediastream:;
    connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com;
    worker-src 'self' blob:;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'none';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
}

export const config = {
  matcher: [
    { source: "/((?!api|_next/static|_next/image|favicon.ico).*)" },
  ],
};
