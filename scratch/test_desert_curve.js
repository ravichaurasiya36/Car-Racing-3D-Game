import * as THREE from 'three';

const rawPoints = [
  new THREE.Vector3(0, 0, 0),         // 0. START
  new THREE.Vector3(0, 0, 450),       // 1. Long Main Desert Straight
  new THREE.Vector3(100, 0, 850),     // 2. Entry Right Sweeper
  new THREE.Vector3(300, 0, 1150),    // 3. Right Sweeper Apex
  new THREE.Vector3(600, 0, 1300),    // 4. Exit Right Sweeper
  new THREE.Vector3(1100, 0, 1450),   // 5. Long East Highway Straight
  new THREE.Vector3(1550, 0, 1350),   // 6. Entry Left Sweeper
  new THREE.Vector3(1900, 0, 1050),   // 7. Left Sweeper Apex
  new THREE.Vector3(2100, 0, 650),    // 8. Technical Oasis Section Entry
  new THREE.Vector3(2050, 0, 300),    // 9. Technical Chicane Left
  new THREE.Vector3(2200, 0, -50),    // 10. Technical Chicane Right
  new THREE.Vector3(2550, 0, -250),   // 11. High-Speed Plateau Straight Entry
  new THREE.Vector3(3100, 0, -400),   // 12. High-Speed Straight
  new THREE.Vector3(3550, 0, -300),   // 13. Right Sweeper Entry
  new THREE.Vector3(3850, 0, -50),    // 14. Right Sweeper Apex
  new THREE.Vector3(3950, 0, 300),    // 15. Left Turn Entry
  new THREE.Vector3(3800, 0, 700),    // 16. Left Turn Apex
  new THREE.Vector3(3650, 0, 1150),   // 17. Final Straightaway Approach
  new THREE.Vector3(3650, 0, 1650),   // 18. Final Straightaway
  new THREE.Vector3(3650, 0, 2050)    // 19. FINISH GANTRY
];

const scale = 6000 / 8219.68; // ~0.729955

const controlPoints = rawPoints.map(p => new THREE.Vector3(
  Math.round(p.x * scale),
  0,
  Math.round(p.z * scale)
));

const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.45);
const length = curve.getLength();
console.log(`Scaled Desert Apex Curve Length: ${length.toFixed(2)} meters (${(length / 1000).toFixed(2)} KM)`);
console.log('Scaled Control Points:');
controlPoints.forEach((p, idx) => {
  console.log(`  new THREE.Vector3(${p.x}, 0, ${p.z}), // ${idx}`);
});
