'use client'

import { useThreadStore } from '@/store/useThreadStore'
import { formatDistanceToNow } from 'date-fns'

export function Sidebar() {
  const { threads, currentThreadId, setCurrentThread, deleteThread, createThread } = useThreadStore()

  return (
    <div className="w-72 h-screen bg-black text-white fixed left-0 top-0 border-r border-gray-800">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">My Threads</h2>
          <button
            onClick={() => createThread()}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors"
          >
            New Thread
          </button>
        </div>
        
        <nav className="space-y-1">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                currentThreadId === thread.id ? 'bg-gray-800' : 'hover:bg-gray-900'
              }`}
            >
              <div className="flex justify-between items-start">
                <div
                  className="flex-1"
                  onClick={() => setCurrentThread(thread.id)}
                >
                  <h3 className="font-medium text-base text-white">{thread.title}</h3>
                  <span className="text-gray-500 text-xs mt-2 block">
                    {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })} • 
                    {thread.tweets.length} {thread.tweets.length === 1 ? 'tweet' : 'tweets'}
                  </span>
                </div>
                <button
                  onClick={() => deleteThread(thread.id)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {threads.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No threads yet. Create one to get started!
            </div>
          )}
        </nav>
      </div>
    </div>
  )
} 