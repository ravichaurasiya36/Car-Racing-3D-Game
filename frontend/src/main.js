import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { SceneManager } from './core/SceneManager.js';
import { InputManager } from './core/InputManager.js';
import { FollowCamera } from './core/FollowCamera.js';
import { AudioManager } from './core/AudioManager.js';
import { RacingCar } from './entities/RacingCar.js';
import { CarController } from './entities/CarController.js';
import { RacingTrack } from './environment/RacingTrack.js';
import { CityTrack } from './environment/CityTrack.js';
import { DesertTrack } from './environment/DesertTrack.js';
import { TrackDecorations } from './environment/TrackDecorations.js';
import { TrackBoundarySystem } from './systems/TrackBoundarySystem.js';
import { RaceManager, RaceState } from './systems/RaceManager.js';
import { VFXManager } from './systems/VFXManager.js';
import { GarageShowroom } from './environment/GarageShowroom.js';
import { VehicleManager } from './systems/VehicleManager.js';
import { BestTimeManager } from './systems/BestTimeManager.js';
import { LeaderboardManager } from './systems/LeaderboardManager.js';
import { TouchControls } from './ui/TouchControls.js';
import { RaceHUD } from './ui/RaceHUD.js';
import { MainMenu } from './ui/MainMenu.js';
import { RaceStartScreen } from './ui/RaceStartScreen.js';
import { GarageScreen } from './ui/GarageScreen.js';
import { RaceResultsScreen } from './ui/RaceResultsScreen.js';
import { BestTimesPanel } from './ui/BestTimesPanel.js';
import { LeaderboardPanel } from './ui/LeaderboardPanel.js';
import { TrackSelectScreen } from './ui/TrackSelectScreen.js';
import { MultiplayerUsernameScreen } from './ui/MultiplayerUsernameScreen.js';
import { MultiplayerLobbyScreen } from './ui/MultiplayerLobbyScreen.js';
import { MultiplayerResultsScreen } from './ui/MultiplayerResultsScreen.js';

class GameApp {
  constructor() {
    console.log('🏎️ Initializing 3D Car Racing Engine (Desert Apex Track Registry Active)...');

    // Track selection state (Default: Forest Crest Circuit selected)
    this.selectedTrack = 'forest';

    // 1. Core Engine Setup
    this.engine = new Engine('game-canvas');
    this.sceneManager = new SceneManager();
    this.inputManager = new InputManager();

    // PHASE 6: Multiplayer Movement Sync State
    this.networkUpdateTimer = 0;
    this.opponentCar = null;
    this.opponentCarController = null;
    this.opponentTransformTarget = null;
    this.opponentPlayerId = null;
    this.opponentLap = 0;
    this.opponentFinished = false;

    // Multiplayer HUD Overlay
    this.opponentStatusElement = document.createElement('div');
    this.opponentStatusElement.id = 'opponent-status-overlay';
    this.opponentStatusElement.style.cssText = 'position: absolute; top: 1rem; right: 50%; transform: translateX(50%); background: rgba(0,0,0,0.7); color: #fff; padding: 0.5rem 1rem; border-radius: 4px; font-weight: bold; display: none; z-index: 1000; text-transform: uppercase; border: 1px solid #3b82f6;';
    
    // Defer appending until DOM is ready, or do it now if container exists
    const hudContainer = document.getElementById('hud-container');
    if (hudContainer) {
      hudContainer.appendChild(this.opponentStatusElement);
    } else {
      // In case HUD container is built later or DOM isn't fully loaded, append it when possible
      window.addEventListener('DOMContentLoaded', () => {
        const hc = document.getElementById('hud-container');
        if (hc) hc.appendChild(this.opponentStatusElement);
      });
    }

    // 2. Audio & Visual Effects Systems
    this.audioManager = new AudioManager();

    // 3. Touch Controls Setup for Mobile & Tablet
    this.touchControls = new TouchControls(this.inputManager);

    // 4. Track Registry & Active Track Setup (Forest Crest, Neon City & Desert Apex)
    this.tracks = {
      forest_crest: new RacingTrack(),
      city_neon: new CityTrack(),
      desert_apex: new DesertTrack()
    };

    // Active track selection (Default: Forest Crest Circuit)
    this.activeTrackId = 'forest_crest';
    this.racingTrack = this.tracks[this.activeTrackId];

    // Add active track mesh to 3D scene
    this.sceneManager.add(this.racingTrack.getMesh());

    this.garageShowroom = new GarageShowroom();
    this.sceneManager.add(this.garageShowroom.getGroup());

    // 5. Build Trackside Environment & Stadium Lighting (Only for Forest Crest Circuit)
    this.trackDecorations = null;
    if (this.activeTrackId === 'forest_crest') {
      this.trackDecorations = new TrackDecorations(this.sceneManager.getScene(), this.racingTrack);
      this.sceneManager.add(this.trackDecorations.getMesh());
    }

    // 6. Build Track Boundary Constraint System
    this.boundarySystem = new TrackBoundarySystem(this.racingTrack);

    // 7. Add High-Detail 3D Sports Racing Car Entity & Car Controller for Player 1
    this.racingCar = new RacingCar();
    const carMesh = this.racingCar.getMesh();
    this.sceneManager.add(carMesh);

    this.carController = new CarController(this.racingCar);

    // Track spawn position helper
    const curve = this.racingTrack.getCenterlineCurve();
    const startPos = curve.getPointAt(0);
    const startTangent = curve.getTangentAt(0).normalize();
    const initialHeading = Math.atan2(startTangent.x, startTangent.z);

    // 8. Instantiate VFX Particle Manager, Vehicle Manager, Best Time Manager & Leaderboard Manager
    this.vfxManager = new VFXManager(this.sceneManager.getScene(), carMesh);
    this.vehicleManager = new VehicleManager();
    this.bestTimeManager = new BestTimeManager();
    this.leaderboardManager = new LeaderboardManager();

    // 9. Build Race State Machine, Main Menu, Garage, Race Results, Best Times & Leaderboard Overlays
    this.raceManager = new RaceManager(this.racingTrack);
    this.raceHUD = new RaceHUD(this.raceManager, this.carController);
    this.bestTimesPanel = new BestTimesPanel(
      () => {
        // BACK button pressed from Best Times Panel -> Return to Main Menu
        if (this.mainMenu) {
          const selectedVehicle = this.vehicleManager.getSelectedVehicle('player1');
          this.mainMenu.show(selectedVehicle);
        }
      }
    );

    this.multiplayerUsernameScreen = new MultiplayerUsernameScreen(
      (username) => {
        // CONTINUE clicked with valid username
        console.log(`🎮 Multiplayer Phase 1: Username saved locally as "${username}"`);
        this.multiplayerUsername = username;
        
        this.hideAllScreens();
        if (this.multiplayerLobbyScreen) {
          const selectedVehicleId = this.vehicleManager.getSelectedVehicle('player1').id;
          this.multiplayerLobbyScreen.show(this.multiplayerUsername, selectedVehicleId, this.selectedTrack);
        }
      },
      () => {
        // BACK button pressed from Multiplayer Screen -> Return to Main Menu
        if (this.mainMenu) {
          const selectedVehicle = this.vehicleManager.getSelectedVehicle('player1');
          this.mainMenu.show(selectedVehicle);
        }
      }
    );

    this.multiplayerLobbyScreen = new MultiplayerLobbyScreen(
      () => {
        // BACK pressed from Lobby -> Return to Username Screen
        this.hideAllScreens();
        if (this.multiplayerUsernameScreen) {
          this.multiplayerUsernameScreen.show();
        }
      },
      this.vehicleManager
    );

    this.multiplayerResultsScreen = new MultiplayerResultsScreen(
      () => {
        // RETURN TO LOBBY pressed
        this.hideAllScreens();
        this.raceManager.showMenu();
        if (this.multiplayerLobbyScreen) {
          this.multiplayerLobbyScreen.switchView('create');
          this.multiplayerLobbyScreen.show();
        }
      },
      () => {
        // REMATCH pressed
        if (this.multiplayerClient) {
          this.multiplayerClient.requestRematch();
        }
      }
    );

    // Wire up multiplayer transform callback
    if (this.multiplayerLobbyScreen && this.multiplayerLobbyScreen.multiplayerClient) {
      this.multiplayerClient = this.multiplayerLobbyScreen.multiplayerClient;
      this.multiplayerClient.onPlayerTransform = (playerId, transform) => {
        if (playerId === this.opponentPlayerId) {
          this.opponentTransformTarget = transform;
        }
      };
      
      // Wrap onRoomState to manage opponent car lifecycle
      const originalOnRoomState = this.multiplayerClient.onRoomState;
      this.multiplayerClient.onRoomState = (players, roomTrack) => {
        if (originalOnRoomState) originalOnRoomState.call(this.multiplayerLobbyScreen, players, roomTrack);
        
        // Force sync local track to Host's authoritative track
        if (roomTrack && this.selectedTrack !== roomTrack && this.activeTrackId !== roomTrack) {
          console.log(`[MULTIPLAYER] Syncing track to host's selection: ${roomTrack}`);
          this.switchTrack(roomTrack);
        }
        
        const otherPlayer = players.find(p => p.playerId !== this.multiplayerClient.currentPlayerId);
        if (otherPlayer) {
          this.opponentPlayerId = otherPlayer.playerId;
          this.ensureOpponentCarExists(otherPlayer.selectedCar, otherPlayer.paintId);
        } else {
          this.opponentPlayerId = null;
          this.removeOpponentCar();
        }
      };

      this.multiplayerClient.onRaceStarting = (startAt) => {
        console.log(`[MULTIPLAYER] Race starting at ${startAt}`);
        this.opponentLap = 0;
        this.opponentFinished = false;
        
        this.hideAllScreens();
        this.applySelectedVehicleToCar();
        this.resetGridPositions();
        this.setMobileOrientation('landscape');
        this.raceManager.startMultiplayerCountdown(startAt);
      };

      this.multiplayerClient.onRaceAborted = () => {
        console.log(`[MULTIPLAYER] Race aborted due to disconnect.`);
        if (this.raceManager.state === RaceState.COUNTDOWN) {
          this.raceManager.showMenu();
          this.hideAllScreens();
          if (this.multiplayerLobbyScreen) {
            this.multiplayerLobbyScreen.show();
            this.multiplayerLobbyScreen.switchView('create');
          }
        }
      };

      this.multiplayerClient.onPlayerDisconnected = (playerId, username) => {
        console.log(`[MULTIPLAYER] Opponent disconnected: ${username} (${playerId})`);
        
        // Remove opponent car and stop updates
        if (this.opponentPlayerId === playerId) {
           this.removeOpponentCar();
           this.opponentPlayerId = null;
        }

        // Show disconnected message
        if (this.opponentStatusElement) {
          this.opponentStatusElement.textContent = `${username} DISCONNECTED`;
          this.opponentStatusElement.style.borderColor = '#ef4444';
          this.opponentStatusElement.style.color = '#ef4444';
          this.opponentStatusElement.style.display = 'block';
        }

        // Handle rematch waiting state
        if (this.multiplayerResultsScreen) {
           this.multiplayerResultsScreen.resetRematchState();
           
           if (this.multiplayerResultsScreen.finalModal && this.multiplayerResultsScreen.finalModal.classList.contains('active')) {
             this.multiplayerResultsScreen.hide();
             this.raceManager.showMenu();
             if (this.multiplayerLobbyScreen) {
               this.multiplayerLobbyScreen.show();
               this.multiplayerLobbyScreen.switchView('create');
             }
           }
        }
      };

      this.multiplayerClient.onDisconnected = () => {
         console.log(`[MULTIPLAYER] Local connection lost.`);
         if (this.opponentStatusElement) {
           this.opponentStatusElement.textContent = `CONNECTION LOST`;
           this.opponentStatusElement.style.borderColor = '#ef4444';
           this.opponentStatusElement.style.color = '#ef4444';
           this.opponentStatusElement.style.display = 'block';
         }
         
         // Clean up opponent
         this.removeOpponentCar();
         this.opponentPlayerId = null;
      };

      this.multiplayerClient.onRaceProgress = (playerId, progressState) => {
        if (playerId === this.opponentPlayerId) {
          this.opponentLap = progressState.lap;
          this.opponentFinished = progressState.finished;
        }
      };

      this.multiplayerClient.onRaceWinner = (winnerUsername) => {
        console.log(`[MULTIPLAYER] Winner declared: ${winnerUsername}`);
        if (this.multiplayerResultsScreen) {
          this.multiplayerResultsScreen.showWinnerBanner(winnerUsername);
        }
      };

      this.multiplayerClient.onFinalRaceResult = (results) => {
        console.log(`[MULTIPLAYER] Final results received`);
        if (this.multiplayerResultsScreen) {
          this.multiplayerResultsScreen.showFinalResults(results);
        }
      };

      this.multiplayerClient.onRematchStatus = (status) => {
        console.log(`[MULTIPLAYER] Rematch status:`, status);
        if (status.allConfirmed) {
          // Both confirmed. Reset to lobby.
          this.hideAllScreens();
          this.raceManager.showMenu();
          if (this.multiplayerLobbyScreen) {
            this.multiplayerLobbyScreen.show();
            this.multiplayerLobbyScreen.switchView('create');
          }
        } else {
          if (this.multiplayerResultsScreen) {
            this.multiplayerResultsScreen.updateRematchStatus(status);
          }
        }
      };
    }

    this.leaderboardPanel = new LeaderboardPanel(
      () => {
        // BACK button pressed from Leaderboard Panel -> Return to Main Menu
        if (this.mainMenu) {
          const selectedVehicle = this.vehicleManager.getSelectedVehicle('player1');
          this.mainMenu.show(selectedVehicle);
        }
      },
      () => {
        // START RACE button pressed from Empty Leaderboard Notice
        this.applySelectedVehicleToCar();
        this.resetGridPositions();
        this.raceManager.showStartScreen();
        const record = this.bestTimeManager.getRecord('player1', this.activeTrackId);
        const bestLapFormatted = this.bestTimeManager.formatTime(record.bestLapTime || this.raceManager.bestLapTime);
        this.raceStartScreen.show(bestLapFormatted, this.racingTrack);
      }
    );

    // Instantiate Phase 9 Step 1 Race Results Screen
    this.raceResultsScreen = new RaceResultsScreen(
      () => {
        // RACE AGAIN: restart countdown with selected vehicle without page reload
        this.hideAllScreens();
        this.applySelectedVehicleToCar();
        this.resetGridPositions();
        this.setMobileOrientation('landscape');
        this.raceManager.startCountdown();
      },
      () => {
        // MAIN MENU: return cleanly to Main Menu preserving vehicle/paint selection
        this.hideAllScreens();
        const selectedVehicle = this.applySelectedVehicleToCar();
        this.resetGridPositions();
        this.setMobileOrientation('portrait');
        this.raceManager.showMenu();
        if (this.mainMenu) {
          this.mainMenu.show(selectedVehicle);
        }
      }
    );

    // Instantiate Phase 8 Step 2 Garage Screen with Live 3D Mesh & Customization Switching
    this.garageScreen = new GarageScreen(
      this.vehicleManager,
      (vehicleId) => {
        // 1. Live 3D vehicle mesh variant switch in showroom
        this.racingCar.setVehicleVariant(vehicleId);
        const cust = this.vehicleManager.getCustomization('player1', vehicleId);
        const paintObj = this.vehicleManager.getPaintObj(cust.paintId);
        const wheelObj = this.vehicleManager.getWheelStyleObj(cust.wheelStyleId);
        this.racingCar.applyCustomization({ paintObj, wheelStyleObj: wheelObj });
      },
      (custData) => {
        // 2. Live paint / wheel / performance tuning update callback
        this.racingCar.applyCustomization(custData);
      },
      (selectedId) => {
        // 3. Vehicle select button clicked
        console.log(`🏎️ Vehicle selected for Player 1: ${selectedId}`);
        const selectedVehicle = this.vehicleManager.getSelectedVehicle('player1');
        if (this.mainMenu) {
          this.mainMenu.updateSelectedVehicle(selectedVehicle);
        }
      },
      () => {
        // 4. Return from Garage to Main Menu
        this.hideAllScreens();
        const selectedVehicle = this.applySelectedVehicleToCar();
        this.resetGridPositions();
        this.setMobileOrientation('portrait');
        this.raceManager.showMenu();
        if (this.mainMenu) {
          this.mainMenu.show(selectedVehicle);
        }
      }
    );

    // Instantiate Phase 7 Step 2 Race Start Screen with Track Selector Callback
    this.raceStartScreen = new RaceStartScreen(
      this.vehicleManager,
      () => {
        // START RACE button pressed: launch cinematic countdown & race start
        this.hideAllScreens();
        this.applySelectedVehicleToCar();
        this.resetGridPositions();
        this.setMobileOrientation('landscape');
        this.raceManager.startCountdown();
      },
      () => {
        // BACK button pressed: return cleanly to Main Menu
        this.hideAllScreens();
        const selectedVehicle = this.applySelectedVehicleToCar();
        this.resetGridPositions();
        this.setMobileOrientation('portrait');
        this.raceManager.showMenu();
        if (this.mainMenu) {
          this.mainMenu.show(selectedVehicle);
        }
      },
      (targetTrackId) => {
        // TRACK SELECTOR TAB CLICKED: switch active track dynamically
        const selection = this.getSelectionFromTrackId(targetTrackId);
        this.selectedTrack = selection;
        this.switchTrack(targetTrackId);
        const record = this.bestTimeManager.getRecord('player1', this.activeTrackId);
        const bestLapFormatted = this.bestTimeManager.formatTime(record.bestLapTime || this.raceManager.bestLapTime);
        if (this.raceStartScreen) {
          this.raceStartScreen.show(bestLapFormatted, this.racingTrack);
        }
      }
    );

    // Instantiate Phase 10 Track Select Screen
    this.trackSelectScreen = new TrackSelectScreen(
      (selectedId) => {
        // Store selected track in state: 'forest', 'neon', or 'desert'
        this.selectedTrack = selectedId;
        console.log(`🗺️ Selected track state updated: ${selectedId}`);
        // Switch active 3D track environment
        const targetTrackId = this.getTrackIdFromSelection(selectedId);
        this.switchTrack(targetTrackId);
      },
      () => {
        // Back button pressed -> Return to Main Menu
        this.hideAllScreens();
        if (this.mainMenu) {
          const selectedVehicle = this.vehicleManager.getSelectedVehicle('player1');
          this.mainMenu.show(selectedVehicle);
        }
      }
    );

    // Instantiate Phase 7 Main Menu with TRACK SELECT, BEST TIMES and LEADERBOARD callbacks
    this.mainMenu = new MainMenu(
      () => {
        // PLAY RACE Clicked -> Show Race Start Briefing Screen for selected track
        this.hideAllScreens();
        const targetTrackId = this.getTrackIdFromSelection(this.selectedTrack);
        this.switchTrack(targetTrackId);
        this.applySelectedVehicleToCar();
        this.resetGridPositions();
        this.raceManager.showStartScreen();
        const record = this.bestTimeManager.getRecord('player1', this.activeTrackId);
        const bestLapFormatted = this.bestTimeManager.formatTime(record.bestLapTime || this.raceManager.bestLapTime);
        if (this.raceStartScreen) {
          this.raceStartScreen.show(bestLapFormatted, this.racingTrack);
        }
      },
      () => {
        // TRACK SELECT Clicked -> Show Track Select Screen
        this.hideAllScreens();
        if (this.trackSelectScreen) {
          this.trackSelectScreen.show(this.selectedTrack);
        }
      },
      () => {
        // GARAGE Clicked -> Show 3D Showroom Garage
        this.hideAllScreens();
        const curVehicle = this.vehicleManager.getVehicleByIndex(this.garageScreen.currentIndex);
        const cust = this.vehicleManager.getCustomization('player1', curVehicle.id);
        const paintObj = this.vehicleManager.getPaintObj(cust.paintId);
        const wheelObj = this.vehicleManager.getWheelStyleObj(cust.wheelStyleId);
        this.racingCar.setVehicleVariant(curVehicle.id);
        this.racingCar.applyCustomization({ paintObj, wheelStyleObj: wheelObj });

        const showroomPos = this.garageShowroom.getPosition();
        this.carController.setPosition(showroomPos.x, 0.05, showroomPos.z);
        this.carController.setHeading(0);
        this.carController.speed = 0;
        this.raceManager.showGarage();
        if (this.garageScreen) {
          this.garageScreen.show();
        }
      },
      () => {
        // BEST TIMES Clicked -> Show Best Times Panel
        this.hideAllScreens();
        const record = this.bestTimeManager.getRecord('player1', this.activeTrackId);
        if (this.bestTimesPanel) {
          this.bestTimesPanel.show(record, this.bestTimeManager);
        }
      },
      () => {
        // LEADERBOARD Clicked -> Show Leaderboard Panel
        this.hideAllScreens();
        const entries = this.leaderboardManager.getEntries(this.activeTrackId);
        if (this.leaderboardPanel) {
          this.leaderboardPanel.show(entries, this.leaderboardManager, 'player1');
        }
      },
      () => {
        // MULTIPLAYER Clicked -> Show Username Screen
        this.hideAllScreens();
        if (this.multiplayerUsernameScreen) {
          this.multiplayerUsernameScreen.show();
        }
      }
    );

    // Initial selected car synchronization & starting grid layout
    this.applySelectedVehicleToCar();
    this.resetGridPositions();

    // 10. Wire Audio & Collision Event Callbacks
    this.raceManager.onCountdownTick = (text) => {
      this.audioManager.playCountdownBeep(text === 'GO!');
    };

    this.raceManager.onLapComplete = (completedLaps) => {
      this.audioManager.playLapSound();
      if (this.multiplayerClient && this.multiplayerClient.isConnected) {
        this.multiplayerClient.sendLapUpdate(completedLaps);
      }
    };

    this.raceManager.onRaceFinish = () => {
      this.audioManager.playFinishFanfare();

      if (this.multiplayerClient && this.multiplayerClient.isConnected) {
        this.multiplayerClient.sendPlayerFinished();
        // BYPASS single-player results screen in multiplayer!
        return;
      }

      const selectedVehicle = this.vehicleManager.getSelectedVehicle('player1');
      const cust = this.vehicleManager.getCustomization('player1', selectedVehicle.id);
      const paintObj = this.vehicleManager.getPaintObj(cust.paintId);

      const totalTime = this.raceManager.totalTime;
      const bestLap = this.raceManager.bestLapTime;
      const completedLaps = this.raceManager.completedLaps;
      const totalLaps = this.raceManager.totalLaps;

      const resultObj = {
        playerSlot: 'player1',
        trackId: this.activeTrackId,
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        paintId: paintObj.id,
        paintName: paintObj.name,
        totalTime: totalTime,
        bestLap: bestLap,
        position: 'P1',
        timestamp: Date.now()
      };

      // 1. Process Personal Best Telemetry
      const pbFlags = this.bestTimeManager.processResult(resultObj);

      // 2. Add Entry to Local Leaderboard (Top 10)
      this.leaderboardManager.addEntry({
        playerId: 'player1',
        playerName: 'RAVI',
        trackId: this.activeTrackId,
        trackName: this.racingTrack.trackName || 'Forest Crest Circuit',
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        paintId: paintObj.id,
        paintName: paintObj.name,
        totalTime: totalTime,
        bestLap: bestLap,
        finishPosition: 1,
        timestamp: Date.now()
      });

      // 3. Show Race Results Screen
      this.raceResultsScreen.show({
        totalTimeFormatted: this.bestTimeManager.formatTime(totalTime),
        bestLapFormatted: this.bestTimeManager.formatTime(bestLap),
        completedLaps: completedLaps,
        totalLaps: totalLaps,
        carName: selectedVehicle.name,
        paintName: paintObj.name,
        position: 'P1'
      }, pbFlags);
    };

    this.boundarySystem.onCollision = (intensity) => {
      this.audioManager.playImpactSound(intensity);
      if (this.followCamera) {
        this.followCamera.triggerShake(0.25 + intensity * 0.3);
      }
    };

    this.vfxManager.onExhaustPop = () => {
      this.audioManager.playExhaustPop();
    };

    // 11. Instantiate Third-Person Follow Camera
    this.followCamera = new FollowCamera(this.engine.camera, carMesh);

    // Speedometer DOM Element
    this.speedValueElement = document.getElementById('speed-value');

    // 12. Register Main Update Loop
    this.engine.addUpdateCallback((delta, elapsedTime) => this.update(delta, elapsedTime));

    // 13. Start WebGL Animation Loop
    this.engine.start(this.sceneManager.getScene());

    window.gameApp = this;
    window.enableAutopilot = () => { if (window.gameApp) window.gameApp.autopilotEnabled = true; };

    this.setMobileOrientation('portrait');
    console.log('🏎️ 3D Car Racing Engine active! Single-player mode live.');
  }

  hideAllScreens() {
    if (this.mainMenu) this.mainMenu.hide();
    if (this.trackSelectScreen) this.trackSelectScreen.hide();
    if (this.raceStartScreen) this.raceStartScreen.hide();
    if (this.garageScreen) this.garageScreen.hide();
    if (this.raceResultsScreen) this.raceResultsScreen.hide();
    if (this.bestTimesPanel) this.bestTimesPanel.hide();
    if (this.leaderboardPanel) this.leaderboardPanel.hide();
    if (this.multiplayerUsernameScreen) this.multiplayerUsernameScreen.hide();
    if (this.multiplayerLobbyScreen) this.multiplayerLobbyScreen.hide();
    if (this.multiplayerResultsScreen) this.multiplayerResultsScreen.hide();
  }

  resetGridPositions() {
    const curve = this.racingTrack.getCenterlineCurve();
    const startPos = curve.getPointAt(0);
    const startTangent = curve.getTangentAt(0).normalize();
    const initialHeading = Math.atan2(startTangent.x, startTangent.z);

    let offsetX = 0;
    let offsetZ = 0;

    // Multiplayer Grid Offset
    if (this.multiplayerClient && this.multiplayerClient.isConnected && this.opponentPlayerId) {
      const rightX = -startTangent.z;
      const rightZ = startTangent.x;
      
      const isLeft = this.multiplayerClient.currentPlayerId < this.opponentPlayerId;
      const lateralOffset = isLeft ? -3.0 : 3.0;

      offsetX = rightX * lateralOffset;
      offsetZ = rightZ * lateralOffset;
    }

    // Grid Position at Start Line
    this.carController.setPosition(startPos.x + offsetX, startPos.y + 0.05, startPos.z + offsetZ);
    this.carController.setHeading(initialHeading);
    this.carController.speed = 0;
    if (this.boundarySystem) {
      this.boundarySystem.resetProgress();
    }
  }

  getTrackIdFromSelection(selection) {
    const map = {
      'forest': 'forest_crest',
      'neon': 'city_neon',
      'city': 'city_neon',
      'desert': 'desert_apex',
      'forest_crest': 'forest_crest',
      'city_neon': 'city_neon',
      'desert_apex': 'desert_apex'
    };
    return map[selection] || 'forest_crest';
  }

  getSelectionFromTrackId(trackId) {
    const map = {
      'forest_crest': 'forest',
      'city_neon': 'neon',
      'city': 'neon',
      'desert_apex': 'desert'
    };
    return map[trackId] || 'forest';
  }

  switchTrack(trackId) {
    const targetTrackId = this.getTrackIdFromSelection(trackId);
    if (!this.tracks[targetTrackId]) return;

    this.selectedTrack = this.getSelectionFromTrackId(targetTrackId);

    if (this.activeTrackId === targetTrackId && this.racingTrack === this.tracks[targetTrackId]) {
      this.resetGridPositions();
      return;
    }

    // 1. Remove current track mesh & decorations from scene
    if (this.racingTrack) {
      this.sceneManager.remove(this.racingTrack.getMesh());
    }
    if (this.trackDecorations) {
      this.sceneManager.remove(this.trackDecorations.getMesh());
      this.trackDecorations = null;
    }

    // 2. Set new active track
    this.activeTrackId = targetTrackId;
    this.racingTrack = this.tracks[this.activeTrackId];

    // 3. Add new track mesh to 3D scene
    this.sceneManager.add(this.racingTrack.getMesh());

    // 4. Add track decorations if forest_crest
    if (this.activeTrackId === 'forest_crest') {
      this.trackDecorations = new TrackDecorations(this.sceneManager.getScene(), this.racingTrack);
      this.sceneManager.add(this.trackDecorations.getMesh());
    }

    // 5. Update boundary system & race manager
    this.boundarySystem = new TrackBoundarySystem(this.racingTrack);
    this.boundarySystem.onCollision = (intensity) => {
      this.audioManager.playImpactSound(intensity);
      if (this.followCamera) {
        this.followCamera.triggerShake(0.25 + intensity * 0.3);
      }
    };

    this.raceManager.racingTrack = this.racingTrack;
    this.raceManager.curve = this.racingTrack.getCenterlineCurve();

    // 6. Reset car position & refresh start screen UI ONLY IF currently on START_SCREEN
    this.resetGridPositions();

    if (this.raceStartScreen && this.raceManager.state === RaceState.START_SCREEN) {
      const record = this.bestTimeManager.getRecord('player1', this.activeTrackId);
      const bestLapFormatted = this.bestTimeManager.formatTime(record.bestLapTime || this.raceManager.bestLapTime);
      this.raceStartScreen.show(bestLapFormatted, this.racingTrack);
    }
  }

  ensureOpponentCarExists(carId, paintId) {
    if (!this.opponentCar) {
      this.opponentCar = new RacingCar();
      const opponentMesh = this.opponentCar.getMesh();
      this.sceneManager.add(opponentMesh);
      this.opponentCarController = new CarController(this.opponentCar);
      this.opponentTransformTarget = null;
      console.log(`[MULTIPLAYER] Opponent car spawned.`);
    }
    
    const vehicle = this.vehicleManager.getVehicle(carId);
    if (vehicle) {
      this.opponentCar.setVehicleVariant(vehicle.id);
      const resolvedPaintId = paintId || vehicle.defaultPaintId;
      const paintObj = this.vehicleManager.getPaintObj(resolvedPaintId);
      const defaultWheelObj = this.vehicleManager.getWheelStyleObj('stock');
      this.opponentCar.applyCustomization({ paintObj: paintObj, wheelStyleObj: defaultWheelObj });
    }
  }

  removeOpponentCar() {
    if (this.opponentCar) {
      const mesh = this.opponentCar.getMesh();
      this.sceneManager.remove(mesh);
      this.opponentCar = null;
      this.opponentCarController = null;
      this.opponentTransformTarget = null;
      console.log(`[MULTIPLAYER] Opponent car removed.`);
    }
  }

  applySelectedVehicleToCar() {
    const selectedVehicle = this.vehicleManager.getSelectedVehicle('player1');
    const cust = this.vehicleManager.getCustomization('player1', selectedVehicle.id);
    const paintObj = this.vehicleManager.getPaintObj(cust.paintId);
    const wheelObj = this.vehicleManager.getWheelStyleObj(cust.wheelStyleId);

    this.racingCar.setVehicleVariant(selectedVehicle.id);
    this.racingCar.applyCustomization({ paintObj, wheelStyleObj: wheelObj });
    
    if (this.mainMenu) {
      this.mainMenu.updateSelectedVehicle(selectedVehicle);
    }
    return selectedVehicle;
  }

  update(delta, elapsedTime) {
    const isRacing = this.raceManager.state === RaceState.RACING;

    // Determine active input state based on RaceState
    let activeInput = { forward: false, backward: false, left: false, right: false };

    if (isRacing) {
      activeInput = this.inputManager.getState();
    }

    // 1. Check Track-Specific Speed Cap & Surface Off-Road Resistance
    const trackMaxSpeed = (this.racingTrack && this.racingTrack.isPointToPoint) ? (350 / 3.6) : null;
    const offRoadDrag = this.boundarySystem.getOffRoadDrag(this.carController);
    this.carController.update(delta, activeInput, offRoadDrag, trackMaxSpeed);

    // 2. Update Race State Machine (Countdown, Timers, Lap Detection, Wrong-Way logic)
    this.raceManager.update(delta, this.carController);

    // 3. Apply Track Boundary Distance Constraint
    this.boundarySystem.constrain(this.carController, delta);

    // MULTIPLAYER SYNC
    if ((isRacing || this.raceManager.state === RaceState.COUNTDOWN) && this.multiplayerClient && this.multiplayerClient.isConnected) {
      this.networkUpdateTimer += delta;
      if (this.networkUpdateTimer >= 0.05) { // ~20 FPS
        this.networkUpdateTimer = 0;
        const pos = this.carController.getPosition();
        this.multiplayerClient.sendPlayerTransform({
          x: pos.x,
          y: pos.y,
          z: pos.z,
          heading: this.carController.getHeading()
        });
      }

      if (this.opponentCarController && this.opponentTransformTarget) {
        const target = this.opponentTransformTarget;
        const currentPos = this.opponentCarController.getPosition();
        const currentHeading = this.opponentCarController.getHeading();
        
        const lerpFactor = Math.min(1.0, delta * 15);
        const newX = THREE.MathUtils.lerp(currentPos.x, target.x, lerpFactor);
        const newY = THREE.MathUtils.lerp(currentPos.y, target.y, lerpFactor);
        const newZ = THREE.MathUtils.lerp(currentPos.z, target.z, lerpFactor);
        this.opponentCarController.setPosition(newX, newY, newZ);
        
        let angleDiff = target.heading - currentHeading;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const newHeading = currentHeading + angleDiff * lerpFactor;
        this.opponentCarController.setHeading(newHeading);
        
        const speed = Math.sqrt(Math.pow(newX - currentPos.x, 2) + Math.pow(newZ - currentPos.z, 2)) / delta;
        if (this.opponentCar) {
          this.opponentCar.setPhysicsState(speed, 0, false);
          this.opponentCar.update(delta, elapsedTime);
        }
      }
      
      // Update opponent HUD
      if (this.opponentStatusElement) {
        this.opponentStatusElement.style.display = 'block';
        if (this.opponentFinished) {
          this.opponentStatusElement.textContent = 'OPPONENT FINISHED';
          this.opponentStatusElement.style.borderColor = '#4ade80';
          this.opponentStatusElement.style.color = '#4ade80';
        } else {
          this.opponentStatusElement.textContent = `OPPONENT LAP ${this.opponentLap} / ${this.raceManager.totalLaps}`;
          this.opponentStatusElement.style.borderColor = '#3b82f6';
          this.opponentStatusElement.style.color = '#fff';
        }
      }
    } else {
      if (this.opponentStatusElement) {
        this.opponentStatusElement.style.display = 'none';
      }
    }

    // 4. Update RacingCar Visual Model (Wheel Spin, Steering Angles, Dynamic Brake Lights)
    this.racingCar.update(delta, elapsedTime);

    // 5. Update Audio & Visual Effects Systems for Player 1
    const speedKmH = this.carController.getSpeedKmH();
    this.audioManager.updateEngine(speedKmH, activeInput.forward, delta);

    const skidFactor = this.vfxManager.getSkidFactor(speedKmH, this.carController.steerAngle, activeInput.backward);
    this.audioManager.updateSkid(skidFactor);
    const isGarageMode = this.raceManager.state === RaceState.GARAGE;

    const isOffRoadSand = offRoadDrag > 0;
    this.vfxManager.update(delta, speedKmH, this.carController.steerAngle, activeInput.forward, activeInput.backward, isGarageMode, this.racingCar, isOffRoadSand);

    const isDesertApex = this.racingTrack && this.racingTrack.trackId === 'desert_apex';

    // 6. Update Third-Person Follow Camera Tracking
    this.followCamera.update(
      delta,
      this.carController.getHeading(),
      speedKmH,
      this.raceManager.state === RaceState.MENU,
      this.raceManager.state === RaceState.START_SCREEN,
      this.raceManager.state === RaceState.GARAGE,
      isDesertApex
    );

    // 7. Update HUD Speedometer Telemetry
    if (this.speedValueElement) {
      this.speedValueElement.textContent = speedKmH;
    }

    // 8. Update Race Telemetry HUD Overlays & Scene Lighting Shadow Tracking
    this.raceHUD.update();
    if (this.trackDecorations) {
      this.trackDecorations.update(delta, elapsedTime);
    }
    this.sceneManager.update(this.carController.getPosition());
  }

  setMobileOrientation(mode) {
    try {
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (!isMobile) return;

      if (mode === 'landscape') {
        document.body.classList.add('is-racing-mobile');
        if (screen && screen.orientation && screen.orientation.lock) {
          // Catch and silently ignore orientation lock errors so it NEVER blocks the race start
          screen.orientation.lock('landscape').catch(() => {});
        }
      } else {
        document.body.classList.remove('is-racing-mobile');
        if (screen && screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('portrait').catch(() => {});
        } else if (screen && screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      }
    } catch (e) {
      console.warn("Orientation enforcement skipped:", e);
    }
  }
}

// Initialize Application once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});


