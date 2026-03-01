'use client'

import React, { useState, useCallback } from 'react'
import { callAIAgent, extractText } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import ChatSidebar from './sections/ChatSidebar'
import ChatPanel from './sections/ChatPanel'
import ComparisonModal from './sections/ComparisonModal'
import type { Recommendation } from './sections/ProductCard'
import type { Message } from './sections/ChatPanel'
import type { Conversation } from './sections/ChatSidebar'

const AGENT_ID = '69a43373bab6fd30b13966d0'
const RAG_ID = '69a4336000c2d274880f8a51'

// --- ErrorBoundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-serif font-medium mb-2 tracking-wider">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm font-sans">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-sans tracking-wider"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Sample data ---
const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: 'sample-1',
    title: 'Laptop for video editing',
    messages: [],
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: 'sample-2',
    title: 'Headphones under $200',
    messages: [],
    timestamp: new Date(Date.now() - 86400000),
  },
]

const SAMPLE_MESSAGES: Message[] = [
  {
    id: 's1',
    role: 'user',
    content: 'I need a laptop for video editing under $2000',
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: 's2',
    role: 'assistant',
    content: '',
    qualifying_question: null,
    recommendations: [
      {
        name: 'MacBook Pro 14" M3 Pro',
        price: '$1,999',
        features: ['M3 Pro chip', '18GB unified memory', '512GB SSD', '14.2" Liquid Retina XDR display', 'Up to 17 hours battery'],
        fit_reason: 'The M3 Pro chip delivers exceptional video editing performance with hardware-accelerated ProRes encoding, and the XDR display provides accurate color representation for professional editing workflows.',
      },
      {
        name: 'ASUS ProArt Studiobook 16 OLED',
        price: '$1,799',
        features: ['Intel Core i9-13980HX', '32GB DDR5 RAM', '1TB SSD', 'NVIDIA RTX 4060', '16" 3.2K OLED display'],
        fit_reason: 'With 32GB RAM and a dedicated RTX 4060 GPU, this laptop handles complex timelines and 4K rendering with ease. The OLED display offers superior contrast for color grading.',
      },
      {
        name: 'Dell XPS 15 (2024)',
        price: '$1,649',
        features: ['Intel Core i7-13700H', '16GB DDR5 RAM', '512GB SSD', 'NVIDIA RTX 4050', '15.6" 3.5K OLED'],
        fit_reason: 'A well-balanced option that combines portability with solid editing capability. The OLED panel and compact form factor make it ideal for editors who travel.',
      },
    ],
    follow_up_suggestions: [
      'Compare the MacBook Pro and ASUS ProArt',
      'Which has the best display for color grading?',
      'Show me options with 32GB RAM or more',
      'What about desktop alternatives?',
    ],
    timestamp: new Date(Date.now() - 240000),
  },
]

export default function Page() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') return crypto.randomUUID()
    return 'fallback-session'
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [comparisonItems, setComparisonItems] = useState<Recommendation[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sampleMode, setSampleMode] = useState(false)
  const [latestSuggestions, setLatestSuggestions] = useState<string[]>([])

  const getActiveMessages = useCallback((): Message[] => {
    if (sampleMode) return SAMPLE_MESSAGES
    if (!activeConversation) return []
    const conv = conversations.find((c) => c.id === activeConversation)
    return Array.isArray(conv?.messages) ? (conv.messages as Message[]) : []
  }, [conversations, activeConversation, sampleMode])

  const getDisplayConversations = useCallback((): Conversation[] => {
    if (sampleMode) return SAMPLE_CONVERSATIONS
    return conversations
  }, [conversations, sampleMode])

  const createNewChat = useCallback(() => {
    if (sampleMode) return
    const newId = crypto.randomUUID()
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      timestamp: new Date(),
    }
    setConversations((prev) => [newConv, ...prev])
    setActiveConversation(newId)
    setLatestSuggestions([])
  }, [sampleMode])

  const ensureActiveConversation = useCallback((): string => {
    if (activeConversation) {
      const exists = conversations.some((c) => c.id === activeConversation)
      if (exists) return activeConversation
    }
    const newId = crypto.randomUUID()
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      timestamp: new Date(),
    }
    setConversations((prev) => [newConv, ...prev])
    setActiveConversation(newId)
    return newId
  }, [activeConversation, conversations])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading || sampleMode) return

    const convId = ensureActiveConversation()
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = Array.isArray(c.messages) ? c.messages : []
        const title = msgs.length === 0 ? text.trim().slice(0, 40) : c.title
        return { ...c, title, messages: [...msgs, userMsg], timestamp: new Date() }
      })
    )
    setInput('')
    setLoading(true)
    setActiveAgentId(AGENT_ID)

    try {
      const result = await callAIAgent(text.trim(), AGENT_ID, { session_id: sessionId })

      let assistantMsg: Message

      if (result.success) {
        const rawResult = result?.response?.result
        const parsed = parseLLMJson(rawResult)

        const qualifying_question = parsed?.qualifying_question || null
        const recommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations : []
        const follow_up_suggestions = Array.isArray(parsed?.follow_up_suggestions) ? parsed.follow_up_suggestions : []

        let content = ''
        if (!qualifying_question && recommendations.length === 0) {
          content = extractText(result.response) || (typeof rawResult === 'string' ? rawResult : '')
        }

        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content,
          qualifying_question,
          recommendations,
          follow_up_suggestions,
          timestamp: new Date(),
        }

        if (follow_up_suggestions.length > 0) {
          setLatestSuggestions(follow_up_suggestions)
        }
      } else {
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result?.error || 'I apologize, but I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
        }
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          const msgs = Array.isArray(c.messages) ? c.messages : []
          return { ...c, messages: [...msgs, assistantMsg] }
        })
      )
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'A network error occurred. Please check your connection and try again.',
        timestamp: new Date(),
      }
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          const msgs = Array.isArray(c.messages) ? c.messages : []
          return { ...c, messages: [...msgs, errorMsg] }
        })
      )
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [loading, sampleMode, ensureActiveConversation, sessionId])

  const handleCompare = useCallback((item: Recommendation) => {
    setComparisonItems((prev) => {
      const exists = prev.some((c) => c?.name === item?.name)
      if (exists) return prev.filter((c) => c?.name !== item?.name)
      return [...prev, item]
    })
  }, [])

  const handleRemoveComparisonItem = useCallback((index: number) => {
    setComparisonItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleDeleteConversation = useCallback((id: string) => {
    if (sampleMode) return
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeConversation === id) {
      setActiveConversation(null)
      setLatestSuggestions([])
    }
  }, [activeConversation, sampleMode])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        <ChatSidebar
          conversations={getDisplayConversations()}
          activeConversation={sampleMode ? 'sample-1' : activeConversation}
          sidebarOpen={sidebarOpen}
          onNewChat={createNewChat}
          onSelectConversation={(id) => {
            if (!sampleMode) {
              setActiveConversation(id)
              setLatestSuggestions([])
            }
          }}
          onDeleteConversation={handleDeleteConversation}
          onCloseSidebar={() => setSidebarOpen(false)}
          ragId={RAG_ID}
        />

        <ChatPanel
          messages={getActiveMessages()}
          input={input}
          loading={loading}
          suggestions={latestSuggestions}
          comparisonItems={comparisonItems}
          onInputChange={setInput}
          onSend={sendMessage}
          onToggleSidebar={() => setSidebarOpen(true)}
          onCompare={handleCompare}
          onShowComparison={() => setShowComparison(true)}
          sidebarOpen={sidebarOpen}
          activeAgentId={activeAgentId}
        />

        <ComparisonModal
          open={showComparison}
          onClose={() => setShowComparison(false)}
          items={comparisonItems}
          onRemoveItem={handleRemoveComparisonItem}
        />

        {/* Sample Data Toggle */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card border border-border px-3 py-2 shadow-sm">
          <Label htmlFor="sample-toggle" className="text-xs font-sans tracking-wider text-muted-foreground cursor-pointer">
            Sample Data
          </Label>
          <Switch
            id="sample-toggle"
            checked={sampleMode}
            onCheckedChange={setSampleMode}
          />
        </div>

        {/* Agent Status */}
        <div className="fixed bottom-4 right-4 z-50 bg-card border border-border px-4 py-3 shadow-sm max-w-[220px]">
          <p className="text-xs font-sans tracking-wider text-muted-foreground uppercase mb-1.5">Agent</p>
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', activeAgentId ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30')} />
            <p className="text-xs font-sans text-foreground truncate">Product Recommendation</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-sans">
            {activeAgentId ? 'Processing...' : 'Ready'}
          </p>
        </div>
      </div>
    </ErrorBoundary>
  )
}
