import { NextRequest, NextResponse } from 'next/server'
import { 
  createImageState, 
  updateImageState, 
  downloadFromInputBucket, 
  uploadToOutputBucket,
  getImageState 
} from '@/services/supabase'
import { 
  transformImageToGhibli, 
  downloadImageFromUrl, 
  getFileExtension 
} from '@/services/openai'

export async function POST(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  const { uuid } = params

  if (!uuid) {
    return NextResponse.json(
      { success: false, error: 'UUID parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Check if this UUID already exists and handle accordingly
    const existingState = await getImageState(uuid)
    if (existingState) {
      if (existingState.state === 'completed') {
        return NextResponse.json({ 
          success: true, 
          message: 'Image already processed',
          outputBucketId: existingState.output_bucket_id
        })
      } else if (existingState.state === 'failed') {
        // Reset failed state to in_progress for retry
        console.log(`Retrying failed processing for UUID: ${uuid}`)
        await updateImageState(uuid, { 
          state: 'in_progress',
          error_message: null
        })
        // Update the existing state object to reflect the change
        existingState.state = 'in_progress'
        existingState.error_message = null
      } else if (existingState.state === 'in_progress') {
        // Request deduplication - another request is already processing this
        console.log(`Processing already in progress for UUID: ${uuid}`)
        return NextResponse.json(
          { success: false, error: 'Image is already being processed. Please wait.' },
          { status: 409 } // Conflict status
        )
      }
    }

    try {
      // Since we now always upload PNG files, look for PNG specifically
      const inputBucketId = `${uuid}.png`
      
      console.log(`Downloading PNG image: ${inputBucketId}`)
      const inputImageBlob = await downloadFromInputBucket(inputBucketId)
      
      if (!inputImageBlob) {
        throw new Error('Could not find uploaded PNG image')
      }

      // Create database entry for tracking (only if it doesn't exist)
      let imageState
      if (!existingState) {
        // Create new entry only if no existing state
        imageState = await createImageState(uuid, inputBucketId)
      } else {
        // Use existing state - don't overwrite completed or other states
        imageState = existingState
        console.log(`Using existing state: ${imageState.state} for UUID: ${uuid}`)
      }

      // Transform image using OpenAI
      console.log('Processing image with OpenAI...')
      const ghibliImageUrl = await transformImageToGhibli(inputImageBlob)
      
      // Download the processed image
      console.log('Downloading processed image from OpenAI...')
      const processedImageBlob = await downloadImageFromUrl(ghibliImageUrl)
      
      // Generate output filename with correct extension
      const fileExtension = getFileExtension(processedImageBlob)
      const outputBucketId = `${uuid}_ghibli.${fileExtension}`
      
      // Upload processed image to output bucket
      console.log(`Uploading processed image ${outputBucketId} to output bucket...`)
      await uploadToOutputBucket(outputBucketId, processedImageBlob)
      
      // Update database state to completed
      await updateImageState(uuid, {
        state: 'completed',
        output_bucket_id: outputBucketId
      })

      console.log(`Successfully processed image ${uuid}`)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Image processed successfully',
        outputBucketId
      })

    } catch (processingError) {
      console.error('Image processing error:', processingError)
      
      // Update database state to failed (only if we have a database entry)
      const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error'
      
      try {
        // Try to update state to failed, but don't fail the whole request if this fails
        await updateImageState(uuid, {
          state: 'failed',
          error_message: errorMessage
        })
      } catch (dbError) {
        console.error('Failed to update database state:', dbError)
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