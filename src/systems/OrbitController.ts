import * as THREE from 'three';

const VIEW_SETTLE_DELAY_MS = 360;
const APPLIANCE_MIN_PITCH = -1.12;
const APPLIANCE_MAX_PITCH = 1.18;

export function horizontalOrbitInputSign(pitch: number): 1 | -1 {
  return Math.cos(pitch) < 0 ? -1 : 1;
}

type OrbitCallbacks = {
  onClick: (clientX: number, clientY: number, touch?: boolean) => void;
  onHover: (clientX: number, clientY: number) => void;
  onLeave: () => void;
  onViewChanged: () => void;
};

export class OrbitController {
  private pointerId: number | null = null;
  private readonly touches = new Map<number, THREE.Vector2>();
  private pinchDistance = 0;
  private readonly pinchCenter = new THREE.Vector2();
  private touchLantern = false;

  setTouchLantern(active: boolean): void {
    this.touchLantern = active;
    this.clearTouches();
  }
  private pinching = false;
  private startX = 0;
  private startY = 0;
  private previousX = 0;
  private previousY = 0;
  private moved = false;
  private yaw = 0.76;
  private pitch = 0.56;
  private appliancePitch = 0.56;
  private radius = 19.2;
  private velocityX = 0;
  private velocityY = 0;
  private suppressClick = false;
  private enabled = true;
  private clickOnly = false;
  private viewSettleTimer = 0;
  private readonly target = new THREE.Vector3(0, 0.05, 0);

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly callbacks: OrbitCallbacks,
  ) {
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerCancel);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    canvas.addEventListener('click', this.onClick);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('blur', this.clearTouches);
    this.updateCamera();
  }

  update(delta: number): void {
    if (this.pointerId === null) {
      const decay = Math.exp(-delta * 8.5);
      this.yaw += this.velocityX * horizontalOrbitInputSign(this.pitch) * delta;
      this.applyPitchDelta(this.velocityY * delta);
      this.velocityX *= decay;
      this.velocityY *= decay;
    }
    this.updateCamera();
  }

  getState(): { yaw: number; pitch: number; appliancePitch: number; radius: number } {
    return {
      yaw: this.yaw,
      pitch: this.pitch,
      appliancePitch: this.appliancePitch,
      radius: this.radius,
    };
  }

  setAngles(yaw: number, pitch: number): void {
    this.yaw = yaw;
    this.pitch = pitch;
    this.appliancePitch = THREE.MathUtils.clamp(
      pitch,
      APPLIANCE_MIN_PITCH,
      APPLIANCE_MAX_PITCH,
    );
    this.velocityX = 0;
    this.velocityY = 0;
    this.updateCamera();
  }

  setRadius(radius: number): void {
    this.radius = THREE.MathUtils.clamp(radius, 12.2, 34);
    this.updateCamera();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.clearTouches();
    if (enabled || this.pointerId === null) return;
    this.pointerId = null;
    this.moved = false;
    this.velocityX = 0;
    this.velocityY = 0;
    this.canvas.classList.remove('dragging');
  }

  setClickOnly(clickOnly: boolean): void {
    this.clickOnly = clickOnly;
    if (clickOnly) this.clearTouches();
    if (!clickOnly || this.pointerId === null) return;
    this.pointerId = null;
    this.moved = false;
    this.velocityX = 0;
    this.velocityY = 0;
    this.canvas.classList.remove('dragging');
  }

  dispose(): void {
    this.clearTouches();
    window.removeEventListener('blur', this.clearTouches);
    window.clearTimeout(this.viewSettleTimer);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'touch' && this.enabled && !this.clickOnly) {
      this.touches.set(event.pointerId, new THREE.Vector2(event.clientX, event.clientY));
      if (this.touches.size > 1) {
        event.preventDefault();
        this.pinching = true;
        this.suppressClick = true;
        this.velocityX = this.velocityY = 0;
        const points = [...this.touches.values()];
        this.pinchDistance = points[0].distanceTo(points[1]);
        this.pinchCenter.copy(points[0]).add(points[1]).multiplyScalar(0.5);
        this.canvas.setPointerCapture(event.pointerId);
        return;
      }
      this.suppressClick = false;
    }
    if (!this.enabled || this.clickOnly || event.button !== 0 || this.pointerId !== null) return;
    this.suppressClick = false;
    event.preventDefault();
    this.pointerId = event.pointerId;
    this.startX = this.previousX = event.clientX;
    this.startY = this.previousY = event.clientY;
    this.moved = false;
    this.velocityX = 0;
    this.velocityY = 0;
    window.clearTimeout(this.viewSettleTimer);
    this.canvas.classList.add('dragging');
      try {
        this.canvas.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic and accessibility-generated pointer events may not own an
        // active browser pointer. Dragging still works through window events.
      }
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (!this.enabled || this.clickOnly) return;
    if (this.touches.has(event.pointerId)) {
      this.touches.get(event.pointerId)!.set(event.clientX, event.clientY);
      if (this.pinching) {
        event.preventDefault();
        if (this.touches.size >= 2) {
          const points = [...this.touches.values()];
          const distance = points[0].distanceTo(points[1]);
          if (distance > 0 && this.pinchDistance > 0) this.setRadius(this.radius * this.pinchDistance / distance);
          this.pinchDistance = distance;
          if (this.touchLantern) {
            const center = points[0].clone().add(points[1]).multiplyScalar(0.5);
            this.yaw -= (center.x - this.pinchCenter.x) * 0.0063 * horizontalOrbitInputSign(this.pitch);
            this.applyPitchDelta((center.y - this.pinchCenter.y) * 0.0063);
            this.pinchCenter.copy(center);
          }
        }
        return;
      }
    }
    if (this.pointerId !== event.pointerId) {
      this.callbacks.onHover(event.clientX, event.clientY);
      return;
    }

    event.preventDefault();
    const deltaX = event.clientX - this.previousX;
    const deltaY = event.clientY - this.previousY;
    this.previousX = event.clientX;
    this.previousY = event.clientY;
    const totalDistance = Math.hypot(event.clientX - this.startX, event.clientY - this.startY);
    if (totalDistance > 5) this.moved = true;
    if (!this.moved) return;

    const sensitivity = 0.0063;
    const horizontalSign = horizontalOrbitInputSign(this.pitch);
    this.yaw -= deltaX * sensitivity * horizontalSign;
    this.applyPitchDelta(deltaY * sensitivity);
    this.velocityX = -deltaX * 0.2;
    this.velocityY = deltaY * 0.2;
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    this.touches.delete(event.pointerId);
    if (this.pinching) {
      event.preventDefault();
      if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
      if (this.touches.size === 0) {
        this.clearTouches();
        this.callbacks.onViewChanged();
      }
      return;
    }
    if (event.pointerId !== this.pointerId) return;
    event.preventDefault();
    this.suppressClick = this.moved;
    this.pointerId = null;
    this.canvas.classList.remove('dragging');
    try {
      this.canvas.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
    if (event.pointerType === 'touch' && !this.moved) {
      this.callbacks.onClick(event.clientX, event.clientY, true);
    }
    if (this.moved) {
      this.updateCamera();
      if (event.pointerType !== 'touch') this.callbacks.onHover(event.clientX, event.clientY);
      this.scheduleSettledViewChanged();
    }
  };

  private readonly onPointerCancel = (event: PointerEvent) => {
    if (this.touches.has(event.pointerId)) this.clearTouches();
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.moved = false;
    this.canvas.classList.remove('dragging');
  };

  private readonly onPointerLeave = () => {
    if (this.pointerId === null) this.callbacks.onLeave();
  };

  private readonly clearTouches = () => {
    window.clearTimeout(this.viewSettleTimer);
    for (const pointerId of this.touches.keys()) {
      if (this.canvas.hasPointerCapture(pointerId)) this.canvas.releasePointerCapture(pointerId);
    }
    this.touches.clear();
    this.pinching = false;
    this.pinchDistance = 0;
    this.pointerId = null;
    this.velocityX = this.velocityY = 0;
    this.suppressClick = true;
    this.canvas.classList.remove('dragging');
  };

  private readonly onClick = (event: MouseEvent) => {
    if (!this.enabled) return;
    if (!this.clickOnly && (event as PointerEvent).pointerType === 'touch') return;
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    this.callbacks.onClick(event.clientX, event.clientY, (event as PointerEvent).pointerType === 'touch');
  };

  private readonly onWheel = (event: WheelEvent) => {
    if (!this.enabled || this.clickOnly) return;
    event.preventDefault();
    this.radius = THREE.MathUtils.clamp(this.radius + event.deltaY * 0.011, 12.2, 34);
    this.updateCamera();
    this.scheduleSettledViewChanged();
  };

  private scheduleSettledViewChanged(): void {
    window.clearTimeout(this.viewSettleTimer);
    this.viewSettleTimer = window.setTimeout(() => {
      this.velocityX = 0;
      this.velocityY = 0;
      this.updateCamera();
      this.callbacks.onViewChanged();
    }, VIEW_SETTLE_DELAY_MS);
  }

  private applyPitchDelta(delta: number): void {
    this.pitch += delta;
    this.appliancePitch = THREE.MathUtils.clamp(
      this.appliancePitch + delta,
      APPLIANCE_MIN_PITCH,
      APPLIANCE_MAX_PITCH,
    );
  }

  private updateCamera(): void {
    const horizontal = Math.cos(this.pitch) * this.radius;
    this.camera.position.set(
      Math.sin(this.yaw) * horizontal,
      Math.sin(this.pitch) * this.radius,
      Math.cos(this.yaw) * horizontal,
    );
    // Use the sphere's pitch tangent as camera-up. Unlike a fixed world-up,
    // this stays perpendicular to the view at both poles, so vertical orbiting
    // can continue through the top and bottom without locking or snapping.
    this.camera.up.set(
      -Math.sin(this.yaw) * Math.sin(this.pitch),
      Math.cos(this.pitch),
      -Math.cos(this.yaw) * Math.sin(this.pitch),
    );
    this.camera.lookAt(this.target);
  }
}
