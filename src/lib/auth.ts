import { supabase } from '@/services/supabase';

export async function ensureAnonymousUser(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    return user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  
  if (error) {
    throw new Error(`Failed to create anonymous user: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Anonymous user creation failed');
  }

  return data.user.id;
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}