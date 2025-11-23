export type UserRole = "assistente" | "supervisor"

export type Department = "cco" | "balanca" | "supervisor"

export interface User {
  id: string
  username: string
  password: string
  role: UserRole
  department: Department
}
