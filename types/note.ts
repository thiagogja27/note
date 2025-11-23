export const CATEGORIES = [
  "Emails",
  "Incluir no relatório de balança",
  "Tarefas pendentes",
  "Anotações Gerais",
] as const

export const RADAR_CATEGORY = "RADAR" as const

export const ANOTACOES_GERAIS_TITLES = ["Observação", "Links", "Paradas"] as const

export type Category = (typeof CATEGORIES)[number]
export type RadarCategory = typeof RADAR_CATEGORY
export type AnotacoesGeraisTitles = (typeof ANOTACOES_GERAIS_TITLES)[number]

export interface Note {
  id: string
  title: string
  content: string
  category?: Category | RadarCategory
  userId: string
  completed?: boolean
  createdBy: string
  createdByDepartment: "cco" | "balanca" | "supervisor"
  updatedBy?: string
  updatedByDepartment?: "cco" | "balanca" | "supervisor"
  createdAt: Date
  updatedAt: Date
}
