import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { decryptText } from '../_shared/crypto.ts';
import { getToolCredential } from '../_shared/capabilities.ts';
import { getUserFromRequest } from '../_shared/supabase.ts';

type OpenAIAction = 'chat.completions' | 'embeddings';

async function getOpenAIKey(userId: string) {
  const credential = await getToolCredential(userId, 'openai');
  if (!credential) {
    throw new Error('OpenAI is not connected for this account');
  }

  const encryptionKey = Deno.env.get('CONNECTOR_ENCRYPTION_KEY');
  if (!encryptionKey) {
    throw new Error('Missing encryption key');
  }

  return await decryptText(credential.secret_enc, encryptionKey);
}

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
    const action = body.action as OpenAIAction | undefined;

    if (!action) {
      return jsonResponse({ error: 'action is required' }, 400);
    }

    const apiKey = await getOpenAIKey(user.id);

    if (action === 'chat.completions') {
      const model = String(body.model || '').trim();
      const messages = Array.isArray(body.messages) ? body.messages : [];
      const temperature = typeof body.temperature === 'number' ? body.temperature : 0.7;
      const maxTokens = typeof body.maxTokens === 'number' ? body.maxTokens : 1500;

      if (!model || messages.length === 0) {
        return jsonResponse({ error: 'model and messages are required' }, 400);
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return jsonResponse(
          { error: data?.error?.message || `OpenAI API error: ${response.status}` },
          response.status,
        );
      }

      const content = data?.choices?.[0]?.message?.content;
      return jsonResponse({
        content: typeof content === 'string' ? content : '',
        usage: data?.usage || null,
        model: data?.model || model,
      });
    }

    if (action === 'embeddings') {
      const model = String(body.model || 'text-embedding-3-small');
      const input = body.input;
      const dimensions = typeof body.dimensions === 'number' ? body.dimensions : undefined;

      if (!(typeof input === 'string' || Array.isArray(input))) {
        return jsonResponse({ error: 'input is required' }, 400);
      }

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input,
          dimensions,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return jsonResponse(
          { error: data?.error?.message || `OpenAI API error: ${response.status}` },
          response.status,
        );
      }

      return jsonResponse({
        data: data?.data || [],
        usage: data?.usage || null,
        model: data?.model || model,
      });
    }

    return jsonResponse({ error: `Unsupported action: ${action}` }, 400);
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
