import { NextResponse } from 'next/server'
import crypto from 'crypto'

interface OAuthParams {
  oauth_consumer_key: string
  oauth_nonce: string
  oauth_signature_method: string
  oauth_timestamp: string
  oauth_token: string
  oauth_version: string
  oauth_signature?: string
}

function generateAuthHeader(method: string, url: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomBytes(16).toString('hex')

  const oauthParams: OAuthParams = {
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

  oauthParams.oauth_signature = signature

  return 'OAuth ' + Object.entries(oauthParams)
    .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
    .join(', ')
}

async function postTweet(content: string, reply_to?: string) {
  const url = 'https://api.twitter.com/2/tweets'
  const body: any = { text: content }
  if (reply_to) {
    body.reply = { in_reply_to_tweet_id: reply_to }
  }

  const authHeader = generateAuthHeader('POST', url)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('Twitter API Error:', error)
    throw new Error(error.detail || 'Failed to post tweet')
  }

  return response.json()
}

export async function POST(request: Request) {
  try {
    const { tweets } = await request.json()

    if (!Array.isArray(tweets) || tweets.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: tweets array is required' },
        { status: 400 }
      )
    }

    // Post the first tweet
    const firstTweet = await postTweet(tweets[0].content)
    let lastTweetId = firstTweet.data.id

    // Post the rest of the tweets as replies
    for (let i = 1; i < tweets.length; i++) {
      const tweet = await postTweet(tweets[i].content, lastTweetId)
      lastTweetId = tweet.data.id
    }

    return NextResponse.json({
      success: true,
      message: 'Thread posted successfully'
    })
  } catch (error: any) {
    console.error('Error posting thread to Twitter:', error)
    return NextResponse.json(
      { 
        error: 'Failed to post thread to Twitter',
        details: error.message
      },
      { status: 500 }
    )
  }
} 