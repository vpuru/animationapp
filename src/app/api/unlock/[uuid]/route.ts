import { NextRequest, NextResponse } from 'next/server'
import { getImageState } from '@/services/supabase'
import { getSupabaseClient } from '@/services/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params

  if (!uuid) {
    return NextResponse.json(
      { success: false, error: 'UUID parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Get the image state from database
    const imageState = await getImageState(uuid)
    
    if (!imageState) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      )
    }

    if (!imageState.output_bucket_id) {
      return NextResponse.json(
        { success: false, error: 'Image processing not completed yet' },
        { status: 400 }
      )
    }

    // Check if image has been purchased
    if (!imageState.purchased) {
      return NextResponse.json(
        { success: false, error: 'Image has not been purchased. Please complete payment first.' },
        { status: 403 }
      )
    }

    // Generate public URL for the full resolution image
    const supabase = getSupabaseClient();
    const { data } = supabase.storage
      .from("output_images")
      .getPublicUrl(imageState.output_bucket_id)

    if (!data.publicUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate image URL' },
        { status: 500 }
      )
    }

    // Verify the image exists
    try {
      const response = await fetch(data.publicUrl, { method: 'HEAD' })
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: 'Full resolution image not found' },
          { status: 404 }
        )
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Unable to access full resolution image' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      fullImageUrl: data.publicUrl,
      message: 'Image unlocked successfully'
    })

  } catch (error) {
    console.error('Unlock API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Server error: ${errorMessage}` 
      },
      { status: 500 }
    )
  }
}