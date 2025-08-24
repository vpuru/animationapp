import { supabase, supabaseAdmin } from '@/services/supabase';
import type { User } from '@supabase/supabase-js';

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

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signInWithGoogle() {
  // Store current anonymous user ID for potential migration
  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.is_anonymous) {
    localStorage.setItem('pendingMigration', currentUser.id);
  }

  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function signOut(): Promise<{ error: Error | null }> {
  // Clear any pending migration data
  localStorage.removeItem('pendingMigration');
  
  return await supabase.auth.signOut();
}

export async function migrateAnonymousData(fromUserId: string, toUserId: string): Promise<void> {
  try {
    // Update all images_state records to transfer ownership from anonymous to authenticated user
    const { error } = await supabaseAdmin
      .from('images_state')
      .update({ user_id: toUserId })
      .eq('user_id', fromUserId);

    if (error) {
      throw new Error(`Failed to migrate user data: ${error.message}`);
    }

    console.log(`Successfully migrated data from ${fromUserId} to ${toUserId}`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function handleAuthStateChange(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user && !user.is_anonymous) {
    // Check if we have a pending migration
    const pendingMigrationId = localStorage.getItem('pendingMigration');
    
    if (pendingMigrationId && pendingMigrationId !== user.id) {
      try {
        await migrateAnonymousData(pendingMigrationId, user.id);
        localStorage.removeItem('pendingMigration');
        
        // Notify user of successful migration
        console.log('Successfully migrated your anonymous data to your Google account!');
      } catch (error) {
        console.error('Failed to migrate anonymous data:', error);
        // Keep the pending migration flag in case of retry
      }
    }
  }
}

// Set up auth state change listener
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user && !session.user.is_anonymous) {
      await handleAuthStateChange();
    }
  });
}