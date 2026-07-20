
"use client";

import { useState, useEffect, useRef } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WSS_URL || 'ws://localhost:8080';

const usePtt = (userId: string, channel: string, remoteAudioRef: React.RefObject<HTMLAudioElement>) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'talking' | 'receiving' | 'error'>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const connect = async () => {
      setStatus('connecting');
      console.log('[PTT Client] Attempting to connect to:', WS_URL);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setLocalStream(stream);

        socketRef.current = new WebSocket(WS_URL);

        socketRef.current.onopen = () => {
          console.log('[PTT Client] WebSocket connected');
          socketRef.current?.send(JSON.stringify({ type: 'join', userId, channel }));
          initializePeerConnection(stream);
          setStatus('connected');
        };

        socketRef.current.onmessage = async (message) => {
          const data = JSON.parse(message.data);
          console.log("[PTT Client] Received message:", data);

          switch (data.type) {
            case 'offer':
              if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnectionRef.current.createAnswer();
                await peerConnectionRef.current.setLocalDescription(answer);
                socketRef.current?.send(JSON.stringify({ type: 'answer', answer, to: data.from }));
              }
              break;
            case 'answer':
              if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
              }
              break;
            case 'candidate':
              if (peerConnectionRef.current) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
              }
              break;
          }
        };

        socketRef.current.onerror = (err) => {
          console.error('[PTT Client] WebSocket error:', err);
          setStatus('error');
        };

        socketRef.current.onclose = () => {
          console.log('[PTT Client] WebSocket disconnected');
          setStatus('idle');
        };

      } catch (err) {
        console.error('[PTT Client] Error initializing PTT:', err);
        setStatus('error');
      }
    };

    connect();

    return () => {
      socketRef.current?.close();
      peerConnectionRef.current?.close();
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, [userId, channel]);

  const initializePeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.send(JSON.stringify({ type: 'candidate', candidate: event.candidate, to: 'all' })); // Simplified: send to all in channel
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      }
    };

    peerConnectionRef.current = pc;
  };

  const startTransmitting = async () => {
    if (status !== 'connected') return;
    setStatus('talking');
    // In a real PTT system, you might send a signal or handle audio tracks differently
    // For this implementation, the stream is already being sent.
    // We just update the state.
  };

  const stopTransmitting = () => {
    if (status !== 'talking') return;
    setStatus('connected');
    // Similar to start, we just manage state here.
  };

  return { status, startTransmitting, stopTransmitting, localStream, remoteStream };
};

export default usePtt;
