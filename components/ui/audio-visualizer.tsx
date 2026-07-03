'use client';

import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  label: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!stream || !canvas) {
        const context = canvas?.getContext('2d');
        if(context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'rgb(39 39 42)'; // zinc-800
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        return;
    };

    const context = canvas.getContext('2d');
    if (!context) return;

    let isCancelled = false;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    const draw = () => {
      if (isCancelled) return;

      animationFrameId.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      context.fillStyle = 'rgb(24 24 27)'; // zinc-900
      context.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2.5;
        context.fillStyle = '#22c55e'; // green-500
        context.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      isCancelled = true;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if(source) source.disconnect();
      if(audioContext.state !== 'closed') {
        audioContext.close().catch(console.error);
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col items-center gap-2 p-2 border border-zinc-700 rounded-lg bg-zinc-900">
        <p className="text-xs text-zinc-400">{label}</p>
        <canvas ref={canvasRef} width="150" height="40" />
    </div>
  );
};

export default AudioVisualizer;