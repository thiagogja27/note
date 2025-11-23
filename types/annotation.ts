export type AnnotationType = "parada" | "link" | "observacao" | "geral"

export interface Annotation {
  id: string
  title: string
  content: string
  type: AnnotationType
  url?: string // For links
  createdBy: string
  createdByDepartment: string
  updatedBy?: string
  updatedByDepartment?: string
  createdAt: Date
  updatedAt: Date
}
