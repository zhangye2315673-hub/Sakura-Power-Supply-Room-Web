import { test, expect } from '@playwright/test';
import * as THREE from 'three';
import { JellyPreviewBody } from '../src/systems/JellyPreviewBody';
import { jellyDefaults, setJellyDynamics } from '../src/systems/JellyDynamicsSettings';

test('lift drops onto center support and transfers impact without horizontal drift', () => {
  setJellyDynamics({...jellyDefaults, inertia:0});
  const root=new THREE.Group(); let impacts=0;
  const body=new JellyPreviewBody(root,v=>{if(v.y>0.1)impacts++;});
  body.reset(new THREE.Vector3(1,2,1));
  body.begin(new THREE.Vector3(0,0.5,0)); body.move(new THREE.Vector3(0.6,2,0));
  for(let i=0;i<180;i++)body.update(1/120);
  expect(root.position.y).toBeGreaterThan(0.15);
  body.release();
  for(let i=0;i<1200;i++)body.update(1/120);
  expect(root.position.y).toBeCloseTo(0,3);
  expect(root.position.x).toBe(0); expect(root.position.z).toBe(0);
  expect(impacts).toBeGreaterThan(0);
  setJellyDynamics(jellyDefaults);
});

test('off-center grab never rotates and stays finite at maximum gravity',()=>{
  setJellyDynamics({...jellyDefaults,gravity:3,inertia:2});
  const root=new THREE.Group(); const body=new JellyPreviewBody(root,()=>{});
  body.reset(new THREE.Vector3(1,2,0.3));
  body.begin(new THREE.Vector3(0.5,0.8,0)); body.move(new THREE.Vector3(-1,3,0));
  for(let i=0;i<240;i++)body.update(1/120);
  expect(root.quaternion.toArray()).toEqual([0,0,0,1]);
  expect(root.position.x).toBe(0); expect(root.position.z).toBe(0);
  body.release(); for(let i=0;i<1200;i++)body.update(1/120);
  expect([...root.position.toArray(),...root.quaternion.toArray()].every(Number.isFinite)).toBe(true);
  setJellyDynamics(jellyDefaults);
});


test('horizontal and small upward pinches leave the body centered',()=>{
  setJellyDynamics({...jellyDefaults,grab:220,gravity:0.5});
  const root=new THREE.Group(); const body=new JellyPreviewBody(root,()=>{});
  body.reset(new THREE.Vector3(1,2,1));
  body.begin(new THREE.Vector3(0.5,0.8,0)); body.move(new THREE.Vector3(4,1,3));
  for(let i=0;i<240;i++) body.update(1/120);
  expect(root.position.toArray()).toEqual([0,0,0]);
  expect(root.quaternion.toArray()).toEqual([0,0,0,1]);
  body.release();
  setJellyDynamics(jellyDefaults);
});
