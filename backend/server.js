import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

// Valid Car IDs from VehicleManager
const VALID_CARS = ['lamborghini_svj', 'ferrari_488', 'bugatti_hypercar'];

// State: roomCode -> { players: Map<playerId, { ws, username, selectedCar }> }
const rooms = new Map();

function generatePlayerId() {
  return Math.random().toString(36).substring(2, 10);
}

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastRoomState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const playersList = [];
  room.players.forEach((player, playerId) => {
    playersList.push({
      playerId,
      username: player.username,
      selectedCar: player.selectedCar,
      paintId: player.paintId,
      ready: player.ready
    });
  });

  const message = JSON.stringify({
    type: 'ROOM_STATE',
    roomCode,
    selectedTrack: room.selectedTrack,
    players: playersList
  });

  room.players.forEach((player) => {
    if (player.ws.readyState === 1 /* OPEN */) {
      player.ws.send(message);
    }
  });
}

function handleCreateRoom(ws, data) {
  const username = data.username?.trim();
  if (!username) {
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid username' }));
    return;
  }

  // Generate unique room code
  let roomCode;
  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));

  const playerId = generatePlayerId();

  const selectedCar = (data.selectedCar && VALID_CARS.includes(data.selectedCar)) ? data.selectedCar : 'lamborghini_svj';

  const VALID_TRACKS = ['forest', 'neon', 'city', 'desert', 'forest_crest', 'city_neon', 'desert_apex'];
  const selectedTrack = (data.selectedTrack && VALID_TRACKS.includes(data.selectedTrack)) ? data.selectedTrack : 'forest';

  const paintId = (typeof data.paintId === 'string' && data.paintId.length < 32) ? data.paintId : 'giallo_yellow';

  const newRoom = {
    selectedTrack: selectedTrack,
    isStarting: false,
    startAt: null,
    winnerPlayerId: null,
    winnerUsername: null,
    players: new Map()
  };
  
  newRoom.players.set(playerId, { 
    ws, username, roomCode, selectedCar, paintId, ready: false,
    completedLaps: 0, finished: false, finishTime: null,
    rematchRequested: false
  });
  rooms.set(roomCode, newRoom);

  // Attach state to ws for disconnect handling
  ws.playerId = playerId;
  ws.roomCode = roomCode;

  ws.send(JSON.stringify({
    type: 'ROOM_CREATED',
    roomCode,
    playerId,
    username
  }));

  broadcastRoomState(roomCode);
  console.log(`[CREATE] Room ${roomCode} created by ${username} (${playerId})`);
}

function handleJoinRoom(ws, data) {
  const username = data.username?.trim();
  const roomCode = data.roomCode?.trim()?.toUpperCase();

  if (!username || !roomCode) {
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid join data' }));
    return;
  }

  const room = rooms.get(roomCode);
  if (!room) {
    ws.send(JSON.stringify({ type: 'ROOM_NOT_FOUND' }));
    return;
  }

  if (room.players.size >= 2) {
    ws.send(JSON.stringify({ type: 'ROOM_FULL' }));
    return;
  }

  const selectedCar = (data.selectedCar && VALID_CARS.includes(data.selectedCar)) ? data.selectedCar : 'lamborghini_svj';
  const paintId = (typeof data.paintId === 'string' && data.paintId.length < 32) ? data.paintId : 'giallo_yellow';
  const playerId = generatePlayerId();
  
  room.players.set(playerId, { 
    ws, username, roomCode, selectedCar, paintId, ready: false,
    completedLaps: 0, finished: false, finishTime: null,
    rematchRequested: false
  });
  
  ws.playerId = playerId;
  ws.roomCode = roomCode;

  ws.send(JSON.stringify({
    type: 'JOINED_ROOM',
    roomCode,
    playerId,
    username
  }));

  broadcastRoomState(roomCode);
  console.log(`[JOIN] Player ${username} (${playerId}) joined room ${roomCode}`);
}

function handleUpdateCar(ws, data) {
  if (!ws.roomCode || !ws.playerId) return;

  const carId = data.carId;
  if (!VALID_CARS.includes(carId)) {
    console.warn(`[WARN] Player ${ws.playerId} requested invalid car ID: ${carId}`);
    return;
  }

  const room = rooms.get(ws.roomCode);
  if (!room) return;

  const player = room.players.get(ws.playerId);
  if (player) {
    player.selectedCar = carId;
    if (typeof data.paintId === 'string' && data.paintId.length < 32) {
      player.paintId = data.paintId;
    }
    console.log(`[UPDATE_CAR] Player ${ws.playerId} changed car to ${carId}, paint ${player.paintId}`);
    broadcastRoomState(ws.roomCode);
  }
}

function handleSetReady(ws, data) {
  if (!ws.roomCode || !ws.playerId) return;

  const readyState = !!data.ready;

  const room = rooms.get(ws.roomCode);
  if (!room) return;

  const player = room.players.get(ws.playerId);
  if (player) {
    player.ready = readyState;
    console.log(`[SET_READY] Player ${ws.playerId} ready state changed to ${readyState}`);
    broadcastRoomState(ws.roomCode);
  }
}

function handlePlayerTransform(ws, data) {
  if (!ws.roomCode || !ws.playerId || !data.transform) return;

  const room = rooms.get(ws.roomCode);
  if (!room) return;

  const player = room.players.get(ws.playerId);
  if (player) {
    // We don't need to explicitly store it on the server if we just relay it,
    // but storing it can be useful for late joiners or sanity checks.
    player.transform = {
      x: typeof data.transform.x === 'number' ? data.transform.x : 0,
      y: typeof data.transform.y === 'number' ? data.transform.y : 0,
      z: typeof data.transform.z === 'number' ? data.transform.z : 0,
      heading: typeof data.transform.heading === 'number' ? data.transform.heading : 0
    };

    // Broadcast transform to other players in the room
    const message = JSON.stringify({
      type: 'PLAYER_TRANSFORM',
      playerId: ws.playerId,
      transform: player.transform
    });

    room.players.forEach((otherPlayer, otherPlayerId) => {
      if (otherPlayerId !== ws.playerId && otherPlayer.ws.readyState === 1) {
        otherPlayer.ws.send(message);
      }
    });
  }
}

function handleStartRace(ws, data) {
  if (!ws.roomCode || !ws.playerId) return;

  const room = rooms.get(ws.roomCode);
  if (!room) return;

  // Validate exactly 2 players
  if (room.players.size !== 2) return;

  // Validate both are ready
  let allReady = true;
  room.players.forEach((p) => {
    if (!p.ready) allReady = false;
  });

  if (!allReady) return;

  // Validate not already starting
  if (room.isStarting) return;

  room.isStarting = true;
  // 3.8s countdown (approximate 3-second UI countdown to GO)
  room.startAt = Date.now() + 3800; 
  room.winnerPlayerId = null;
  room.winnerUsername = null;

  // Reset progress for both players
  room.players.forEach(p => {
    p.completedLaps = 0;
    p.finished = false;
    p.finishTime = null;
  });

  console.log(`[START_RACE] Room ${ws.roomCode} is starting. startAt: ${room.startAt}`);

  const message = JSON.stringify({
    type: 'RACE_STARTING',
    startAt: room.startAt
  });

  room.players.forEach((player) => {
    if (player.ws.readyState === 1) {
      player.ws.send(message);
    }
  });
}

function broadcastRaceProgress(room, playerId) {
  const player = room.players.get(playerId);
  if (!player) return;

  const message = JSON.stringify({
    type: 'RACE_PROGRESS',
    playerId: playerId,
    progressState: {
      lap: player.completedLaps,
      finished: player.finished,
      finishTime: player.finishTime
    }
  });

  room.players.forEach((otherPlayer, otherPlayerId) => {
    if (otherPlayer.ws.readyState === 1) {
      otherPlayer.ws.send(message);
    }
  });
}

function handleUpdateLap(ws, data) {
  if (!ws.roomCode || !ws.playerId) return;
  const room = rooms.get(ws.roomCode);
  if (!room) return;

  const player = room.players.get(ws.playerId);
  if (!player || player.finished) return;

  const newLap = parseInt(data.lap, 10);
  if (isNaN(newLap) || newLap <= player.completedLaps || newLap > 3) return;

  player.completedLaps = newLap;
  console.log(`[UPDATE_LAP] Player ${ws.playerId} reached lap ${newLap}`);
  broadcastRaceProgress(room, ws.playerId);
}

function handlePlayerFinished(ws) {
  if (!ws.roomCode || !ws.playerId) return;
  const room = rooms.get(ws.roomCode);
  if (!room) return;

  const player = room.players.get(ws.playerId);
  if (!player || player.finished) return;

  player.finished = true;
  player.finishTime = Date.now();
  console.log(`[PLAYER_FINISHED] Player ${ws.playerId} finished the race.`);
  broadcastRaceProgress(room, ws.playerId);

  // Check if first to finish
  if (!room.winnerPlayerId) {
    room.winnerPlayerId = ws.playerId;
    room.winnerUsername = player.username;
    
    console.log(`[WINNER_DECLARED] ${player.username} won the race in room ${ws.roomCode}`);
    
    const winnerMsg = JSON.stringify({
      type: 'RACE_WINNER_DECLARED',
      winnerUsername: room.winnerUsername,
      winnerPlayerId: room.winnerPlayerId
    });

    room.players.forEach(p => {
      if (p.ws.readyState === 1) p.ws.send(winnerMsg);
    });
  }

  // Check if all players are finished
  let allFinished = true;
  const finalResults = [];
  
  room.players.forEach(p => {
    if (!p.finished) allFinished = false;
    finalResults.push({
      playerId: p.ws.playerId, // Wait, `p` doesn't have `playerId` except inside `ws` or the map key. But let's look at `room.players.set(playerId, ...)` It doesn't store playerId in the object, only as the key. Wait, the loop gives `(p, pId)`.
      // Actually `room.players.forEach((p, pId) => { ... })`.
      username: p.username,
      finishTime: p.finishTime,
      isWinner: false
    });
  });
  
  // Correction: using a clean loop to build final results
  if (allFinished && room.players.size > 0) {
    const results = [];
    room.players.forEach((p, pId) => {
      results.push({
        playerId: pId,
        username: p.username,
        finishTime: p.finishTime,
        isWinner: pId === room.winnerPlayerId
      });
    });
    
    // Sort by finish time (fastest first)
    results.sort((a, b) => a.finishTime - b.finishTime);
    
    console.log(`[FINAL_RESULT] Both players finished in room ${ws.roomCode}`);
    
    const finalMsg = JSON.stringify({
      type: 'FINAL_RACE_RESULT',
      results: results
    });
    
    room.players.forEach(p => {
      if (p.ws.readyState === 1) p.ws.send(finalMsg);
    });
  }
}

function handleRequestRematch(ws) {
  if (!ws.roomCode || !ws.playerId) return;
  const room = rooms.get(ws.roomCode);
  if (!room) return;
  
  const player = room.players.get(ws.playerId);
  if (!player) return;

  player.rematchRequested = true;
  console.log(`[REMATCH] Player ${ws.playerId} requested a rematch.`);

  let bothRequested = true;
  room.players.forEach(p => {
    if (!p.rematchRequested) bothRequested = false;
  });

  if (bothRequested && room.players.size === 2) {
    console.log(`[REMATCH_CONFIRMED] Both players requested rematch in room ${ws.roomCode}`);
    room.isStarting = false;
    room.startAt = null;
    room.winnerPlayerId = null;
    room.winnerUsername = null;

    room.players.forEach(p => {
      p.ready = false;
      p.completedLaps = 0;
      p.finished = false;
      p.finishTime = null;
      p.rematchRequested = false;
    });

    const statusMsg = JSON.stringify({ type: 'REMATCH_STATUS', allConfirmed: true });
    room.players.forEach(p => {
      if (p.ws.readyState === 1) p.ws.send(statusMsg);
    });

    // The lobby depends on ROOM_STATE to reset the ready UI
    broadcastRoomState(ws.roomCode);
  } else {
    const statusMsg = JSON.stringify({
      type: 'REMATCH_STATUS',
      allConfirmed: false,
      requesterId: ws.playerId,
      requesterUsername: player.username
    });
    room.players.forEach(p => {
      if (p.ws.readyState === 1) p.ws.send(statusMsg);
    });
  }
}

function handleDisconnect(ws) {
  if (!ws.roomCode || !ws.playerId) return;
  
  const room = rooms.get(ws.roomCode);
  if (room) {
    const disconnectedPlayer = room.players.get(ws.playerId);
    const disconnectedUsername = disconnectedPlayer ? disconnectedPlayer.username : 'Unknown';
    
    room.players.delete(ws.playerId);
    console.log(`[DISCONNECT] Player ${ws.playerId} left room ${ws.roomCode}`);

    if (room.players.size === 0) {
      rooms.delete(ws.roomCode);
      console.log(`[CLEANUP] Room ${ws.roomCode} deleted (empty)`);
    } else {
      // Notify remaining player that someone disconnected
      const disconnectMsg = JSON.stringify({
        type: 'PLAYER_DISCONNECTED',
        disconnectedPlayerId: ws.playerId,
        disconnectedUsername: disconnectedUsername
      });
      room.players.forEach((player) => {
        if (player.ws.readyState === 1) {
          player.ws.send(disconnectMsg);
        }
      });

      // If room was starting/racing, abort the race ONLY if still in countdown
      if (room.isStarting && room.startAt && Date.now() < room.startAt) {
        room.isStarting = false;
        room.startAt = null;
        room.players.forEach(p => { p.ready = false; }); // Reset ready state
        console.log(`[ABORT_RACE] Room ${ws.roomCode} start aborted due to disconnect.`);
        
        const abortMsg = JSON.stringify({ type: 'ABORT_RACE' });
        room.players.forEach((player) => {
          if (player.ws.readyState === 1) {
            player.ws.send(abortMsg);
          }
        });
      }
      
      // Clear rematch state if the remaining player was waiting
      room.players.forEach(p => {
        p.rematchRequested = false;
      });

      broadcastRoomState(ws.roomCode);
    }
  }

  // Clear references
  ws.roomCode = null;
  ws.playerId = null;
}

wss.on('connection', (ws) => {
  console.log('[CONNECT] New client connected');

  ws.on('message', (messageAsString) => {
    try {
      const data = JSON.parse(messageAsString);

      switch (data.type) {
        case 'CREATE_ROOM':
          handleCreateRoom(ws, data);
          break;
        case 'JOIN_ROOM':
          handleJoinRoom(ws, data);
          break;
        case 'UPDATE_CAR':
          handleUpdateCar(ws, data);
          break;
        case 'SET_READY':
          handleSetReady(ws, data);
          break;
        case 'START_RACE':
          handleStartRace(ws, data);
          break;
        case 'UPDATE_LAP':
          handleUpdateLap(ws, data);
          break;
        case 'PLAYER_FINISHED':
          handlePlayerFinished(ws);
          break;
        case 'PLAYER_TRANSFORM':
          handlePlayerTransform(ws, data);
          break;
        case 'REQUEST_REMATCH':
          handleRequestRematch(ws);
          break;
        default:
          console.warn('[WARN] Unknown message type:', data.type);
      }
    } catch (err) {
      console.error('[ERROR] Failed to parse message', err);
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });
});

console.log(`🚀 Apex Velocity Multiplayer Server running on port ${PORT}`);
