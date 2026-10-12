import { describe, it, expect } from 'vitest';
import { readSupabaseConfig } from '@/lib/supabase-config';
const url = 'https://test-project.supabase.co';
const key = 'sb_publishable_valid_test_key_12345';
function jwt(role: string) { return `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role }))}.signature`; }
describe('Supabase configuration', () => {
  it('reports missing values without throwing', () => {
    expect(readSupabaseConfig({}).error).toContain('.env.local');
  });
  it('accepts and trims publishable credentials', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: ` ${url} `, VITE_SUPABASE_PUBLISHABLE_KEY: ` ${key} ` })).toEqual({ url, key, error: null });
  });
  it('supports the legacy anon variable', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: jwt('anon') }).error).toBeNull();
  });
  it('rejects secret and service role keys', () => {
    for (const secret of ['sb_secret_12345', jwt('service_role')]) {
      expect(readSupabaseConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: secret }).error).toBeTruthy();
    }
  });
  it('rejects placeholders and malformed URLs and keys', () => {
    for (const invalidUrl of ['invalid', 'https://your-project.supabase.co', `${url}/rest/v1`, 'ftp://localhost']) {
      expect(readSupabaseConfig({ VITE_SUPABASE_URL: invalidUrl, VITE_SUPABASE_PUBLISHABLE_KEY: key }).error).toBeTruthy();
    }
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: 'not-a-key' }).error).toBeTruthy();
  });
  it('prefers publishable over legacy key', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key, VITE_SUPABASE_ANON_KEY: 'bad' }).error).toBeNull();
  });
});
