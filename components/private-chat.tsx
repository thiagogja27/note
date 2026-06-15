'use client'

import { useState, useEffect, useRef } from "react"
import { useChat } from "@/contexts/chat-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Send, UserPlus, Users, MessageCircle, Eye, EyeOff } from "lucide-react"
import type { User } from "@/types/user"
import type { PrivateMessage, PrivateChatContact } from "@/types/private-message"
import {
  sendPrivateMessage,
  listenToPrivateMessages,
  addPrivateChatContact,
  removePrivateChatContact,
  listenToPrivateChatContacts,
  getAllUsers,
} from "@/lib/private-messages"
import { formatDistanceToNow } from "@/lib/format-date"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { signInWithEmailPassword } from "@/lib/firebase-auth"

interface PrivateChatProps {
  currentUser: User
}

export function PrivateChat({ currentUser }: PrivateChatProps) {
  const { isChatOpen, closeChat, selectedUser, openChat } = useChat()
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [contacts, setContacts] = useState<PrivateChatContact[]>([])
  const [selectedContact, setSelectedContact] = useState<PrivateChatContact | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [showAddContact, setShowAddContact] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; username: string; department: string }>>([])
  const [isBlurred, setIsBlurred] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [password, setPassword] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessagesRef = useRef<PrivateMessage[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribeMessages = listenToPrivateMessages(currentUser.id, setMessages)
    const unsubscribeContacts = listenToPrivateChatContacts(currentUser.id, setContacts)

    return () => {
      unsubscribeMessages()
      unsubscribeContacts()
    }
  }, [currentUser.id])

  useEffect(() => {
    if (prevMessagesRef.current.length > 0) {
      const newMessages = messages.filter((msg) => !prevMessagesRef.current.some((prev) => prev.id === msg.id))
      const incoming = newMessages.find((msg) => msg.recipientId === currentUser.id)

      if (incoming) {
        toast({
          title: `Nova mensagem de ${incoming.senderName}`,
          description: incoming.content.substring(0, 40) + "...",
          action: (
            <ToastAction altText="Abrir Chat" onClick={() => openChat(incoming.senderId)}>
              Abrir Chat
            </ToastAction>
          ),
        })
      }
    }
    prevMessagesRef.current = messages
  }, [messages, currentUser.id, openChat, toast])

  useEffect(() => {
    if (selectedUser) {
      const contact = contacts.find((c) => c.userId === selectedUser)
      if (contact) {
        setSelectedContact(contact)
      }
    } else {
      setSelectedContact(null)
    }
  }, [selectedUser, contacts])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, selectedContact])

  useEffect(() => {
    if (showAddContact) {
      loadAvailableUsers()
    }
  }, [showAddContact])

  const loadAvailableUsers = async () => {
    const users = await getAllUsers()
    const filtered = users.filter((user) => user.id !== currentUser.id && !contacts.some((c) => c.userId === user.id))
    setAvailableUsers(filtered)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return

    try {
      await sendPrivateMessage(
        currentUser.id,
        currentUser.username,
        currentUser.department,
        selectedContact.userId,
        selectedContact.username,
        newMessage.trim(),
      )
      setNewMessage("")
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const handleAddContact = async (user: { id: string; username: string; department: string }) => {
    try {
      await addPrivateChatContact(currentUser.id, user.id, user.username, user.department)
      setShowAddContact(false)
      openChat(user.id)
      toast({
        title: "Contato adicionado",
        description: `${user.username} foi adicionado aos seus contatos`,
      })
    } catch (error) {
      toast({
        title: "Erro ao adicionar contato",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveContact = async (contactUserId: string) => {
    if (!confirm("Tem certeza que deseja remover este contato?")) return

    try {
      await removePrivateChatContact(currentUser.id, contactUserId)
      if (selectedContact?.userId === contactUserId) {
        setSelectedContact(null)
      }
      toast({
        title: "Contato removido",
        description: "Contato removido com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro ao remover contato",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const getConversationMessages = () => {
    if (!selectedContact) return []
    return messages.filter(
      (msg) =>
        (msg.senderId === currentUser.id && msg.recipientId === selectedContact.userId) ||
        (msg.senderId === selectedContact.userId && msg.recipientId === currentUser.id),
    )
  }

  const getUnreadCount = (contactUserId: string) => {
    return messages.filter((msg) => msg.senderId === contactUserId && msg.recipientId === currentUser.id && !msg.read)
      .length
  }

  const handleSelectContact = (contact: PrivateChatContact) => {
    openChat(contact.userId)
  }

  const handleToggleBlur = () => {
    if (isBlurred) {
      setIsBlurred(false)
    } else {
      setShowPasswordPrompt(true)
    }
  }

  const handleVerifyPassword = async () => {
    try {
      await signInWithEmailPassword(currentUser.username, password)
      setIsBlurred(true)
      setShowPasswordPrompt(false)
      setPassword("")
    } catch (error) {
      toast({
        title: "Senha incorreta",
        description: "A senha fornecida está incorreta.",
        variant: "destructive",
      })
    }
  }

  if (!isChatOpen) {
    return null
  }

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl h-[600px] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Chat Privado</h2>
            </div>
            <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleToggleBlur}>
                {isBlurred ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            <Button variant="ghost" size="icon" onClick={closeChat}>
              <X className="h-4 w-4" />
            </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-64 border-r border-border flex flex-col">
              <div className="p-3 border-b border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 bg-transparent"
                  onClick={() => setShowAddContact(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Adicionar Contato
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {contacts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhum contato ainda
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {contacts.map((contact) => {
                      const unreadCount = getUnreadCount(contact.userId)
                      return (
                        <button
                          key={contact.userId}
                          onClick={() => handleSelectContact(contact)}
                          className={`w-full text-left p-3 rounded hover:bg-secondary/50 transition-colors ${
                            selectedContact?.userId === contact.userId ? "bg-secondary" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{contact.username}</p>
                              <p className="text-xs text-muted-foreground">{contact.department.toUpperCase()}</p>
                            </div>
                            {unreadCount > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 ml-2">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {selectedContact ? (
                <>
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedContact.username}</p>
                      <p className="text-xs text-muted-foreground">{selectedContact.department.toUpperCase()}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveContact(selectedContact.userId)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remover Contato
                    </Button>
                  </div>

                  <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isBlurred ? "filter blur-sm" : ""}`}>
                    {getConversationMessages().map((msg) => {
                      const isOwn = msg.senderId === currentUser.id
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOwn ? "bg-primary text-primary-foreground" : "bg-secondary"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                            >
                              {formatDistanceToNow(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        className="min-h-[60px] resize-none"
                        disabled={isBlurred}
                      />
                      <Button onClick={handleSendMessage} size="icon" className="shrink-0" disabled={isBlurred}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Selecione um contato para iniciar uma conversa</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showAddContact && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">Adicionar Contato</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAddContact(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 max-h-[400px] overflow-y-auto">
                {availableUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum usuário disponível</p>
                ) : (
                  <div className="space-y-2">
                    {availableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border border-border rounded hover:bg-secondary/50"
                      >
                        <div>
                          <p className="font-medium text-sm">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.department.toUpperCase()}</p>
                        </div>
                        <Button size="sm" onClick={() => handleAddContact(user)}>
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Dialog open={showPasswordPrompt} onOpenChange={setShowPasswordPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificação de Senha</DialogTitle>
            <DialogDescription>
              Para ocultar o conteúdo do chat, por favor, insira sua senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordPrompt(false)}>
              Cancelar
            </Button>
            <Button onClick={handleVerifyPassword}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
