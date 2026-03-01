'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { KnowledgeBaseUpload } from '@/components/KnowledgeBaseUpload'
import { FiPlus, FiMessageSquare, FiX, FiTrash2 } from 'react-icons/fi'

export interface Conversation {
  id: string
  title: string
  messages: any[]
  timestamp: Date
}

interface ChatSidebarProps {
  conversations: Conversation[]
  activeConversation: string | null
  sidebarOpen: boolean
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onCloseSidebar: () => void
  ragId: string
}

export default function ChatSidebar({
  conversations,
  activeConversation,
  sidebarOpen,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onCloseSidebar,
  ragId,
}: ChatSidebarProps) {
  const safeConversations = Array.isArray(conversations) ? conversations : []

  const formatDate = (date: Date) => {
    try {
      const d = new Date(date)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHrs = Math.floor(diffMins / 60)
      if (diffHrs < 24) return `${diffHrs}h ago`
      const diffDays = Math.floor(diffHrs / 24)
      if (diffDays < 7) return `${diffDays}d ago`
      return d.toLocaleDateString()
    } catch {
      return ''
    }
  }

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={onCloseSidebar} />
      )}

      <aside
        className={`fixed md:relative z-40 top-0 left-0 h-full w-[280px] bg-secondary border-r border-border flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-0'}`}
      >
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-lg font-medium tracking-wider text-foreground">
              Curated
            </h1>
            <p className="text-xs text-muted-foreground font-sans tracking-wider mt-0.5">
              Product Advisor
            </p>
          </div>
          <button onClick={onCloseSidebar} className="md:hidden text-muted-foreground hover:text-foreground">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <Button
            onClick={onNewChat}
            variant="outline"
            className="w-full justify-start gap-2 font-sans text-sm tracking-wider border-border"
          >
            <FiPlus className="w-4 h-4" />
            New Conversation
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-2 py-2">
          {safeConversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 font-sans tracking-wider">
              No conversations yet
            </p>
          ) : (
            <div className="space-y-1">
              {safeConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${activeConversation === conv.id ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <FiMessageSquare className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(conv.timestamp)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id) }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="p-4">
          <p className="text-xs font-sans tracking-wider text-muted-foreground uppercase mb-3">Knowledge Base</p>
          <KnowledgeBaseUpload ragId={ragId} className="[&_p]:text-xs" />
        </div>
      </aside>
    </>
  )
}
