export interface StorageSelection {
  id: string
  tegRoad: string
  tegRoadTombador: string
  tegRailwayMoega01: string
  tegRailwayMoega02: string
  teagRoad: string
  teagRailway: string
  updatedBy?: string // Nome do usuário que atualizou
  updatedByDepartment?: "cco" | "balanca" | "supervisor" // Departamento de quem atualizou
  updatedAt: Date
}
