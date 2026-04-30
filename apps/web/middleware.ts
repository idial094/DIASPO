import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("auth_role")?.value;

  const legacyPathMap: Record<string, string> = {
    "/dashboard": "/diaspora/dashboard",
    "/documents": "/diaspora/documents",
    "/projets": "/agence/projets",
    "/chantier": "/agence/chantier"
  };
  const legacyRolePaths = new Set(["/messages", "/paiements", "/colis"]);

  if (legacyPathMap[pathname]) {
    return NextResponse.redirect(new URL(legacyPathMap[pathname], request.url));
  }

  if (legacyRolePaths.has(pathname)) {
    const base = role === "agence" ? "/agence" : "/diaspora";
    return NextResponse.redirect(new URL(`${base}${pathname}`, request.url));
  }

  if (pathname.startsWith("/admin")) {
    const isAdminLoginPath = pathname === "/admin/login";
    const adminToken = request.cookies.get("admin_token")?.value;
    const sessionExpiryRaw = request.cookies.get("admin_session_expires_at")?.value;
    const sessionExpiryMs = Number.parseInt(sessionExpiryRaw ?? "0", 10);
    const hasValidSessionExpiry = Number.isFinite(sessionExpiryMs) && sessionExpiryMs > Date.now();
    // Token is a real JWT (non-empty string with dots) and session not expired
    const hasValidAdminAuth = Boolean(adminToken) && adminToken!.includes(".") && hasValidSessionExpiry;

    if (!hasValidAdminAuth && !isAdminLoginPath) {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.set("admin_token", "", { path: "/", maxAge: 0 });
      response.cookies.set("admin_session_expires_at", "", { path: "/", maxAge: 0 });
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }

    if (hasValidAdminAuth && isAdminLoginPath) {
      const response = NextResponse.redirect(new URL("/admin/dashboard", request.url));
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }

    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  const isDiasporaPath = pathname.startsWith("/diaspora");
  const isAgencePath = pathname.startsWith("/agence");
  const isProtectedUserPath = isDiasporaPath || isAgencePath;
  const isPublicLoginPath = pathname === "/login";

  if (isProtectedUserPath || isPublicLoginPath) {
    const token = request.cookies.get("auth_token")?.value;
    const sessionExpiryRaw = request.cookies.get("auth_session_expires_at")?.value;
    const sessionExpiryMs = Number.parseInt(sessionExpiryRaw ?? "0", 10);
    const hasValidSessionExpiry = Number.isFinite(sessionExpiryMs) && sessionExpiryMs > Date.now();
    const hasValidAuth = Boolean(token) && hasValidSessionExpiry;

    if (isPublicLoginPath && hasValidAuth) {
      const redirectPath = role === "agence" ? "/agence/projets" : "/diaspora/dashboard";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    if (isProtectedUserPath && !hasValidAuth) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
      response.cookies.set("auth_role", "", { path: "/", maxAge: 0 });
      response.cookies.set("auth_session_expires_at", "", { path: "/", maxAge: 0 });
      return response;
    }

    if (isDiasporaPath && role === "agence") {
      return NextResponse.redirect(new URL("/agence/projets", request.url));
    }

    if (isAgencePath && role === "diaspora") {
      return NextResponse.redirect(new URL("/diaspora/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/dashboard",
    "/documents",
    "/messages",
    "/paiements",
    "/colis",
    "/projets",
    "/chantier",
    "/diaspora/:path*",
    "/agence/:path*"
  ]
};
