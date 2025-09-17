// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * ENV utilizadas:
 * - AUTH_COOKIE_NAME   (ex: "pcon_token")
 * - COOKIE_DOMAIN      (opcional; ex: "local.correios.com.br")
 * - CAS_BASE_URL       (ex: "https://cas.seudominio.gov.br/cas")
 * - CAS_LOGOUT_PARAM   (opcional: "url" | "service"; padrão "url")
 */

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "pcon_token";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN; // ex.: "local.correios.com.br"
const CAS_BASE_URL = process.env.CAS_BASE_URL;
const CAS_PARAM = (process.env.CAS_LOGOUT_PARAM || "url").toLowerCase() as
  | "url"
  | "service";

/** Descobre proto/host/porta respeitando proxy/reverse-proxy */
function getBaseUrl(req: NextRequest) {
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (req.nextUrl.protocol.replace(":", "") || "https");
  const hostHeader =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  // Fallback explícito ao seu host local com porta
  const host = hostHeader ?? "local.correios.com.br:24731";
  return `${proto}://${host}`;
}

/** URL para onde o usuário deve voltar após o logout (home por padrão) */
function buildReturnUrl(req: NextRequest) {
  const base = getBaseUrl(req);
  return new URL("/", base).toString(); // ex: https://local.correios.com.br:24731/
}

/** Monta a URL de logout do CAS com o parâmetro correto (url ou service) */
function buildCasLogoutUrl(returnUrl: string) {
  if (!CAS_BASE_URL) return returnUrl;
  const paramName = CAS_PARAM === "service" ? "service" : "url";
  // Alguns CAS exigem whitelisting do returnUrl
  return `${CAS_BASE_URL.replace(/\/$/, "")}/logout?${paramName}=${encodeURIComponent(
    returnUrl
  )}`;
}

/** Limpa o cookie de autenticação (host-only e, se definido, com domain) */
function clearAuthCookie(res: NextResponse, name: string) {
  // 1) Remoção host-only (sem domain)
  res.cookies.set(name, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    secure: true,
    sameSite: "lax",
  });
  // 2) Remoção com domain explícito (caso tenha sido criado com domain)
  if (COOKIE_DOMAIN) {
    res.cookies.set(name, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      secure: true,
      sameSite: "lax",
      domain: COOKIE_DOMAIN,
    });
  }
}

/** Implementação principal do logout */
function handleLogout(req: NextRequest, doRedirect = true) {
  const returnUrl = buildReturnUrl(req);
  const redirectTo = buildCasLogoutUrl(returnUrl);

  const res = doRedirect
    ? NextResponse.redirect(redirectTo, { status: 302 })
    : NextResponse.json({ success: true, redirectTo });

  clearAuthCookie(res, COOKIE_NAME);
  return res;
}

/** GET — ideal para <a href="/api/auth/logout">Logout</a> */
export async function GET(req: NextRequest) {
  return handleLogout(req, true);
}

/** POST — caso queira disparar via fetch e decidir o redirect no front */
export async function POST(req: NextRequest) {
  // Retorna JSON com redirectTo; o front faz window.location.href = redirectTo
  return handleLogout(req, false);
}
