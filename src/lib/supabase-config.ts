export function readSupabaseConfig(env: Record<string, unknown>) {
  const url = String(env.VITE_SUPABASE_URL ?? '').trim();
  const key = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '').trim();
  let error: string | null = null;
  if (!url || !key) {
    error = 'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.';
  } else {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || !['', '/'].includes(parsed.pathname)) throw new Error();
      if (/your[-_]project|example/i.test(parsed.hostname)) throw new Error();
    } catch {
      error = 'VITE_SUPABASE_URL must be your Supabase project URL (https://PROJECT.supabase.co), without an API path.';
    }
    if (!error) {
      if (key.startsWith('sb_secret_')) {
        error = 'A secret key cannot be used in the browser. Use the publishable key.';
      } else if (key.startsWith('sb_publishable_') && key.length > 20 && !/\.\.\.|your|replace/i.test(key)) {
        // Publishable keys are opaque strings, not JWTs.
      } else {
        try {
          const parts = key.split('.');
          if (parts.length !== 3) throw new Error();
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.role !== 'anon') throw new Error();
        } catch {
          error = 'Use a valid Supabase publishable key or legacy anon key. Never use a service_role key.';
        }
      }
    }
  }
  return { url, key, error };
}
