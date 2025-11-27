
export const CATEGORIES = [
  "Emails",
  "Incluir no relatório de balança",
  "Tarefas pendentes",
] as const;

export const RADAR_CATEGORY = "RADAR" as const;
export const INFO_CATEGORY = "INFORMACOES" as const; 

export type Category = typeof CATEGORIES[number];
export type SpecialCategory = typeof RADAR_CATEGORY | typeof INFO_CATEGORY;

export interface Note {
  id: string;
  title: string;
  content: string;
  category: Category | SpecialCategory; 
  userId: string;
  completed?: boolean;
  createdBy: string;
  createdByDepartment: "cco" | "balanca" | "supervisor";
  updatedBy?: string;
  updatedByDepartment?: "cco" | "balanca" | "supervisor";
  createdAt: Date;
  updatedAt: Date;
}
