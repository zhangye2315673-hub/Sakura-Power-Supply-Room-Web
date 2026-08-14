import fs from 'node:fs';
import * as THREE from 'three';
import { createDesktopComputerModel } from '../src/appliances/models/desktopComputer';

const build = createDesktopComputerModel({ id: 'desktop-computer', accent: 0xe8a7b7 });
const nodes = build.root.userData.sculptRuntime.nodes as Record<string, THREE.Object3D>;
const requireNode = (name: string): THREE.Object3D => {
  const node = nodes[name];
  if (!node) throw new Error(`Missing node ${name}`);
  return node;
};

const screenState = requireNode('desktop-computer-screen-state-pivot');
const mainWindow = requireNode('desktop-computer-main-window-pivot');
const secondWindow = requireNode('desktop-computer-secondary-window-pivot');
const cursor = requireNode('desktop-computer-screen-cursor-pivot');
const activeKeys = [1, 2, 3, 4, 5, 6].map((index) => requireNode(`desktop-computer-active-key-${index}-pivot`));
const spacebar = requireNode('desktop-computer-spacebar-pivot');
const mouseButton = requireNode('desktop-computer-mouse-button-pivot');
const mouseWheel = requireNode('desktop-computer-mouse-wheel-pivot');
const mouse = requireNode('desktop-computer-mouse-assembly-pivot');
const fan = requireNode('desktop-computer-inferred-rear-fan-pivot');
const sideFan = requireNode('desktop-computer-side-cooling-fan-pivot');
const blueScreen = requireNode('desktop-computer-classic-blue-screen-pivot');
const tilt = requireNode('desktop-computer-screen-tilt-pivot');
const powerButton = requireNode('desktop-computer-power-button-pivot');
const screenGlass = requireNode('desktop-computer-recessed-screen-glass') as THREE.Mesh<THREE.BufferGeometry, THREE.MeshToonMaterial>;

const initial = {
  screenVisible: screenState.visible,
  mainVisible: mainWindow.visible,
  secondVisible: secondWindow.visible,
  cursorVisible: cursor.visible,
  mainScale: mainWindow.scale.toArray(),
  activeKeyYs: activeKeys.map((key) => key.position.y),
  spacebarY: spacebar.position.y,
  mouseButtonX: mouseButton.rotation.x,
  mouseWheelX: mouseWheel.rotation.x,
  mousePosition: mouse.position.toArray(),
  mouseFacingY: mouse.rotation.y,
  fanZ: fan.rotation.z,
  tiltX: tilt.rotation.x,
  powerButtonZ: powerButton.position.z,
  signal: build.animation.signal(),
  indicatorEmissive: build.indicatorMaterial.emissiveIntensity,
  screenEmissive: screenGlass.material.emissiveIntensity,
};

// The upgraded keyboard uses a fast staggered rhythm. Sample a time window
// instead of asserting an obsolete one-key-per-beat schedule.
const keyDepressions = activeKeys.map(() => 0);
for (let time = 1.45; time <= 3.45; time += 1 / 120) {
  build.animation.update(time, 1);
  activeKeys.forEach((key, index) => {
    keyDepressions[index] = Math.max(
      keyDepressions[index],
      initial.activeKeyYs[index] - key.position.y,
    );
  });
}
build.animation.update(2.18, 1);
const powered = {
  screenVisible: screenState.visible,
  mainVisible: mainWindow.visible,
  cursorVisible: cursor.visible,
  mainScale: mainWindow.scale.x,
  keyDepressions,
  signal: build.animation.signal(),
  indicatorEmissive: build.indicatorMaterial.emissiveIntensity,
  screenEmissive: screenGlass.material.emissiveIntensity,
};
build.animation.update(3.67, 1);
const inputState = {
  secondVisible: secondWindow.visible,
  mouseButtonRotation: mouseButton.rotation.x,
  mouseWheelRotation: mouseWheel.rotation.x,
  fanRotation: fan.rotation.z,
  sideFanRotation: sideFan.rotation.x,
  mousePlanarOffset: Math.hypot(mouse.position.x - initial.mousePosition[0], mouse.position.z - initial.mousePosition[2]),
  mouseFacingY: mouse.rotation.y,
};
build.animation.update(4.52, 1);
const climaxState = {
  blueScreenVisible: blueScreen.visible,
  blueScreenScale: blueScreen.scale.x,
};
build.animation.stop();

const reset = {
  screenVisible: screenState.visible,
  mainVisible: mainWindow.visible,
  secondVisible: secondWindow.visible,
  cursorVisible: cursor.visible,
  mainScale: mainWindow.scale.toArray(),
  activeKeyYs: activeKeys.map((key) => key.position.y),
  spacebarY: spacebar.position.y,
  mouseButtonX: mouseButton.rotation.x,
  mouseWheelX: mouseWheel.rotation.x,
  mousePosition: mouse.position.toArray(),
  mouseFacingY: mouse.rotation.y,
  fanZ: fan.rotation.z,
  tiltX: tilt.rotation.x,
  powerButtonZ: powerButton.position.z,
  signal: build.animation.signal(),
  indicatorEmissive: build.indicatorMaterial.emissiveIntensity,
  screenEmissive: screenGlass.material.emissiveIntensity,
};

if (!powered.screenVisible || !powered.mainVisible || !powered.cursorVisible || powered.mainScale < 0.9 || powered.keyDepressions.some((value) => value < 0.08) || powered.signal !== 1) {
  throw new Error(`Powered computer cue failed: ${JSON.stringify(powered)}`);
}
if (!inputState.secondVisible || Math.abs(inputState.mouseButtonRotation) < 0.05 || Math.abs(inputState.mouseWheelRotation) < 1 || Math.abs(inputState.fanRotation) < 1 || Math.abs(inputState.sideFanRotation) < 1 || inputState.mousePlanarOffset < 0.05 || Math.abs(inputState.mouseFacingY - Math.PI) > 1e-6) {
  throw new Error(`Input/cooling cue failed: ${JSON.stringify(inputState)}`);
}
if (!climaxState.blueScreenVisible || climaxState.blueScreenScale < 0.9) {
  throw new Error(`Blue-screen climax failed: ${JSON.stringify(climaxState)}`);
}
if (JSON.stringify(reset) !== JSON.stringify(initial)) {
  throw new Error(`stop() did not restore exact state\ninitial=${JSON.stringify(initial)}\nreset=${JSON.stringify(reset)}`);
}

let triangleCount = 0;
for (const mesh of build.interactiveMeshes) {
  const geometry = mesh.geometry;
  const triangles = geometry.index ? geometry.index.count / 3 : (geometry.attributes.position?.count ?? 0) / 3;
  const instances = mesh instanceof THREE.InstancedMesh ? mesh.count : 1;
  triangleCount += triangles * instances;
}

const spec = JSON.parse(fs.readFileSync('docs/sculpt-specs/desktop-computer/object-sculpt-spec.json', 'utf8')) as {
  componentTree: Array<{ id: string }>;
};
const nodeMap: Record<string, string> = {
  'monitor-assembly': 'desktop-computer-monitor-assembly-pivot',
  'monitor-stand-assembly': 'desktop-computer-monitor-stand-pivot',
  'tower-assembly': 'desktop-computer-tower-assembly-pivot',
  'keyboard-assembly': 'desktop-computer-keyboard-assembly-pivot',
  'mouse-assembly': 'desktop-computer-mouse-assembly-pivot',
  'monitor-shell': 'desktop-computer-rounded-monitor-shell',
  'monitor-bezel': 'desktop-computer-monitor-bezel-top',
  'screen-panel': 'desktop-computer-recessed-screen-glass',
  'monitor-mount-plate': 'desktop-computer-pink-rear-monitor-mount',
  'monitor-stand-column': 'desktop-computer-leaning-pink-column',
  'monitor-stand-base': 'desktop-computer-monitor-base-lower',
  'tower-shell': 'desktop-computer-rounded-tower-shell',
  'tower-top-cap': 'desktop-computer-pink-tower-top-cap',
  'tower-front-io': 'desktop-computer-pink-front-io-strip',
  'tower-side-panel': 'desktop-computer-tower-side-panel-seam',
  'tower-rear-panel': 'desktop-computer-pink-rear-panel',
  'tower-rear-vent-panel': 'desktop-computer-rear-vent-fields',
  'keyboard-shell': 'desktop-computer-rounded-keyboard-shell',
  'keyboard-deck': 'desktop-computer-pink-keyboard-deck',
  'keyboard-key-system': 'desktop-computer-keybed-pivot',
  'mouse-shell': 'desktop-computer-cream-mouse-lower-shell',
  'mouse-top-shell': 'desktop-computer-pink-mouse-upper-shell',
  'mouse-button-system': 'desktop-computer-mouse-button-pivot',
  'monitor-rear-emblem': 'desktop-computer-monitor-flower-emblem',
  'screen-gui-layer': 'desktop-computer-desktop-background',
  'tower-front-emblem': 'desktop-computer-tower-flower-emblem',
  'tower-front-controls': 'desktop-computer-power-button-pivot',
  'tower-side-seam': 'desktop-computer-tower-side-panel-seam',
  'tower-side-vents': 'desktop-computer-side-vent-grid',
  'tower-rear-vents': 'desktop-computer-rear-vent-fields',
  'tower-rear-io': 'desktop-computer-rear-io-pivot',
  'tower-power-inlet': 'desktop-computer-rear-power-inlet-frame',
  'tower-service-panel': 'desktop-computer-rear-service-panel',
  'tower-feet': 'desktop-computer-four-tower-feet',
  'keyboard-row-system': 'desktop-computer-cream-keycap-field',
  'keyboard-spacebar': 'desktop-computer-long-pink-spacebar',
  'mouse-wheel': 'desktop-computer-mouse-wheel',
  'computer-powered-state': 'desktop-computer-screen-state-pivot',
};

const parts = spec.componentTree
  .filter((component) => component.id !== 'root')
  .map((component) => {
    const mappedName = nodeMap[component.id];
    const node = mappedName ? nodes[mappedName] : undefined;
    if (!node) throw new Error(`No built node mapped for specified component ${component.id}`);
    return { name: component.id, kind: 'part', module: node.name, triangles: 0 };
  });
const manifest = {
  model: 'desktop-computer',
  parts,
  unnamedMeshes: build.interactiveMeshes.filter((mesh) => !mesh.name).length,
  integralMeshes: build.interactiveMeshes.length,
};
fs.mkdirSync('artifacts/img2threejs/desktop-computer', { recursive: true });
fs.writeFileSync('artifacts/img2threejs/desktop-computer/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync('artifacts/img2threejs/desktop-computer/animation-verification.json', `${JSON.stringify({ initial, powered, inputState, climaxState, reset, exactReset: true, interactiveMeshes: build.interactiveMeshes.length, triangleCount }, null, 2)}\n`);
console.log(JSON.stringify({ exactReset: true, powered, inputState, climaxState, interactiveMeshes: build.interactiveMeshes.length, triangleCount, parts: parts.length }, null, 2));
