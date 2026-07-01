export type SpoutTrack = {
    id: string;
    spoutNumber: string;
    destination: 'TEG' | 'TEAG';
    cell: string;
    belt?: string;
    unloadingPoint?: string; // Novo campo para o local de descarga
    product: string;
    operator: string;
    startTimestamp: string;
    endTimestamp: string;
    observations: string;
    isOccurrence?: boolean; 
  };