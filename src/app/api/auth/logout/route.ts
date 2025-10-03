// app/api/auth/logout/route.ts
import redis from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";


/**
 * ENV utilizadas:
 * - AUTH_COOKIE_NAME   (ex: "pcon_token")
 * - COOKIE_DOMAIN      (opcional; ex: "local.correios.com.br")
 * - CAS_BASE_URL       (ex: "https://cas.seudominio.gov.br/cas")
 * - CAS_LOGOUT_PARAM   (opcional: "url" | "service"; padrão "url")
 */

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "pcon_token";
const AUTH_COOKIE_MENU_NAME = process.env.AUTH_COOKIE_NAME || "pcon_menu";
const NEXT_AUTH_JWT_SECRET = process.env.NEXT_AUTH_JWT_SECRET

function secret() {
  return new TextEncoder().encode(process.env.NEXT_AUTH_JWT_SECRET);
}


const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN; // ex.: "local.correios.com.br"
const CAS_BASE_URL = process.env.CAS_BASE_URL;

/** Descobre proto/host/porta respeitando proxy/reverse-proxy */
function getBaseUrl(req: NextRequest) {
  const hostHeader =
    req.headers.get("referer") ?? req.headers.get("host");
  
  // Fallback explícito ao seu host local com porta
  //const host = hostHeader ?? "local.correios.com.br:24731";
  const host = hostHeader ?? "https://localhost:24731";    

  return `${host}`;


  
}

/** URL para onde o usuário deve voltar após o logout (home por padrão) */
function buildReturnUrl(req: NextRequest) {
  const base = getBaseUrl(req);
  return new URL("/", base).toString(); // ex: https://local.correios.com.br:24731/
}

/** Monta a URL de logout do CAS com o parâmetro correto (url ou service) */
function buildCasLogoutUrl(returnUrl: string) {
  if (!CAS_BASE_URL) return returnUrl;
  const paramName = "service";
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
async function handleLogout(req: NextRequest, doRedirect = true) {
  const returnUrl = buildReturnUrl(req);
  const redirectTo = buildCasLogoutUrl(returnUrl);

  const res = doRedirect
    ? NextResponse.redirect(redirectTo, { status: 302 })
    : NextResponse.json({ success: true, redirectTo });

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      const sessiosId = payload.sessiosId;      
      if (sessiosId) {
        const chave = `sessao:${typeof sessiosId === "string" ? sessiosId : JSON.stringify(sessiosId)}`;
        console.log("Chave da sessão a ser removida do Redis:", chave);
        const result = await redis.del(chave);
        console.log("Resultado do redis.del:", result); // Deve ser 1 se apagou, 0 se não existia
      }
    } catch (e) {
      console.error("Erro ao verificar token JWT durante logout:", e);
      return NextResponse.json('Erro ao processar logout', { status: 500 });
    }
  }

  clearAuthCookie(res, AUTH_COOKIE_NAME);
  clearAuthCookie(res, AUTH_COOKIE_MENU_NAME);

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
