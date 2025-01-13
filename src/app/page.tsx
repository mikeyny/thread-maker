'use client'

import { ThreadEditor } from '@/components/editor/ThreadEditor'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <ThreadEditor />
      </div>
    </main>
  )
}
