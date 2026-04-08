export function normalizeReturnToPath(raw: string | null | undefined): string {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  return raw;
}

export function buildAuthRedirect(
  returnTo: string,
  options?: {
    mode?: 'signin' | 'signup';
    context?: string;
  }
) {
  const params = new URLSearchParams();
  params.set('returnTo', normalizeReturnToPath(returnTo));

  if (options?.mode) {
    params.set('mode', options.mode);
  }

  if (options?.context) {
    params.set('context', options.context);
  }

  return `/auth?${params.toString()}`;
}
