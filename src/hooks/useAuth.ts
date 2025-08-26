"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/services/supabase";
import type { User, Subscription, AuthApiError } from "@supabase/supabase-js";

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

// Helper function to determine if error requires merge strategy
const shouldUseMergeStrategy = (error: unknown): boolean => {
  // Check if it's an AuthApiError with specific status codes
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as AuthApiError;
    // 409 Conflict = identity already linked or email conflict
    // 422 Unprocessable Entity = cannot process due to state
    return apiError.status === 409 || apiError.status === 422;
  }

  // Check if it's an AuthError with specific patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('already linked') ||
      message.includes('identity is already linked') ||
      message.includes('already in use') ||
      message.includes('email already exists') ||
      message.includes('conflict') ||
      message.includes('duplicate')
    );
  }

  return false;
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state and set up listener
  useEffect(() => {
    let mounted = true;
    let authSubscription: Subscription | null = null;

    const handleAuthStateChange = async (authenticatedUser: User): Promise<void> => {
      // Only handle migration for conflict scenarios (when linkIdentity failed)
      if (authenticatedUser && !authenticatedUser.is_anonymous) {
        const pendingMigrationId = localStorage.getItem("pendingMigration");

        if (pendingMigrationId && pendingMigrationId !== authenticatedUser.id) {
          console.log(`Attempting to migrate data from ${pendingMigrationId} to ${authenticatedUser.id}`);
          
          try {
            await migrateAnonymousData(pendingMigrationId, authenticatedUser.id);
            localStorage.removeItem("pendingMigration");

            // Notify user of successful merge
            console.log("Successfully merged your images with your Google account!");
          } catch (error) {
            console.error("Failed to merge anonymous data:", error);
            
            // Even if migration fails, user should stay signed in
            // Remove the pending migration to prevent retry loops
            localStorage.removeItem("pendingMigration");
            
            // Log the error but don't throw - user authentication should not fail
            console.warn("Migration failed but user remains authenticated. Some images may not have transferred.");
          }
        } else if (pendingMigrationId && pendingMigrationId === authenticatedUser.id) {
          // LinkIdentity was successful, clean up
          console.log("LinkIdentity successful - cleaning up migration flag");
          localStorage.removeItem("pendingMigration");
        }
      }
    };

    const migrateAnonymousData = async (fromUserId: string, toUserId: string): Promise<void> => {
      try {
        const response = await fetch("/api/migrate-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromUserId,
            toUserId,
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
    const currentUser = user;

    // If user is anonymous, try linkIdentity first (preserves user_id)
    if (currentUser && currentUser.is_anonymous) {
      try {
        console.log("Attempting to link Google identity to anonymous user...");

        const { data, error } = await supabase.auth.linkIdentity({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          throw error;
        }

        console.log("Successfully linked Google identity - no migration needed!");
        return { data, error: null };
      } catch (linkError: unknown) {
        console.log("Link identity failed, analyzing error type:", linkError);

        // Check if this is an identity conflict that requires migration
        const requiresMerge = shouldUseMergeStrategy(linkError);

        if (requiresMerge) {
          // Store anonymous user ID for merge after OAuth redirect
          localStorage.setItem("pendingMigration", currentUser.id);
          console.log(`Storing pendingMigration: ${currentUser.id} for merge strategy`);

          // Fallback to standard OAuth flow which will create/sign into existing account
          console.log("Using merge strategy - will transfer data to existing Google account");
          
          try {
            const oauthResult = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/auth/callback`,
              },
            });
            
            // OAuth initiated successfully
            return oauthResult;
          } catch (oauthError) {
            console.error("OAuth flow failed:", oauthError);
            // Clean up pending migration on OAuth failure
            localStorage.removeItem("pendingMigration");
            return {
              data: null,
              error: oauthError instanceof Error ? oauthError : new Error(String(oauthError)),
            };
          }
        } else {
          // Re-throw other errors that don't require merge strategy
          console.error("Link identity failed with non-recoverable error:", linkError);
          return {
            data: null,
            error: linkError instanceof Error ? linkError : new Error(String(linkError)),
          };
        }
      }
    } else {
      // User is not anonymous, use standard OAuth flow
      return await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    }
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
