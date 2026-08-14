import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createInductionCooktopModel } from '../src/appliances/models/inductionCooktop';

const build = createInductionCooktopModel({ id: 'induction-cooktop', accent: 0xe8aec4 });
const componentMatchers: Record<string, RegExp> = {
  'main-enclosure': /cream-main-enclosure|faceted-shell-shoulder/,
  'lower-band': /mint-lower-band/,
  'top-bezel': /raised-cream-bezel/,
  'cooking-panel': /pink-glass-ceramic-panel|faceted-cooking-zone/,
  'heating-zone': /heater-dash-ring|heater-center-dot|powered-heat-ring/,
  'control-knob': /rotary-knob|knob-(?:index|grip-ridge)/,
  'timer-button': /timer-(?:button|icon|hand)/,
  'mode-button': /mode-(?:button|icon)/,
  'power-button': /power-(?:button|icon)/,
  'control-glyphs': /(?:plus|minus)-/,
  'side-vents': /nine-side-vents/,
  'foot-array': /rubber-foot-/,
  'fan-grille': /fan-(?:cavity|grille)|concentric-fan/,
  'cable-trough': /cable-(?:storage-recess|trough-cream-inset)/,
  'power-cord': /stored-power-cord|cord-strain-relief|stored-two-pin-plug|stored-plug-pin/,
  'seam-system': /inset-panel-seam|faceted-shell-shoulder/,
  'steam-plume': /steam-cloud/,
  'powered-cookware': /hotpot-(?:thick-bottom|outer-wall|inner-cavity|rolled-rim|.*handle)/,
};
const parts = new Map(Object.keys(componentMatchers).map((name) => [name, { name, kind: 'part', module: name, triangles: 0 }])); let unnamedMeshes = 0; let invalidGeometry = 0; let integralMeshes = 0;
build.root.traverse((node) => { if (!(node instanceof THREE.Mesh)) return; integralMeshes += 1; if (!node.name) unnamedMeshes += 1; const position = node.geometry.getAttribute('position'); if (position) for (let index = 0; index < position.count; index += 1) if (![position.getX(index), position.getY(index), position.getZ(index)].every(Number.isFinite)) invalidGeometry += 1; const triangles = Math.round(node.geometry.index ? node.geometry.index.count / 3 : (position?.count ?? 0) / 3); for (const [component, matcher] of Object.entries(componentMatchers)) if (matcher.test(node.name)) parts.get(component)!.triangles += triangles; });
const emptyComponents = [...parts.values()].filter((part) => part.triangles === 0).map((part) => part.name); const runtime = build.root.userData.sculptRuntime;
const manifest = { model: 'induction-cooktop', parts: [...parts.values()], unnamedMeshes, integralMeshes, invalidGeometry, runtimeNodes: Object.keys(runtime.nodes).length, sockets: Object.keys(runtime.sockets).length, colliders: runtime.colliders.length, destructionGroups: runtime.destructionGroups.length, emptyComponents };
mkdirSync('artifacts/appliance-v2/induction-cooktop/assembly', { recursive: true }); writeFileSync('artifacts/appliance-v2/induction-cooktop/assembly/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`); console.log(JSON.stringify(manifest, null, 2)); if (unnamedMeshes || invalidGeometry || emptyComponents.length) process.exitCode = 1;
