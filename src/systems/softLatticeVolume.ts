import * as THREE from 'three';

const tetrahedra: number[][] = [];
for (let z=0; z<2; z++) for (let y=0; y<2; y++) for (let x=0; x<2; x++) {
  const a=x+y*3+z*9, h=a+13;
  for (const [b,c] of [[1,4],[4,3],[3,12],[12,9],[9,10],[10,1]]) tetrahedra.push([a,a+b,a+c,h]);
}
const positions = Array.from({length:4},()=>new THREE.Vector3());
const gradients = Array.from({length:4},()=>new THREE.Vector3());
const ab=new THREE.Vector3(), ac=new THREE.Vector3(), ad=new THREE.Vector3();
const rest = new THREE.Vector3();

/** Soft volume projection on the 48 tetrahedra of the shared lattice. No mesh
 * topology changes; deformation stays bounded before shader interpolation. */
export function preserveLatticeVolume(nodes: THREE.Vector3[], size: THREE.Vector3, dt: number, strength = 0.8): void {
  if (strength <= 0) return;
  for (const ids of tetrahedra) {
    ids.forEach((id,k)=>positions[k].copy(nodes[id]).add(rest.set((id%3)*size.x/2, (Math.floor(id/3)%3)*size.y/2, Math.floor(id/9)*size.z/2)));
    ab.subVectors(positions[1],positions[0]); ac.subVectors(positions[2],positions[0]); ad.subVectors(positions[3],positions[0]);
    gradients[1].crossVectors(ac,ad).multiplyScalar(1/6);
    gradients[2].crossVectors(ad,ab).multiplyScalar(1/6);
    gradients[3].crossVectors(ab,ac).multiplyScalar(1/6);
    gradients[0].copy(gradients[1]).add(gradients[2]).add(gradients[3]).negate();
    const volume = ab.dot(gradients[1]);
    const restVolume = size.x*size.y*size.z/48;
    const denominator = gradients.reduce((sum,g)=>sum+g.lengthSq(),0) + (0.000002 + (1-strength)*0.00009)/(dt*dt);
    const correction = -(volume-restVolume)/Math.max(denominator,1e-12);
    ids.forEach((id,k)=>nodes[id].addScaledVector(gradients[k],correction));
  }
}
