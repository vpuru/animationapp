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
    // Check if this UUID already exists and is completed
    const existingState = await getImageState(uuid)
    if (existingState) {
      if (existingState.state === 'completed') {
        return NextResponse.json({ 
          success: true, 
          message: 'Image already processed',
          outputBucketId: existingState.output_bucket_id
        })
      } else if (existingState.state === 'failed') {
        return NextResponse.json(
          { success: false, error: existingState.error_message || 'Previous processing failed' },
          { status: 500 }
        )
      }
      // If in_progress, continue with processing
    }

    try {
      // First, we need to find the actual file in the bucket since we don't know the extension
      // We'll try common extensions in order of preference
      const possibleExtensions = ['jpg', 'jpeg', 'png', 'webp']
      let inputImageBlob: Blob | null = null
      let actualInputBucketId = ''

      for (const ext of possibleExtensions) {
        const testFileName = `${uuid}.${ext}`
        try {
          inputImageBlob = await downloadFromInputBucket(testFileName)
          actualInputBucketId = testFileName
          console.log(`Found image with extension: ${ext}`)
          break
        } catch (error) {
          // Continue to next extension
          continue
        }
      }

      if (!inputImageBlob || !actualInputBucketId) {
        throw new Error('Could not find uploaded image with any supported extension')
      }

      // Create or update database entry for tracking  
      let imageState
      if (!existingState) {
        imageState = await createImageState(uuid, actualInputBucketId)
      } else {
        imageState = existingState
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
      
      // Update database state to failed
      const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error'
      await updateImageState(uuid, {
        state: 'failed',
        error_message: errorMessage
      })

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