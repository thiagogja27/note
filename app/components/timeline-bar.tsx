
"use client";

import { useMemo } from 'react';

interface TimelineBarProps {
  start: string | Date;
  end: string | Date;
  min: number; // min timestamp in the whole dataset
  max: number; // max timestamp in the whole dataset
}

// Função para formatar a duração de milissegundos para uma string legível (ex: 2h 15m)
const formatDuration = (ms: number) => {
  if (ms < 0) ms = 0;
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export function TimelineBar({ start, end, min, max }: TimelineBarProps) {
  const { durationText, offsetPercent, widthPercent } = useMemo(() => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    const durationMs = endTime - startTime;
    const durationTextValue = formatDuration(durationMs);

    const totalRange = max - min;
    if (totalRange <= 0 || !isFinite(startTime) || !isFinite(endTime)) {
      return { durationText: durationTextValue, offsetPercent: 0, widthPercent: 0 };
    }

    const offset = ((startTime - min) / totalRange) * 100;
    const width = (durationMs / totalRange) * 100;

    return {
      durationText: durationTextValue,
      offsetPercent: Math.max(0, offset),
      widthPercent: Math.min(100 - Math.max(0, offset), Math.max(0, width)),
    };
  }, [start, end, min, max]);

  return (
    <div className="w-full py-1 group relative">
      <div className="text-xs text-center mb-1 font-mono">{durationText}</div>
      <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-red-500 opacity-75 rounded-full"
          style={{
            left: `${offsetPercent}%`,
            width: `${widthPercent}%`,
          }}
        />
      </div>
    </div>
  );
}
