import { NextResponse } from 'next/server'
import crypto from 'crypto'

function generateAuthHeader(method: string, url: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomBytes(16).toString('hex')

  const oauthParams = {
    oauth_consumer_key: process.env.TWITTER_API_KEY!,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: process.env.TWITTER_ACCESS_TOKEN!,
    oauth_version: '1.0',
  }

  // Create parameter string
  const paramString = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')

  // Create signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramString),
  ].join('&')

  // Create signing key
  const signingKey = `${encodeURIComponent(process.env.TWITTER_API_SECRET!)}&${encodeURIComponent(process.env.TWITTER_ACCESS_SECRET!)}`

  // Generate signature
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64')

  return 'OAuth ' + Object.entries({ ...oauthParams, oauth_signature: signature })
    .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
    .join(', ')
}

async function uploadMedia(file: Buffer, mimeType: string) {
  // Step 1: Initialize upload
  const initUrl = 'https://upload.twitter.com/1.1/media/upload.json'
  const authHeader = generateAuthHeader('POST', initUrl)

  // Create form data for INIT
  const formData = new FormData()
  formData.append('command', 'INIT')
  formData.append('total_bytes', file.length.toString())
  formData.append('media_type', mimeType)

  console.log('Initializing media upload:', { mimeType, size: file.length })

  const initResponse = await fetch(initUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
    body: formData,
  })

  if (!initResponse.ok) {
    const error = await initResponse.json()
    console.error('Media upload INIT error:', error)
    throw new Error(error.error || 'Failed to initialize media upload')
  }

  const initData = await initResponse.json()
  console.log('Media upload initialized:', initData)
  const { media_id_string } = initData

  // Step 2: Upload media chunks
  const chunkSize = 5 * 1024 * 1024 // 5MB chunks
  const chunks = Math.ceil(file.length / chunkSize)

  console.log('Uploading media in chunks:', { totalChunks: chunks, chunkSize })

  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.length)
    const chunk = file.slice(start, end)

    const appendFormData = new FormData()
    appendFormData.append('command', 'APPEND')
    appendFormData.append('media_id', media_id_string)
    appendFormData.append('segment_index', i.toString())
    appendFormData.append('media', new Blob([chunk], { type: mimeType }))

    console.log('Uploading chunk:', { index: i, size: chunk.length })

    const appendResponse = await fetch(initUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: appendFormData,
    })

    if (!appendResponse.ok) {
      const error = await appendResponse.json()
      console.error('Media upload APPEND error:', error)
      throw new Error(error.error || 'Failed to upload media chunk')
    }
  }

  // Step 3: Finalize upload
  const finalizeFormData = new FormData()
  finalizeFormData.append('command', 'FINALIZE')
  finalizeFormData.append('media_id', media_id_string)

  console.log('Finalizing media upload')

  const finalizeResponse = await fetch(initUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
    body: finalizeFormData,
  })

  if (!finalizeResponse.ok) {
    const error = await finalizeResponse.json()
    console.error('Media upload FINALIZE error:', error)
    throw new Error(error.error || 'Failed to finalize media upload')
  }

  const finalizeData = await finalizeResponse.json()
  console.log('Media upload completed:', finalizeData)

  return media_id_string
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('Processing media upload:', { 
      type: file.type, 
      size: file.size,
      name: file.name 
    })

    const buffer = Buffer.from(await file.arrayBuffer())
    const mediaId = await uploadMedia(buffer, file.type)

    return NextResponse.json({ mediaId })
  } catch (error: any) {
    console.error('Error in media upload endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload media',
        details: error.message
      },
      { status: 500 }
    )
  }
} 