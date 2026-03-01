'use client'

import React, { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { FiSend, FiMenu, FiColumns, FiTag } from 'react-icons/fi'
import ProductCard from './ProductCard'
import type { Recommendation } from './ProductCard'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  recommendations?: Recommendation[]
  qualifying_question?: string | null
  follow_up_suggestions?: string[]
  timestamp: Date
}

interface ChatPanelProps {
  messages: Message[]
  input: string
  loading: boolean
  suggestions: string[]
  comparisonItems: Recommendation[]
  onInputChange: (val: string) => void
  onSend: (text: string) => void
  onToggleSidebar: () => void
  onCompare: (item: Recommendation) => void
  onShowComparison: () => void
  sidebarOpen: boolean
  activeAgentId: string | null
}

const WELCOME_SUGGESTIONS = [
  'I need a laptop for video editing',
  'Show me headphones under $200',
  'Help me find a camera for beginners',
  'Compare smartwatches for fitness',
]

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-serif font-medium text-sm mt-3 mb-1 tracking-wider">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-serif font-medium text-base mt-3 mb-1 tracking-wider">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-serif font-medium text-lg mt-4 mb-2 tracking-wider">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm leading-relaxed">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

export default function ChatPanel({
  messages,
  input,
  loading,
  suggestions,
  comparisonItems,
  onInputChange,
  onSend,
  onToggleSidebar,
  onCompare,
  onShowComparison,
  sidebarOpen,
  activeAgentId,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const safeMessages = Array.isArray(messages) ? messages : []
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : []
  const displaySuggestions = safeSuggestions.length > 0 ? safeSuggestions : (safeMessages.length === 0 ? WELCOME_SUGGESTIONS : [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [safeMessages.length, loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
      e.preventDefault()
      onSend(input.trim())
    }
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button onClick={onToggleSidebar} className="text-muted-foreground hover:text-foreground transition-colors">
              <FiMenu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="font-serif text-base font-medium tracking-wider">Product Recommendations</h2>
            <p className="text-xs text-muted-foreground font-sans tracking-wider">
              {activeAgentId ? 'Searching for products...' : 'Personalized suggestions curated for you'}
            </p>
          </div>
        </div>
        {comparisonItems.length >= 2 && (
          <Button variant="outline" size="sm" onClick={onShowComparison} className="font-sans text-xs tracking-wider gap-1.5">
            <FiColumns className="w-3.5 h-3.5" />
            Compare ({comparisonItems.length})
          </Button>
        )}
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 md:px-8 py-6">
        {safeMessages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-12 h-12 border border-primary/30 flex items-center justify-center mb-6">
              <FiTag className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-medium tracking-wider mb-3">Welcome to Your Personal Shopping Assistant</h2>
            <p className="text-sm text-muted-foreground font-sans leading-loose max-w-lg mb-8 tracking-wider">
              I can help you find the perfect product based on your needs, preferences, and budget. Tell me what you are looking for, and I will provide tailored recommendations.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {WELCOME_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSend(suggestion)}
                  className="text-xs font-sans tracking-wider px-4 py-2 border border-border bg-card hover:bg-secondary hover:border-primary/30 transition-colors text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {safeMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground px-5 py-3' : ''}`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm font-sans leading-relaxed tracking-wider">{msg.content}</p>
                  ) : (
                    <div className="space-y-4">
                      {msg.qualifying_question && (
                        <div className="text-sm font-sans leading-relaxed text-foreground">
                          {renderMarkdown(msg.qualifying_question)}
                        </div>
                      )}

                      {msg.content && !msg.qualifying_question && (
                        <div className="text-sm font-sans leading-relaxed text-foreground">
                          {renderMarkdown(msg.content)}
                        </div>
                      )}

                      {Array.isArray(msg.recommendations) && msg.recommendations.length > 0 && (
                        <div className="space-y-3">
                          {msg.recommendations.map((rec, rIdx) => (
                            <ProductCard
                              key={rIdx}
                              recommendation={rec}
                              onCompare={onCompare}
                              isSelected={comparisonItems.some((c) => c?.name === rec?.name)}
                            />
                          ))}
                        </div>
                      )}

                      {Array.isArray(msg.follow_up_suggestions) && msg.follow_up_suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {msg.follow_up_suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => onSend(sug)}
                              className="text-xs font-sans tracking-wider px-3 py-1.5 border border-border bg-card hover:bg-secondary hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="space-y-2 max-w-[70%]">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Suggestion Chips + Input */}
      <div className="border-t border-border bg-card px-4 md:px-8 py-4">
        {safeMessages.length > 0 && displaySuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 max-w-3xl mx-auto">
            {displaySuggestions.slice(0, 4).map((sug, idx) => (
              <button
                key={idx}
                onClick={() => onSend(sug)}
                disabled={loading}
                className="text-xs font-sans tracking-wider px-3 py-1.5 border border-border hover:bg-secondary hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3 max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you're looking for..."
            disabled={loading}
            className="flex-1 font-sans text-sm tracking-wider bg-background border-border placeholder:text-muted-foreground/60"
          />
          <Button
            onClick={() => { if (input.trim()) onSend(input.trim()) }}
            disabled={loading || !input.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4"
          >
            <FiSend className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
