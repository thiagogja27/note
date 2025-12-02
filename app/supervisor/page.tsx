"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { loadAuthSession, clearAuthSession } from "@/lib/firebase-auth"
import { getAllUsers, listenToAllUserNotes, deleteNote, listenToRadarNotes, addNote } from "@/lib/realtime"
import { listenToTasks, addTask, updateTask, deleteTask as deleteTaskFromDb } from "@/lib/tasks"
import type { User } from "@/types/user"
import type { Task, TaskPriority, TaskStatus, Shift } from "@/types/task"
import type { Note } from "@/types/note"
import { CATEGORIES, RADAR_CATEGORY } from "@/types/note"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Plus, Pencil, Trash2, ClipboardList, LogOut, Users } from 'lucide-react'
import { formatDistanceToNow } from "@/lib/format-date"
import { RadarSummary } from "@/components/RadarSummary"

type ShiftWithAll = Shift | "Todos";

const SHIFTS: ShiftWithAll[] = ["A", "B", "C", "D", "E", "Todos"]
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
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPriority, setFormPriority] = useState<TaskPriority>("media")
  const [formShift, setFormShift] = useState<ShiftWithAll>("Todos")
  const [formAssignedTo, setFormAssignedTo] = useState<string[]>([])
  const [formDueDate, setFormDueDate] = useState("")
  const [filterShift, setFilterShift] = useState<Shift | "all">("all")
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all")

  const [allNotes, setAllNotes] = useState<Note[]>([])
  const [radarNotes, setRadarNotes] = useState<Note[]>([])
  const [newRadarInput, setNewRadarInput] = useState("")
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [userFilter, setUserFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  
  useEffect(() => {
    const loadSession = async () => {
      const user = await loadAuthSession()
      if (user && user.department === "supervisor") {
        setCurrentUser(user)
        const fetchedUsers = await getAllUsers()
        setUsers(fetchedUsers)
      } else {
        router.push("/")
      }
      setLoading(false)
    }
    loadSession()
  }, [router])

  useEffect(() => {
    if (currentUser) {
      const unsubscribeTasks = listenToTasks(setTasks)
      const unsubscribeNotes = listenToAllUserNotes(setAllNotes)
      const unsubscribeRadar = listenToRadarNotes(setRadarNotes)
      return () => {
        unsubscribeTasks()
        unsubscribeNotes()
        unsubscribeRadar()
      }
    }
  }, [currentUser])

  useEffect(() => {
    let notes = allNotes;
    if (userFilter !== "all") {
      notes = notes.filter(note => note.userId === userFilter);
    }
    if (categoryFilter !== "all") {
      notes = notes.filter(note => note.category === categoryFilter);
    }
    setFilteredNotes(notes);
  }, [allNotes, userFilter, categoryFilter]);

  const handleLogout = async () => {
    await clearAuthSession()
    router.push("/")
  }

  const handleAddRadarNote = async () => {
    const content = newRadarInput.trim()
    if (!content || !currentUser) return
    try {
      await addNote({
        title: content.substring(0, 50),
        content,
        category: RADAR_CATEGORY,
        userId: currentUser.id,
        createdBy: currentUser.username,
        createdByDepartment: currentUser.department
      })
      setNewRadarInput("")
      toast({ title: "Adicionado ao RADAR!" })
    } catch (error) {
      toast({ title: "Erro ao adicionar ao RADAR", variant: "destructive" })
    }
  }

  const resetTaskForm = () => {
    setFormTitle(""); setFormDescription(""); setFormPriority("media"); setFormShift("Todos");
    setFormAssignedTo([]); setFormDueDate(""); setEditingTask(null);
  }

  const handleOpenTaskDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task)
      setFormTitle(task.title); setFormDescription(task.description); setFormPriority(task.priority);
      setFormShift(task.shift as ShiftWithAll); // Asserção para conformidade
      setFormAssignedTo(task.assignedTo);
      setFormDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
    } else {
      resetTaskForm();
    }
    setIsTaskDialogOpen(true);
  }

  const handleSaveTask = async () => {
    if (!formTitle.trim() || !formDescription.trim() || formAssignedTo.length === 0 || !currentUser) {
      toast({ title: "Campos obrigatórios", description: "Preencha título, descrição e atribua a tarefa.", variant: "destructive" })
      return
    }

    try {
      const taskData: Partial<Task> = {
        title: formTitle,
        description: formDescription,
        priority: formPriority,
        shift: formShift as any, // <-- CORREÇÃO APLICADA AQUI
        assignedTo: formAssignedTo,
        dueDate: formDueDate ? new Date(formDueDate) : undefined,
      }
      
      if (editingTask) {
        await updateTask(editingTask.id, taskData)
        toast({ title: "Tarefa atualizada com sucesso!" })
      } else {
        await addTask({
          ...taskData,
          status: "pendente",
          assignedBy: currentUser.username,
          assignedByDepartment: "supervisor"
        } as Task)
        toast({ title: "Tarefa criada e atribuída com sucesso!" })
      }
      setIsTaskDialogOpen(false); resetTaskForm();
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error)
      toast({ title: "Erro ao salvar tarefa", variant: "destructive" })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskFromDb(taskId)
      toast({ title: "Tarefa excluída com sucesso!" })
    } catch (error) {
      toast({ title: "Erro ao excluir tarefa", variant: "destructive" })
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!currentUser) return
    try {
      await deleteNote(id, currentUser.username, currentUser.department)
      toast({ title: "Anotação excluída com sucesso!" })
    } catch (error) {
      toast({ title: "Erro ao excluir anotação", variant: "destructive" })
    }
  }
  
  const filteredTasks = tasks.filter((task) => {
    if (filterShift !== "all" && task.shift !== filterShift && task.shift !== "Todos") return false
    if (filterStatus !== "all" && task.status !== filterStatus) return false
    return true
  })
  
  if (loading || !currentUser) {
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
      <div className="container mx-auto px-4 py-6 max-w-[1600px]">
        <header className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold">Painel do Supervisor</h1>
                    <p className="text-sm text-muted-foreground">Bem-vindo, {currentUser.username}!</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="outline" onClick={handleLogout} className="gap-2"><LogOut className="h-4 w-4" /> Sair</Button>
            </div>
        </header>

        <div className="my-6">
            <RadarSummary radarNotes={radarNotes} />
        </div>

        <div className="bg-card border-2 border-primary rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3 text-primary">RADAR - Área Compartilhada</h2>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Adicionar item importante ao RADAR..." value={newRadarInput} onChange={(e) => setNewRadarInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddRadarNote()} />
            <Button onClick={handleAddRadarNote}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {radarNotes.length === 0 ? <p className="text-sm text-center text-muted-foreground py-4">Nenhum item no RADAR.</p> : radarNotes.map(note => (
              <div key={note.id} className="group bg-primary/5 border border-primary/30 p-3 rounded">
                <p className="text-sm mb-2 whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{note.createdBy} ({note.createdByDepartment}) - {formatDistanceToNow(note.createdAt)}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteNote(note.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><ClipboardList className="h-5 w-5" />Gerenciador de Tarefas</h2>
            <div className="flex gap-4 mb-6">
                <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                    <DialogTrigger asChild><Button onClick={() => handleOpenTaskDialog()} className="gap-2"><Plus className="h-4 w-4" /> Nova Tarefa</Button></DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2"><Label htmlFor="title">Título *</Label><Input id="title" placeholder="Ex: Verificar balança 03" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="description">Descrição *</Label><Textarea id="description" placeholder="Descreva os detalhes da tarefa..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={4} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="priority">Prioridade</Label><Select value={formPriority} onValueChange={(v) => setFormPriority(v as TaskPriority)}><SelectTrigger id="priority"><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label htmlFor="shift">Turno</Label><Select value={formShift} onValueChange={(v) => setFormShift(v as ShiftWithAll)}><SelectTrigger id="shift"><SelectValue /></SelectTrigger><SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s === 'Todos' ? 'Todos os Turnos' : `Turno ${s}`}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="dueDate">Data de Vencimento (Opcional)</Label><Input id="dueDate" type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} /></div>
                            <div className="space-y-2">
                                <Label>Atribuir para (Usuários) *</Label>
                                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                                    {users.filter(u => u.department !== 'supervisor').length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário operacional registrado.</p> : users.filter(u => u.department !== 'supervisor').map((user) => (<label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-2 rounded"><input type="checkbox" checked={formAssignedTo.includes(user.username)} onChange={(e) => {if (e.target.checked) {setFormAssignedTo([...formAssignedTo, user.username])} else {setFormAssignedTo(formAssignedTo.filter((u) => u !== user.username))}}} className="h-4 w-4" /> <span className="text-sm">{user.username} ({user.department.toUpperCase()})</span></label>))}
                                </div>
                                {formAssignedTo.length > 0 && <p className="text-xs text-muted-foreground">{formAssignedTo.length} usuário(s) selecionado(s)</p>}
                            </div>
                            <div className="flex gap-2 pt-4"><Button onClick={handleSaveTask} className="flex-1">{editingTask ? "Atualizar" : "Criar"} Tarefa</Button><Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancelar</Button></div>
                        </div>
                    </DialogContent>
                </Dialog>
                <Select value={filterShift} onValueChange={(v) => setFilterShift(v as Shift | "all")}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por turno" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os Turnos</SelectItem>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s === 'Todos' ? 'Todos os Turnos' : `Turno ${s}`}</SelectItem>)}</SelectContent></Select>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TaskStatus | "all")}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os Status</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ").charAt(0).toUpperCase() + s.replace("_", " ").slice(1)}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-4">
                {filteredTasks.length === 0 ? <div className="text-center py-12"><ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma tarefa encontrada para os filtros selecionados.</p></div> : filteredTasks.map((task) => (<div key={task.id} className="bg-secondary/20 border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"><div className="flex items-start justify-between gap-4"><div className="flex-1"><div className="flex items-center flex-wrap gap-2 mb-2"><h3 className="text-lg font-semibold">{task.title}</h3><span className={`text-xs px-2 py-1 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>{task.priority.toUpperCase()}</span><span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[task.status]}`}>{task.status.replace("_", " ").toUpperCase()}</span></div><p className="text-sm text-muted-foreground mb-3">{task.description}</p><div className="flex flex-wrap gap-4 text-xs text-muted-foreground"><span>Turno: <strong>{task.shift}</strong></span><span>Atribuído a: <strong>{task.assignedTo.join(", ")}</strong></span><span>Por: <strong>{task.assignedBy}</strong></span>{task.dueDate && <span>Vencimento: <strong>{new Date(task.dueDate).toLocaleDateString("pt-BR")}</strong></span>}<span>{formatDistanceToNow(new Date(task.createdAt))}</span></div></div><div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => handleOpenTaskDialog(task)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteTask(task.id)}><Trash2 className="h-4 w-4" /></Button></div></div></div>))}
            </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Visualizador de Anotações</h2>
            <div className="flex gap-4 mb-6">
                <Select value={userFilter} onValueChange={setUserFilter}><SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrar por usuário" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os Usuários</SelectItem>{users.filter(u => u.department !== 'supervisor').map(user => (<SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>))}</SelectContent></Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrar por categoria" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as Categorias</SelectItem>{CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-4">
                {filteredNotes.length > 0 ? (filteredNotes.map(note => (
                  <div key={note.id} className="bg-secondary/30 border border-border rounded p-4">
                    <p className={`text-sm leading-relaxed mb-3 ${note.completed ? "line-through text-muted-foreground" : ""}`}>{note.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-primary">{users.find(u => u.id === note.userId)?.username || 'Usuário desconhecido'}</span>
                            <span>{note.category}</span>
                            <span>{formatDistanceToNow(new Date(note.updatedAt))}</span>
                        </div>
                        <span className={`px-2 py-0.5 font-semibold rounded-full ${ note.completed ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700' }`}>
                            {note.completed ? 'Concluído' : 'Pendente'}
                        </span>
                    </div>
                  </div>
                )))
                : ( <p className="text-center text-muted-foreground py-12">Nenhuma anotação encontrada para os filtros selecionados.</p> )}
            </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
