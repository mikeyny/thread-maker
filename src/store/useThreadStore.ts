import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Tweet {
  id: string
  content: string
  mediaUrls?: string[]
}

export interface Thread {
  id: string
  title: string
  tweets: Tweet[]
  createdAt: string
  updatedAt: string
}

interface ThreadState {
  threads: Thread[]
  currentThreadId: string | null
  createThread: (title?: string) => void
  updateThread: (threadId: string, tweets: Tweet[]) => void
  updateThreadTitle: (threadId: string, title: string) => void
  deleteThread: (threadId: string) => void
  setCurrentThread: (threadId: string) => void
  getCurrentThread: () => Thread | undefined
}

export const useThreadStore = create<ThreadState>()(
  persist(
    (set, get) => ({
      threads: [],
      currentThreadId: null,

      createThread: (title = 'Untitled Thread') => {
        const newThread: Thread = {
          id: crypto.randomUUID(),
          title: title.slice(0, 20),
          tweets: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          threads: [...state.threads, newThread],
          currentThreadId: newThread.id,
        }))
      },

      updateThread: (threadId: string, tweets: Tweet[]) => {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  tweets,
                  updatedAt: new Date().toISOString(),
                }
              : thread
          ),
        }))
      },

      updateThreadTitle: (threadId: string, title: string) => {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  title: title.slice(0, 20),
                  updatedAt: new Date().toISOString(),
                }
              : thread
          ),
        }))
      },

      deleteThread: (threadId: string) => {
        set((state) => ({
          threads: state.threads.filter((thread) => thread.id !== threadId),
          currentThreadId:
            state.currentThreadId === threadId ? null : state.currentThreadId,
        }))
      },

      setCurrentThread: (threadId: string) => {
        set({ currentThreadId: threadId })
      },

      getCurrentThread: () => {
        const state = get()
        return state.threads.find((thread) => thread.id === state.currentThreadId)
      },
    }),
    {
      name: 'thread-storage',
    }
  )
) 