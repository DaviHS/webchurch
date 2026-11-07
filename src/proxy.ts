import { NextResponse } from "next/server";
import { authProxy } from "@/server/auth";

const SIGN_IN = "/sign-in";
const CHANGE_PASSWORD = "/change-password";
const HOME = "/app";
/** Porta de entrada do app instalado: quem já está logado cai na Bíblia; quem não está, entra e vai para o início. */
const ENTRY = "/entrada";
const LANDING = "/app/bible";

export default authProxy((request) => {
  const { nextUrl, auth: session } = request;
  const { pathname, search } = nextUrl;

  if (!session?.user) {
    const signIn = new URL(SIGN_IN, nextUrl);
    if (pathname !== CHANGE_PASSWORD && pathname !== ENTRY) signIn.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signIn);
  }

  const mustChangePassword = session.user.hasDefaultPassword === true;
  if (mustChangePassword && pathname !== CHANGE_PASSWORD) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD, nextUrl));
  }
  if (!mustChangePassword && pathname === CHANGE_PASSWORD) {
    return NextResponse.redirect(new URL(HOME, nextUrl));
  }

  if (pathname === ENTRY) return NextResponse.redirect(new URL(LANDING, nextUrl));

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/entrada", "/change-password", "/presentation/control/:path*", "/presentation/remote/:path*"],
};
