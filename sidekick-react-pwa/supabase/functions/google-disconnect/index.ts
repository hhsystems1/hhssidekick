import { getUserFromRequest, getAdminClient } from '../_shared/supabase.ts';
import { decryptText } from '../_shared/crypto.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const { user } = await getUserFromRequest(req);
    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const admin = getAdminClient();
    const encryptionKey = Deno.env.get('CONNECTOR_ENCRYPTION_KEY');

    const { data: tokenRow } = await admin
      .from('connector_tokens')
      .select('access_token_enc')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (tokenRow && encryptionKey) {
      try {
        const accessToken = await decryptText(tokenRow.access_token_enc, encryptionKey);
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: accessToken }),
        });
      } catch {
        // best effort revoke
      }
    }

    await admin.from('connector_tokens').delete().eq('user_id', user.id).eq('provider', 'google');
    await admin.from('connector_integrations').delete().eq('user_id', user.id).eq('provider', 'google');

    await admin.from('connector_audit_logs').insert({
      user_id: user.id,
      provider: 'google',
      action: 'disconnected',
    });

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
