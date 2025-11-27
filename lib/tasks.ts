"use client"

import { ref, onValue, set, push, update, remove, get } from "firebase/database"
import { getFirebaseDatabase } from "./firebase"
import type { Task, TaskStatus } from "@/types/task"
import type { Department } from "@/types/user"

const TASKS_COLLECTION = "tarefas"

// Helper function to remove properties with undefined values
function cleanupObject(obj: any) {
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

export function listenToTasks(callback: (tasks: Task[]) => void): () => void {
  try {
    const db = getFirebaseDatabase()
    const tasksRef = ref(db, TASKS_COLLECTION)

    const unsubscribe = onValue(
      tasksRef,
      (snapshot) => {
        const data = snapshot.val()
        if (!data) {
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
      },
      (error) => {
        console.error("[v0] Erro na conexão de tarefas em tempo real:", error)
      },
    )

    return unsubscribe
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Listener de tarefas não iniciado: Banco de dados indisponível.")
    } else {
      console.error("[v0] Erro ao iniciar listener de tarefas:", error)
    }
    return () => {}
  }
}

export function listenToUserTasks(username: string, callback: (tasks: Task[]) => void): () => void {
  return listenToTasks((allTasks) => {
    const userTasks = allTasks.filter(task => task.assignedTo.includes(username));
    callback(userTasks);
  });
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
    } else {
      console.error("Erro ao buscar tarefas:", error)
    }
    return []
  }
}

export async function addTask(
  taskData: Omit<Task, "id" | "createdAt" | "updatedAt"> & {
    assignedBy: string
    assignedByDepartment: Department
  },
): Promise<Task> {
  const db = getFirebaseDatabase()
  const tasksRef = ref(db, TASKS_COLLECTION)
  const newTaskRef = push(tasksRef)

  const now = new Date().toISOString()
  
  const newTaskPayload = {
    ...taskData,
    dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
    completedAt: taskData.completedAt ? new Date(taskData.completedAt).toISOString() : null,
    createdAt: now,
    updatedAt: now,
  };

  const finalPayload = cleanupObject(newTaskPayload);

  await set(newTaskRef, finalPayload);

  return {
    id: newTaskRef.key!,
    ...taskData,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  } as Task;
}

export async function updateTask(
  id: string,
  taskData: Partial<Omit<Task, "id" | "createdAt" | "assignedBy" | "assignedByDepartment"> >,
): Promise<void> {
    const db = getFirebaseDatabase();
    const taskRef = ref(db, `${TASKS_COLLECTION}/${id}`);

    const updatedAt = new Date().toISOString();

    const updatePayload: any = { ...taskData, updatedAt };

    if (taskData.hasOwnProperty('dueDate')) {
        updatePayload.dueDate = taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null;
    }
    if (taskData.hasOwnProperty('completedAt')) {
        updatePayload.completedAt = taskData.completedAt ? new Date(taskData.completedAt).toISOString() : null;
    }
    
    const finalPayload = cleanupObject(updatePayload);

    await update(taskRef, finalPayload);
}

export async function deleteTask(id: string): Promise<void> {
  const db = getFirebaseDatabase()
  const taskRef = ref(db, `${TASKS_COLLECTION}/${id}`)
  await remove(taskRef)
}

export async function updateTaskStatus(id: string, status: TaskStatus, completedBy?: string): Promise<void> {
  const db = getFirebaseDatabase()
  const taskRef = ref(db, `${TASKS_COLLECTION}/${id}`)

  const now = new Date().toISOString()
  const fieldsToUpdate: any = { status, updatedAt: now }

  if (status === "concluida" && completedBy) {
    fieldsToUpdate.completedAt = now
    fieldsToUpdate.completedBy = completedBy
  }

  await update(taskRef, fieldsToUpdate);
}
