import type { Department } from "./user"

export type TaskPriority = "baixa" | "media" | "alta" | "urgente"
export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "cancelada"
export type Shift = "A" | "B" | "C" | "D" | "E" | "todos"

export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  shift: Shift
  assignedTo: string[] // Array of user emails
  assignedBy: string // Supervisor who created the task
  assignedByDepartment: Department
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  completedBy?: string
}
