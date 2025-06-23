import { type NextRequest, NextResponse } from "next/server";
import { isNoNeedProcess } from "./lib/auth";
import { auth } from "./server/auth";

export default auth((request: NextRequest) => {
  if (isNoNeedProcess(request)) return;

  const fullPath = request.nextUrl.pathname;
  const isAuth = !!(request as any).auth;
  const isAuthRoute = /^\/(sign-in|forgot-password|reset-password)/.test(fullPath);
  const isRootRoute = fullPath === '/';

  if (isRootRoute) {
    return NextResponse.next();
  }

  if (!fullPath.startsWith('/app') && !isAuthRoute) {
    const newUrl = new URL(`/app${fullPath}`, request.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  if (fullPath.startsWith('/app')) {
    if (!isAuth) {
      return NextResponse.redirect(
        new URL(`/sign-in?from=${encodeURIComponent(fullPath)}`, request.nextUrl.origin)
      );
    }
  }

  if (isAuth && isAuthRoute) {
    const from = request.nextUrl.searchParams.get("from") || '/app';
    return NextResponse.redirect(new URL(from, request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};