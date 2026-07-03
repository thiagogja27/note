
export type ClassificationStatus = 
  | "aguardando" 
  | "liberado" 
  | "recusado"
  | "descarregando"
  | "concluido";

export interface Classification {
  id: string;
  plate: string;
  product: "soja" | "acucar";
  invoiceNumber?: string;
  riPercentage?: number;
  humidity?: number;
  observations?: string;
  
  status: ClassificationStatus;
  createdAt: string;
  createdBy: string;

  releasedAt?: string;
  releasedBy?: string;

  refusedAt?: string;
  refusedBy?: string;

  unloadingStartedAt?: string;
  unloadingStartedBy?: string;

  unloadingFinishedAt?: string;
  unloadingFinishedBy?: string;
}
