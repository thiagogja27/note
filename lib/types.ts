export type PTTState = 'idle' | 'connected' | 'talking';

export type Role = 'operador' | 'classificacao';

export enum PTTEventType {
  Start = 'ptt_start',
  End = 'ptt_end',
}

export interface PTTEvent {
  type: 'presence_update' | 'ptt_start' | 'ptt_end' | 'welcome';
  activeRoles?: Role[];
  role?: Role;
  clientCount?: number;
  clientId?: string;
}
