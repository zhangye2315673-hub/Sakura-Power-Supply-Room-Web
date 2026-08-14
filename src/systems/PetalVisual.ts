import * as THREE from 'three';
import { PAL } from '../style/palette';

/**
 * One shared sakura silhouette for ambient, opening-screen and spectacle petals.
 * A flat ShapeGeometry keeps the petal readable at small screen sizes and avoids
 * the dark toon rim produced by the old flattened sphere.
 */
export function createSakuraPetalGeometry(scale = 1): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.15 * scale);
  shape.bezierCurveTo(
    0.105 * scale,
    0.105 * scale,
    0.145 * scale,
    0.01 * scale,
    0.075 * scale,
    -0.085 * scale,
  );
  shape.bezierCurveTo(
    0.035 * scale,
    -0.135 * scale,
    -0.035 * scale,
    -0.135 * scale,
    -0.075 * scale,
    -0.085 * scale,
  );
  shape.bezierCurveTo(
    -0.145 * scale,
    0.01 * scale,
    -0.105 * scale,
    0.105 * scale,
    0,
    0.15 * scale,
  );
  return new THREE.ShapeGeometry(shape, 5);
}

export function createSakuraPetalMaterial(
  color: THREE.ColorRepresentation = PAL.petal,
  opacity = 0.78,
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity,
    depthWrite: false,
    fog: true,
  });
}
