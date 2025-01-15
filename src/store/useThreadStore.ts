import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface MediaItem {
  file: File
  previewUrl: string
}

export interface SerializedMediaItem {
  name: string
  type: string
  size: number
  lastModified: number
  base64Data: string
}

export interface Tweet {
  id: string
  content: string
  mediaUrls?: string[]
  mediaFiles?: MediaItem[]
  serializedMediaFiles?: SerializedMediaItem[]
}

export interface Thread {
  id: string
  title: string
  tweets: Tweet[]
  createdAt: string
  updatedAt: string
}

interface ThreadStore {
  threads: Thread[]
  currentThreadId: string | null
  getCurrentThread: () => Thread | null
  createThread: () => void
  updateThread: (id: string, tweets: Tweet[]) => Promise<void>
  updateThreadTitle: (id: string, title: string) => void
  deleteThread: (id: string) => void
  setCurrentThread: (id: string) => void
}

const serializeMediaFiles = async (mediaFiles?: MediaItem[]): Promise<SerializedMediaItem[] | undefined> => {
  if (!mediaFiles) return undefined
  
  return Promise.all(mediaFiles.map(async item => {
    // Convert file to base64
    const buffer = await item.file.arrayBuffer()
    const base64Data = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    )
    
    return {
      name: item.file.name,
      type: item.file.type,
      size: item.file.size,
      lastModified: item.file.lastModified,
      base64Data
    }
  }))
}

const deserializeMediaFiles = (serializedFiles?: SerializedMediaItem[]): MediaItem[] | undefined => {
  if (!serializedFiles) return undefined
  
  try {
    return serializedFiles.map(item => {
      // Convert base64 back to file
      const byteString = atob(item.base64Data)
      const arrayBuffer = new ArrayBuffer(byteString.length)
      const uint8Array = new Uint8Array(arrayBuffer)
      
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i)
      }
      
      const blob = new Blob([arrayBuffer], { type: item.type })
      const file = new File([blob], item.name, {
        type: item.type,
        lastModified: item.lastModified
      })
      
      return {
        file,
        previewUrl: URL.createObjectURL(blob)
      }
    })
  } catch (error) {
    console.error('Error deserializing media files:', error)
    return undefined
  }
}

export const useThreadStore = create<ThreadStore>()(
  persist(
    (set, get) => ({
      threads: [],
      currentThreadId: null,
      getCurrentThread: () => {
        const state = get()
        if (!state.currentThreadId) return null
        return state.threads.find((t) => t.id === state.currentThreadId) || null
      },
      createThread: () => {
        const newThread: Thread = {
          id: uuidv4(),
          title: 'New Thread',
          tweets: [{ id: uuidv4(), content: '' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        set((state) => ({
          threads: [...state.threads, newThread],
          currentThreadId: newThread.id,
        }))
      },
      updateThread: async (id, tweets) => {
        const serializedTweets = await Promise.all(tweets.map(async tweet => ({
          ...tweet,
          serializedMediaFiles: await serializeMediaFiles(tweet.mediaFiles),
          mediaFiles: tweet.mediaFiles // Keep the mediaFiles for current session
        })))

        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === id
              ? {
                  ...t,
                  tweets: serializedTweets,
                  updatedAt: new Date().toISOString()
                }
              : t
          ),
        }))
      },
      updateThreadTitle: (id, title) => {
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === id 
              ? { 
                  ...t, 
                  title,
                  updatedAt: new Date().toISOString()
                } 
              : t
          ),
        }))
      },
      deleteThread: (id) => {
        set((state) => ({
          threads: state.threads.filter((t) => t.id !== id),
          currentThreadId:
            state.currentThreadId === id ? null : state.currentThreadId,
        }))
      },
      setCurrentThread: (id) => {
        set({ currentThreadId: id })
      },
    }),
    {
      name: 'thread-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Deserialize media files after rehydration
          state.threads = state.threads.map(thread => ({
            ...thread,
            tweets: thread.tweets.map(tweet => ({
              ...tweet,
              mediaFiles: deserializeMediaFiles(tweet.serializedMediaFiles)
            }))
          }))
        }
      }
    }
  )
) 