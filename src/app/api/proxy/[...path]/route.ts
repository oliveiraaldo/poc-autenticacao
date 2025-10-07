import { NextResponse } from 'next/server';
import { redis, rotateSecurityKey } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';


export async function all(request: Request) {
  // parse cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(cookieHeader.split(';').map(c => {
    const [k,v] = c.split('=').map(s=>s?.trim());
    return [k, v];
  }).filter(Boolean));

  const cookieName = process.env.SECURITY_ID_COOKIE_NAME || 'security_id';
  const securityId = cookies[cookieName];
  if (!securityId) return new Response('Unauthorized', { status: 401 });

  const oldKey = `security:${securityId}`;
  const laravelJwt = await redis.get(oldKey);
  if (!laravelJwt) return new Response('Unauthorized', { status: 401 });

  // forward request to LaravelAPI
  const path = new URL(request.url).pathname.replace(/^\/api\/proxy/, '');
  const url = process.env.LARAVEL_API_BASE + path + (new URL(request.url).search || '');

  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${laravelJwt}`);
  headers.delete('cookie'); // não repassar cookies

  const proxied = await fetch(url, {
    method: request.method,
    headers,
    body: request.body
  });

  // se sucesso -> rotaciona SecurityId
  const status = proxied.status;
  const text = await proxied.text();
  if (status >= 200 && status < 300) {
    const newSecurityId = uuidv4();
    const newKey = `security:${newSecurityId}`;
    const ttl = Number(process.env.SECURITY_ID_TTL || 900);
    const moved = await rotateSecurityKey(oldKey, newKey, ttl);
    if (!moved) {
      // caso falhe na rotação (concorrência), manter o antigo (ou forçar nova criação)
    }
    // set new cookie
    const cookie = serialize(cookieName, newSecurityId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ttl,
      domain: process.env.SESSION_COOKIE_DOMAIN
    });

    return new Response(text, {
      status,
      headers: {
        'Content-Type': proxied.headers.get('content-type') || 'application/json',
        'Set-Cookie': cookie
      }
    });
  } else {
    // repassa erro sem rotacionar
    return new Response(text, { status, headers: { 'Content-Type': proxied.headers.get('content-type') || 'text/plain' }});
  }
}
