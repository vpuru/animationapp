import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase';

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

    console.log(`Successfully migrated data from ${fromUserId} to ${toUserId}`);

    return NextResponse.json({ 
      success: true,
      message: `Successfully migrated data from ${fromUserId} to ${toUserId}`
    });
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during migration' },
      { status: 500 }
    );
  }
}