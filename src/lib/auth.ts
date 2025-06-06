import { type NextRequest } from "next/server";
import { signOut } from "next-auth/react"
import { FILTER_STORAGE_KEY } from "./utils"

const noNeedProcessRoute = [".*\\.png", ".*\\.jpg", ".*\\.opengraph-image.png"];
const noRedirectRoute = ["/api(.*)", "/trpc(.*)", "/admin"];
const publicRoute = [
  "^/\\w{2}$",
  "/(\\w{2}/)?forgot-password(.*)",
  "/(\\w{2}/)?recovery-password(.*)",
];

export const isValidateRoute = (
  request: NextRequest,
  routes: string[],
): boolean => {
  const pathname = request.nextUrl.pathname;
  return routes.some((route) => new RegExp(route).test(pathname));
};

export const isNoRedirect = (request: NextRequest): boolean => {
  return isValidateRoute(request, noRedirectRoute);
};

export const isPublicPage = (request: NextRequest): boolean => {
  return isValidateRoute(request, publicRoute);
};

export const isNoNeedProcess = (request: NextRequest): boolean => {
  return isValidateRoute(request, noNeedProcessRoute);
};

export const logoutAndClearFilters = async () => {
  localStorage.removeItem(FILTER_STORAGE_KEY); 
  await signOut({ callbackUrl: `/sign-in` }); 
};
