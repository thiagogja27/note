"use client";

import { useState, useEffect } from 'react';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const formattedDate = time.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = time.toLocaleTimeString('pt-BR');

  return (
    <div className="text-sm text-muted-foreground text-right">
      <div className="font-semibold text-lg">{formattedTime}</div>
      <div>{formattedDate}</div>
    </div>
  );
}
