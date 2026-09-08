import type * as THREE from 'three';

const SHARED_RESOURCE_FLAG = 'sharedAcrossInstances';

export function markSharedResource<
  T extends THREE.BufferGeometry | THREE.Material,
>(resource: T): T {
  resource.userData[SHARED_RESOURCE_FLAG] = true;
  return resource;
}

export function isSharedResource(
  resource: THREE.BufferGeometry | THREE.Material,
): boolean {
  return resource.userData[SHARED_RESOURCE_FLAG] === true;
}

export function disposeOwnedResource(
  resource: THREE.BufferGeometry | THREE.Material | null | undefined,
): void {
  if (resource && !isSharedResource(resource)) resource.dispose();
}
