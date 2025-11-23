"use client"

import { ref, onValue, set, push, update, remove, get } from "firebase/database"
import { getFirebaseDatabase } from "./firebase"
import type { Task, TaskStatus } from "@/types/task"
import type { Department } from "@/types/user"

const TASKS_COLLECTION = "tarefas"

export function listenToTasks(callback: (tasks: Task[]) => void): () => void {
  try {
    const db = getFirebaseDatabase()
    const tasksRef = ref(db, TASKS_COLLECTION)

    console.log("[v0] Iniciando listener em tempo real para tarefas...")

    const unsubscribe = onValue(
      tasksRef,
      (snapshot) => {
        try {
          const data = snapshot.val()

          if (!data || data === null) {
            callback([])
            return
          }

          const tasks: Task[] = Object.entries(data).map(([id, value]: any) => ({
            id,
            title: value.title || "",
            description: value.description || "",
            priority: value.priority || "media",
            status: value.status || "pendente",
            shift: value.shift || "todos",
            assignedTo: value.assignedTo || [],
            assignedBy: value.assignedBy || "",
            assignedByDepartment: value.assignedByDepartment || "supervisor",
            dueDate: value.dueDate ? new Date(value.dueDate) : undefined,
            createdAt: new Date(value.createdAt || Date.now()),
            updatedAt: new Date(value.updatedAt || Date.now()),
            completedAt: value.completedAt ? new Date(value.completedAt) : undefined,
            completedBy: value.completedBy,
          }))

          tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          callback(tasks)
        } catch (error) {
          console.error("[v0] Erro ao processar tarefas em tempo real:", error)
        }
      },
      (error) => {
        console.error("[v0] Erro na conexão de tarefas em tempo real:", error)
      },
    )

    return unsubscribe
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Listener de tarefas não iniciado: Banco de dados indisponível.")
      return () => {}
    }
    console.error("[v0] Erro ao iniciar listener de tarefas:", error)
    return () => {} // Return empty unsubscribe function
  }
}

export function listenToUserTasks(userEmail: string, callback: (tasks: Task[]) => void): () => void {
  try {
    const db = getFirebaseDatabase()
    const tasksRef = ref(db, TASKS_COLLECTION)

    console.log("[v0] Iniciando listener para tarefas do usuário:", userEmail)

    const unsubscribe = onValue(
      tasksRef,
      (snapshot) => {
        try {
          const data = snapshot.val()

          if (!data || data === null) {
            callback([])
            return
          }

          const tasks: Task[] = Object.entries(data)
            .map(([id, value]: any) => ({
              id,
              title: value.title || "",
              description: value.description || "",
              priority: value.priority || "media",
              status: value.status || "pendente",
              shift: value.shift || "todos",
              assignedTo: value.assignedTo || [],
              assignedBy: value.assignedBy || "",
              assignedByDepartment: value.assignedByDepartment || "supervisor",
              dueDate: value.dueDate ? new Date(value.dueDate) : undefined,
              createdAt: new Date(value.createdAt || Date.now()),
              updatedAt: new Date(value.updatedAt || Date.now()),
              completedAt: value.completedAt ? new Date(value.completedAt) : undefined,
              completedBy: value.completedBy,
            }))
            .filter((task) => task.assignedTo.includes(userEmail))

          tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          callback(tasks)
        } catch (error) {
          console.error("[v0] Erro ao processar tarefas do usuário:", error)
        }
      },
      (error) => {
        console.error("[v0] Erro na conexão de tarefas do usuário:", error)
      },
    )

    return unsubscribe
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Listener de tarefas do usuário não iniciado: Banco de dados indisponível.")
      return () => {}
    }
    console.error("[v0] Erro ao iniciar listener de tarefas do usuário:", error)
    return () => {}
  }
}

export async function getAllTasks(): Promise<Task[]> {
  try {
    const db = getFirebaseDatabase()
    const tasksRef = ref(db, TASKS_COLLECTION)
    const snapshot = await get(tasksRef)
    const data = snapshot.val()

    if (!data) return []

    const tasks: Task[] = Object.entries(data).map(([id, value]: any) => ({
      id,
      title: value.title || "",
      description: value.description || "",
      priority: value.priority || "media",
      status: value.status || "pendente",
      shift: value.shift || "todos",
      assignedTo: value.assignedTo || [],
      assignedBy: value.assignedBy || "",
      assignedByDepartment: value.assignedByDepartment || "supervisor",
      dueDate: value.dueDate ? new Date(value.dueDate) : undefined,
      createdAt: new Date(value.createdAt || Date.now()),
      updatedAt: new Date(value.updatedAt || Date.now()),
      completedAt: value.completedAt ? new Date(value.completedAt) : undefined,
      completedBy: value.completedBy,
    }))

    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Aviso: Não foi possível buscar tarefas (Banco de dados indisponível).")
      return []
    }
    console.error("Erro ao buscar tarefas:", error)
    return []
  }
}

export async function addTask(
  taskData: Omit<Task, "id" | "createdAt" | "updatedAt"> & {
    assignedBy: string
    assignedByDepartment: Department
  },
): Promise<Task> {
  try {
    const db = getFirebaseDatabase()
    const tasksRef = ref(db, TASKS_COLLECTION)
    const newTaskRef = push(tasksRef)

    const now = new Date().toISOString()
    const newTask = {
      ...taskData,
      dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : undefined,
      createdAt: now,
      updatedAt: now,
    }

    await set(newTaskRef, newTask)

    return {
      id: newTaskRef.key!,
      ...taskData,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    } as Task
  } catch (error: any) {
    console.error("Erro ao adicionar tarefa:", error)
    throw error
  }
}

export async function updateTask(
  id: string,
  taskData: Partial<Omit<Task, "id" | "createdAt" | "updatedAt" | "assignedBy" | "assignedByDepartment">>,
): Promise<Task> {
  try {
    const db = getFirebaseDatabase()
    const taskRef = ref(db, `${TASKS_COLLECTION}/${id}`)

    const updatedAt = new Date().toISOString()
    const updatedData = {
      ...taskData,
      dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : undefined,
      completedAt: taskData.completedAt ? taskData.completedAt.toISOString() : undefined,
      updatedAt,
    }

    await update(taskRef, updatedData)

    return { id, ...updatedData, updatedAt: new Date(updatedAt) } as Task
  } catch (error: any) {
    console.error("Erro ao atualizar tarefa:", error)
    throw error
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    const db = getFirebaseDatabase()
    const taskRef = ref(db, `${TASKS_COLLECTION}/${id}`)
    await remove(taskRef)
  } catch (error: any) {
    console.error("Erro ao excluir tarefa:", error)
    throw error
  }
}

export async function updateTaskStatus(id: string, status: TaskStatus, completedBy?: string): Promise<Task> {
  try {
    const db = getFirebaseDatabase()
    const taskRef = ref(db, `${TASKS_COLLECTION}/${id}`)

    const updatedAt = new Date().toISOString()
    const fields: any = { status, updatedAt }

    if (status === "concluida" && completedBy) {
      fields.completedAt = updatedAt
      fields.completedBy = completedBy
    }

    await update(taskRef, fields)

    return {
      id,
      ...fields,
      updatedAt: new Date(updatedAt),
      completedAt: fields.completedAt ? new Date(fields.completedAt) : undefined,
    } as Task
  } catch (error: any) {
    console.error("Erro ao atualizar status da tarefa:", error)
    throw error
  }
}
