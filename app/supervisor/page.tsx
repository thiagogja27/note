"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { loadAuthSession, clearAuthSession } from "@/lib/firebase-auth"
import { getAllUsers, listenToNotes } from "@/lib/realtime"
import { listenToTasks, addTask, updateTask, deleteTask } from "@/lib/tasks"
import type { User } from "@/types/user"
import type { Task, TaskPriority, TaskStatus, Shift } from "@/types/task"
import type { Note } from "@/types/note"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"
import { AnnotationsManager } from "@/components/annotations-manager"

const SHIFTS: Shift[] = ["A", "B", "C", "D", "E", "Todos"]
const PRIORITIES: TaskPriority[] = ["baixa", "media", "alta", "urgente"]
const STATUSES: TaskStatus[] = ["pendente", "em_andamento", "concluida", "cancelada"]

const PRIORITY_COLORS = {
  baixa: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  media: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  alta: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  urgente: "bg-red-500/10 text-red-600 border-red-500/30",
}

const STATUS_COLORS = {
  pendente: "bg-gray-500/10 text-gray-600 border-gray-500/30",
  em_andamento: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  concluida: "bg-green-500/10 text-green-600 border-green-500/30",
  cancelada: "bg-red-500/10 text-red-600 border-red-500/30",
}

export default function SupervisorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [allNotes, setAllNotes] = useState<Note[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPriority, setFormPriority] = useState<TaskPriority>("media")
  const [formShift, setFormShift] = useState<Shift>("Todos")
  const [formAssignedTo, setFormAssignedTo] = useState<string[]>([])
  const [formDueDate, setFormDueDate] = useState("")

  const [filterShift, setFilterShift] = useState<Shift | "all">("all")
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all")

  useEffect(() => {
    const loadSession = async () => {
      const user = await loadAuthSession()
      if (user) {
        if (user.department !== "supervisor") {
          router.push("/")
          return
        }
        setCurrentUser(user)
        setIsAuthenticated(true)
        loadUsers()
      } else {
        router.push("/")
      }
      setLoading(false)
    }
    loadSession()
  }, [router])

  useEffect(() => {
    if (!isAuthenticated) return

    const unsubscribe = listenToTasks((fetchedTasks) => {
      setTasks(fetchedTasks)
    })

    return () => unsubscribe()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return

    console.log("[v0] Supervisor: Carregando todas as anotações de todos os usuários...")
    const unsubscribe = listenToNotes(undefined, (fetchedNotes) => {
      console.log(`[v0] Supervisor: ${fetchedNotes.length} anotações carregadas`)
      setAllNotes(fetchedNotes)
    })

    return () => unsubscribe()
  }, [isAuthenticated])

  const loadUsers = async () => {
    try {
      console.log("[v0] Carregando usuários do banco de dados...")
      const fetchedUsers = await getAllUsers()
      const filteredUsers = fetchedUsers.filter((u) => u.department !== "supervisor")
      console.log(`[v0] ${filteredUsers.length} usuário(s) disponível(is) para atribuição de tarefas`)
      setUsers(filteredUsers)
    } catch (error: any) {
      console.error("[v0] Erro ao carregar usuários:", error)
      toast({
        title: "Erro ao carregar usuários",
        description:
          error.message ||
          "Não foi possível buscar a lista de usuários. Verifique se o Firebase Realtime Database está configurado.",
        variant: "destructive",
      })
      setUsers([])
    }
  }

  const handleLogout = async () => {
    await clearAuthSession()
    router.push("/")
  }

  const resetForm = () => {
    setFormTitle("")
    setFormDescription("")
    setFormPriority("media")
    setFormShift("Todos")
    setFormAssignedTo([])
    setFormDueDate("")
    setEditingTask(null)
  }

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task)
      setFormTitle(task.title)
      setFormDescription(task.description)
      setFormPriority(task.priority)
      setFormShift(task.shift)
      setFormAssignedTo(task.assignedTo)
      setFormDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "")
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSaveTask = async () => {
    if (!formTitle.trim() || !formDescription.trim() || formAssignedTo.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, descrição e selecione pelo menos um usuário",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title: formTitle,
          description: formDescription,
          priority: formPriority,
          shift: formShift,
          assignedTo: formAssignedTo,
          dueDate: formDueDate ? new Date(formDueDate) : undefined,
        })
        toast({
          title: "Tarefa atualizada",
          description: "A tarefa foi atualizada com sucesso",
        })
      } else {
        await addTask({
          title: formTitle,
          description: formDescription,
          priority: formPriority,
          status: "pendente",
          shift: formShift,
          assignedTo: formAssignedTo,
          assignedBy: currentUser?.username || "Supervisor",
          assignedByDepartment: "supervisor",
          dueDate: formDueDate ? new Date(formDueDate) : undefined,
        })
        toast({
          title: "Tarefa criada",
          description: "A tarefa foi atribuída com sucesso",
        })
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("[v0] Erro ao salvar tarefa:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a tarefa",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return

    try {
      await deleteTask(taskId)
      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi removida com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a tarefa",
        variant: "destructive",
      })
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filterShift !== "all" && task.shift !== filterShift && task.shift !== "Todos") return false
    if (filterStatus !== "all" && task.status !== filterStatus) return false
    return true
  })

  const getNotesByCategory = (category: string) => {
    return allNotes.filter((note) => note.category === category)
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

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-[1400px]">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Painel do Supervisor</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie e atribua tarefas para a equipe • {currentUser?.username}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Verificar balança 03"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva os detalhes da tarefa..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={formPriority} onValueChange={(v) => setFormPriority(v as TaskPriority)}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shift">Turno</Label>
                    <Select value={formShift} onValueChange={(v) => setFormShift(v as Shift)}>
                      <SelectTrigger id="shift">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIFTS.map((shift) => (
                          <SelectItem key={shift} value={shift}>
                            Turno {shift}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data de Vencimento (Opcional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Atribuir para (Usuários) *</Label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                    {users.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário registrado ainda</p>
                    ) : (
                      users.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formAssignedTo.includes(user.username)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormAssignedTo([...formAssignedTo, user.username])
                              } else {
                                setFormAssignedTo(formAssignedTo.filter((u) => u !== user.username))
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">
                            {user.username} ({user.department.toUpperCase()})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {formAssignedTo.length > 0 && (
                    <p className="text-xs text-muted-foreground">{formAssignedTo.length} usuário(s) selecionado(s)</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveTask} className="flex-1">
                    {editingTask ? "Atualizar" : "Criar"} Tarefa
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Select value={filterShift} onValueChange={(v) => setFilterShift(v as Shift | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os turnos</SelectItem>
              {SHIFTS.map((shift) => (
                <SelectItem key={shift} value={shift}>
                  Turno {shift}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TaskStatus | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
              <p className="text-sm text-muted-foreground mt-2">Clique em "Nova Tarefa" para criar uma tarefa</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded border ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded border ${STATUS_COLORS[task.status]}`}>
                        {task.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>
                        Turno: <strong>{task.shift}</strong>
                      </span>
                      <span>
                        Atribuído para: <strong>{task.assignedTo.join(", ")}</strong>
                      </span>
                      <span>
                        Por: <strong>{task.assignedBy}</strong>
                      </span>
                      {task.dueDate && (
                        <span>
                          Vencimento: <strong>{new Date(task.dueDate).toLocaleDateString("pt-BR")}</strong>
                        </span>
                      )}
                      <span>{formatDistanceToNow(task.createdAt, { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(task)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Annotations Manager */}
        <div className="mt-8">
          <AnnotationsManager currentUser={currentUser!} />
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Anotações de Todos os Usuários</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Visualize todas as anotações cadastradas no sistema (Emails, Relatórios, Tarefas Pendentes)
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Emails */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-primary">Emails</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {getNotesByCategory("Emails").map((note) => (
                  <div
                    key={note.id}
                    className="bg-secondary/30 border border-border rounded p-3"
                  >
                    <p className="text-sm leading-relaxed mb-2">{note.content}</p>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground block">
                        {formatDistanceToNow(note.updatedAt, { addSuffix: true, locale: ptBR })}
                      </span>
                      {note.createdBy && (
                        <span className="text-xs text-primary font-medium block">
                          Por: {note.createdBy} ({note.createdByDepartment?.toUpperCase()})
                        </span>
                      )}
                      {note.completed && (
                        <span className="text-xs text-green-600 font-medium block">✓ Concluído</span>
                      )}
                    </div>
                  </div>
                ))}
                {getNotesByCategory("Emails").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma anotação</p>
                )}
              </div>
            </div>

            {/* Incluir no relatório de balança */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-primary">Incluir no relatório de balança</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {getNotesByCategory("Incluir no relatório de balança").map((note) => (
                  <div
                    key={note.id}
                    className="bg-secondary/30 border border-border rounded p-3"
                  >
                    <p className="text-sm leading-relaxed mb-2">{note.content}</p>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground block">
                        {formatDistanceToNow(note.updatedAt, { addSuffix: true, locale: ptBR })}
                      </span>
                      {note.createdBy && (
                        <span className="text-xs text-primary font-medium block">
                          Por: {note.createdBy} ({note.createdByDepartment?.toUpperCase()})
                        </span>
                      )}
                      {note.completed && (
                        <span className="text-xs text-green-600 font-medium block">✓ Concluído</span>
                      )}
                    </div>
                  </div>
                ))}
                {getNotesByCategory("Incluir no relatório de balança").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma anotação</p>
                )}
              </div>
            </div>

            {/* Tarefas pendentes */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-primary">Tarefas pendentes</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {getNotesByCategory("Tarefas pendentes").map((note) => (
                  <div
                    key={note.id}
                    className="bg-secondary/30 border border-border rounded p-3"
                  >
                    <p className="text-sm leading-relaxed mb-2">{note.content}</p>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground block">
                        {formatDistanceToNow(note.updatedAt, { addSuffix: true, locale: ptBR })}
                      </span>
                      {note.createdBy && (
                        <span className="text-xs text-primary font-medium block">
                          Por: {note.createdBy} ({note.createdByDepartment?.toUpperCase()})
                        </span>
                      )}
                      {note.completed && (
                        <span className="text-xs text-green-600 font-medium block">✓ Concluído</span>
                      )}
                    </div>
                  </div>
                ))}
                {getNotesByCategory("Tarefas pendentes").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma anotação</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
