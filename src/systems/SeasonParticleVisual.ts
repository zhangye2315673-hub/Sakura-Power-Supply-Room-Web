import * as THREE from 'three';

type FlatParticleKind = 'summer-leaf' | 'autumn-maple' | 'winter-snow';

function roundedShape(points: Array<[number, number]>): THREE.Shape {
  const shape = new THREE.Shape();
  const midpoint = (a: [number, number], b: [number, number]): [number, number] => [
    (a[0] + b[0]) * 0.5,
    (a[1] + b[1]) * 0.5,
  ];
  const start = midpoint(points[points.length - 1], points[0]);
  shape.moveTo(start[0], start[1]);
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const end = midpoint(point, next);
    shape.quadraticCurveTo(point[0], point[1], end[0], end[1]);
  });
  shape.closePath();
  return shape;
}

function finishFlatGeometry(
  shape: THREE.Shape,
  scale: number,
  kind: FlatParticleKind,
): THREE.ShapeGeometry {
  const geometry = new THREE.ShapeGeometry(shape, 8);
  geometry.scale(scale, scale, 1);
  geometry.computeBoundingBox();
  geometry.userData.flatParticleKind = kind;
  return geometry;
}

function addVerticalGradient(
  geometry: THREE.BufferGeometry,
  bottom: THREE.ColorRepresentation,
  top: THREE.ColorRepresentation,
): void {
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox!;
  const height = Math.max(0.0001, bounds.max.y - bounds.min.y);
  const position = geometry.getAttribute('position');
  const bottomColor = new THREE.Color(bottom);
  const topColor = new THREE.Color(top);
  const mixed = new THREE.Color();
  const colors = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index += 1) {
    const progress = THREE.MathUtils.smoothstep((position.getY(index) - bounds.min.y) / height, 0.08, 0.92);
    mixed.copy(bottomColor).lerp(topColor, progress);
    colors[index * 3] = mixed.r;
    colors[index * 3 + 1] = mixed.g;
    colors[index * 3 + 2] = mixed.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

export function createSummerLeafGeometry(scale = 1): THREE.ShapeGeometry {
  const leaf = new THREE.Shape();
  leaf.moveTo(0, 0.15);
  leaf.bezierCurveTo(0.052, 0.125, 0.074, 0.052, 0.058, -0.012);
  leaf.bezierCurveTo(0.043, -0.08, 0.016, -0.135, 0, -0.15);
  leaf.bezierCurveTo(-0.016, -0.135, -0.043, -0.08, -0.058, -0.012);
  leaf.bezierCurveTo(-0.074, 0.052, -0.052, 0.125, 0, 0.15);
  return finishFlatGeometry(leaf, scale, 'summer-leaf');
}

export function createAutumnLeafGeometry(scale = 1): THREE.ShapeGeometry {
  // Candidate 6: one tiny petal-like face with five soft waterdrop lobes.
  // Continuous curves keep the tips round at game scale without veins,
  // serrations, secondary points or low-poly facets.
  const maple = new THREE.Shape();
  maple.moveTo(-0.004, -0.112);
  maple.bezierCurveTo(-0.014, -0.105, -0.016, -0.086, -0.012, -0.07);
  maple.bezierCurveTo(-0.04, -0.075, -0.078, -0.09, -0.096, -0.068);
  maple.bezierCurveTo(-0.106, -0.054, -0.09, -0.039, -0.07, -0.034);
  maple.bezierCurveTo(-0.088, -0.012, -0.115, 0.007, -0.122, 0.034);
  maple.bezierCurveTo(-0.128, 0.055, -0.096, 0.061, -0.058, 0.03);
  maple.bezierCurveTo(-0.052, 0.078, -0.03, 0.132, 0, 0.15);
  maple.bezierCurveTo(0.03, 0.132, 0.052, 0.078, 0.058, 0.03);
  maple.bezierCurveTo(0.096, 0.061, 0.128, 0.055, 0.122, 0.034);
  maple.bezierCurveTo(0.115, 0.007, 0.088, -0.012, 0.07, -0.034);
  maple.bezierCurveTo(0.09, -0.039, 0.106, -0.054, 0.096, -0.068);
  maple.bezierCurveTo(0.078, -0.09, 0.04, -0.075, 0.012, -0.07);
  maple.bezierCurveTo(0.017, -0.087, 0.014, -0.108, 0.004, -0.112);
  maple.closePath();
  const geometry = finishFlatGeometry(maple, scale, 'autumn-maple');
  geometry.userData.autumnStyle = 'minimal-rounded-v6';
  geometry.userData.autumnLobeCount = 5;
  geometry.userData.autumnSecondarySerrations = 0;
  geometry.userData.autumnStemCurved = true;
  geometry.userData.autumnStemLengthRatio = 0.18;
  addVerticalGradient(geometry, 0xbc4f55, 0xe47659);
  return geometry;
}

export function createWinterSnowGeometry(scale = 1): THREE.ShapeGeometry {
  const armProfile: Array<[number, number]> = [
    [-0.014, 0.034],
    [-0.063, 0.054], [-0.022, 0.07],
    [-0.054, 0.091], [-0.014, 0.106],
    [0, 0.145],
    [0.014, 0.106], [0.054, 0.091],
    [0.022, 0.07], [0.063, 0.054],
    [0.014, 0.034],
  ];
  const points: Array<[number, number]> = [];
  for (let arm = 0; arm < 6; arm += 1) {
    const angle = -arm * Math.PI / 3;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (const [x, y] of armProfile) {
      points.push([x * cos - y * sin, x * sin + y * cos]);
    }
  }
  const geometry = finishFlatGeometry(roundedShape(points), scale, 'winter-snow');
  geometry.userData.winterArmCount = 6;
  geometry.userData.winterBranchPairsPerArm = 2;
  return geometry;
}

export function createFireflyGeometry(scale = 1): THREE.CircleGeometry {
  return new THREE.CircleGeometry(0.055 * scale, 8);
}

export function createSeasonParticleMaterial(
  color: THREE.ColorRepresentation,
  opacity: number,
  glow = false,
  vertexColors = false,
): THREE.MeshBasicMaterial {
  if (glow) {
    return new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending,
    });
  }
  return new THREE.MeshBasicMaterial({
    color,
    vertexColors,
    side: THREE.DoubleSide,
    transparent: true,
    opacity,
    depthWrite: false,
    fog: true,
  });
}
