import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // Set current path header so server components can access the request URL
  response.headers.set("x-current-path", request.nextUrl.pathname + request.nextUrl.search);
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
