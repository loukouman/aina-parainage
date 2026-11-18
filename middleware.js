import { NextResponse } from 'next/server';
// L'espace admin vit en interne sous /gestion. Il est joignable via /admin
// (et via l'ancienne adresse secrète ADMIN_PATH si elle est définie).
export function middleware(req) {
  const h = new Headers(req.headers);
  h.set('x-admin-gate', ''); // écrase tout en-tête envoyé par un client
  const p = req.nextUrl.pathname;
  const roots = ['admin'];
  const ap = process.env.ADMIN_PATH;
  if (ap && /^[A-Za-z0-9-]{12,}$/.test(ap)) roots.push(ap);
  const root = roots.find((r) => p === `/${r}` || p.startsWith(`/${r}/`));
  if (root) {
    h.set('x-admin-gate', process.env.APP_SECRET || '');
    const url = req.nextUrl.clone();
    url.pathname = '/gestion' + p.slice(root.length + 1);
    return NextResponse.rewrite(url, { request: { headers: h } });
  }
  return NextResponse.next({ request: { headers: h } });
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
