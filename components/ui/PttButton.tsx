
"use client";

import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

type PttButtonProps = {
  status: 'idle' | 'connecting' | 'connected' | 'transmitting' | 'receiving' | 'error';
  startTransmitting: () => void;
  stopTransmitting: () => void;
  className?: string;
};

export function PttButton({ status, startTransmitting, stopTransmitting, className }: PttButtonProps) {

  const handleMouseDown = () => {
    if (status === 'connected' || status === 'idle' || status === 'receiving') {
      startTransmitting();
    }
  };

  const handleMouseUp = () => {
    if (status === 'transmitting') {
      stopTransmitting();
    }
  };

  const getButtonColor = () => {
    switch (status) {
      case 'transmitting':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'receiving':
        return 'bg-blue-500 text-white';
      case 'connected':
        return 'bg-gray-700 hover:bg-gray-800 text-white';
      case 'connecting':
        return 'bg-yellow-500 text-white animate-pulse';
      case 'error':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'transmitting':
        return 'Transmitindo...';
      case 'receiving':
        return 'Recebendo...';
      case 'connected':
        return 'Segure para falar';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return 'Erro de Conexão';
      default:
        return 'Pressione para falar';
    }
  };

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown} // For mobile
      onTouchEnd={handleMouseUp}     // For mobile
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        getButtonColor(),
        className
      )}
    >
      <Mic className="h-5 w-5" />
      {getButtonText()}
    </button>
  );
}
