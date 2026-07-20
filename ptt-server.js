const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

const clients = new Map(); // Stores WebSocket connection -> role

console.log(`[PTT Server] Simple WebSocket server started on port ${PORT}`);

function broadcast(message, sender) {
  wss.clients.forEach(client => {
    // If a sender is specified, broadcast to all clients except the sender
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastPresence() {
  const activeRoles = Array.from(new Set(Array.from(clients.values())));
  const presenceMessage = JSON.stringify({
    type: 'presence_update',
    activeRoles,
    clientCount: wss.clients.size
  });
  // Broadcast presence to ALL clients
   wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(presenceMessage);
    }
  });
  console.log(`[PTT Server] Presence updated: ${activeRoles.join(', ') || 'none'} active. Total clients: ${wss.clients.size}`);
}

wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substring(2, 9);
  console.log(`[PTT Server] Client ${clientId} connected.`);
  
  ws.send(JSON.stringify({ type: 'welcome', clientId }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const senderRole = clients.get(ws);

      if (!senderRole && data.type !== 'register') {
          console.warn(`[PTT Server] Message from unregistered client ${clientId}. Ignoring.`);
          return;
      }

      switch(data.type) {
        case 'register':
          clients.set(ws, data.role);
          console.log(`[PTT Server] Client ${clientId} registered as role: ${data.role}`);
          broadcastPresence();
          break;
        
        case 'ptt_start':
          console.log(`[PTT Server] Role '${senderRole}' started talking.`);
          // Optional: broadcast a ptt_start event if UIs need to react instantly
          // broadcast(JSON.stringify({ type: 'talk_start', role: senderRole }), ws);
          break;
        
        case 'ptt_end':
          console.log(`[PTT Server] Role '${senderRole}' stopped talking.`);
          // Notify other clients that this user has stopped talking
          broadcast(JSON.stringify({ type: 'talk_end', role: senderRole }), ws);
          break;

        case 'audio_chunk':
          // Re-package and broadcast to other clients with sender's role
          const remoteAudio = {
            type: 'remote_audio',
            role: senderRole,
            payload: data.payload // The base64 audio string
          };
          broadcast(JSON.stringify(remoteAudio), ws);
          break;
        
        case 'volume_update':
          const remoteVolume = {
            type: 'remote_volume_update',
            role: senderRole,
            volume: data.volume
          };
          broadcast(JSON.stringify(remoteVolume), ws);
          break;
      }

    } catch (e) {
      console.error("[PTT Server] Error processing message:", e);
    }
  });

  ws.on('close', () => {
    const role = clients.get(ws);
    if (role) {
        console.log(`[PTT Server] Client ${clientId} (Role: ${role}) disconnected.`);
        clients.delete(ws);
        // Notify others that the user might have disconnected while talking
        broadcast(JSON.stringify({ type: 'talk_end', role: role }));
        broadcastPresence();
    }
  });

  ws.on('error', (error) => {
    console.error(`[PTT Server] Error from client ${clientId}:`, error);
  });
});
