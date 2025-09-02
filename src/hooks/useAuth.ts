"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/services/supabase";
import type { User, Subscription } from "@supabase/supabase-js";
import { getImageUuidsFromCookie, clearImageUuidsCookie } from "@/lib/cookieUtils";

interface UseAuthReturn {
  // State
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Actions
  signInWithGoogle: () => Promise<{ data: unknown; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  getCurrentUser: () => Promise<User | null>;
  getCurrentUserId: () => Promise<string | null>;
}

// Cookie migration helper function
const migrateCookieImages = async (userId: string): Promise<void> => {
  try {
    const uuids = getImageUuidsFromCookie();
    
    if (uuids.length === 0) {
      console.log('No cookie images to migrate');
      return;
    }

    console.log(`Migrating ${uuids.length} images from cookies to user ${userId}`);
    
    const response = await fetch("/api/migrate-cookie-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uuids,
        toUserId: userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Migration failed with status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Cookie migration completed: ${result.message}`);
    
    // Clear cookie after successful migration
    const cookieCleared = clearImageUuidsCookie();
    if (!cookieCleared) {
      console.warn('Failed to clear cookie after migration, but migration was successful');
    }
    
  } catch (error) {
    console.error("Cookie migration failed:", error);
    // Don't throw - migration failure shouldn't break authentication
    // User can still use the app, they just might lose access to some images
  }
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state and set up listener
  useEffect(() => {
    let mounted = true;
    let authSubscription: Subscription | null = null;

    const handleAuthStateChange = async (authenticatedUser: User): Promise<void> => {
      // Handle cookie migration for newly authenticated users
      if (authenticatedUser) {
        try {
          await migrateCookieImages(authenticatedUser.id);
        } catch (migrationError) {
          console.error("Cookie migration error during auth state change:", migrationError);
          // Don't throw - migration failure shouldn't break auth
        }
      }
    };


    const initAuth = async () => {
      try {
        // Get initial session with timeout
        const supabase = getSupabaseClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Supabase auth session error:", error);
          throw error;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Set up auth state listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
            setLoading(false);

            // Handle cookie migration for newly authenticated users
            if (event === "SIGNED_IN" && session?.user) {
              try {
                await handleAuthStateChange(session.user);
              } catch (migrationError) {
                console.error("Migration error during auth state change:", migrationError);
                // Don't throw - migration failure shouldn't break auth
              }
            }
          }
        });

        authSubscription = subscription;
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Always ensure loading is set to false even on failure
        if (mounted) {
          setLoading(false);
          setUser(null);
        }
        // Don't re-throw - we want the component to render in a "no user" state
      }
    };

    // Execute async initialization
    initAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Auth actions
  const signInWithGoogle = async () => {
    const supabase = getSupabaseClient();
    
    console.log("Starting Google OAuth sign-in...");
    
    try {
      const result = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (result.error) {
        console.error("Google OAuth failed:", result.error);
        return {
          data: null,
          error: result.error,
        };
      }

      console.log("Google OAuth initiated successfully");
      return result;
    } catch (error) {
      console.error("Unexpected error during Google sign-in:", error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    
    // Note: We don't clear cookies on sign out since users might want 
    // to sign back in and claim those images later
    console.log("Signing out user...");
    
    return await supabase.auth.signOut();
  };


  const getCurrentUser = async (): Promise<User | null> => {
    // Use current state if available, otherwise fetch fresh
    if (user) {
      return user;
    }

    const supabase = getSupabaseClient();
    const {
      data: { user: freshUser },
    } = await supabase.auth.getUser();
    return freshUser;
  };

  const getCurrentUserId = async (): Promise<string | null> => {
    // Use current state if available, otherwise fetch fresh
    if (user) {
      return user.id;
    }

    const supabase = getSupabaseClient();
    const {
      data: { user: freshUser },
    } = await supabase.auth.getUser();
    return freshUser?.id || null;
  };

  return {
    // State
    user,
    loading,
    isAuthenticated: !!user,

    // Actions
    signInWithGoogle,
    signOut,
    getCurrentUser,
    getCurrentUserId,
  };
}
