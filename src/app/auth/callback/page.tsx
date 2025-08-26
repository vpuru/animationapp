"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/services/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/?error=auth_failed');
          return;
        }

        if (data.session) {
          const user = data.session.user;
          const pendingMigration = localStorage.getItem('pendingMigration');
          
          // Check if this is a successful linkIdentity operation (same user_id preserved)
          if (pendingMigration && pendingMigration === user.id && !user.is_anonymous) {
            // LinkIdentity was successful - user_id preserved, no migration needed
            console.log('LinkIdentity successful - user converted from anonymous to permanent');
            localStorage.removeItem('pendingMigration');
          } else if (pendingMigration && pendingMigration !== user.id) {
            // This was a conflict scenario - migration will be handled by auth state listener
            console.log('OAuth conflict resolved - data will be merged from anonymous account');
          }
          
          // Auth successful, redirect to home or previous page
          const returnTo = sessionStorage.getItem('authReturnTo') || '/';
          sessionStorage.removeItem('authReturnTo');
          router.push(returnTo);
        } else {
          // No session, redirect to home
          router.push('/');
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        router.push('/?error=unexpected');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen app-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign-in...</p>
        <p className="text-sm text-gray-500 mt-2">Your images will be preserved</p>
      </div>
    </div>
  );
}