import * as THREE from 'three';
import { createPrinterModel } from '../src/appliances/models/printer';

const build = createPrinterModel({ id: 'printer', accent: 0xe8a7b7 });
build.animation.stop();

function snapshot(): string {
  const nodes: unknown[] = [];
  build.root.traverse((node) => {
    nodes.push({
      name: node.name,
      position: node.position.toArray(),
      quaternion: node.quaternion.toArray(),
      scale: node.scale.toArray(),
      visible: node.visible,
    });
  });
  const materials = [...build.materials].map((material) => {
    const toon = material as THREE.MeshToonMaterial;
    return {
      color: toon.color?.getHex() ?? null,
      emissive: toon.emissive?.getHex() ?? null,
      emissiveIntensity: toon.emissiveIntensity ?? null,
      opacity: toon.opacity,
    };
  });
  return JSON.stringify({ nodes, materials });
}

const idle = snapshot();
const pages = [1, 2, 3].map((index) => build.root.getObjectByName(`printer-printed-paper-${index}-feed-pivot`) as THREE.Group);
const bursts = [1, 2, 3].map((index) => build.root.getObjectByName(`printer-sakura-burst-${index}-pivot`) as THREE.Group);
const paperSizes = pages.map((page) => {
  const paper = page.children.find((child) => child.name.startsWith('printer-printed-output-paper-')) as THREE.Mesh;
  paper.geometry.computeBoundingBox();
  const size = paper.geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3();
  return { width: size.x, depth: size.z, aspect: size.x / Math.max(size.z, 1e-6) };
});
const sampleTimes = [0.76, 2.2, 3.64];
const pageSamples = sampleTimes.map((time, index) => {
  build.animation.update(time, 1);
  return {
    time,
    pageVisible: pages[index].visible,
    pageZ: pages[index].position.z,
    burstOrFallVisible: bursts[index].visible || pages[index].position.y < 0.62,
  };
});
build.animation.update(1.15, 1);
const powered = snapshot();
build.animation.stop();
const reset = snapshot();
const result = {
  animationSignalAfterStop: build.animation.signal(),
  poweredStateDiffers: powered !== idle,
  exactReset: reset === idle,
  threeIndependentPages: pages.every(Boolean) && new Set(pages).size === 3,
  fullSizePages: paperSizes.every((size) => size.width >= 1.9 && size.depth >= 1.15 && size.aspect <= 1.8),
  paperSizes,
  pageSamples,
};
console.log(JSON.stringify(result, null, 2));
if (
  !result.poweredStateDiffers
  || !result.exactReset
  || !result.threeIndependentPages
  || !result.fullSizePages
  || result.pageSamples.some((sample) => !sample.pageVisible || sample.pageZ <= 1.18)
  || result.animationSignalAfterStop !== 0
) process.exit(1);
