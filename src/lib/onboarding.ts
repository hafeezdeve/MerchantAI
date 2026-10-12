import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Metadata supplies display names only; ownership always comes from the signed-in user.
export async function ensureBusinessProfile(user: User) {
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle();
  if (profileError) throw profileError;
  if (profile) return;
  const name = user.user_metadata?.name;
  const businessName = user.user_metadata?.business_name;
  if (!name || !businessName) throw new Error('Business profile missing. Contact the project administrator to complete your account setup.');
  const { data: existing, error: lookupError } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1).maybeSingle();
  if (lookupError) throw lookupError;
  let businessId = existing?.id;
  if (!businessId) {
    const { data, error } = await supabase.from('businesses').insert({ name: businessName, business_type: 'retail', currency: 'PKR', timezone: 'Asia/Karachi', owner_id: user.id }).select('id').single();
    if (error) throw error;
    businessId = data.id;
  }
  const { error } = await supabase.from('profiles').insert({ user_id: user.id, business_id: businessId, name, email: user.email, role: 'owner', is_active: true });
  if (error) throw error;
}
