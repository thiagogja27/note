
"use client";

import { useState, useEffect } from 'react';

interface ElapsedTimeProps {
  startDate: string;
}

const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

export function ElapsedTime({ startDate }: ElapsedTimeProps) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const start = new Date(startDate).getTime();
    const intervalId = setInterval(() => {
      const now = Date.now();
      const duration = now - start;
      setElapsed(formatDuration(duration));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startDate]);

  return <span className="font-mono text-lg font-semibold">{elapsed}</span>;
}

export function calculateTotalDuration(startDate?: string, endDate?: string): string {
    if (!startDate || !endDate) {
        return '00:00:00';
    }
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const duration = end - start;
    return formatDuration(duration);
}
