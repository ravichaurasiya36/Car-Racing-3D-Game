export class MultiplayerClient {
  constructor(serverUrl = 'ws://localhost:8080') {
    this.serverUrl = serverUrl;
    this.ws = null;
    
    // Callbacks provided by the UI
    this.onRoomCreated = null;
    this.onJoinedRoom = null;
    this.onRoomState = null;
    this.onPlayerTransform = null;
    this.onRaceStarting = null;
    this.onRaceAborted = null;
    this.onRaceProgress = null;
    this.onRaceWinner = null;
    this.onFinalRaceResult = null;
    this.onRematchStatus = null;
    this.onError = null;
    this.onDisconnected = null;
    this.onPlayerDisconnected = null;

    // Internal state
    this.isConnected = false;
    this.currentRoomCode = null;
    this.currentPlayerId = null;
    this.currentUsername = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log(`[NETWORK] Connected to Multiplayer Server at ${this.serverUrl}`);
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.error('[NETWORK] Failed to parse server message', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[NETWORK] WebSocket error:', error);
        if (!this.isConnected) {
          reject(new Error('Failed to connect to multiplayer server.'));
        }
        if (this.onError) {
          this.onError('CONNECTION_ERROR');
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.currentRoomCode = null;
        this.currentPlayerId = null;
        console.log('[NETWORK] Disconnected from server');
        if (this.onDisconnected) {
          this.onDisconnected();
        }
      };
    });
  }

  handleServerMessage(data) {
    switch (data.type) {
      case 'ROOM_CREATED':
        this.currentRoomCode = data.roomCode;
        this.currentPlayerId = data.playerId;
        if (this.onRoomCreated) this.onRoomCreated(data.roomCode);
        break;
      
      case 'JOINED_ROOM':
        this.currentRoomCode = data.roomCode;
        this.currentPlayerId = data.playerId;
        if (this.onJoinedRoom) this.onJoinedRoom(data.roomCode);
        break;
      
      case 'ROOM_STATE':
        if (this.onRoomState) this.onRoomState(data.players, data.selectedTrack);
        break;
      
      case 'PLAYER_TRANSFORM':
        if (this.onPlayerTransform) this.onPlayerTransform(data.playerId, data.transform);
        break;
      
      case 'RACE_STARTING':
        if (this.onRaceStarting) this.onRaceStarting(data.startAt);
        break;

      case 'ABORT_RACE':
        if (this.onRaceAborted) this.onRaceAborted();
        break;

      case 'RACE_PROGRESS':
        if (this.onRaceProgress) this.onRaceProgress(data.playerId, data.progressState);
        break;

      case 'PLAYER_FINISHED':
        if (this.onRaceProgress) this.onRaceProgress(data);
        break;

      case 'RACE_WINNER_DECLARED':
        if (this.onRaceWinner) this.onRaceWinner(data.winnerUsername);
        break;

      case 'FINAL_RACE_RESULT':
        if (this.onFinalRaceResult) this.onFinalRaceResult(data.results);
        break;

      case 'REMATCH_STATUS':
        if (this.onRematchStatus) this.onRematchStatus(data);
        break;

      case 'PLAYER_DISCONNECTED':
        if (this.onPlayerDisconnected) this.onPlayerDisconnected(data.disconnectedPlayerId, data.disconnectedUsername);
        break;

      case 'ROOM_NOT_FOUND':
        if (this.onError) this.onError('ROOM_NOT_FOUND');
        break;
      
      case 'ROOM_FULL':
        if (this.onError) this.onError('ROOM_FULL');
        break;
      
      case 'ERROR':
        if (this.onError) this.onError(data.message);
        break;
      
      default:
        console.warn('[NETWORK] Unknown message from server:', data.type);
    }
  }

  async createRoom(username, selectedCar = 'lamborghini_svj', selectedTrack = 'forest', paintId = 'giallo_yellow') {
    this.currentUsername = username;
    
    if (!this.isConnected) {
      await this.connect();
    }
    
    this.ws.send(JSON.stringify({
      type: 'CREATE_ROOM',
      username: username,
      selectedCar: selectedCar,
      selectedTrack: selectedTrack,
      paintId: paintId
    }));
  }

  async joinRoom(roomCode, username, selectedCar = 'lamborghini_svj', paintId = 'giallo_yellow') {
    this.currentUsername = username;

    if (!this.isConnected) {
      await this.connect();
    }
    
    this.ws.send(JSON.stringify({
      type: 'JOIN_ROOM',
      roomCode: roomCode,
      username: username,
      selectedCar: selectedCar,
      paintId: paintId
    }));
  }

  updateCar(carId, paintId = 'giallo_yellow') {
    if (!this.isConnected || !this.ws) return;
    
    this.ws.send(JSON.stringify({
      type: 'UPDATE_CAR',
      carId: carId,
      paintId: paintId
    }));
  }

  setReady(ready) {
    if (!this.isConnected || !this.ws) return;
    
    this.ws.send(JSON.stringify({
      type: 'SET_READY',
      ready: !!ready
    }));
  }

  startRace() {
    if (!this.isConnected || !this.ws) return;
    
    this.ws.send(JSON.stringify({
      type: 'START_RACE'
    }));
  }

  sendPlayerTransform(transform) {
    if (!this.isConnected || !this.ws) return;
    
    this.ws.send(JSON.stringify({
      type: 'PLAYER_TRANSFORM',
      transform: transform
    }));
  }

  sendLapUpdate(lap) {
    if (!this.isConnected || !this.ws) return;

    this.ws.send(JSON.stringify({
      type: 'UPDATE_LAP',
      lap: lap
    }));
  }

  sendPlayerFinished() {
    if (!this.isConnected || !this.ws) return;

    this.ws.send(JSON.stringify({
      type: 'PLAYER_FINISHED'
    }));
  }

  requestRematch() {
    if (!this.isConnected || !this.ws) return;

    this.ws.send(JSON.stringify({
      type: 'REQUEST_REMATCH'
    }));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.currentRoomCode = null;
    this.currentPlayerId = null;
  }
}
