"use client"

import * as XLSX from 'xlsx';
import type { StorageLog } from '@/types/storage';

// Define um tipo para os dados que serão exportados para tornar o código mais legível
type ExcelExportData = {
    'Data/Hora': string;
    'Usuário': string;
    'Departamento': string;
    'TEG Rod. 01-06': string;
    'TEG Rod. 07': string;
    'TEG Ferr. Moega 01': string;
    'TEG Ferr. Moega 02': string;
    'TEAG Rodovia': string;
    'TEAG Ferrovia': string;
};

/**
 * Exporta um array de logs de estocagem para um ficheiro Excel.
 * @param logs Os dados do histórico de estocagem.
 * @param fileName O nome do ficheiro a ser gerado (sem a extensão .xlsx).
 */
export function exportStorageLogsToExcel(logs: StorageLog[], fileName: string): void {
  // 1. Mapeia os dados dos logs para o formato de exportação, que servirá como as linhas da tabela
  const dataToExport: ExcelExportData[] = logs.map(log => ({
    'Data/Hora': new Date(log.timestamp).toLocaleString('pt-BR'),
    'Usuário': log.changedBy,
    'Departamento': log.department,
    'TEG Rod. 01-06': log.changes.tegRoad || '--',
    'TEG Rod. 07': log.changes.tegRoadTombador || '--',
    'TEG Ferr. Moega 01': log.changes.tegRailwayMoega01 || '--',
    'TEG Ferr. Moega 02': log.changes.tegRailwayMoega02 || '--',
    'TEAG Rodovia': log.changes.teagRoad || '--',
    'TEAG Ferrovia': log.changes.teagRailway || '--',
  }));

  // 2. Cria uma nova folha de cálculo (worksheet) a partir dos dados mapeados
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);

  // 3. (Opcional) Ajusta a largura das colunas para melhor visualização
  const columnWidths = [
    { wch: 20 }, // Data/Hora
    { wch: 15 }, // Usuário
    { wch: 15 }, // Departamento
    { wch: 20 }, // TEG Rod. 01-06
    { wch: 20 }, // TEG Rod. 07
    { wch: 20 }, // TEG Ferr. Moega 01
    { wch: 20 }, // TEG Ferr. Moega 02
    { wch: 20 }, // TEAG Rodovia
    { wch: 20 }, // TEAG Ferrovia
  ];
  worksheet['!cols'] = columnWidths;

  // 4. Cria um novo livro (workbook) e adiciona a nossa folha de cálculo a ele
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico de Estocagem');

  // 5. Gera o ficheiro Excel e aciona o download no navegador do utilizador
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
