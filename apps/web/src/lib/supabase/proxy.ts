import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

const PROTECTED = [
  '/dashboard',
  '/transactions',
  '/wallets',
  '/bills',
  '/splits',
  '/reports',
  '/settings',
];

function matches(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function redirectTo(request: NextRequest, pathname: string, from: NextResponse): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  const response = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) response.cookies.set(cookie);
  return response;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet, headers) => {
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims.sub);
  const { pathname } = request.nextUrl;

  if (!signedIn && matches(pathname, PROTECTED)) return redirectTo(request, '/login', response);
  if (signedIn && pathname === '/login') return redirectTo(request, '/dashboard', response);
  return response;
}
