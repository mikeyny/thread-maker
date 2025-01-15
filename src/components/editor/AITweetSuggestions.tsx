import { useState, useEffect, useRef } from 'react'

interface AITweetSuggestionsProps {
  selectedText: string
  position: { x: number, y: number } | null
  onSuggestionSelect: (suggestion: string) => void
  onClose: () => void
  isVisible: boolean
  threadContext: string
}

interface Suggestion {
  text: string
  score: number
}

export function AITweetSuggestions({ 
  selectedText, 
  position, 
  onSuggestionSelect,
  onClose,
  isVisible,
  threadContext
}: AITweetSuggestionsProps) {
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')

  const prompts = [
    { icon: '✨', label: 'Make it more engaging' },
    { icon: '😄', label: 'Make it funnier' },
    { icon: '📝', label: 'Make it shorter' },
    { icon: '🎯', label: 'Make it clearer' },
    { icon: '🔥', label: 'Make it more viral' },
    { icon: '✏️', label: 'Custom prompt...', isCustom: true }
  ]

  const handleAIButtonClick = () => {
    setShowPromptModal(true)
    setShowCustomPrompt(false)
    setCustomPrompt('')
  }

  const handleNextSuggestion = () => {
    setCurrentSuggestionIndex((prev) => 
      prev === suggestions.length - 1 ? 0 : prev + 1
    )
  }

  const handlePrevSuggestion = () => {
    setCurrentSuggestionIndex((prev) => 
      prev === 0 ? suggestions.length - 1 : prev - 1
    )
  }

  const handlePromptSelect = async (prompt: string) => {
    setSelectedPrompt(prompt)
    setShowPromptModal(false)
    setIsLoading(true)
    setShowSuggestionsModal(true)
    setCurrentSuggestionIndex(0)

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: selectedText,
          prompt: prompt,
          threadContext: threadContext
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }

      const data = await response.json()
      setSuggestions(data.suggestions)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([
        { text: 'Failed to generate suggestions. Please try again.', score: 0 }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionSelect = (suggestion: string) => {
    onSuggestionSelect(suggestion)
    setShowSuggestionsModal(false)
    onClose()
  }

  const handlePromptClick = (prompt: typeof prompts[0]) => {
    if (prompt.isCustom) {
      setShowCustomPrompt(true)
    } else {
      handlePromptSelect(prompt.label)
    }
  }

  const handleCustomPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customPrompt.trim()) {
      handlePromptSelect(customPrompt)
      setCustomPrompt('')
      setShowCustomPrompt(false)
    }
  }

  if (!isVisible || !position) return null

  return (
    <>
      {/* Floating AI Button */}
      <div
        className="fixed z-50 shadow-lg rounded-full bg-blue-500 p-2 cursor-pointer hover:bg-blue-600 transition-colors"
        style={{ 
          left: `${position?.x}px`, 
          top: `${position?.y}px`,
          transform: 'translate(-50%, -50%)'
        }}
        onClick={handleAIButtonClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-white"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Updated Prompt Selection Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              How would you like to improve this text?
            </h3>
            {!showCustomPrompt ? (
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt.label}
                    onClick={() => handlePromptClick(prompt)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3"
                  >
                    <span className="text-2xl">{prompt.icon}</span>
                    <span className="text-gray-700">{prompt.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleCustomPromptSubmit} className="space-y-4">
                <div>
                  <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter your prompt
                  </label>
                  <input
                    type="text"
                    id="customPrompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., Make it more professional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomPrompt(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!customPrompt.trim()}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </form>
            )}
            {!showCustomPrompt && (
              <button
                onClick={onClose}
                className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Updated Suggestions Modal */}
      {showSuggestionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowSuggestionsModal(false)
                onClose()
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI Suggestions
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {selectedPrompt}
            </p>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="relative">
                {/* Navigation arrows */}
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <button
                    onClick={handlePrevSuggestion}
                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors transform -translate-x-1/2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    onClick={handleNextSuggestion}
                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors transform translate-x-1/2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Current suggestion */}
                <div className="px-8">
                  <button
                    onClick={() => handleSuggestionSelect(suggestions[currentSuggestionIndex].text)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <p className="text-gray-700">{suggestions[currentSuggestionIndex].text}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 h-1 rounded-full">
                        <div 
                          className="bg-blue-500 h-1 rounded-full"
                          style={{ width: `${suggestions[currentSuggestionIndex].score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(suggestions[currentSuggestionIndex].score * 100)}%
                      </span>
                    </div>
                  </button>
                  <div className="mt-2 text-center text-sm text-gray-500">
                    {currentSuggestionIndex + 1} of {suggestions.length}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">No suggestions available</p>
            )}
            
            <button
              onClick={() => {
                setShowSuggestionsModal(false)
                onClose()
              }}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
} 