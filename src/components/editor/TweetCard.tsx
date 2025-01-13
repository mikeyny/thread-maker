'use client'

import { useState, useEffect, useRef } from 'react'
import { Tweet } from '@/store/useThreadStore'
import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useDrag, useDrop } from 'react-dnd'
import { AITweetSuggestions } from './AITweetSuggestions'

interface TweetCardProps {
  tweet: Tweet
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
  index: number
  moveCard: (dragIndex: number, hoverIndex: number) => void
  threadContext: string
}

interface DragItem {
  index: number
  id: string
  type: 'tweet'
}

interface EmojiData {
  id: string
  name: string
  native: string
  keywords: string[]
}

interface EmojiDataset {
  [key: string]: Omit<EmojiData, 'id'>
}

// Initialize emoji data
const emojiDataTyped = emojiData as any
const allEmojis = emojiDataTyped.emojis

export function TweetCard({ tweet, onUpdate, onDelete, index, moveCard, threadContext }: TweetCardProps) {
  const [content, setContent] = useState(tweet.content)
  const [charCount, setCharCount] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showEmojiSuggestions, setShowEmojiSuggestions] = useState(false)
  const [emojiSuggestions, setEmojiSuggestions] = useState<EmojiData[]>([])
  const [pickerPosition, setPickerPosition] = useState<'top' | 'bottom'>('bottom')
  const [colonCommand, setColonCommand] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [aiButtonPosition, setAiButtonPosition] = useState<{ x: number, y: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const pickerHeight = 280 // height of emoji picker in pixels

  // Function to count characters including emoji length
  const getCharCount = (text: string) => {
    // Count emojis as 2 characters each
    const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu
    const emojis = text.match(emojiRegex) || []
    const emojiCount = emojis.length
    
    // Get base length of string with emojis counted as single chars
    const baseLength = [...text].length
    
    // Add an extra count for each emoji (since they're already counted once in baseLength)
    return baseLength + emojiCount
  }

  useEffect(() => {
    setCharCount(getCharCount(content))
  }, [content])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Handle emoji suggestions click outside
      if (showEmojiSuggestions && 
          suggestionRef.current && 
          !suggestionRef.current.contains(target)) {
        setShowEmojiSuggestions(false)
      }
      
      // Handle emoji picker click outside
      if (showEmojiPicker) {
        const isClickInsidePicker = pickerRef.current?.contains(target)
        const isClickInsideButton = emojiButtonRef.current?.contains(target)
        
        if (!isClickInsidePicker && !isClickInsideButton) {
          setShowEmojiPicker(false)
        }
      }
    }

    // Use mouseup instead of mousedown to ensure click events complete first
    document.addEventListener('mouseup', handleClickOutside)
    return () => document.removeEventListener('mouseup', handleClickOutside)
  }, [showEmojiPicker, showEmojiSuggestions])

  const handleEmojiPickerToggle = () => {
    if (!showEmojiPicker) {
      const cardRect = cardRef.current?.getBoundingClientRect()
      if (cardRect) {
        const viewportHeight = window.innerHeight
        const spaceBelow = viewportHeight - cardRect.bottom
        const spaceAbove = cardRect.top
        const pickerHeight = 280 // reduced height of picker
        
        // Choose position based on available space
        setPickerPosition(spaceBelow >= pickerHeight || spaceBelow > spaceAbove ? 'bottom' : 'top')
      }
    }
    setShowEmojiPicker(!showEmojiPicker)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    onUpdate(tweet.id, newContent)

    // Handle colon commands for emoji
    const cursorPosition = e.target.selectionStart || 0
    const textBeforeCursor = newContent.slice(0, cursorPosition)
    const colonMatch = textBeforeCursor.match(/:([^:\s]*)$/)

    if (colonMatch) {
      const query = colonMatch[1].toLowerCase()
      setColonCommand(query)
      
      // Filter emojis based on query
      const suggestions = Object.entries(allEmojis)
        .filter(([_, emoji]: [string, any]) => {
          const name = (emoji.name || '').toLowerCase()
          const keywords = emoji.keywords || []
          return name.includes(query) || keywords.some((k: string) => k.includes(query))
        })
        .map(([id, emoji]: [string, any]) => ({
          id,
          name: emoji.name || '',
          native: emoji.skins?.[0].native || emoji.native || '',
          keywords: emoji.keywords || []
        }))
        .filter(emoji => emoji.native)
        .slice(0, 5)
      
      setEmojiSuggestions(suggestions)
      setShowEmojiSuggestions(suggestions.length > 0)
    } else {
      setShowEmojiSuggestions(false)
    }
  }

  const insertEmoji = (emoji: EmojiData) => {
    if (!textareaRef.current || !emoji.native) return

    const textarea = textareaRef.current
    const cursorPosition = textarea.selectionStart || 0
    const textBeforeCursor = content.slice(0, cursorPosition)
    const colonMatch = textBeforeCursor.match(/:([^:\s]*)$/)
    
    if (!colonMatch) return
    
    const startPosition = colonMatch.index!
    const textBefore = content.slice(0, startPosition)
    const textAfter = content.slice(cursorPosition)
    
    // Create new content with the emoji
    const newContent = `${textBefore}${emoji.native} ${textAfter}`
    
    // Update content immediately
    setContent(newContent)
    onUpdate(tweet.id, newContent)
    setShowEmojiSuggestions(false)
    
    // Set cursor position after emoji and space
    requestAnimationFrame(() => {
      textarea.focus()
      const newPosition = startPosition + emoji.native.length + 1
      textarea.setSelectionRange(newPosition, newPosition)
    })
  }

  const selectEmojiFromPicker = (emoji: any) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    
    // Get the emoji character
    const emojiChar = emoji.native
    if (!emojiChar) return
    
    // Create new content with the emoji
    const newContent = content.slice(0, start) + emojiChar + ' ' + content.slice(end)
    
    // Update content immediately
    setContent(newContent)
    onUpdate(tweet.id, newContent)
    setShowEmojiPicker(false)
    
    // Set cursor position after emoji and space
    requestAnimationFrame(() => {
      textarea.focus()
      const newPosition = start + emojiChar.length + 1
      textarea.setSelectionRange(newPosition, newPosition)
    })
  }

  const ref = useRef<HTMLDivElement>(null)

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: 'tweet',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Time to actually perform the action
      moveCard(dragIndex, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: 'tweet',
    item: () => {
      return { id: tweet.id, index, type: 'tweet' }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const opacity = isDragging ? 0.4 : 1
  drag(drop(ref))

  const handleTextSelection = () => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const selectedText = textarea.value.substring(
      textarea.selectionStart || 0,
      textarea.selectionEnd || 0
    ).trim()

    if (!selectedText) {
      setSelectedText('')
      setAiButtonPosition(null)
      return
    }

    const textareaRect = textarea.getBoundingClientRect()
    const selectionStart = textarea.selectionStart || 0
    const textBeforeSelection = textarea.value.substring(0, selectionStart)
    
    // Create a temporary div to measure text dimensions
    const measureDiv = document.createElement('div')
    measureDiv.style.cssText = window.getComputedStyle(textarea).cssText
    measureDiv.style.height = 'auto'
    measureDiv.style.position = 'absolute'
    measureDiv.style.whiteSpace = 'pre-wrap'
    measureDiv.style.visibility = 'hidden'
    measureDiv.textContent = textBeforeSelection
    document.body.appendChild(measureDiv)

    // Get the line height
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight)
    
    // Calculate position
    const lines = Math.floor(measureDiv.clientHeight / lineHeight)
    const top = textareaRect.top + (lines * lineHeight)
    
    // Clean up
    document.body.removeChild(measureDiv)
    
    setSelectedText(selectedText)
    setAiButtonPosition({
      x: textareaRect.left + Math.min(
        textareaRect.width / 2,
        Math.max(50, (textarea.selectionEnd || 0) - (textarea.selectionStart || 0)) * 4
      ),
      y: top - 10
    })
  }

  const handleSuggestionSelect = (suggestion: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    
    const newContent = content.slice(0, start) + suggestion + content.slice(end)
    setContent(newContent)
    onUpdate(tweet.id, newContent)
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleMouseUp = () => {
      handleTextSelection()
    }

    textarea.addEventListener('mouseup', handleMouseUp)
    textarea.addEventListener('keyup', handleTextSelection)
    
    return () => {
      textarea.removeEventListener('mouseup', handleMouseUp)
      textarea.removeEventListener('keyup', handleTextSelection)
    }
  }, [content])

  return (
    <div 
      ref={ref}
      className="p-4 bg-gray-900 rounded-xl border border-gray-800 cursor-move"
      style={{ opacity }}
      data-handler-id={handlerId}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium text-white">
            {index + 1}
          </div>
          <span className="text-sm font-medium text-gray-300">Tweet {index + 1}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            ref={emojiButtonRef}
            onClick={handleEmojiPickerToggle}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
            </svg>
          </button>
          <span className={`text-sm ${charCount > 280 ? 'text-red-500' : 'text-gray-400'}`}>
            {charCount}/280
          </span>
          <button
            onClick={() => onDelete(tweet.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          className="w-full min-h-[120px] p-3 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-lg"
          placeholder="What's happening? Type :emoji: for emojis"
          style={{ border: 'none' }}
        />
        
        {showEmojiSuggestions && (
          <div 
            ref={suggestionRef}
            className="absolute bottom-full left-0 mb-2 w-72 bg-gray-800 rounded-lg shadow-lg border border-gray-700 max-h-60 overflow-y-auto"
          >
            {emojiSuggestions.map((emoji) => (
              <button
                key={emoji.id}
                onClick={() => insertEmoji(emoji)}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-3 text-white"
              >
                <span className="text-2xl">{emoji.native}</span>
                <div className="flex flex-col">
                  <span className="text-sm text-white font-medium">:{emoji.name}:</span>
                  <span className="text-xs text-gray-400">{emoji.keywords.slice(0, 3).join(', ')}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {showEmojiPicker && (
          <div 
            ref={pickerRef}
            className={`absolute ${
              pickerPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            } right-0 z-50`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[280px] overflow-hidden rounded-lg shadow-lg">
              <Picker
                data={emojiData}
                onEmojiSelect={selectEmojiFromPicker}
                theme="dark"
                skinTonePosition="none"
                previewPosition="none"
                searchPosition="none"
                perLine={8}
                maxFrequentRows={0}
                emojiSize={20}
                emojiButtonSize={28}
                navPosition="none"
                categories={['smileys', 'people', 'nature', 'food', 'activity']}
              />
            </div>
          </div>
        )}

        <AITweetSuggestions
          selectedText={selectedText}
          position={aiButtonPosition}
          onSuggestionSelect={handleSuggestionSelect}
          onClose={() => {
            setSelectedText('')
            setAiButtonPosition(null)
          }}
          isVisible={Boolean(selectedText && aiButtonPosition)}
          threadContext={threadContext}
        />
      </div>
      {charCount > 280 && (
        <p className="text-sm text-red-500 mt-1">
          Tweet exceeds character limit
        </p>
      )}
    </div>
  )
} 