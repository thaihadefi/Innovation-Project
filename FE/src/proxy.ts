import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if(token) {
    return NextResponse.next();
  } else {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
 
export const config = {
  matcher: [
    '/company-manage/:path*', 
    '/user-manage/:path*', 
  ],
}