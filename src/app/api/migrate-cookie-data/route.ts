import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/supabase';

export async function POST(request: NextRequest) {
  try {
    const { uuids, toUserId } = await request.json();

    // Validate input
    if (!uuids || !Array.isArray(uuids) || uuids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid uuids array' },
        { status: 400 }
      );
    }

    if (!toUserId || typeof toUserId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid toUserId' },
        { status: 400 }
      );
    }

    // Validate UUID format (basic check)
    const invalidUuids = uuids.filter((uuid: unknown) => {
      return typeof uuid !== 'string' || uuid.length < 32;
    });

    if (invalidUuids.length > 0) {
      return NextResponse.json(
        { error: `Invalid UUID format for: ${invalidUuids.join(', ')}` },
        { status: 400 }
      );
    }

    // Limit the number of UUIDs to prevent abuse
    if (uuids.length > 100) {
      return NextResponse.json(
        { error: 'Too many UUIDs. Maximum 100 allowed per request.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    console.log(`Cookie migration: ${uuids.length} UUIDs to user ${toUserId}`);

    // First, check which UUIDs exist and are unclaimed (user_id IS NULL)
    const { data: existingImages, error: queryError } = await supabaseAdmin
      .from('images_state')
      .select('uuid, user_id, created_at')
      .in('uuid', uuids);

    if (queryError) {
      console.error('Error querying existing images:', queryError);
      return NextResponse.json(
        { error: `Failed to query images: ${queryError.message}` },
        { status: 500 }
      );
    }

    if (!existingImages || existingImages.length === 0) {
      console.log('No matching images found for cookie UUIDs');
      return NextResponse.json({ 
        success: true,
        message: 'No images found for the provided UUIDs',
        imagesMigrated: 0,
        alreadyClaimed: 0,
        notFound: uuids.length
      });
    }

    // Separate unclaimed vs already claimed images
    const unclaimedImages = existingImages.filter(img => img.user_id === null);
    const alreadyClaimedImages = existingImages.filter(img => img.user_id !== null);
    const foundUuids = existingImages.map(img => img.uuid);
    const notFoundUuids = uuids.filter((uuid: string) => !foundUuids.includes(uuid));

    console.log(`Found ${existingImages.length} total images:`);
    console.log(`- ${unclaimedImages.length} unclaimed (will migrate)`);
    console.log(`- ${alreadyClaimedImages.length} already claimed (will skip)`);
    console.log(`- ${notFoundUuids.length} not found`);

    if (unclaimedImages.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No unclaimed images to migrate',
        imagesMigrated: 0,
        alreadyClaimed: alreadyClaimedImages.length,
        notFound: notFoundUuids.length
      });
    }

    // Migrate unclaimed images to the user
    const unclaimedUuids = unclaimedImages.map(img => img.uuid);
    const { error: updateError, count } = await supabaseAdmin
      .from('images_state')
      .update({ user_id: toUserId })
      .in('uuid', unclaimedUuids)
      .is('user_id', null); // Double-check user_id is null for safety

    if (updateError) {
      console.error('Migration error:', updateError);
      return NextResponse.json(
        { error: `Failed to migrate images: ${updateError.message}` },
        { status: 500 }
      );
    }

    const migratedCount = count || 0;
    console.log(`Successfully migrated ${migratedCount} images from cookies to user ${toUserId}`);

    // Log warning if some images were already claimed
    if (alreadyClaimedImages.length > 0) {
      console.warn(`${alreadyClaimedImages.length} images were already claimed by users:`, 
        alreadyClaimedImages.map(img => `${img.uuid} -> ${img.user_id}`));
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully migrated ${migratedCount} images to your account`,
      imagesMigrated: migratedCount,
      alreadyClaimed: alreadyClaimedImages.length,
      notFound: notFoundUuids.length,
      details: {
        migratedUuids: unclaimedUuids,
        alreadyClaimedUuids: alreadyClaimedImages.map(img => img.uuid),
        notFoundUuids
      }
    });

  } catch (error) {
    console.error('Cookie migration API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error during cookie migration' },
      { status: 500 }
    );
  }
}