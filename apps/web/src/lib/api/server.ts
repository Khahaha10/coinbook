import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { parse, send, type RequestOptions } from './request';

export async function serverApi<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const response = await send(path, options, data.session?.access_token);
  if (response.status === 401) redirect('/login');
  return parse<T>(response);
}
