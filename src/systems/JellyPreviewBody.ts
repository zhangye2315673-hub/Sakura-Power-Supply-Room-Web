import * as THREE from 'three';
import { jellyDynamics as settings } from './JellyDynamicsSettings';

/** Centered gallery specimen: horizontal pulling deforms the lattice only.
 * Vertical lifting transfers acceleration and ground impact to that lattice. */
export class JellyPreviewBody {
  readonly velocity = new THREE.Vector3();
  private height = 1;
  private readonly grab = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly localTarget = new THREE.Vector3();
  private held = false;
  constructor(readonly root: THREE.Group, private readonly impulse: (v: THREE.Vector3)=>void) {}
  reset(size: THREE.Vector3): void {
    this.height = Math.max(size.y, 0.1);
    this.root.position.set(0,0,0); this.root.quaternion.identity();
    this.velocity.set(0,0,0); this.held = false;
  }
  begin(point: THREE.Vector3): void {
    this.root.updateWorldMatrix(true,false);
    this.grab.copy(this.root.worldToLocal(point.clone()));
    this.target.copy(point); this.held = true;
  }
  move(point: THREE.Vector3): void { this.target.copy(point); }
  release(): void { this.held = false; }
  get moving(): boolean { return this.held || this.root.position.y>0.0001 || Math.abs(this.velocity.y)>0.0001; }
  update(delta: number): void {
    this.root.position.x=0; this.root.position.z=0;
    this.root.quaternion.identity(); this.velocity.x=0; this.velocity.z=0;
    this.localTarget.copy(this.target);
    this.root.parent?.updateWorldMatrix(true,false);
    this.root.parent?.worldToLocal(this.localTarget);
    // Reserve the first part of a pull for stretching. Even a strong grab
    // cannot turn a small pinch into a whole-object drag.
    const lift = THREE.MathUtils.clamp((this.localTarget.y-this.grab.y-this.height*0.16)*0.5,0,this.height*0.6);
    for(let remaining=Math.min(delta,0.05);remaining>0;) {
      const dt=Math.min(remaining,1/120); remaining-=dt;
      const before=this.velocity.y;
      let acceleration=-settings.gravity*this.height*3;
      if(this.held) acceleration+=(lift-this.root.position.y)*settings.grab*0.5-this.velocity.y*12;
      this.velocity.y+=acceleration*dt;
      this.root.position.y+=this.velocity.y*dt;
      if(this.root.position.y<0) {
        this.root.position.y=0;
        if(this.velocity.y<0) this.velocity.y=Math.abs(this.velocity.y)>this.height*0.12 ? -this.velocity.y*settings.bounce : 0;
      }
      const change=this.velocity.y-before;
      if(Math.abs(change)>0.001) this.impulse(new THREE.Vector3(0,change,0));
    }
  }
}
