import * as XLSX from 'xlsx';
import type { StorageLog } from "@/types/storage";
import type { SpoutTrack } from "@/types/spout-track";

/**
 * Define a estrutura dos dados a serem exportados, onde cada chave é um cabeçalho de coluna.
 */
type ExcelExportData = {
  [key: string]: string | number | boolean | null | undefined;
};

/**
 * Função auxiliar para criar e fazer o download de um ficheiro Excel.
 * @param data Os dados a serem escritos no ficheiro.
 * @param fileName O nome do ficheiro a ser gerado.
 */
function downloadExcel(data: ExcelExportData[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Exporta um array de logs de estocagem para um ficheiro Excel.
 * @param logs Os dados do histórico de estocagem.
 * @param fileName O nome do ficheiro a ser gerado (sem a extensão .xlsx).
 */
export function exportStorageLogsToExcel(logs: StorageLog[], fileName: string): void {
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
    'TEAG Rod. Tombador 05': log.changes.teagRoadTombador05 || '--',
    'TEAG Ferr. Moega 03': log.changes.teagRailwayMoega03 || '--',
    'TEAG Ferr. Moega 04': log.changes.teagRailwayMoega04 || '--',
    'TEAG Ferr. Moega 05': log.changes.teagRailwayMoega05 || '--',
    'Op. TEG M.01': log.changes.tegRailwayMoega01Operation === 'descarga-vagao' ? 'Desc. Vagão' : log.changes.tegRailwayMoega01Operation === 'descarga-caminhao' ? 'Desc. Caminhão' : '--',
    'Op. TEG M.02': log.changes.tegRailwayMoega02Operation === 'descarga-vagao' ? 'Desc. Vagão' : log.changes.tegRailwayMoega02Operation === 'descarga-caminhao' ? 'Desc. Caminhão' : '--',
    'Op. TEAG M.03': log.changes.teagRailwayMoega03Operation === 'descarga-vagao' ? 'Desc. Vagão' : log.changes.teagRailwayMoega03Operation === 'descarga-caminhao' ? 'Desc. Caminhão' : '--',
    'Op. TEAG M.04': log.changes.teagRailwayMoega04Operation === 'descarga-vagao' ? 'Desc. Vagão' : log.changes.teagRailwayMoega04Operation === 'descarga-caminhao' ? 'Desc. Caminhão' : '--',
    'Op. TEAG M.05': log.changes.teagRailwayMoega05Operation === 'descarga-vagao' ? 'Desc. Vagão' : log.changes.teagRailwayMoega05Operation === 'descarga-caminhao' ? 'Desc. Caminhão' : '--',
  }));
  downloadExcel(dataToExport, fileName);
}

/**
 * Calcula a duração entre duas datas e a formata como "Xh Ym".
 */
const formatDuration = (start: string, end: string): string => {
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    if (durationMs < 0) return "0m";
    const totalMinutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  

/**
 * Exporta um array de registros de bicas para um ficheiro Excel.
 * @param tracks Os dados do histórico de bicas.
 * @param fileName O nome do ficheiro a ser gerado (sem a extensão .xlsx).
 */
export function exportSpoutTracksToExcel(tracks: SpoutTrack[], fileName: string): void {
  const dataToExport: ExcelExportData[] = tracks.map(track => ({
    'Ocorrência': track.isOccurrence ? 'Sim' : 'Não',
    'Bica(s)': track.spoutNumber,
    'Produto': track.product,
    'Destino': track.destination,
    'Célula': track.cell,
    'Início': new Date(track.startTimestamp).toLocaleString('pt-BR'),
    'Fim': new Date(track.endTimestamp).toLocaleString('pt-BR'),
    'Duração': formatDuration(track.startTimestamp, track.endTimestamp),
    'Observações': track.observations || '--',
    'Operador': track.operator,
  }));
  downloadExcel(dataToExport, fileName);
}
