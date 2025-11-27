import type { Department } from "./user";

export interface StorageSelection {
  id: string;
  tegRoad: string;
  tegRoadTombador: string;
  tegRailwayMoega01: string;
  tegRailwayMoega02: string;
  teagRoad: string;
  teagRailway: string;
  updatedBy?: string; 
  updatedByDepartment?: Department;
  updatedAt: Date;
}

/**
 * Representa um único registro no log de alterações de estocagem.
 */
export interface StorageLog {
  id: string;
  changedBy: string;       // Nome do usuário que fez a alteração
  department: Department;    // Departamento do usuário
  timestamp: Date;           // Data e hora da alteração
  changes: {               // Objeto com os valores que foram definidos
    tegRoad: string;
    tegRoadTombador: string;
    tegRailwayMoega01: string;
    tegRailwayMoega02: string;
    teagRoad: string;
    teagRailway: string;
  };
}
