'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ChatContextType {
  isChatOpen: boolean
  selectedUser: string | null
  openChat: (userId: string) => void
  closeChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const openChat = (userId: string) => {
    setSelectedUser(userId)
    setIsChatOpen(true)
  }

  const closeChat = () => {
    setIsChatOpen(false)
    setSelectedUser(null)
  }

  return (
    <ChatContext.Provider value={{ isChatOpen, selectedUser, openChat, closeChat }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
