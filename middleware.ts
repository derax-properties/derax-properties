import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Enforces the real security boundary for both CRM surfaces — /admin
 * (Owner/Admin) and /agent-intake (VA) — and, per the plan's "subdomain
 * architecture" section, lets a `crm.` subdomain reach the same CRM
 * without a rebuild: point crm.yourdomain.com at this same deployment in
 * Vercel (or use it on the default *.vercel.app host during development)
 * and requests to its bare root are internally rewritten to /admin. The
 * public marketing site keeps its own root on the main domain untouched.
 *
 * Auth/role checks below are the actual boundary — noindex/robots (see
 * app/robots.ts and each CRM layout's metadata) are cosmetic on top of
 * this, never a substitute for it.
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const isCrmSubdomain = host.startsWith("crm.");

  // On the CRM subdomain, a bare "/" means "open the CRM", not the
  // marketing homepage.
  if (isCrmSubdomain && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.rewrite(url);
  }

  // Bare "/" on the main public domain needs no auth check at all — skip
  // the Supabase round trip on every marketing-site homepage visit.
  if (!isCrmSubdomain && request.nextUrl.pathname === "/") {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isAgentIntakeRoute = path.startsWith("/agent-intake");
  const isLoginRoute = path === "/admin/login";
  const isAcceptInviteRoute = path.startsWith("/admin/accept-invite/");
  const isAgentLoginRoute = path === "/agent-intake/login";

  if (isAdminRoute && !isLoginRoute && !isAcceptInviteRoute) {
    if (!user) {
      const redirectUrl = new URL("/admin/login", request.url);
      redirectUrl.searchParams.set("redirectTo", path);
      return NextResponse.redirect(redirectUrl);
    }
    // A VA never reaches the full CRM dashboard — that's the entire point
    // of the separate /agent-intake surface. Role is looked up once here;
    // each page/action still checks it again server-side (defense in depth).
    const { data: profile } = await supabase.from("admin_profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role === "va") {
      return NextResponse.redirect(new URL("/agent-intake", request.url));
    }
  }

  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isAgentIntakeRoute && !isAgentLoginRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/agent-intake/login", request.url));
    }
    const { data: profile } = await supabase.from("admin_profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile && profile.role !== "va") {
      // Owners/Admins belong in the full CRM, not the intake tool.
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (user && isAgentLoginRoute) {
    return NextResponse.redirect(new URL("/agent-intake", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/agent-intake/:path*", "/"],
};
