import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { encryptText } from '../_shared/crypto.ts';
import { CAPABILITY_REGISTRY } from '../_shared/capabilities.ts';
import { getAdminClient, getUserFromRequest } from '../_shared/supabase.ts';

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

    const body = await req.json().catch(() => ({}));
    const provider = body.provider as string | undefined;
    const secret = body.secret as string | undefined;
    const label = body.label as string | undefined;
    const config =
      body.config && typeof body.config === 'object' && !Array.isArray(body.config) ? body.config : {};

    if (!provider || !secret) {
      return jsonResponse({ error: 'provider and secret are required' }, 400);
    }

    const capability = CAPABILITY_REGISTRY.find((item) => item.provider === provider);
    if (!capability || capability.authKind !== 'api_key') {
      return jsonResponse({ error: 'Provider does not support API key setup' }, 400);
    }

    const encryptionKey = Deno.env.get('CONNECTOR_ENCRYPTION_KEY');
    if (!encryptionKey) {
      return jsonResponse({ error: 'Missing encryption key' }, 500);
    }

    const secretEnc = await encryptText(secret, encryptionKey);
    const admin = getAdminClient();

    const { error } = await admin.from('tool_credentials').upsert(
      {
        user_id: user.id,
        provider,
        label: label || null,
        secret_enc: secretEnc,
        config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' }
    );

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
