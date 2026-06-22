export type SpoutTrack = {
    id: string;
    spoutNumber: string;
    destination: 'TEG' | 'TEAG';
    cell: string;
    product: string;
    operator: string;
    startTimestamp: string;
    endTimestamp: string;
    observations: string;
    isOccurrence?: boolean; // Campo para marcar ocorrências
  };