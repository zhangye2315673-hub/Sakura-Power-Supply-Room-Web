import * as THREE from 'three';

/** Initial visible body bounds; hidden animation props must not shrink the appliance. */
export function applianceBodyBounds(root: THREE.Object3D, result = new THREE.Box3()): THREE.Box3 {
  root.updateWorldMatrix(true, true);
  result.makeEmpty();
  root.traverseVisible(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (!materials.some(material => material.visible && material.opacity > 0)) return;
    if (object instanceof THREE.InstancedMesh) {
      object.computeBoundingBox();
      if (object.boundingBox) result.union(object.boundingBox.clone().applyMatrix4(object.matrixWorld));
    } else {
      object.geometry.computeBoundingBox();
      if (object.geometry.boundingBox) result.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
    }
  });
  if (result.isEmpty()) result.setFromCenterAndSize(root.getWorldPosition(new THREE.Vector3()), new THREE.Vector3(1, 1, 1));
  return result;
}
