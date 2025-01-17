'use client'

import { useState, Suspense } from 'react'
import { useThreadStore, Tweet } from '@/store/useThreadStore'
import { TweetCard } from './TweetCard'
import { v4 as uuidv4 } from 'uuid'
import dynamic from 'next/dynamic'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

// Create a client-only DnD wrapper
const DndProviderWrapper = dynamic(
  async () => {
    const Component = ({ children }: { children: React.ReactNode }) => (
      <DndProvider backend={HTML5Backend}>{children}</DndProvider>
    )
    Component.displayName = 'DndProviderWrapper'
    return Component
  },
  { 
    ssr: false,
    loading: () => <div className="max-w-2xl mx-auto p-4 opacity-50" />
  }
)

interface MediaItem {
  file: File
  previewUrl: string
}

interface TweetWithMedia extends Tweet {
  mediaFiles?: MediaItem[]
}

export function ThreadEditor() {
  const { getCurrentThread, updateThread, createThread, updateThreadTitle } = useThreadStore()
  const currentThread = getCurrentThread()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  const handleAddTweet = () => {
    if (!currentThread) {
      createThread()
      return
    }

    const newTweet: Tweet = {
      id: uuidv4(),
      content: '',
    }
    
    updateThread(currentThread.id, [...currentThread.tweets, newTweet])
  }

  const handleUpdateTweet = (id: string, content: string, mediaUrls?: string[]) => {
    if (!currentThread) return

    const updatedTweets = currentThread.tweets.map((t) =>
      t.id === id ? { 
        ...t, 
        content, 
        mediaUrls,
        // Preserve mediaFiles from the existing tweet object
        mediaFiles: (t as TweetWithMedia).mediaFiles 
      } : t
    )
    updateThread(currentThread.id, updatedTweets)
  }

  const handleDeleteTweet = (id: string) => {
    if (!currentThread) return

    const updatedTweets = currentThread.tweets.filter((t) => t.id !== id)
    updateThread(currentThread.id, updatedTweets)
  }

  const moveCard = (dragIndex: number, hoverIndex: number) => {
    if (!currentThread) return
    
    const dragTweet = currentThread.tweets[dragIndex]
    const updatedTweets = [...currentThread.tweets]
    updatedTweets.splice(dragIndex, 1)
    updatedTweets.splice(hoverIndex, 0, dragTweet)
    updateThread(currentThread.id, updatedTweets)
  }

  const handleTitleUpdate = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!currentThread) return
    if (e.key === 'Enter') {
      updateThreadTitle(currentThread.id, e.currentTarget.value)
      setIsEditingTitle(false)
    }
  }

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!currentThread) return
    updateThreadTitle(currentThread.id, e.target.value)
    setIsEditingTitle(false)
  }

  const getThreadContext = () => {
    if (!currentThread) return ''
    return currentThread.tweets.map((t, i) => `Tweet ${i + 1}: ${t.content}`).join('\n')
  }

  const handlePostToTwitter = async () => {
    if (!currentThread || currentThread.tweets.length === 0) return
    
    setIsPosting(true)
    try {
      // First, upload all media
      const tweetsWithMedia = await Promise.all(
        currentThread.tweets.map(async (tweet) => {
          const mediaUrls = []
          const tweetWithMedia = tweet as TweetWithMedia
          
          if (tweetWithMedia.mediaFiles && tweetWithMedia.mediaFiles.length > 0) {
            for (const mediaItem of tweetWithMedia.mediaFiles) {
              const formData = new FormData()
              formData.append('file', mediaItem.file)

              const response = await fetch('/api/media', {
                method: 'POST',
                body: formData,
              })

              if (!response.ok) {
                const error = await response.json()
                console.error('Media upload error:', error)
                throw new Error('Failed to upload media: ' + (error.details || error.error || 'Unknown error'))
              }

              const { mediaId } = await response.json()
              mediaUrls.push(mediaId)
            }
          }
          
          return {
            ...tweet,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
          }
        })
      )

      // Then post the tweets
      const response = await fetch('/api/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweets: tweetsWithMedia,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        const error = data.error || 'Failed to post thread'
        console.error('Twitter API error:', data)
        throw new Error(error)
      }

      alert('Thread posted successfully!')
    } catch (error: any) {
      console.error('Error posting thread:', error)
      alert(error.message || 'Failed to post thread')
    } finally {
      setIsPosting(false)
    }
  }

  if (!currentThread) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">No Thread Selected</h2>
        <button
          onClick={() => createThread()}
          className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          Create New Thread
        </button>
      </div>
    )
  }

  const content = (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          {isEditingTitle ? (
            <input
              type="text"
              defaultValue={currentThread?.title}
              maxLength={20}
              autoFocus
              onKeyDown={handleTitleUpdate}
              onBlur={handleTitleBlur}
              className="text-2xl font-bold bg-transparent text-gray-900 border-b-2 border-blue-500 focus:outline-none w-full max-w-md"
            />
          ) : (
            <h1 
              onClick={() => setIsEditingTitle(true)}
              className="text-2xl font-bold text-gray-900 mb-1 cursor-pointer hover:opacity-80 flex items-center gap-2"
            >
              {currentThread?.title}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </h1>
          )}
          <p className="text-gray-500 text-sm">
            {currentThread?.tweets.length} tweets in thread
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePostToTwitter}
            disabled={isPosting || !currentThread?.tweets.length}
            className={`px-4 py-2 text-white rounded-full transition-colors ${
              isPosting || !currentThread?.tweets.length
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isPosting ? 'Posting...' : 'Post to Twitter'}
          </button>
          <button
            onClick={handleAddTweet}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            Add Tweet
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {currentThread?.tweets.map((tweet, index) => (
          <TweetCard
            key={tweet.id}
            tweet={tweet}
            index={index}
            onUpdate={handleUpdateTweet}
            onDelete={handleDeleteTweet}
            moveCard={moveCard}
            threadContext={getThreadContext()}
          />
        ))}
      </div>

      {currentThread?.tweets.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          Start your thread by adding a tweet
        </div>
      )}
    </div>
  )

  return (
    <Suspense fallback={content}>
      <DndProviderWrapper>
        {content}
      </DndProviderWrapper>
    </Suspense>
  )
} 