"use client"

import { useState, useEffect, useRef } from "react"
import {
  addNote,
  updateNote,
  deleteNote,
  toggleNoteCompleted,
  isFirebaseConfigured,
  getConfigErrorMessage,
  listenToNotes,
  listenToRadarNotes,
  listenToInfoNotes,
  listenToStorage,
} from "@/lib/realtime"
import { loadAuthSession, clearAuthSession } from "@/lib/firebase-auth"
import type { Note, Category, SpecialCategory } from "@/types/note"
import { CATEGORIES, RADAR_CATEGORY, INFO_CATEGORY } from "@/types/note"
import type { User } from "@/types/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Volume2, VolumeX, MessageCircle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatDistanceToNow } from "@/lib/format-date"
import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from 'next/navigation'
import { Checkbox } from "@/components/ui/checkbox"
import { DatabaseSetupGuide } from "@/components/database-setup-guide"
import { announceStorageChange, announceRadarMessage, setVoiceEnabled, isVoiceEnabled } from "@/lib/voice-notifications"
import { PrivateChat } from "@/components/private-chat"
import { UserTasks } from "@/components/user-tasks"
import { InformacoesBalancasTable } from "@/components/informacoes-balancas-table"
import { RadarSummary } from "@/components/RadarSummary" // <-- IMPORTADO

export default function NotesApp() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [radarNotes, setRadarNotes] = useState<Note[]>([])
  const [infoNotes, setInfoNotes] = useState<Note[]>([])
  const [newNoteInputs, setNewNoteInputs] = useState<Record<Category, string>>({
    Emails: "",
    "Incluir no relatório de balança": "",
    "Tarefas pendentes": "",
  })
  const [newRadarInput, setNewRadarInput] = useState("")
  const [newInfoTitle, setNewInfoTitle] = useState("")
  const [newInfoContent, setNewInfoContent] = useState("")
  const [editingNote, setEditingNote] = useState<{ id: string; title: string; content: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const [showEstocagem, setShowEstocagem] = useState(false)
  const [showInformacoes, setShowInformacoes] = useState(true)
  const [voiceNotificationsEnabled, setVoiceNotificationsEnabled] = useState(true)
  const [showTarefas, setShowTarefas] = useState(false)

  const [tegRoad, setTegRoad] = useState("")
  const [tegRoadTombador, setTegRoadTombador] = useState("")
  const [tegRailwayMoega01, setTegRailwayMoega01] = useState("")
  const [tegRailwayMoega02, setTegRailwayMoega02] = useState("")
  const [teagRoad, setTeagRoad] = useState("")
  const [teagRailway, setTeagRailway] = useState("")
  const [storageUpdatedBy, setStorageUpdatedBy] = useState<string>("")
  const [storageUpdatedAt, setStorageUpdatedAt] = useState<Date | null>(null)
  const [storageUpdatedByDepartment, setStorageUpdatedByDepartment] = useState<string>("")

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [showPrivateChat, setShowPrivateChat] = useState(false)

  const prevStorageRef = useRef<{
    tegRoad: string
    tegRoadTombador: string
    tegRailwayMoega01: string
    tegRailwayMoega02: string
    teagRoad: string
    teagRailway: string
  } | null>(null)
  const prevRadarCountRef = useRef<number>(0)
  const isInitialLoadRef = useRef(true)

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError(getConfigErrorMessage())
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!currentUser) return

    const unsubscribers = [
      listenToNotes(currentUser.id, (notes) => {
        setNotes(notes)
        setLoading(false)
      }),
      listenToRadarNotes((notes) => {
        if (!isInitialLoadRef.current && notes.length > prevRadarCountRef.current) {
          const newMessages = notes.slice(0, notes.length - prevRadarCountRef.current)
          newMessages.forEach((note) => announceRadarMessage(note.content))
        }
        setRadarNotes(notes)
        prevRadarCountRef.current = notes.length
      }),
      listenToInfoNotes(setInfoNotes),
      listenToStorage((storage) => {
        if (storage) {
          const newStorage = {
            tegRoad: storage.tegRoad || "",
            tegRoadTombador: storage.tegRoadTombador || "",
            tegRailwayMoega01: storage.tegRailwayMoega01 || "",
            tegRailwayMoega02: storage.tegRailwayMoega02 || "",
            teagRoad: storage.teagRoad || "",
            teagRailway: storage.teagRailway || "",
          }

          if (prevStorageRef.current && !isInitialLoadRef.current && isVoiceEnabled()) {
            const prev = prevStorageRef.current
            if (prev.tegRoad !== newStorage.tegRoad && newStorage.tegRoad) announceStorageChange("TEG Rodovia Tombadores 01 e 06", newStorage.tegRoad)
            if (prev.tegRoadTombador !== newStorage.tegRoadTombador && newStorage.tegRoadTombador) announceStorageChange("TEG Rodovia Tombador 07", newStorage.tegRoadTombador)
            if (prev.tegRailwayMoega01 !== newStorage.tegRailwayMoega01 && newStorage.tegRailwayMoega01) announceStorageChange("TEG Ferrovia Moega 01", newStorage.tegRailwayMoega01)
            if (prev.tegRailwayMoega02 !== newStorage.tegRailwayMoega02 && newStorage.tegRailwayMoega02) announceStorageChange("TEG Ferrovia Moega 02", newStorage.tegRailwayMoega02)
            if (prev.teagRoad !== newStorage.teagRoad && newStorage.teagRoad) announceStorageChange("TEAG Rodovia", newStorage.teagRoad)
            if (prev.teagRailway !== newStorage.teagRailway && newStorage.teagRailway) announceStorageChange("TEAG Ferrovia", newStorage.teagRailway)
          }

          setTegRoad(newStorage.tegRoad)
          setTegRoadTombador(newStorage.tegRoadTombador)
          setTegRailwayMoega01(newStorage.tegRailwayMoega01)
          setTegRailwayMoega02(newStorage.tegRailwayMoega02)
          setTeagRoad(newStorage.teagRoad)
          setTeagRailway(newStorage.teagRailway)
          setStorageUpdatedBy(storage.updatedBy || "")
          setStorageUpdatedAt(storage.updatedAt || null)
          setStorageUpdatedByDepartment(storage.updatedByDepartment || "")
          prevStorageRef.current = newStorage
        }
      })
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [currentUser])

  useEffect(() => {
    if (currentUser && isFirebaseConfigured()) {
      const timer = setTimeout(() => { isInitialLoadRef.current = false }, 2000)
      return () => clearTimeout(timer)
    }
  }, [currentUser])

  useEffect(() => {
    const loadSession = async () => {
      if (!isFirebaseConfigured()) {
        setError(getConfigErrorMessage())
        setLoading(false)
        return
      }
      try {
        const user = await loadAuthSession()
        if (user) {
          if (user.department === "cco") { router.push("/cco"); return }
          if (user.department === "supervisor") { router.push("/supervisor"); return }
          setCurrentUser(user)
          setIsAuthenticated(true)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error("[v0] Erro ao carregar sessão:", err)
        setLoading(false)
      }
    }
    loadSession()
  }, [router])

  const handleLogin = (user: User) => {
    if (!isFirebaseConfigured()) { setError(getConfigErrorMessage()); return }
    if (user.department === "cco") { router.push("/cco"); return }
    if (user.department === "supervisor") { router.push("/supervisor"); return }
    setCurrentUser(user)
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    await clearAuthSession()
    setCurrentUser(null)
    setIsAuthenticated(false)
    setNotes([])
    setRadarNotes([])
    setInfoNotes([])
    toast({ title: "Logout realizado", description: "Você saiu com sucesso." })
  }
  
  const handleAddNote = async (category: Category | SpecialCategory, content: string, title?: string) => {
      const trimmedContent = content.trim()
      const trimmedTitle = title?.trim() || ''

      if (!trimmedContent || !currentUser) return
      if (category === INFO_CATEGORY && !trimmedTitle) {
          toast({ title: "Título é obrigatório para Informações", variant: "destructive" })
          return
      }

      try {
          await addNote({
              title: category === INFO_CATEGORY ? trimmedTitle : trimmedContent.substring(0, 50),
              content: trimmedContent,
              category,
              userId: currentUser.id,
              createdBy: currentUser.username,
              createdByDepartment: currentUser.department,
          })
          
          if(category === RADAR_CATEGORY) setNewRadarInput("")
          if(category === INFO_CATEGORY) {
            setNewInfoTitle("")
            setNewInfoContent("")
          }
          if(CATEGORIES.includes(category as Category)) setNewNoteInputs({ ...newNoteInputs, [category as Category]: "" })

          toast({ title: "Adicionado!", description: `Item adicionado em ${category}` })
      } catch (error) {
          toast({ title: "Erro ao adicionar", variant: "destructive" })
      }
  }

  const handleStartEdit = (note: Note) => {
    setEditingNote({ id: note.id, title: note.title, content: note.content })
  }

  const handleSaveEdit = async () => {
    if (!editingNote || !currentUser) return

    try {
      await updateNote(
        editingNote.id,
        { title: editingNote.title, content: editingNote.content },
        currentUser.username,
        currentUser.department,
      )
      setEditingNote(null)
      toast({ title: "Atualizado!", description: "Item atualizado com sucesso." })
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" })
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!currentUser) {
        toast({ title: "Erro de autenticação", variant: "destructive" });
        return;
    }
    
    try {
      await deleteNote(id, currentUser.username, currentUser.department);
      toast({ title: "Excluído", description: "Item removido com sucesso." });
    } catch (error) {
      console.error("##### FALHA AO APAGAR #####", error);
      toast({ title: "Erro ao excluir", description: "Não foi possível remover o item.", variant: "destructive" });
    }
  }

  const handleToggleCompleted = async (note: Note) => {
    if (!currentUser) return
    try {
      await toggleNoteCompleted(note.id, !note.completed, currentUser.username, currentUser.department)
      toast({
        title: note.completed ? "Desmarcado" : "Marcado como concluído",
      })
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" })
    }
  }

  const handleToggleVoice = () => {
    const newState = !voiceNotificationsEnabled
    setVoiceNotificationsEnabled(newState)
    setVoiceEnabled(newState)
    toast({
      title: newState ? "Notificações de voz ativadas" : "Notificações de voz desativadas",
    })
  }

  const renderInfoSection = () => (
    <div className="bg-card border-2 border-primary rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-3 text-primary">INFORMAÇÕES - Área Compartilhada</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Adicione informações importantes com título e conteúdo para melhor organização.
      </p>
      <div className="flex flex-col gap-2 mb-4">
        <Input
          placeholder="Título da Informação"
          value={newInfoTitle}
          onChange={(e) => setNewInfoTitle(e.target.value)}
        />
        <Textarea
          placeholder="Conteúdo da Informação..."
          value={newInfoContent}
          onChange={(e) => setNewInfoContent(e.target.value)}
          rows={3}
        />
        <Button onClick={() => handleAddNote(INFO_CATEGORY, newInfoContent, newInfoTitle)} className="self-end">
          <Plus className="h-4 w-4 mr-2" /> Adicionar Informação
        </Button>
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {infoNotes.map((note) => (
          <div key={note.id} className="group rounded p-3 bg-primary/5 border border-primary/30 hover:border-primary transition-colors">
            {editingNote?.id === note.id ? (
              <div className="space-y-2">
                <Input
                   value={editingNote.title}
                   onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                   className="font-bold"
                />
                <Textarea
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} className="gap-1">
                    <Check className="h-3 w-3" /> Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingNote(null)} className="gap-1">
                    <X className="h-3 w-3" /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-md mb-1">{note.title}</h3>
                <p className="text-sm leading-relaxed mb-2 whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(note.updatedAt)}</span>
                    {note.createdBy && (
                      <span className="text-xs text-primary font-medium">
                        Por: {note.createdBy} ({note.createdByDepartment?.toUpperCase()})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(note)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {infoNotes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma informação adicionada ainda.</p>
        )}
      </div>
    </div>
  );
  
  const renderSpecialSection = (
    title: string,
    notes: Note[],
    inputValue: string,
    onInputChange: (value: string) => void,
    onAdd: () => void,
  ) => (
    <div className="bg-card border-2 border-primary rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-3 text-primary">{title} - Área Compartilhada</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Todos os usuários podem adicionar, editar e visualizar itens importantes do setor.
      </p>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder={`Adicionar em ${title}...`}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          className="flex-1"
        />
        <Button onClick={onAdd} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {notes.map((note) => (
          <div key={note.id} className="group rounded p-3 bg-primary/5 border border-primary/30 hover:border-primary transition-colors">
            {editingNote?.id === note.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, title: '', content: e.target.value })}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} className="gap-1">
                    <Check className="h-3 w-3" /> Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingNote(null)} className="gap-1">
                    <X className="h-3 w-3" /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed mb-2 whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center justify-between">
                   <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(note.updatedAt)}</span>
                    {note.createdBy && (
                      <span className="text-xs text-primary font-medium">
                        Por: {note.createdBy} ({note.createdByDepartment?.toUpperCase()})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(note)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum item ainda.</p>
        )}
      </div>
    </div>
  )

  if (!isAuthenticated) return <LoginForm onLogin={handleLogin} />
  if (error && error.includes("não está configurada")) return <DatabaseSetupGuide />
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-[1400px]">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Controle de Tarefas - Balança TEG/TEAG</h1>
                <p className="text-sm text-muted-foreground">
                  Organize suas tarefas e informações • Usuário: {currentUser?.username || "Desconhecido"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setShowPrivateChat(true)} title="Chat Privado">
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button
                variant={voiceNotificationsEnabled ? "default" : "outline"}
                size="icon"
                onClick={handleToggleVoice}
                title={voiceNotificationsEnabled ? "Desativar notificações de voz" : "Ativar notificações de voz"}
              >
                {voiceNotificationsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <ThemeToggle />
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </header>

        <div className="flex gap-4 mb-6">
          <Button variant={showEstocagem ? "default" : "outline"} onClick={() => setShowEstocagem(!showEstocagem)} className="flex-1">
            ESTOCAGEM {showEstocagem ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          <Button variant={showInformacoes ? "default" : "outline"} onClick={() => setShowInformacoes(!showInformacoes)} className="flex-1">
            INFORMAÇÕES {showInformacoes ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          <Button variant={showTarefas ? "default" : "outline"} onClick={() => setShowTarefas(!showTarefas)} className="flex-1">
            MINHAS TAREFAS {showTarefas ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {showEstocagem && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Controle de Estocagem</h2>
            <p className="text-sm text-muted-foreground mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
              ⚠️ Somente o setor CCO pode alterar as células de estocagem. As informações são atualizadas em tempo real.
            </p>
            {storageUpdatedAt && (
              <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded">
                <p className="text-sm">
                  <span className="font-semibold text-primary">Última atualização:</span>{" "}
                  <span className="text-muted-foreground">
                    {storageUpdatedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} às {storageUpdatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {" • "}
                  <span className="font-medium text-primary">
                    {storageUpdatedBy} ({storageUpdatedByDepartment?.toUpperCase()})
                  </span>
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Lado TEG</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rodovia - Tombadores 01 e 06:</label>
                    <Input value={tegRoad} placeholder="Aguardando..." disabled className="opacity-75 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rodovia - Tombador 07:</label>
                    <Input value={tegRoadTombador} placeholder="Aguardando..." disabled className="opacity-75 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ferrovia - Moega 01:</label>
                    <Input value={tegRailwayMoega01} placeholder="Aguardando..." disabled className="opacity-75 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ferrovia - Moega 02:</label>
                    <Input value={tegRailwayMoega02} placeholder="Aguardando..." disabled className="opacity-75 cursor-not-allowed" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Lado TEAG</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rodovia:</label>
                    <Input value={teagRoad} placeholder="Aguardando..." disabled className="opacity-75 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ferrovia:</label>
                    <Input value={teagRailway} placeholder="Aguardando..." disabled className="opacity-75 cursor-not-allowed" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showInformacoes && (
          <>
            {renderInfoSection()}
            <InformacoesBalancasTable />
          </>
        )}

        {showTarefas && currentUser && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Tarefas Atribuídas a Você</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Gerencie as tarefas que foram atribuídas a você pelo supervisor
            </p>
            <UserTasks currentUser={currentUser} />
          </div>
        )}
        
        {/* -- Bloco de Resumo da IA -- */}
        <div className="mb-6">
            <RadarSummary radarNotes={radarNotes} />
        </div>

        {renderSpecialSection(
            "RADAR",
            radarNotes,
            newRadarInput,
            (value) => setNewRadarInput(value),
            () => handleAddNote(RADAR_CATEGORY, newRadarInput),
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((category) => (
            <div key={category} className="bg-card border border-border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3 text-primary">{category}</h2>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder={`Adicionar em ${category}...`}
                  value={newNoteInputs[category]}
                  onChange={(e) => setNewNoteInputs({ ...newNoteInputs, [category]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote(category, newNoteInputs[category])}
                  className="flex-1"
                />
                <Button onClick={() => handleAddNote(category, newNoteInputs[category])} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {notes.filter(n => n.category === category).map((note) => (
                  <div key={note.id} className="group bg-secondary/30 border border-border rounded p-3 hover:border-primary/50 transition-colors">
                    {editingNote?.id === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingNote.content}
                          onChange={(e) => setEditingNote({ ...editingNote, title: '', content: e.target.value })}
                          className="min-h-[60px]"
                        />
                        <div                        className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit} className="gap-1"><Check className="h-3 w-3" />Salvar</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingNote(null)} className="gap-1"><X className="h-3 w-3" />Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3 mb-2">
                          <Checkbox
                            checked={note.completed || false}
                            onCheckedChange={() => handleToggleCompleted(note)}
                            className="mt-0.5"
                          />
                          <p className={`text-sm leading-relaxed flex-1 ${note.completed ? "line-through opacity-60" : ""}`}>
                            {note.content}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(note.updatedAt)}</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ note.completed ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700' }`}>
                              {note.completed ? 'Concluído' : 'Pendente'}
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(note)}><Pencil className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteNote(note.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {notes.filter(n => n.category === category).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum item ainda</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showPrivateChat && <PrivateChat currentUser={currentUser!} onClose={() => setShowPrivateChat(false)} />}
      <Toaster />
    </div>
  )
}
