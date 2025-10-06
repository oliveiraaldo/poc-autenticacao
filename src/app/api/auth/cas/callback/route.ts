/**
 * CALLBACK DE AUTENTICAÇÃO CAS
 * 
 * Este endpoint é chamado pelo servidor CAS após o usuário fazer login.
 * Recebe um ticket, valida no CAS, extrai dados do usuário,
 * decodifica JWT interno do CAS, cria JWT local e redireciona para a página inicial.
 */

import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { randomUUID } from "crypto";
import redis from '@/lib/redis'


// Função para obter a chave secreta para assinar JWTs
function secret() {
  const s = process.env.NEXT_AUTH_JWT_SECRET;
  if (!s) throw new Error("NEXT_AUTH_JWT_SECRET ausente");
  return new TextEncoder().encode(s); // Converte string para bytes
}

/** Valida ticket no servidor CAS - Tenta p3 (versão mais nova) e depois p2 (versão antiga) */
async function fetchValidate(
  base: string,
  service: string,
  ticket: string
): Promise<{
  ok: boolean;
  json: Record<string, any>;
  tried: string[];
  status: number;
}> {
  // URLs de validação CAS: primeiro tenta p3 (mais recursos), depois p2 (básico)
  const urls = [
    `${base}/p3/serviceValidate?service=${encodeURIComponent(service)}&ticket=${encodeURIComponent(ticket)}&format=json`,
    //`${base}/serviceValidate?service=${encodeURIComponent(service)}&ticket=${encodeURIComponent(ticket)}`
  ];
  let lastStatus = 0, lastText: Record<string, any> = {};

  // Tenta cada URL até encontrar uma que funcione
  for (const u of urls) {
    const r = await fetch(u, { cache: "no-store" }); // Sem cache para garantir validação fresca
    lastStatus = r.status;
    lastText = await r.json();
    if (r.ok) return { ok: true, json: lastText, tried: urls, status: r.status };
  }
  return { ok: false, json: lastText, tried: urls, status: lastStatus };
}

// Função principal do callback - processada quando o CAS redireciona de volta
export async function GET(req: NextRequest) {
  console.log("Iniciando callback de autenticação CAS...");
  const url = new URL(req.url);
  const ticket = url.searchParams.get("ticket"); // Ticket de autenticação do CAS
  const debug = url.searchParams.get("debug") === "1"; // Modo debug para mostrar detalhes extras

  // Valida se o ticket foi fornecido
  if (!ticket) {
    return NextResponse.json({ error: "no_ticket" }, { status: 400 });
  }

  // Carrega variáveis de ambiente necessárias
  const CAS_BASE_URL = process.env.CAS_BASE_URL; // URL base do servidor CAS
  const SERVICE_URL = process.env.SERVICE_URL;   // URL do nosso serviço (callback)
  const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "pcon_token"; // Nome do cookie
  const AUTH_COOKIE_MENU_NAME = process.env.AUTH_COOKIE_MENU_NAME || "pcon_menu"; // Nome do cookie


  if (!CAS_BASE_URL || !SERVICE_URL) {
    return NextResponse.json(
      { error: "env_missing", detail: "Defina CAS_BASE_URL e SERVICE_URL no .env.local e reinicie o dev server." },
      { status: 500 }

    );
  }

  try {
    // Valida o ticket no servidor CAS (tenta p3 primeiro, depois p2)
    const validation = await fetchValidate(CAS_BASE_URL, SERVICE_URL, ticket);
    if (!validation.ok) {
      return NextResponse.json(
        {
          error: "cas_unreachable_or_invalid_response",
          status: validation.status,
          tried: validation.tried,
          hint: "Cheque se SERVICE_URL (protocolo/host/porta) bate com o usado no login e o cadastrado no CAS.",
          json: debug ? validation.json : undefined
        },
        { status: 502 }
      );
    }
    const data = validation.json['serviceResponse'];
    // Extrai dados de sucesso ou falha da resposta CAS
    const success = data?.authenticationSuccess
    const failure = data?.authenticationFailure;
    if (!success) {
      return NextResponse.json(
        {
          error: "auth_failed",
          code: failure?.["@_code"] ?? null,
          message: failure?.["#text"] ?? "Falha na autenticação CAS",
          hint: "Se o code for INVALID_SERVICE, o protocolo (http/https), host ou porta do SERVICE_URL não batem.",
          json: debug ? validation : undefined
        },
        { status: 401 }
      );
    }

    // Extrai dados do usuário e atributos da resposta CAS
    const user = success["user"]; // ID do usuário
    //console.log('Usuário autenticado com sucesso no CAS:', user);
    const rawAttrs = success["attributes"] || {}; // Atributos brutos
    //const attrs: Record<string, any> = {};      

    const attrs = Object.fromEntries(
      Object.entries(rawAttrs).map(([k, v]) => [k, Array.isArray(v) && v.length === 1 ? v[0] : v])
    );

    let casJwtData = null;
    if (attrs.jwt) {
      const parts = attrs.jwt.split('.'); // JWT tem 3 partes: header.payload.signature
      //console.log('JWT do CAS encontrado nos atributos, decodificando...', attrs.jwt);
      if (parts.length === 3) {
        // Decodifica apenas o payload (segunda parte) - contém os dados do usuário
        const base64Payload = parts[1];
        const jsonPayload = Buffer.from(base64Payload, 'base64url').toString('utf8');
        casJwtData = JSON.parse(jsonPayload);
      }
      else {
        console.log('Formato do JWT do CAS inválido, esperado 3 partes separadas por pontos.');
        return NextResponse.json('Erro ao decodificar JWT do CAS', { status: 500 });
      }
    }

    // Monta o payload do nosso JWT local com os melhores dados disponíveis    
    const { menus, jwt: jwtInterno, ...rest } = attrs
    console.log('🔍 DEBUG - Menu recebido dos atributos CAS:', menus);
    console.log('🔍 DEBUG - Tipo do menu:', typeof menus);
    console.log('🔍 DEBUG - Menu é array:', Array.isArray(menus));
    let jwtInternoData = null;
    if (jwtInterno) {
      const parts = jwtInterno.split('.'); // JWT tem 3 partes: header.payload.signature
      //console.log('JWT do CAS encontrado nos atributos, decodificando...', attrs.jwt);
      if (parts.length === 3) {
        // Decodifica apenas o payload (segunda parte) - contém os dados do usuário
        const base64Payload = parts[1];
        const jsonPayload = Buffer.from(base64Payload, 'base64url').toString('utf8');
        jwtInternoData = JSON.parse(jsonPayload);
      }
      else {
        console.log('Formato do JWT interno do CAS inválido, esperado 3 partes separadas por pontos.');
        return NextResponse.json('Erro ao decodificar JWT interno do CAS', { status: 500 });
      }

      const { nomesGrupos, mcu = null, nomeLotacao = null, dr = null } = jwtInternoData
      const sessiosId = randomUUID();
      await redis.set(`sessao:${sessiosId}`, JSON.stringify({ jwtInterno }), 'EX', 60 * 60 * 8); // Expira em 8 horas
      const grupos = nomesGrupos || [];

      const payload = {
        sessiosId,
        sub: String(user), // ID do usuário
        name: casJwtData?.nome ?? attrs.nome ?? attrs.displayName ?? attrs.cn ?? String(user), // Nome (prioriza JWT)
        email: casJwtData?.email ?? attrs.email ?? attrs.mail ?? null, // Email (prioriza JWT),
        mcu, // Matricula
        nomeLotacao,
        dr,
        grupos, // Grupos/Perfis (array),
        // Outros atributos do CAS ficam disponíveis em payload.attrs no front-end
        ...rest
        //attrs, // Todos os atributos originais do CAS
        //casJwtData // Dados decodificados do JWT do CAS (grupos, perfis, etc)
      };

      // Salva os dados do usuário no Redis para exibição posterior
      await redis.set(`user_data:${sessiosId}`, JSON.stringify({
        token: null, // Será preenchido após criar o token
        payload,
        attrs,
        casJwtData
      }), 'EX', 60 * 60 * 8); // Expira em 8 horas

      // Cria e assina nosso JWT local com validade de 8 horas
      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" }) // Algoritmo de assinatura
        .setSubject(String(user)) // Subject = ID do usuário
        .setIssuedAt() // Data de emissão = agora
        .setExpirationTime("8h") // Expira em 8 horas
        .sign(secret()); // Assina com nossa chave secreta

      // Atualiza os dados no Redis com o token
      await redis.set(`user_data:${sessiosId}`, JSON.stringify({
        token,
        payload,
        attrs,
        casJwtData
      }), 'EX', 60 * 60 * 8); // Expira em 8 horas

      // Redireciona para a página inicial com sucesso
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:24731';
      const res = NextResponse.redirect(new URL('/', baseUrl));

      // Define cookie seguro com o JWT para autenticação automática em próximas requisições
      const isDevelopment = process.env.NODE_ENV === 'development';
      res.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,    // Não acessível via JavaScript (segurança)
        secure: !isDevelopment,  // HTTPS apenas em produção
        sameSite: "lax",   // Proteção CSRF
        path: "/",         // Cookie válido para todo o site
        maxAge: 60 * 60 * 8 // 8 horas em segundos
      });
      console.log('cookie definido:', AUTH_COOKIE_NAME);
      // Converte o menu para JSON string antes de salvar no cookie
      const menuJson = JSON.stringify(menus);
      res.cookies.set(AUTH_COOKIE_MENU_NAME, menuJson, {
        httpOnly: true,    // Não acessível via JavaScript (segurança)
        secure: !isDevelopment,  // HTTPS apenas em produção
        sameSite: "lax",   // Proteção CSRF
        path: "/",         // Cookie válido para todo o site
        maxAge: 60 * 60 * 8 // 8 horas em segundos
      });
      console.log('🔍 DEBUG - Cookie do menu definido:', AUTH_COOKIE_MENU_NAME);
      console.log('🔍 DEBUG - Menu convertido para JSON:', menuJson);

     
      return res;
    }

  } catch (e: any) {
      return NextResponse.json({ error: "callback_exception", message: String(e?.message ?? e) }, { status: 500 });
    }
  }