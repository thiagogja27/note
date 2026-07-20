export type ClassificationStatus = 
  | "aguardando"
  | "liberado"
  | "recusado"
  | "descarregando"
  | "concluido"
  | "em-analise"; // Novo estado

export interface Classification {
  id: string;
  plate: string;
  driver: string;
  company: string;
  product: string;
  status: ClassificationStatus;
  createdAt: string;
  createdBy: string; // User who created the classification
  releasedAt?: string;
  releasedBy?: string; // User who released it
  refusedAt?: string;
  refusedBy?: string; // User who refused it
  refusalReason?: string; // Reason for refusal
  unloadingStartedAt?: string;
  unloadingStartedBy?: string; // Operator who started unloading
  unloadingFinishedAt?: string;
  unloadingFinishedBy?: string; // Operator who finished unloading
  analysisStartedAt?: string; // Novo campo
  analysisStartedBy?: string; // Novo campo
}
