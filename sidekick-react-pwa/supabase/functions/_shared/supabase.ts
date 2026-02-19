import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getAdminClient() {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

export function getUserClient(jwt: string | null) {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: jwt
      ? {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      : undefined,
  });
}

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const jwt = authHeader?.replace('Bearer ', '') || null;
  if (!jwt) return { user: null, jwt: null };

  const client = getUserClient(jwt);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return { user: null, jwt };
  }
  return { user: data.user, jwt };
}
