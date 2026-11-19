import { createClient } from '@/lib/supabase/browser';
import { parse, send, type RequestOptions } from './request';

const UNAUTHORIZED = 401;

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  let response = await send(path, options, data.session?.access_token);

  if (response.status === UNAUTHORIZED) {
    const refreshed = await supabase.auth.refreshSession();
    const token = refreshed.data.session?.access_token;
    if (token) response = await send(path, options, token);
    if (!token || response.status === UNAUTHORIZED) {
      await supabase.auth.signOut();
      window.location.assign('/login');
    }
  }
  return parse<T>(response);
}
