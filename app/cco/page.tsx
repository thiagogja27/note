"use client"

import { useState, useEffect, useRef } from "react"
import {
  getAllNotes,
  addNote,
  updateNote,
  deleteNote,
  getRadarNotes,
  getStorageSelection,
  saveStorageSelection,
} from "@/lib/realtime"
import { loadAuthSession, clearAuthSession } from "@/lib/firebase-auth"
import type { Note, Category } from "@/types/note"
import { RADAR_CATEGORY } from "@/types/note"
import type { User } from "@/types/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatDistanceToNow } from "@/lib/format-date"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Checkbox } from "@/components/ui/checkbox"
import { Volume2, VolumeX } from "lucide-react"
import { speak, stopSpeaking, isVoiceEnabled, setVoiceEnabled } from "@/lib/voice-notifications"
import { UserTasks } from "@/components/user-tasks"

const CCO_CATEGORIES: Category[] = ["Emails", "Incluir no relatório de balança", "Tarefas pendentes"]

export default function CCOPage() {
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
  const { toast } = useToast()

  const [showEstocagem, setShowEstocagem] = useState(false)
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

  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [voiceEnabled, setVoiceEnabledState] = useState(false)
  const previousStorageRef = useRef<string>("")
  const previousRadarCountRef = useRef<number>(0)
  const isInitialLoadRef = useRef(true)

  useEffect(() => {
    setVoiceEnabledState(isVoiceEnabled())
  }, [])

  const toggleVoice = () => {
    const newState = !voiceEnabled
    setVoiceEnabled(newState)
    setVoiceEnabledState(newState)
    if (!newState) {
      stopSpeaking()
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser) {
        loadRadarNotesData()
      }
    }, 5000) // Atualiza a cada 5 segundos

    return () => clearInterval(interval)
  }, [currentUser])

  useEffect(() => {
    const loadSession = async () => {
      const user = await loadAuthSession()
      if (!user) {
        router.push("/")
        return
      }

      if (user.department !== "cco") {
        router.push("/")
        return
      }

      setCurrentUser(user)
      await loadNotesForUser(user.id)
      await loadRadarNotesData()
      await loadStorageData()
      setLoading(false)
    }

    loadSession()
  }, [router])

  async function loadNotesForUser(userId: string) {
    try {
      const fetchedNotes = await getAllNotes(userId)
      setNotes(fetchedNotes)
    } catch (err) {
      console.error("[v0] Erro ao carregar notas:", err)
    }
  }

  async function loadRadarNotesData() {
    try {
      const fetchedRadarNotes = await getRadarNotes()
      setRadarNotes(fetchedRadarNotes)
    } catch (err) {
      console.error("[v0] Erro ao carregar notas do RADAR:", err)
    }
  }

  async function loadStorageData() {
    try {
      let savedStorage = await getStorageSelection()

      if (!savedStorage) {
        const localStorageData = localStorage.getItem("storageSelection")
        if (localStorageData) {
          savedStorage = JSON.parse(localStorageData)
        }
      }

      if (savedStorage) {
        setTegRoad(savedStorage.tegRoad || "")
        setTegRoadTombador(savedStorage.tegRoadTombador || "")
        setTegRailwayMoega01(savedStorage.tegRailwayMoega01 || "")
        setTegRailwayMoega02(savedStorage.tegRailwayMoega02 || "")
        setTeagRoad(savedStorage.tegRoad || "")
        setTeagRailway(savedStorage.tegRailway || "")
        setStorageUpdatedBy(savedStorage.updatedBy || "")
        setStorageUpdatedAt(savedStorage.updatedAt ? new Date(savedStorage.updatedAt) : null)
        setStorageUpdatedByDepartment(savedStorage.updatedByDepartment || "")
      }
    } catch (err) {
      console.error("[v0] Erro ao carregar estocagem:", err)
    }
  }

  const handleStorageChange = async (field: string, value: string) => {
    if (!currentUser) return

    const newSelection = {
      tegRoad,
      tegRoadTombador,
      tegRailwayMoega01,
      tegRailwayMoega02,
      teagRoad,
      teagRailway,
      [field]: value,
    }

    switch (field) {
      case "tegRoad":
        setTegRoad(value)
        break
      case "tegRoadTombador":
        setTegRoadTombador(value)
        break
      case "tegRailwayMoega01":
        setTegRailwayMoega01(value)
        break
      case "tegRailwayMoega02":
        setTegRailwayMoega02(value)
        break
      case "teagRoad":
        setTeagRoad(value)
        break
      case "teagRailway":
        setTeagRailway(value)
        break
    }

    await saveStorageSelection(newSelection, currentUser.id, currentUser.username, currentUser.department)
    setStorageUpdatedBy(currentUser.username)
    setStorageUpdatedAt(new Date())
    setStorageUpdatedByDepartment(currentUser.department)

    const fieldNames: Record<string, string> = {
      tegRoad: "TEG Rodovia - Tombadores 01 e 06",
      tegRoadTombador: "TEG Rodovia - Tombador 07",
      tegRailwayMoega01: "TEG Ferrovia - Moega 01",
      tegRailwayMoega02: "TEG Ferrovia - Moega 02",
      teagRoad: "TEAG Rodovia",
      teagRailway: "TEAG Ferrovia",
    }

    const alertMessage = `🚨 ALTERAÇÃO DE CÉLULA: ${fieldNames[field]} foi alterada para ${value}`

    try {
      const newNote = await addNote({
        title: alertMessage.substring(0, 50),
        content: alertMessage,
        category: RADAR_CATEGORY,
        userId: currentUser.id,
        createdBy: currentUser.username,
        createdByDepartment: currentUser.department,
      })
      setRadarNotes([newNote, ...radarNotes])
    } catch (error) {
      console.error("[v0] Erro ao criar alerta no RADAR:", error)
    }

    toast({
      title: "Estocagem atualizada",
      description: "As células foram atualizadas para todos os usuários",
    })
  }

  useEffect(() => {
    if (!currentUser || isInitialLoadRef.current) return

    const currentStorage = `${tegRoad}-${tegRoadTombador}-${tegRailwayMoega01}-${tegRailwayMoega02}-${teagRoad}-${teagRailway}`

    if (previousStorageRef.current && previousStorageRef.current !== currentStorage && voiceEnabled) {
      speak("Atenção! Houve alteração nas células de estocagem.", true)
    }

    previousStorageRef.current = currentStorage
  }, [tegRoad, tegRoadTombador, tegRailwayMoega01, tegRailwayMoega02, teagRoad, teagRailway, currentUser, voiceEnabled])

  useEffect(() => {
    if (!currentUser || isInitialLoadRef.current) return

    if (previousRadarCountRef.current > 0 && radarNotes.length > previousRadarCountRef.current && voiceEnabled) {
      speak("Nova mensagem no RADAR.", false)
    }

    previousRadarCountRef.current = radarNotes.length
  }, [radarNotes, currentUser, voiceEnabled])

  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        isInitialLoadRef.current = false
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [currentUser])

  const handleLogout = async () => {
    await clearAuthSession()
    router.push("/")
  }

  const handleQuickAdd = async (category: Category) => {
    const content = newNoteInputs[category].trim()
    if (!content || !currentUser) return

    try {
      const newNote = await addNote({
        title: content.substring(0, 50),
        content: content,
        category: category,
        userId: currentUser.id,
        createdBy: currentUser.username,
        createdByDepartment: currentUser.department,
      })
      setNotes([newNote, ...notes])
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
      const newNote = await addNote({
        title: content.substring(0, 50),
        content: content,
        category: RADAR_CATEGORY,
        userId: currentUser.id,
        createdBy: currentUser.username,
        createdByDepartment: currentUser.department,
      })
      setRadarNotes([newNote, ...radarNotes])
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

      const updated = await updateNote(
        editingNote.id,
        {
          title: editingNote.content.substring(0, 50),
          content: editingNote.content,
          category: note.category,
          userId: currentUser.id,
        },
        currentUser.username,
        currentUser.department,
      )

      if (note.category === RADAR_CATEGORY) {
        setRadarNotes(radarNotes.map((n) => (n.id === updated.id ? updated : n)))
      } else {
        setNotes(notes.map((n) => (n.id === updated.id ? updated : n)))
      }

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
      if (isRadar) {
        setRadarNotes(radarNotes.filter((n) => n.id !== id))
      } else {
        setNotes(notes.filter((n) => n.id !== id))
      }
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
      const updated = await updateNote(
        note.id,
        {
          title: note.title,
          content: note.content,
          category: note.category,
          userId: currentUser.id,
          completed: !note.completed,
        },
        currentUser.username,
        currentUser.department,
      )

      setNotes(notes.map((n) => (n.id === updated.id ? updated : n)))
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
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">CCO - Centro de Controle Operacional</h1>
                <p className="text-sm text-muted-foreground">
                  Controle de estocagem e RADAR • Usuário: {currentUser?.username || "Desconhecido"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleVoice}
                title={voiceEnabled ? "Desativar notificações de voz" : "Ativar notificações de voz"}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
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
            CONTROLE DE ESTOCAGEM
            {showEstocagem ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
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
            <h2 className="text-xl font-semibold mb-4 text-primary">Definir Células de Estocagem</h2>
            <p className="text-sm text-muted-foreground mb-4">
              As células definidas aqui serão exibidas para todos os usuários de Balança
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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Lado TEG</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rodovia - Tombadores 01 e 06:</label>
                    <Select value={tegRoad} onValueChange={(value) => handleStorageChange("tegRoad", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o armazém" />
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
                    <Select
                      value={tegRoadTombador}
                      onValueChange={(value) => handleStorageChange("tegRoadTombador", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o armazém" />
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
                    <Select
                      value={tegRailwayMoega01}
                      onValueChange={(value) => handleStorageChange("tegRailwayMoega01", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o armazém" />
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
                    <Select
                      value={tegRailwayMoega02}
                      onValueChange={(value) => handleStorageChange("tegRailwayMoega02", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o armazém" />
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Lado TEAG</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rodovia:</label>
                    <Select value={teagRoad} onValueChange={(value) => handleStorageChange("teagRoad", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o armazém" />
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
                    <Select value={teagRailway} onValueChange={(value) => handleStorageChange("teagRailway", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o armazém" />
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
            Adicione informações importantes que serão compartilhadas com todos os usuários
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
            {radarNotes.map((note) => (
              <div
                key={note.id}
                className="group bg-primary/5 border border-primary/30 rounded p-3 hover:border-primary transition-colors"
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
                    <p className="text-sm leading-relaxed mb-2">{note.content}</p>
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
            ))}
            {radarNotes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum item no RADAR ainda</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {CCO_CATEGORIES.map((category) => (
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
                        <div className="flex items-start gap-2 mb-2">
                          <Checkbox
                            checked={note.completed || false}
                            onCheckedChange={() => handleToggleCompleted(note)}
                            className="mt-0.5"
                          />
                          <p
                            className={`text-sm leading-relaxed flex-1 ${note.completed ? "line-through text-muted-foreground" : ""}`}
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
      <Toaster />
    </div>
  )
}
