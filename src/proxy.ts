import { NextResponse } from "next/server";
import { authProxy } from "@/server/auth";

const SIGN_IN = "/sign-in";
const CHANGE_PASSWORD = "/change-password";
const HOME = "/app";

export default authProxy((request) => {
  const { nextUrl, auth: session } = request;
  const { pathname, search } = nextUrl;

  if (!session?.user) {
    const signIn = new URL(SIGN_IN, nextUrl);
    if (pathname !== CHANGE_PASSWORD) signIn.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signIn);
  }

  const mustChangePassword = session.user.hasDefaultPassword === true;
  if (mustChangePassword && pathname !== CHANGE_PASSWORD) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD, nextUrl));
  }
  if (!mustChangePassword && pathname === CHANGE_PASSWORD) {
    return NextResponse.redirect(new URL(HOME, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/change-password", "/presentation/control/:path*", "/presentation/remote/:path*"],
};
