import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ensureBusinessProfile } from '@/lib/onboarding';
vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));
const user = { id: 'u1', email: 'owner@example.com', user_metadata: { name: 'Owner', business_name: 'Shop' } } as unknown as User;
function query(result: unknown) {
  const q = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), insert: vi.fn().mockResolvedValue(result), maybeSingle: vi.fn().mockResolvedValue(result), single: vi.fn().mockResolvedValue(result) };
  return q;
}
beforeEach(() => vi.clearAllMocks());
describe('business onboarding', () => {
  it('leaves an existing profile alone', async () => {
    vi.mocked(supabase.from).mockReturnValue(query({ data: { id: 'p1' }, error: null }) as never);
    await ensureBusinessProfile(user);
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });
  it('reuses an owned business after interrupted registration', async () => {
    const profileQuery = query({ data: null, error: null });
    const businessQuery = query({ data: { id: 'b1' }, error: null });
    const insertQuery = query({ error: null });
    vi.mocked(supabase.from).mockReturnValueOnce(profileQuery as never).mockReturnValueOnce(businessQuery as never).mockReturnValueOnce(insertQuery as never);
    await ensureBusinessProfile(user);
    expect(businessQuery.eq).toHaveBeenCalledWith('owner_id', 'u1');
    expect(insertQuery.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u1', business_id: 'b1', role: 'owner' }));
  });
  it('propagates database errors', async () => {
    vi.mocked(supabase.from).mockReturnValue(query({ data: null, error: new Error('permission denied') }) as never);
    await expect(ensureBusinessProfile(user)).rejects.toThrow('permission denied');
  });
});
