"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/services/supabase";
import type { User, Subscription } from "@supabase/supabase-js";

interface UseAuthReturn {
  // State
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;

  // Actions
  signInWithGoogle: () => Promise<{ data: unknown; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  ensureAnonymousUser: () => Promise<string>;
  getCurrentUser: () => Promise<User | null>;
  getCurrentUserId: () => Promise<string | null>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state and set up listener
  useEffect(() => {
    let mounted = true;
    let authSubscription: Subscription | null = null;

    const handleAuthStateChange = async (authenticatedUser: User): Promise<void> => {
      if (authenticatedUser && !authenticatedUser.is_anonymous) {
        // Check if we have a pending migration
        const pendingMigrationId = localStorage.getItem("pendingMigration");

        if (pendingMigrationId && pendingMigrationId !== authenticatedUser.id) {
          try {
            await migrateAnonymousData(pendingMigrationId, authenticatedUser.id);
            localStorage.removeItem("pendingMigration");

            // Notify user of successful migration
            console.log("Successfully migrated your anonymous data to your Google account!");
          } catch (error) {
            console.error("Failed to migrate anonymous data:", error);
            // Keep the pending migration flag in case of retry
          }
        }
      }
    };

    const migrateAnonymousData = async (fromUserId: string, toUserId: string): Promise<void> => {
      try {
        const response = await fetch('/api/migrate-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fromUserId,
            toUserId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Migration failed with status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result.message);
      } catch (error) {
        console.error("Migration failed:", error);
        throw error;
      }
    };

    const initAuth = async () => {
      try {
        // Get initial session with timeout
        const supabase = getSupabaseClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Supabase auth session error:", error);
          throw error;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
            setLoading(false);

            // Handle data migration for newly authenticated users
            if (event === "SIGNED_IN" && session?.user && !session.user.is_anonymous) {
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

    // Store current anonymous user ID for potential migration
    const currentUser = user;
    if (currentUser && currentUser.is_anonymous) {
      localStorage.setItem("pendingMigration", currentUser.id);
    }

    return await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();

    // Clear any pending migration data
    localStorage.removeItem("pendingMigration");
    return await supabase.auth.signOut();
  };

  const ensureAnonymousUser = async (): Promise<string> => {
    if (user) {
      return user.id;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      throw new Error(`Failed to create anonymous user: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("Anonymous user creation failed");
    }

    return data.user.id;
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
    isAuthenticated: !!user && !user.is_anonymous,
    isAnonymous: !!user?.is_anonymous,

    // Actions
    signInWithGoogle,
    signOut,
    ensureAnonymousUser,
    getCurrentUser,
    getCurrentUserId,
  };
}
