import { test, expect } from '@playwright/test';
import * as THREE from 'three';
import { APPLIANCE_CATALOG } from '../src/systems/ApplianceCatalog';
import { createApplianceModel } from '../src/appliances/models';
import { SoftDeformController } from '../src/systems/SoftDeformController';

test('all appliance gel surfaces keep animation material properties and bind to the deformation cage', () => {
  for (const definition of APPLIANCE_CATALOG) {
    const model = createApplianceModel(definition.id, { id: definition.id, accent: 0xe8a7b7 });
    new SoftDeformController(model.root);
    let gelCount = 0;
    model.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material.userData.jelly) continue;
        gelCount++;
        expect(material).toBeInstanceOf(THREE.MeshPhysicalMaterial);
        const gel = material as THREE.MeshPhysicalMaterial;
        expect(gel.transmission).toBeGreaterThan(0.7);
        expect(gel.ior).toBeLessThan(1.5);
        expect(Number.isFinite(gel.opacity)).toBe(true);
        expect(gel.emissive).toBeInstanceOf(THREE.Color);
      }
    });
    expect(gelCount, definition.id).toBeGreaterThan(0);
    const shell = [...model.materials].find(m => m.userData.jelly && m.userData.softDeformPatched);
    expect(shell, `${definition.id} has deformable gel`).toBeTruthy();
    model.materials.forEach(m => m.dispose());
  }
});

import { ApplianceModelKit } from '../src/appliances/ApplianceModelKit';
import { createCableToonMaterial } from '../src/render/CableGeometry';
import { preserveLatticeVolume } from '../src/systems/softLatticeVolume';

test('cream and accent pigments stay exactly authored', () => {
  const kit = new ApplianceModelKit({ id: 'palette-test', accent: 0xe05f61 });
  expect(kit.material(0xf1e9d9).color.getHex()).toBe(0xf1e9d9);
  expect(kit.material(0xe05f61).color.getHex()).toBe(0xe05f61);
});

test('central cable gel keeps all skill controls', () => {
  const material = createCableToonMaterial(0xe05f61);
  expect(material).toBeInstanceOf(THREE.MeshPhysicalMaterial);
  for (const key of ['freezeAmount','coffeeAmount','overheatAmount','skillSweepProgress','skillRecolorProgress']) expect(material.userData[key]).toBeTruthy();
  expect(material.depthWrite).toBe(true);
  expect(material.transparent).toBe(true);
  expect(material.opacity).toBeGreaterThan(0.9);
  expect(material.opacity).toBeLessThan(1);
  expect(material.transmission).toBeLessThan(0.2);
  expect(material.attenuationColor.getHex()).toBe(material.color.getHex());
});

test('volume constraint leaves rest shape unchanged and reduces compression', () => {
  const size = new THREE.Vector3(2,2,2);
  const rest = Array.from({length:27},()=>new THREE.Vector3());
  preserveLatticeVolume(rest,size,1/120);
  expect(Math.max(...rest.map(v=>v.length()))).toBeLessThan(1e-9);
  const nodes = Array.from({length:27},(_,i)=>new THREE.Vector3(0,-(Math.floor(i/3)%3)*0.2,0));
  const before = nodes[7].y-nodes[1].y;
  for(let i=0;i<20;i++) preserveLatticeVolume(nodes,size,1/120);
  expect(nodes.every(v=>v.toArray().every(Number.isFinite))).toBe(true);
  expect(nodes[7].y-nodes[1].y).toBeGreaterThan(before + 0.02);
});


test('whole-body gel stays finite on thin shapes and settles after release', () => {
  for (const depth of [0.12, 1]) {
    const root = new THREE.Group();
    const material = new THREE.MeshPhysicalMaterial();
    root.add(new THREE.Mesh(new THREE.BoxGeometry(1,2,depth), material));
    const controller = new SoftDeformController(root);
    // Observe the actual array sent to the vertex shader, not the legacy cage helper.
    const shader = { uniforms: {}, vertexShader: '' };
    material.onBeforeCompile(shader as any, null as any);
    const nodes = (shader.uniforms as any).uSoftLattice.value as THREE.Vector3[];
    controller.begin(new THREE.Vector3(0.5,1,depth/2), 2, 1);
    controller.setPointerWorld(new THREE.Vector3(1.5,1.5,depth/2));
    for (let i=0;i<120;i++) controller.update(1/120);
    expect(nodes.every(v=>v.toArray().every(Number.isFinite))).toBe(true);
    expect(Math.min(...nodes.map(v=>v.length()))).toBeGreaterThan(0.01);
    expect(nodes[26].distanceTo(nodes[0])).toBeGreaterThan(0.01);
    const held = nodes.map(v=>v.clone());
    controller.release();
    expect(nodes.every((v,i)=>v.equals(held[i]))).toBe(true);
    for (let i=0;i<1200;i++) controller.update(1/120);
    expect(controller.isSettled).toBe(true);
    expect(Math.max(...nodes.map(v=>v.length()))).toBeLessThan(0.001);
    controller.reset();
    expect(nodes.every(v=>v.lengthSq()===0)).toBe(true);
  }
});

import { jellyDefaults, setJellyDynamics } from '../src/systems/JellyDynamicsSettings';
test('parameter extremes remain bounded and nudge has alternating rebound', () => {
  try {
    for (const damping of [1.5,14]) {
      setJellyDynamics({stiffness:100,damping,coupling:90,volume:1,stretch:0.4,grab:220});
      const root = new THREE.Group(); const material = new THREE.MeshPhysicalMaterial();
      root.add(new THREE.Mesh(new THREE.BoxGeometry(1,2,0.2), material));
      const controller = new SoftDeformController(root);
      const shader = {uniforms:{},vertexShader:''}; material.onBeforeCompile(shader as any,null as any);
      const nodes = (shader.uniforms as any).uSoftLattice.value as THREE.Vector3[];
      controller.nudge();
      let previous = 0, crossings = 0;
      for(let i=0;i<2400;i++) {
        controller.update(1/120);
        const current = nodes[25].x;
        if (previous*current<0) crossings++;
        previous=current;
        expect(nodes.every(v=>v.toArray().every(Number.isFinite))).toBe(true);
        expect(Math.max(...nodes.map(v=>Math.abs(v.x)))).toBeLessThanOrEqual(0.400001);
      }
      if(damping===1.5) expect(crossings).toBeGreaterThan(2);
      expect(controller.isSettled).toBe(true);
    }
  } finally { setJellyDynamics(jellyDefaults); }
});

test('small off-grid pinch reaches the cursor locally and rebounds on release',()=>{
  try {
    setJellyDynamics({...jellyDefaults,radius:0.12});
    const root=new THREE.Group(); const material=new THREE.MeshPhysicalMaterial();
    root.add(new THREE.Mesh(new THREE.BoxGeometry(2,2,2,12,12,12),material));
    const controller=new SoftDeformController(root);
    const shader={uniforms:{},vertexShader:''}; material.onBeforeCompile(shader as any,null as any);
    const u=shader.uniforms as any;
    controller.begin(new THREE.Vector3(0.65,0.7,1),2,1.4);
    controller.setPointerWorld(new THREE.Vector3(0.65,1.5,1));
    for(let i=0;i<180;i++)controller.update(1/120);
    expect(u.uSoftPinchLocal.value.y).toBeGreaterThan(0.8);
    expect(u.uSoftGrabRadius.value).toBeLessThan(0.3);
    controller.release(); let reversed=false;
    for(let i=0;i<900;i++){controller.update(1/120); if(u.uSoftPinchLocal.value.y<0)reversed=true;}
    expect(reversed).toBe(true);
    expect(controller.isSettled).toBe(true);
    controller.reset(); expect(u.uSoftPinchLocal.value.length()).toBe(0);
    setJellyDynamics({radius:1.2});
    controller.begin(new THREE.Vector3(0.65,0.7,1),2,1.4);
    controller.setPointerWorld(new THREE.Vector3(0.65,1.5,1));
    for(let i=0;i<180;i++)controller.update(1/120);
    expect(u.uSoftPinchLocal.value.length()).toBe(0);
    expect(Math.max(...u.uSoftLattice.value.map((v:THREE.Vector3)=>v.y))).toBeGreaterThan(0.1);
  } finally {setJellyDynamics(jellyDefaults);}
});
