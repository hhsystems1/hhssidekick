import { getUserFromRequest, getAdminClient } from '../_shared/supabase.ts';
import { decryptText } from '../_shared/crypto.ts';

Deno.serve(async (req) => {
  try {
    const { user } = await getUserFromRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
