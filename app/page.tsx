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
  listenToStorage,
} from "@/lib/realtime"
import { loadAuthSession, clearAuthSession } from "@/lib/firebase-auth"
import type { Note, Category } from "@/types/note"
import { CATEGORIES, RADAR_CATEGORY } from "@/types/note"
import type { User } from "@/types/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Volume2, VolumeX, MessageCircle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatDistanceToNow } from "@/lib/format-date"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from 'next/navigation'
import { Checkbox } from "@/components/ui/checkbox"
import { DatabaseSetupGuide } from "@/components/database-setup-guide"
import { announceStorageChange, announceRadarMessage, setVoiceEnabled, isVoiceEnabled } from "@/lib/voice-notifications"
import { PrivateChat } from "@/components/private-chat"
import { UserTasks } from "@/components/user-tasks"

export default function NotesApp() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [radarNotes, setRadarNotes] = useState<Note[]>([])
  const [newNoteInputs, setNewNoteInputs] = useState<Record<Category, string>>({
    Emails: "",
    "Incluir no relatório de balança": "",
    "Tarefas pendentes": "",
  })
  const [newRadarInput, setNewRadarInput] = useState("")
  const [editingNote, setEditingNote] = useState<{ id: string; content: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const [showEstocagem, setShowEstocagem] = useState(false)
  const [showInformacoes, setShowInformacoes] = useState(false)
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

    try {
      const unsubscribeNotes = listenToNotes(currentUser.id, (updatedNotes) => {
        setNotes(updatedNotes)
        setError(null)
        setLoading(false)
      })

      return () => {
        unsubscribeNotes()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("[v0] Erro ao conectar:", errorMessage)
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return

    try {
      const unsubscribeRadar = listenToRadarNotes((updatedRadarNotes) => {
        if (!isInitialLoadRef.current && updatedRadarNotes.length > prevRadarCountRef.current) {
          // New message(s) added
          const newMessages = updatedRadarNotes.slice(0, updatedRadarNotes.length - prevRadarCountRef.current)
          newMessages.forEach((note) => {
            announceRadarMessage(note.content)
          })
        }

        setRadarNotes(updatedRadarNotes)
        prevRadarCountRef.current = updatedRadarNotes.length
      })

      return () => {
        unsubscribeRadar()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("[v0] Erro ao conectar RADAR:", errorMessage)
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return

    try {
      const unsubscribeStorage = listenToStorage((storage) => {
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

            if (prev.tegRoad !== newStorage.tegRoad && newStorage.tegRoad) {
              announceStorageChange("TEG Rodovia Tombadores 01 e 06", newStorage.tegRoad)
            }
            if (prev.tegRoadTombador !== newStorage.tegRoadTombador && newStorage.tegRoadTombador) {
              announceStorageChange("TEG Rodovia Tombador 07", newStorage.tegRoadTombador)
            }
            if (prev.tegRailwayMoega01 !== newStorage.tegRailwayMoega01 && newStorage.tegRailwayMoega01) {
              announceStorageChange("TEG Ferrovia Moega 01", newStorage.tegRailwayMoega01)
            }
            if (prev.tegRailwayMoega02 !== newStorage.tegRailwayMoega02 && newStorage.tegRailwayMoega02) {
              announceStorageChange("TEG Ferrovia Moega 02", newStorage.tegRailwayMoega02)
            }
            if (prev.teagRoad !== newStorage.teagRoad && newStorage.teagRoad) {
              announceStorageChange("TEAG Rodovia", newStorage.teagRoad)
            }
            if (prev.teagRailway !== newStorage.teagRailway && newStorage.teagRailway) {
              announceStorageChange("TEAG Ferrovia", newStorage.teagRailway)
            }
          }

          // Update state
          setTegRoad(newStorage.tegRoad)
          setTegRoadTombador(newStorage.tegRoadTombador)
          setTegRailwayMoega01(newStorage.tegRailwayMoega01)
          setTegRailwayMoega02(newStorage.tegRailwayMoega02)
          setTeagRoad(newStorage.teagRoad)
          setTeagRailway(newStorage.teagRailway)
          setStorageUpdatedBy(storage.updatedBy || "")
          setStorageUpdatedAt(storage.updatedAt || null)
          setStorageUpdatedByDepartment(storage.updatedByDepartment || "")

          // Store current values for next comparison
          prevStorageRef.current = newStorage
        }
      })

      return () => {
        unsubscribeStorage()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("[v0] Erro ao conectar Storage:", errorMessage)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser && isFirebaseConfigured()) {
      const timer = setTimeout(() => {
        isInitialLoadRef.current = false
      }, 2000) // Wait 2 seconds after login before enabling voice notifications

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
          if (user.department === "cco") {
            router.push("/cco")
            return
          }

          if (user.department === "supervisor") {
            router.push("/supervisor")
            return
          }

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

  const handleLogin = async (user: User) => {
    if (!isFirebaseConfigured()) {
      setError(getConfigErrorMessage())
      return
    }

    if (user.department === "cco") {
      router.push("/cco")
      return
    }

    if (user.department === "supervisor") {
      router.push("/supervisor")
      return
    }

    setCurrentUser(user)
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    await clearAuthSession()
    setNotes([])
    setRadarNotes([])
    toast({
      title: "Logout realizado",
      description: "Você saiu com sucesso.",
    })
  }

  const handleQuickAdd = async (category: Category) => {
    const content = newNoteInputs[category].trim()
    if (!content || !currentUser) return

    try {
      await addNote({
        title: content.substring(0, 50),
        content: content,
        category: category,
        userId: currentUser.id,
        createdBy: currentUser.username,
        createdByDepartment: currentUser.department,
      })
      setNewNoteInputs({ ...newNoteInputs, [category]: "" })
      toast({
        title: "Adicionado!",
        description: `Item adicionado em ${category}`,
      })
    } catch (error) {
      toast({
        title: "Erro ao adicionar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const handleRadarAdd = async () => {
    const content = newRadarInput.trim()
    if (!content || !currentUser) return

    try {
      await addNote({
        title: content.substring(0, 50),
        content: content,
        category: RADAR_CATEGORY,
        userId: currentUser.id,
        createdBy: currentUser.username,
        createdByDepartment: currentUser.department,
      })
      setNewRadarInput("")
      toast({
        title: "Adicionado ao RADAR!",
        description: "Item compartilhado com todos os usuários",
      })
    } catch (error) {
      toast({
        title: "Erro ao adicionar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const handleStartEdit = (note: Note) => {
    setEditingNote({ id: note.id, content: note.content })
  }

  const handleSaveEdit = async () => {
    if (!editingNote || !currentUser) return

    try {
      const note = notes.find((n) => n.id === editingNote.id) || radarNotes.find((n) => n.id === editingNote.id)
      if (!note) return

      await updateNote(
        editingNote.id,
        {
          title: editingNote.content.substring(0, 50),
          content: editingNote.content,
        },
        currentUser.username,
        currentUser.department,
      )

      setEditingNote(null)
      toast({
        title: "Atualizado!",
        description: "Item atualizado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteNote = async (id: string, isRadar = false) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return

    try {
      await deleteNote(id)
      toast({
        title: "Excluído",
        description: "Item removido com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const handleToggleCompleted = async (note: Note) => {
    if (!currentUser) return

    try {
      await toggleNoteCompleted(note.id, !note.completed, currentUser.username, currentUser.department)

      toast({
        title: note.completed ? "Desmarcado" : "Marcado como concluído",
        description: note.completed ? "Item reaberto" : "Item marcado como realizado",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const getNotesByCategory = (category: Category) => {
    return notes.filter((note) => note.category === category)
  }

  const handleToggleVoice = () => {
    const newState = !voiceNotificationsEnabled
    setVoiceNotificationsEnabled(newState)
    setVoiceEnabled(newState)
    toast({
      title: newState ? "Notificações de voz ativadas" : "Notificações de voz desativadas",
      description: newState ? "Você receberá alertas por voz" : "Alertas por voz foram desativados",
    })
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />
  }

  if (error && error.includes("não está configurada")) {
    return <DatabaseSetupGuide />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-[1400px]">
        {/* Header */}
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
          <Button
            variant={showEstocagem ? "default" : "outline"}
            onClick={() => setShowEstocagem(!showEstocagem)}
            className="flex-1"
          >
            ESTOCAGEM
            {showEstocagem ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          <Button
            variant={showInformacoes ? "default" : "outline"}
            onClick={() => setShowInformacoes(!showInformacoes)}
            className="flex-1"
          >
            INFORMAÇÕES
            {showInformacoes ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          <Button
            variant={showTarefas ? "default" : "outline"}
            onClick={() => setShowTarefas(!showTarefas)}
            className="flex-1"
          >
            MINHAS TAREFAS
            {showTarefas ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {showEstocagem && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Controle de Estocagem</h2>
            <p className="text-sm text-muted-foreground mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
              ⚠️ Somente o setor CCO pode alterar as células de estocagem. As informações abaixo são atualizadas
              automaticamente em tempo real.
            </p>

            {storageUpdatedBy && storageUpdatedAt && (
              <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded">
                <p className="text-sm">
                  <span className="font-semibold text-primary">Última atualização:</span>{" "}
                  <span className="text-muted-foreground">
                    {storageUpdatedAt.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}{" "}
                    às{" "}
                    {storageUpdatedAt.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {" • "}
                  <span className="font-medium text-primary">
                    {storageUpdatedBy} ({storageUpdatedByDepartment?.toUpperCase()})
                  </span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TEG Side */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Lado TEG</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rodovia - Tombadores 01 e 06:</label>
                    <Select value={tegRoad} disabled>
                      <SelectTrigger className="opacity-75 cursor-not-allowed">
                        <SelectValue placeholder="Aguardando definição do CCO" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="B1">B1</SelectItem>
                        <SelectItem value="C1">C1</SelectItem>
                        <SelectItem value="A2">A2</SelectItem>
                        <SelectItem value="B2">B2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Rodovia - Tombador 07:</label>
                    <Select value={tegRoadTombador} disabled>
                      <SelectTrigger className="opacity-75 cursor-not-allowed">
                        <SelectValue placeholder="Aguardando definição do CCO" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="B1">B1</SelectItem>
                        <SelectItem value="C1">C1</SelectItem>
                        <SelectItem value="A2">A2</SelectItem>
                        <SelectItem value="B2">B2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Ferrovia - Moega 01:</label>
                    <Select value={tegRailwayMoega01} disabled>
                      <SelectTrigger className="opacity-75 cursor-not-allowed">
                        <SelectValue placeholder="Aguardando definição do CCO" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="B1">B1</SelectItem>
                        <SelectItem value="C1">C1</SelectItem>
                        <SelectItem value="A2">A2</SelectItem>
                        <SelectItem value="B2">B2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Ferrovia - Moega 02:</label>
                    <Select value={tegRailwayMoega02} disabled>
                      <SelectTrigger className="opacity-75 cursor-not-allowed">
                        <SelectValue placeholder="Aguardando definição do CCO" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="B1">B1</SelectItem>
                        <SelectItem value="C1">C1</SelectItem>
                        <SelectItem value="A2">A2</SelectItem>
                        <SelectItem value="B2">B2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* TEAG Side */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Lado TEAG</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rodovia:</label>
                    <Select value={teagRoad} disabled>
                      <SelectTrigger className="opacity-75 cursor-not-allowed">
                        <SelectValue placeholder="Aguardando definição do CCO" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="B3">B3</SelectItem>
                        <SelectItem value="A4">A4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Ferrovia:</label>
                    <Select value={teagRailway} disabled>
                      <SelectTrigger className="opacity-75 cursor-not-allowed">
                        <SelectValue placeholder="Aguardando definição do CCO" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="B3">B3</SelectItem>
                        <SelectItem value="A4">A4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showInformacoes && (
          <div className="space-y-4 mb-6">
            <div className="bg-primary/5 border-2 border-primary/30 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-primary">OPERAÇÕES UTILIZADAS</h2>
              <div className="space-y-3">
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold text-primary">
                      RECEPÇÃO TERCEIROS – ADM / LDC / BUNGE TEG (CGLI OU LDCT)
                    </span>
                    <br />
                    <span className="text-muted-foreground">Verificar na NF / BP </span>
                    <span className="font-mono font-semibold">0217113104</span>
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold text-primary">RECEPÇÃO TRANSFERÊNCIA – CGL TEG</span>
                    <br />
                    <span className="text-muted-foreground">BP </span>
                    <span className="font-mono font-semibold">0217100901</span>
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold text-primary">RECEPÇÃO SUBPRODUTOS – RZN SUISSE TEAG AÇÚCAR</span>
                    <br />
                    <span className="text-muted-foreground">BP </span>
                    <span className="font-mono font-semibold">0222000901</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border-2 border-primary/30 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-primary">Links e outras informações</h2>
              <div className="space-y-3">
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold text-primary">
                      Segue regras/orientações para as confiabilidades semanais.
                      <br />
                      <br />
                      <strong>BALANÇAS RODOVIÁRIAS:</strong>
                      <br />
                      Segunda e Sexta: Aferição com caçamba nas balanças 03, 06, 07 e 08. Se não conseguirmos caçamba,
                      realizar com PC.
                      <br />
                      Horário: 07h às 13h.
                      <br />
                      Quarta: Aferição com caçamba e PC para extração de peso líquido.
                      <br />
                      Horário: 07h às 13h.
                      <br />
                      <br />
                      <strong>BALANÇAS FERROVIÁRIAS:</strong>
                      <br />
                      Segunda e Sexta:
                      <br />
                      TEG: Aferição com um vagão carregado nas balanças 10 e 02 e pode utilizar outro vagão carregado
                      para fazer nas balanças 09 e 01.
                      <br />
                      TEAG: Aferição com vagão carregado na balança 05.
                      <br />
                      <br />
                      Quarta: Deverá ser realizado aferição nas balanças 01, 02, 05, 09 e 10 com o vagão carregado e
                      vazio.
                      <br />
                      Obs.: Utilizar o mesmo vagão carregado em todas as balanças e pode utilizar outro vagão vazio, mas
                      é imprescindível que passe em todas as balanças para ser realizado a extração de peso líquido.
                      <br />
                      <br />
                      <strong>BALANÇA DINÂMICA:</strong>
                      <br />
                      Deve ser realizado aferição toda SEGUNDA-FEIRA ou TERÇA-FEIRA.
                      <br />
                      Registrar mínimo de 3 passagens.
                      <br />
                      <br />
                      OBS.: A solicitação para aferição deve ser sinalizada no grupo CONFIABILIDADE BALANÇAS no WhatsApp
                      e via rádio para reforçar. Caso não seja realizada até as 13h, deverá me acionar.
                    </span>
                    <br />
                    <br />
                    <span className="text-muted-foreground">
                      <strong>Links úteis:</strong>
                      <br />
                      rds: https://rdswebguaruja.la.cargill.com/
                      <br />
                      gbm dashboard: https://tegteagtes-tot.gbmtech.com.br/dashboard/login
                      <br />
                      gbm coletor: https://tegteagtes-collector.gbmtech.com.br/list-of-arrival
                      <br />
                      gbm pedra: https://tot.gbmtech.com.br/login
                      <br />
                      converter pdf: https://www.pdftoexcel.com/
                      <br />
                      ecopatio: https://extranet.ecopatio.com.br/
                      <br />
                      <br />
                      SHAREPOINT:https://cargillonline.sharepoint.com/sites/Estoque_TEG_TEAG/Shared%20Documents/Forms/AllItems.aspx?viewid=25e30711%2Dbcff%2D425b%2D9584%2D10a0e2f758da
                      <br />
                       <br />
                      GBM AGENDAMENTOS: https://app.gbmtech.com.br/pt-br
                      <br />
                      link câmeras OCR: https://cameras-ocr--tegteagtes.on.websim.ai/
                      <br />
                      se suite: https://teg.softexpert.com/softexpert/login
                    </span>
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm leading-relaxed">
                    <span className="text-muted-foreground">
                      <strong>RDS:</strong>
                   
                      <br />
                      <strong>GBM DASHBOARD Login - GBM TOT:</strong>
                      <br />
                      https://tegteagtes-tot.gbmtech.com.br/dashboard/login
                      <br />
                      Login: balanca@tegporto.com.br
                      <br />
                      Senha: BTd#eOPa
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Informações das Balanças</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-semibold bg-primary/10">Nº BALANÇAS</th>
                      <th className="text-left p-3 font-semibold bg-primary/10">USUÁRIO</th>
                      <th className="text-left p-3 font-semibold bg-primary/10">MÁQUINA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border bg-yellow-500/20">
                      <td className="p-3 font-medium">BALANÇA01</td>
                      <td className="p-3">PS959976</td>
                      <td className="p-3">BRGUAR14300W</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium">BALANÇA02</td>
                      <td className="p-3">PS865110</td>
                      <td className="p-3">BRGUAR13179W</td>
                    </tr>
                    <tr className="border-b border-border bg-yellow-500/20">
                      <td className="p-3 font-medium">BALANÇA07</td>
                      <td className="p-3">PS288277</td>
                      <td className="p-3">BRGUAR14290W</td>
                    </tr>
                    <tr className="border-b border-border bg-yellow-500/20">
                      <td className="p-3 font-medium">BALANÇA08</td>
                      <td className="p-3 text-muted-foreground">-</td>
                      <td className="p-3">BRGUAR20273W</td>
                    </tr>
                    <tr className="border-b border-border bg-yellow-500/20">
                      <td className="p-3 font-medium">BALANÇA09</td>
                      <td className="p-3">PS2243666</td>
                      <td className="p-3">BRGUAR24682W</td>
                    </tr>
                    <tr className="border-b border-border bg-yellow-500/20">
                      <td className="p-3 font-medium">BALANÇA10</td>
                      <td className="p-3">PS445662</td>
                      <td className="p-3">BRGUAR24681W</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium">BALANÇA03</td>
                      <td className="p-3">PS808813</td>
                      <td className="p-3">BRGUAR14298W</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-medium">BALANÇA04</td>
                      <td className="p-3 text-muted-foreground">-</td>
                      <td className="p-3">BRGUAR14299V</td>
                    </tr>
                    <tr className="bg-blue-500/20">
                      <td className="p-3 font-medium">BALANÇA05</td>
                      <td className="p-3">PS606021</td>
                      <td className="p-3">BRGUAR14292V</td>
                    </tr>
                    <tr className="bg-blue-500/20">
                      <td className="p-3 font-medium">BALANÇA06</td>
                      <td className="p-3">PS471750</td>
                      <td className="p-3">BRGUAR20260V</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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

        <div className="bg-card border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3 text-primary">RADAR - Área Compartilhada</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Todos os usuários podem adicionar, editar e visualizar itens importantes do setor
          </p>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Adicionar item importante (tickets, restrições, balanças inoperantes, etc)..."
              value={newRadarInput}
              onChange={(e) => setNewRadarInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRadarAdd()
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleRadarAdd} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {radarNotes.map((note) => {
              const isStorageAlert = note.content.startsWith("🚨 ALTERAÇÃO DE CÉLULA:")

              return (
                <div
                  key={note.id}
                  className={`group rounded p-3 hover:border-primary transition-colors ${
                    isStorageAlert
                      ? "bg-orange-500/10 border-2 border-orange-500/50"
                      : "bg-primary/5 border border-primary/30"
                  }`}
                >
                  {editingNote?.id === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingNote.content}
                        onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                        className="min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit} className="gap-1">
                          <Check className="h-3 w-3" />
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingNote(null)} className="gap-1">
                          <X className="h-3 w-3" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p
                        className={`text-sm leading-relaxed mb-2 ${isStorageAlert ? "font-semibold text-orange-600 dark:text-orange-400" : ""}`}
                      >
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">{formatDistanceToNow(note.updatedAt)}</span>
                          {note.createdBy && (
                            <span className="text-xs text-primary font-medium">
                              Criado por: {note.createdBy} ({note.createdByDepartment?.toUpperCase()})
                            </span>
                          )}
                          {note.updatedBy && note.updatedBy !== note.createdBy && (
                            <span className="text-xs text-orange-500 font-medium">
                              Editado por: {note.updatedBy} ({note.updatedByDepartment?.toUpperCase()})
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
                            onClick={() => handleDeleteNote(note.id, true)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
            {radarNotes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum item no RADAR ainda</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((category) => (
            <div key={category} className="bg-card border border-border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3 text-primary">{category}</h2>

              <div className="flex gap-2 mb-4">
                <Input
                  placeholder={`Adicionar em ${category}...`}
                  value={newNoteInputs[category]}
                  onChange={(e) => setNewNoteInputs({ ...newNoteInputs, [category]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleQuickAdd(category)
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={() => handleQuickAdd(category)} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {getNotesByCategory(category).map((note) => (
                  <div
                    key={note.id}
                    className="group bg-secondary/30 border border-border rounded p-3 hover:border-primary/50 transition-colors"
                  >
                    {editingNote?.id === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingNote.content}
                          onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                          className="min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit} className="gap-1">
                            <Check className="h-3 w-3" />
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingNote(null)} className="gap-1">
                            <X className="h-3 w-3" />
                            Cancelar
                          </Button>
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
                          <p
                            className={`text-sm leading-relaxed flex-1 ${
                              note.completed ? "line-through opacity-60" : ""
                            }`}
                          >
                            {note.content}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{formatDistanceToNow(note.updatedAt)}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleStartEdit(note)}
                            >
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
                {getNotesByCategory(category).length === 0 && (
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
