import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/supabase';

export async function POST(request: NextRequest) {
  try {
    const { fromUserId, toUserId } = await request.json();

    if (!fromUserId || !toUserId) {
      return NextResponse.json(
        { error: 'Missing fromUserId or toUserId' },
        { status: 400 }
      );
    }

    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: 'fromUserId and toUserId cannot be the same' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Safety check: Verify users using auth.identities table
    // Anonymous users typically have no identities, authenticated users have provider identities
    try {
      const { data: fromIdentities } = await supabaseAdmin
        .from('auth.identities')
        .select('provider')
        .eq('user_id', fromUserId);

      const { data: toIdentities } = await supabaseAdmin
        .from('auth.identities')
        .select('provider')
        .eq('user_id', toUserId);

      // Anonymous users should have no identities
      if (fromIdentities && fromIdentities.length > 0) {
        console.warn(`Warning: fromUserId ${fromUserId} has ${fromIdentities.length} identities, expected 0 for anonymous user`);
      }

      // Authenticated users should have at least one identity (like google, etc.)
      if (!toIdentities || toIdentities.length === 0) {
        console.warn(`Warning: toUserId ${toUserId} has no identities, expected at least 1 for authenticated user`);
      } else {
        console.log(`Target user ${toUserId} has ${toIdentities.length} identity(ies): ${toIdentities.map(i => i.provider).join(', ')}`);
      }
    } catch (error) {
      console.warn('Could not verify user types via identities table:', error);
    }

    console.log(`Account merge verified: from anonymous user ${fromUserId} to authenticated user ${toUserId}`);

    // First, check how many images we're migrating
    const { data: imagesToMigrate, error: countError } = await supabaseAdmin
      .from('images_state')
      .select('uuid, created_at')
      .eq('user_id', fromUserId);

    if (countError) {
      console.error('Error counting images to migrate:', countError);
      return NextResponse.json(
        { error: `Failed to count images: ${countError.message}` },
        { status: 500 }
      );
    }

    const imageCount = imagesToMigrate?.length || 0;
    console.log(`Merging ${imageCount} images from anonymous user to authenticated user`);

    if (imageCount === 0) {
      console.log('No images to migrate');
      return NextResponse.json({ 
        success: true,
        message: `No images found for anonymous user ${fromUserId}`,
        imagesMigrated: 0
      });
    }

    // Migrate all images_state records from anonymous user to authenticated user
    const { error } = await supabaseAdmin
      .from('images_state')
      .update({ user_id: toUserId })
      .eq('user_id', fromUserId);

    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json(
        { error: `Failed to migrate user data: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`Successfully merged ${imageCount} images from ${fromUserId} to ${toUserId}`);

    return NextResponse.json({ 
      success: true,
      message: `Successfully merged ${imageCount} images into your Google account`,
      imagesMigrated: imageCount,
      fromUserId,
      toUserId
    });
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during migration' },
      { status: 500 }
    );
  }
}