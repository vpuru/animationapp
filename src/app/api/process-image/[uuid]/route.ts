import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { 
  updateImageState, 
  downloadFromInputBucket, 
  uploadToOutputBucket,
  uploadToPreviewBucket,
  getImageState 
} from '@/services/supabase'
import { 
  transformImageToGhibli, 
  downloadImageFromUrl, 
  getFileExtension 
} from '@/services/openai'
import { addPadlockOverlay } from '@/services/imageProcessing'

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
    // Check if this UUID already exists and handle accordingly
    const existingState = await getImageState(uuid)
    if (!existingState) {
      return NextResponse.json(
        { success: false, error: 'No database entry found for this UUID. Please start the upload process again.' },
        { status: 400 }
      )
    }

    if (existingState.output_bucket_id && existingState.preview_bucket_id) {
      // Image already processed successfully
      return NextResponse.json({ 
        success: true, 
        message: 'Image already processed',
        outputBucketId: existingState.output_bucket_id,
        previewBucketId: existingState.preview_bucket_id
      })
    }

    // Entry exists but no output - continue with processing
    console.log(`Processing image for UUID: ${uuid}`)
    await updateImageState(uuid, { 
      error_message: null
    })

    try {
      // Since we now always upload PNG files, look for PNG specifically
      const inputBucketId = `${uuid}.png`
      
      console.log(`Downloading PNG image: ${inputBucketId}`)
      const inputImageBlob = await downloadFromInputBucket(inputBucketId)
      
      if (!inputImageBlob) {
        throw new Error('Could not find uploaded PNG image')
      }

      // Use existing state (entry is guaranteed to exist from check above)
      console.log(`Using existing record for UUID: ${uuid}`)

      // Transform image using OpenAI
      console.log('Processing image with OpenAI...')
      const ghibliImageUrl = await transformImageToGhibli(inputImageBlob)
      
      // Download the processed image
      console.log('Downloading processed image from OpenAI...')
      const processedImageBlob = await downloadImageFromUrl(ghibliImageUrl)
      
      // Generate random UUID for full resolution output
      const outputUuid = uuidv4()
      const fileExtension = getFileExtension(processedImageBlob)
      const outputBucketId = `${outputUuid}_ghibli.${fileExtension}`
      
      // Upload full resolution image to output bucket
      console.log(`Uploading full resolution image ${outputBucketId} to output bucket...`)
      await uploadToOutputBucket(outputBucketId, processedImageBlob)
      
      // Create preview image with padlock overlay
      console.log('Creating preview image with padlock overlay...')
      const previewImageBlob = await addPadlockOverlay(processedImageBlob)
      const previewBucketId = `${uuid}.png`
      
      // Upload preview image to preview bucket
      console.log(`Uploading preview image ${previewBucketId} to preview bucket...`)
      await uploadToPreviewBucket(previewBucketId, previewImageBlob)
      
      // Update database with both bucket IDs
      await updateImageState(uuid, {
        output_bucket_id: outputBucketId,
        preview_bucket_id: previewBucketId
      })

      console.log(`Successfully processed image ${uuid}`)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Image processed successfully',
        outputBucketId,
        previewBucketId
      })

    } catch (processingError) {
      console.error('Image processing error:', processingError)
      
      // Update database state to failed (only if we have a database entry)
      const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error'
      
      try {
        // Try to update error message, but don't fail the whole request if this fails
        await updateImageState(uuid, {
          error_message: errorMessage
        })
      } catch (dbError) {
        console.error('Failed to update database error message:', dbError)
        // Continue to return the original error
      }

      return NextResponse.json(
        { 
          success: false, 
          error: `Processing failed: ${errorMessage}` 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API route error:', error)
    
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