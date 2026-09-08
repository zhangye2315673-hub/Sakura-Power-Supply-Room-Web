import { test, expect } from '@playwright/test';
import * as THREE from 'three';
import { applianceBodyBounds } from '../src/appliances/bodyBounds';
import { createApplianceModel } from '../src/appliances/models';

test('initial body bounds exclude hidden animation fields and retain instance positions', () => {
  const model = createApplianceModel('dehumidifier', { id: 'dehumidifier', accent: 0xe8a7b7 });
  const body = applianceBodyBounds(model.root).getSize(new THREE.Vector3());
  const all = new THREE.Box3().setFromObject(model.root).getSize(new THREE.Vector3());
  expect(body.x).toBeLessThan(all.x * 0.75);
  const root = new THREE.Group();
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial(),2);
  mesh.setMatrixAt(1,new THREE.Matrix4().makeTranslation(3,0,0));root.add(mesh);
  expect(applianceBodyBounds(root).getSize(new THREE.Vector3()).x).toBe(4);
});
