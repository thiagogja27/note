
import { useState, useEffect, useRef, useCallback } from 'react';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { pttBip } from './sounds';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

type PttStatus = 'idle' | 'initializing' | 'connecting' | 'connected' | 'transmitting' | 'receiving' | 'error' | 'no_mic_permission';
type SignalingMessage = {
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: any;
  sender: string;
};

export function usePtt(userId: string, targetId: string) {
  const [status, setStatus] = useState<PttStatus>('idle');
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudio = useRef<HTMLAudioElement | null>(null);
  const bipSound = useRef<HTMLAudioElement | null>(null);

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // --- Robust Audio Handling --- //
  useEffect(() => {
    try {
      bipSound.current = new Audio(pttBip);
      bipSound.current.load();
    } catch (e) {
      console.error("Failed to create or load bip sound:", e);
    }
    remoteAudio.current = new Audio();
    remoteAudio.current.autoplay = true;

    return () => {
        if (bipSound.current) {
            bipSound.current.pause();
            bipSound.current.src = '';
        }
        if (remoteAudio.current) {
            remoteAudio.current.pause();
            remoteAudio.current.srcObject = null;
        }
    }
  }, []);

  const setupSignaling = useCallback(() => {
    const db = getDatabase();
    const channelId = [userId, targetId].sort().join('-');
    const targetSignalingRef = ref(db, `ptt/channels/${channelId}/signaling/${targetId}`);
    const targetUserTxRef = ref(db, `ptt/users/${targetId}/transmitting`);

    const unsubscribeTarget = onValue(targetSignalingRef, handleSignalingMessage);
    const unsubscribeTargetTx = onValue(targetUserTxRef, (snapshot) => {
      const isTargetTransmitting = !!snapshot.val();
      setStatus(currentStatus => {
        if (isTargetTransmitting) {
          if (currentStatus !== 'transmitting' && currentStatus !== 'receiving') {
            bipSound.current?.play().catch(e => console.error("Bip play error:", e));
          }
          return currentStatus !== 'transmitting' ? 'receiving' : currentStatus;
        } else {
          return currentStatus === 'receiving' ? 'connected' : currentStatus;
        }
      });
    });
    return () => {
        unsubscribeTarget();
        unsubscribeTargetTx();
    }
  }, [userId, targetId]);


  const setupPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(configuration);

    localStream.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStream.current!);
    });

    pc.onicecandidate = event => {
      if (event.candidate) {
        const db = getDatabase();
        const channelId = [userId, targetId].sort().join('-');
        const signalingRef = ref(db, `ptt/channels/${channelId}/signaling/${userId}`);
        set(signalingRef, { type: 'ice-candidate', payload: event.candidate.toJSON(), sender: userId });
      }
    };

    pc.ontrack = event => {
      if (remoteAudio.current && event.streams && event.streams[0]) {
        remoteAudio.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      const pcState = pc?.connectionState;
      if (pcState === 'connected') {
        setStatus(currentStatus => currentStatus === 'connecting' ? 'connected' : currentStatus);
      } else if (pcState === 'failed' || pcState === 'disconnected') {
        setStatus('error');
      } else if (pcState === 'connecting') {
        setStatus('connecting');
      }
    };
    peerConnection.current = pc;
  }, [userId, targetId]);
  
  const handleSignalingMessage = async (snapshot: any) => {
    const message: SignalingMessage = snapshot.val();
    if (!message || message.sender === userId) return;

    const pc = peerConnection.current;
    if (!pc) return;
    
    try {
      if (message.type === 'offer') {
        if (pc.signalingState !== 'stable') return; 
        await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const db = getDatabase();
        const channelId = [userId, targetId].sort().join('-');
        const signalingRef = ref(db, `ptt/channels/${channelId}/signaling/${userId}`);
        set(signalingRef, { type: 'answer', payload: answer, sender: userId });
      } else if (message.type === 'answer') {
        if (pc.signalingState !== 'have-local-offer') return;
        await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
      } else if (message.type === 'ice-candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(message.payload));
      }
    } catch (error) {
      console.error("Error handling signaling message:", error);
      setStatus('error');
    }
  };

  const initializeMedia = async () => {
    if (localStream.current) return true;
    try {
      setStatus('initializing');
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current.getTracks().forEach(track => track.enabled = false);
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatus('no_mic_permission');
        console.error("Microphone permission was denied.");
      } else {
        setStatus('error');
        console.error("Error accessing microphone:", err);
      }
      return false;
    }
  }

  useEffect(() => {
    const db = getDatabase();
    const userStatusRef = ref(db, `ptt/users/${userId}`);
    const userTxRef = ref(db, `ptt/users/${userId}/transmitting`);
    const connectedRef = ref(db, '.info/connected');

    const unsubscribePresence = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(userStatusRef, { online: true, timestamp: serverTimestamp() });
        onDisconnect(userStatusRef).set({ online: false, timestamp: serverTimestamp() });
        onDisconnect(userTxRef).set(false);
      }
    });
    
    const cleanupSignaling = setupSignaling();

    return () => {
      cleanupSignaling();
      unsubscribePresence?.();
      onDisconnect(userStatusRef).cancel();
      onDisconnect(userTxRef).cancel();
      peerConnection.current?.close();
      localStream.current?.getTracks().forEach(track => track.stop());
    };
  }, [userId, targetId, setupSignaling]);


  const connect = async () => {
    if (!peerConnection.current) return;
    if (peerConnection.current.signalingState !== 'stable') return;
    setStatus('connecting');
    try {
        const db = getDatabase();
        const channelId = [userId, targetId].sort().join('-');
        const signalingRef = ref(db, `ptt/channels/${channelId}/signaling/${userId}`);
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        set(signalingRef, { type: 'offer', payload: offer, sender: userId });
    } catch(err) {
        console.error("Error creating offer:", err);
        setStatus('error');
    }
  }

  const startTransmitting = async () => {
    if (!['connected', 'receiving', 'idle', 'no_mic_permission'].includes(statusRef.current)) return;

    if (!localStream.current) {
      const hasMic = await initializeMedia();
      if (!hasMic) return;
    }

    if (!peerConnection.current) {
      setupPeerConnection();
    }
    
    if (peerConnection.current?.connectionState !== 'connected') {
        connect();
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.enabled = true);
      const db = getDatabase();
      const userTxRef = ref(db, `ptt/users/${userId}/transmitting`);
      set(userTxRef, true);
      setStatus('transmitting');
      bipSound.current?.play().catch(e => console.error("Bip play error:", e));
    }
  };

  const stopTransmitting = () => {
    if (statusRef.current !== 'transmitting') return;

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.enabled = false);
      const db = getDatabase();
      const userTxRef = ref(db, `ptt/users/${userId}/transmitting`);
      set(userTxRef, false);
      setStatus('connected');
    }
  };

  return { status, startTransmitting, stopTransmitting };
}
