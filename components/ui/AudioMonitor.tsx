
"use client";

import React from 'react';

type AudioMonitorProps = {
  title: string;
  volume: number; // A value between 0 and 1
  isActive: boolean; // To control the visual feedback
};

const AudioVisualizer = ({ volume, isActive }: { volume: number; isActive: boolean }) => {
    const normalizedVolume = Math.min(1, Math.max(0, volume));

    // Create 20 bars for a more detailed visualizer
    const barCount = 20;
    const heights = Array.from({ length: barCount }, (_, i) => {
        const segment = 1 / barCount;
        const barVolume = Math.max(0.05, normalizedVolume);
        if (i * segment < barVolume) {
            // Add some randomness to make it look more dynamic
            return Math.max(0.1, Math.random() * barVolume);
        }
        return 0.05; // Minimum height for inactive bars
    });

    return (
        <div className="flex items-center justify-center h-full w-full gap-px px-2">
            {heights.map((height, index) => (
                <div 
                    key={index}
                    className="w-full rounded-full transition-all duration-100"
                    style={{ 
                        height: `${height * 90}%`,
                        backgroundColor: isActive ? '#4ade80' : '#4b5563', // green-400 or gray-600
                        opacity: isActive ? 1 : 0.4,
                    }}
                />
            ))}
        </div>
    );
};

export const AudioMonitor = ({ title, volume, isActive }: AudioMonitorProps) => {
  return (
    <div className="flex flex-col bg-gray-800/80 rounded-lg p-2 w-36 h-20 border border-gray-700/50 shadow-md">
      <p className="text-xs text-center text-gray-400 mb-1">{title}</p>
      <div className="flex-1 bg-black/30 rounded-md overflow-hidden">
        <AudioVisualizer volume={volume} isActive={isActive} />
      </div>
    </div>
  );
};
