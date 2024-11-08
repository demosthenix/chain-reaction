import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/socketio")) {
    const upgradeHeader = request.headers.get("upgrade");
    if (upgradeHeader === "websocket") {
      return NextResponse.next({
        headers: {
          upgrade: upgradeHeader,
          connection: "upgrade",
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/socketio/:path*",
};
