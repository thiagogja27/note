
import { formatDistanceToNow as formatDistance, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDistanceToNow(date: Date): string {
  return formatDistance(date, { addSuffix: true, locale: ptBR });
}

// Re-exportando a função format para que ela possa ser usada em outros lugares
export { format };
