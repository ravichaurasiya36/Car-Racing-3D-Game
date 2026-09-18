export const VEHICLE_CATALOG = [
  {
    id: 'lamborghini_svj',
    name: 'LAMBORGHINI AVENTADOR SVJ',
    brand: 'LAMBORGHINI',
    modelName: 'AVENTADOR SVJ',
    subtitle: 'APEX VELOCITY SUPERCAR EDITION',
    class: 'SUPERCAR',
    drivetrain: 'AWD SUPERSPORT',
    engine: '6.5L V12 N/A',
    power: '770 HP @ 8,500 RPM',
    torque: '720 NM @ 6,750 RPM',
    topSpeedKmH: 350,
    accelSec: 2.8,
    handlingRating: 94,
    brakingRating: 92,
    colorName: 'GIALLO YELLOW METALLIC',
    colorHex: '#FFD21F',
    defaultPaintId: 'giallo_yellow',
    isUnlocked: true,
    isDefault: true
  },
  {
    id: 'ferrari_488',
    name: 'APEX ITALIA 488 SUPERSPORT',
    brand: 'ROSSO APEX',
    modelName: '488 GTB SUPERSPORT',
    subtitle: 'TURBO V8 ITALIAN EXOTIC',
    class: 'SUPERCAR',
    drivetrain: 'RWD TWIN TURBO',
    engine: '3.9L V8 TWIN TURBO',
    power: '710 HP @ 8,000 RPM',
    torque: '770 NM @ 3,000 RPM',
    topSpeedKmH: 345,
    accelSec: 2.9,
    handlingRating: 96,
    brakingRating: 94,
    colorName: 'ROSSO CORSA METALLIC RED',
    colorHex: '#DD0B18',
    defaultPaintId: 'rosso_red',
    isUnlocked: true,
    isDefault: false
  },
  {
    id: 'bugatti_hypercar',
    name: 'APEX ROYALE HYPER GT',
    brand: 'APEX ROYALE',
    modelName: 'ROYALE HYPER GT',
    subtitle: 'QUAD-TURBO W16 HYPERCAR EDITION',
    class: 'HYPERCAR',
    drivetrain: 'AWD QUAD-TURBO',
    engine: '8.0L W16 QUAD-TURBO',
    power: '1600 HP @ 7,000 RPM',
    torque: '1600 NM @ 2,250 RPM',
    topSpeedKmH: 420,
    accelSec: 2.3,
    handlingRating: 98,
    brakingRating: 97,
    colorName: 'ROYAL COBALT BLUE METALLIC',
    colorHex: '#0A3880',
    defaultPaintId: 'metallic_blue',
    isUnlocked: true,
    isDefault: false
  }
];

export const PAINT_PALETTE = [
  { id: 'giallo_yellow', name: 'Giallo Yellow', hex: '#FFD21F', numHex: 0xffd21f, roughness: 0.14, metalness: 0.38, emissive: 0x332600 },
  { id: 'rosso_red',     name: 'Rosso Red',     hex: '#DD0B18', numHex: 0xdd0b18, roughness: 0.12, metalness: 0.42, emissive: 0x220004 },
  { id: 'nero_black',    name: 'Nero Black',    hex: '#111318', numHex: 0x111318, roughness: 0.10, metalness: 0.90, emissive: 0x050505 },
  { id: 'pearl_white',   name: 'Pearl White',   hex: '#EBF2FA', numHex: 0xebf2fa, roughness: 0.12, metalness: 0.35, emissive: 0x151c28 },
  { id: 'metallic_blue', name: 'Metallic Blue', hex: '#0A3880', numHex: 0x0a3880, roughness: 0.12, metalness: 0.85, emissive: 0x001133 },
  { id: 'racing_green',  name: 'Racing Green',  hex: '#008844', numHex: 0x008844, roughness: 0.16, metalness: 0.65, emissive: 0x001a0d }
];

export const WHEEL_STYLES = [
  { id: 'stock',  name: 'Stock Performance', rimColor: 0x22262d, rimRoughness: 0.16, rimMetalness: 0.94, caliperColor: 0xcc0000 },
  { id: 'track',  name: 'Track Sport',       rimColor: 0x111318, rimRoughness: 0.08, rimMetalness: 0.98, caliperColor: 0xffd21f },
  { id: 'carbon', name: 'Carbon Performance',rimColor: 0x00f0ff, rimRoughness: 0.20, rimMetalness: 0.85, caliperColor: 0x00ff88 }
];

export const PERFORMANCE_LEVELS = [
  { level: 1, name: 'Level 1 — Stock',  label: 'STOCK',  topSpeedBonus: 0,  accelBonus: 0.0, handlingBonus: 0, brakingBonus: 0 },
  { level: 2, name: 'Level 2 — Street', label: 'STREET', topSpeedBonus: 8,  accelBonus: -0.1, handlingBonus: 2, brakingBonus: 2 },
  { level: 3, name: 'Level 3 — Sport',  label: 'SPORT',  topSpeedBonus: 16, accelBonus: -0.2, handlingBonus: 4, brakingBonus: 4 },
  { level: 4, name: 'Level 4 — Track',  label: 'TRACK',  topSpeedBonus: 24, accelBonus: -0.3, handlingBonus: 6, brakingBonus: 6 },
  { level: 5, name: 'Level 5 — Race',   label: 'RACE',   topSpeedBonus: 32, accelBonus: -0.4, handlingBonus: 8, brakingBonus: 8 }
];

export class VehicleManager {
  constructor() {
    // Player-keyed selection state (Player 1 & Player 2 Multiplayer Compatible!)
    this.selections = {
      player1: 'lamborghini_svj',
      player2: 'lamborghini_svj'
    };

    // Customization profiles per player & vehicle
    this.customizations = {
      player1: {
        lamborghini_svj: { paintId: 'giallo_yellow', wheelStyleId: 'stock', performanceLevel: 1 },
        ferrari_488:     { paintId: 'rosso_red',     wheelStyleId: 'stock', performanceLevel: 1 },
        bugatti_hypercar:{ paintId: 'metallic_blue', wheelStyleId: 'stock', performanceLevel: 1 }
      },
      player2: {
        lamborghini_svj: { paintId: 'giallo_yellow', wheelStyleId: 'stock', performanceLevel: 1 },
        ferrari_488:     { paintId: 'rosso_red',     wheelStyleId: 'stock', performanceLevel: 1 },
        bugatti_hypercar:{ paintId: 'metallic_blue', wheelStyleId: 'stock', performanceLevel: 1 }
      }
    };
  }

  getCatalog() {
    return VEHICLE_CATALOG;
  }

  getPaintPalette() {
    return PAINT_PALETTE;
  }

  getWheelStyles() {
    return WHEEL_STYLES;
  }

  getPerformanceLevels() {
    return PERFORMANCE_LEVELS;
  }

  getVehicle(vehicleId = 'lamborghini_svj') {
    return VEHICLE_CATALOG.find(v => v.id === vehicleId) || VEHICLE_CATALOG[0];
  }

  getSelectedVehicle(playerSlot = 'player1') {
    const id = this.selections[playerSlot] || 'lamborghini_svj';
    return this.getVehicle(id);
  }

  setSelectedVehicle(playerSlot = 'player1', vehicleId = 'lamborghini_svj') {
    if (VEHICLE_CATALOG.some(v => v.id === vehicleId)) {
      this.selections[playerSlot] = vehicleId;
    }
  }

  getSelectedIndex(playerSlot = 'player1') {
    const selectedId = this.selections[playerSlot];
    const index = VEHICLE_CATALOG.findIndex(v => v.id === selectedId);
    return index >= 0 ? index : 0;
  }

  getVehicleByIndex(index) {
    const safeIndex = (index + VEHICLE_CATALOG.length) % VEHICLE_CATALOG.length;
    return VEHICLE_CATALOG[safeIndex];
  }

  getCustomization(playerSlot = 'player1', vehicleId = null) {
    const vId = vehicleId || this.selections[playerSlot] || 'lamborghini_svj';
    const playerStore = this.customizations[playerSlot] || this.customizations.player1;
    
    if (!playerStore[vId]) {
      const baseVehicle = this.getVehicle(vId);
      playerStore[vId] = {
        paintId: baseVehicle.defaultPaintId || 'giallo_yellow',
        wheelStyleId: 'stock',
        performanceLevel: 1
      };
    }

    return playerStore[vId];
  }

  setCustomization(playerSlot = 'player1', vehicleId = null, updates = {}) {
    const vId = vehicleId || this.selections[playerSlot] || 'lamborghini_svj';
    const current = this.getCustomization(playerSlot, vId);

    if (updates.paintId !== undefined) current.paintId = updates.paintId;
    if (updates.wheelStyleId !== undefined) current.wheelStyleId = updates.wheelStyleId;
    if (updates.performanceLevel !== undefined) current.performanceLevel = updates.performanceLevel;
  }

  getPaintObj(paintId) {
    return PAINT_PALETTE.find(p => p.id === paintId) || PAINT_PALETTE[0];
  }

  getWheelStyleObj(wheelStyleId) {
    return WHEEL_STYLES.find(w => w.id === wheelStyleId) || WHEEL_STYLES[0];
  }

  getPerformanceLevelObj(level) {
    return PERFORMANCE_LEVELS.find(p => p.level === level) || PERFORMANCE_LEVELS[0];
  }

  getEffectiveTelemetry(vehicleId, performanceLevel = 1) {
    const vehicle = this.getVehicle(vehicleId);
    const perfObj = this.getPerformanceLevelObj(performanceLevel);

    return {
      topSpeedKmH: vehicle.topSpeedKmH + perfObj.topSpeedBonus,
      accelSec: Math.max(2.0, (vehicle.accelSec + perfObj.accelBonus)).toFixed(1),
      handlingRating: Math.min(100, vehicle.handlingRating + perfObj.handlingBonus),
      brakingRating: Math.min(100, vehicle.brakingRating + perfObj.brakingBonus)
    };
  }
}
