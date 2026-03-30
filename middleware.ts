import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Next.js generates inline scripts for hydration/chunk loading
  // that cannot receive a nonce in the current App Router architecture,
  // so 'unsafe-inline' is required for script-src.
  //
  // Mitigations for this trade-off:
  // - 'strict-dynamic' is NOT used (it would bypass host allowlists)
  // - CDN scripts are protected by SRI hashes in the client code
  // - All other CSP directives remain maximally strict
  // - script-src is locked to 'self' + one CDN domain only
  const cspHeader = `
    default-src 'none';
    script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net;
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

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", cspHeader);

  // Prevent caching of HTML responses to ensure CSP is always fresh
  if (request.headers.get("accept")?.includes("text/html")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
  }

  return response;
}

export const config = {
  matcher: [
    { source: "/((?!api|_next/static|_next/image|favicon.ico).*)" },
  ],
};
