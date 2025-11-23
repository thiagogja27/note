"use client"

import { useState, useEffect } from "react"
import { listenToUserTasks, updateTaskStatus } from "@/lib/tasks"
import type { Task, TaskPriority, TaskStatus } from "@/types/task"
import type { User } from "@/types/user"
import { Button } from "@/components/ui/button"
import { Clock, AlertCircle, CheckCircle2, PlayCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "@/lib/format-date"

interface UserTasksProps {
  currentUser: User
}

export function UserTasks({ currentUser }: UserTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = listenToUserTasks(currentUser.username, (updatedTasks) => {
      setTasks(updatedTasks)
    })

    return () => {
      unsubscribe()
    }
  }, [currentUser])

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, status, currentUser.username)
      toast({
        title: "Status atualizado",
        description: `Tarefa marcada como ${status.replace("_", " ")}`,
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "urgente":
        return "bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400"
      case "alta":
        return "bg-orange-500/10 border-orange-500/50 text-orange-600 dark:text-orange-400"
      case "media":
        return "bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-400"
      case "baixa":
        return "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400"
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "concluida":
        return "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400"
      case "em_andamento":
        return "bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400"
      case "cancelada":
        return "bg-gray-500/10 border-gray-500/50 text-gray-600 dark:text-gray-400"
      default:
        return "bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-400"
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa atribuída</h3>
        <p className="text-sm text-muted-foreground">Você não tem tarefas pendentes no momento</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-semibold">{task.title}</h3>
                <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                  {task.priority.toUpperCase()}
                </span>
                <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(task.status)}`}>
                  {task.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              {task.description && <p className="text-sm text-muted-foreground mb-2">{task.description}</p>}

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Turno: {task.shift === "todos" ? "Todos" : task.shift}</span>
                </div>
                {task.dueDate && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>Vencimento: {task.dueDate.toLocaleDateString("pt-BR")}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span>Atribuído por: {task.assignedBy}</span>
                </div>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                <p>Criado {formatDistanceToNow(task.createdAt)}</p>
                {task.completedBy && task.completedAt && (
                  <p className="text-green-600 dark:text-green-400">
                    Concluído por: {task.completedBy} • {formatDistanceToNow(task.completedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {task.status !== "em_andamento" && task.status !== "concluida" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(task.id, "em_andamento")}
                className="gap-1"
              >
                <PlayCircle className="h-3 w-3" />
                Iniciar
              </Button>
            )}
            {task.status !== "concluida" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleUpdateStatus(task.id, "concluida")}
                className="gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                Concluir
              </Button>
            )}
            {task.status === "concluida" && (
              <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(task.id, "pendente")}>
                Reabrir
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
