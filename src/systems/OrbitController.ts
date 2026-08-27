import * as THREE from 'three';

const VIEW_SETTLE_DELAY_MS = 360;
const APPLIANCE_MIN_PITCH = -1.12;
const APPLIANCE_MAX_PITCH = 1.18;

export function horizontalOrbitInputSign(pitch: number): 1 | -1 {
  return Math.cos(pitch) < 0 ? -1 : 1;
}

type OrbitCallbacks = {
  onClick: (clientX: number, clientY: number) => void;
  onHover: (clientX: number, clientY: number) => void;
  onLeave: () => void;
  onViewChanged: () => void;
};

export class OrbitController {
  private pointerId: number | null = null;
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
    if (enabled || this.pointerId === null) return;
    this.pointerId = null;
    this.moved = false;
    this.velocityX = 0;
    this.velocityY = 0;
    this.canvas.classList.remove('dragging');
  }

  setClickOnly(clickOnly: boolean): void {
    this.clickOnly = clickOnly;
    if (!clickOnly || this.pointerId === null) return;
    this.pointerId = null;
    this.moved = false;
    this.velocityX = 0;
    this.velocityY = 0;
    this.canvas.classList.remove('dragging');
  }

  dispose(): void {
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
    if (!this.enabled || this.clickOnly || event.button !== 0 || this.pointerId !== null) return;
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

    const sensitivity = 0.0063;
    const horizontalSign = horizontalOrbitInputSign(this.pitch);
    this.yaw -= deltaX * sensitivity * horizontalSign;
    this.applyPitchDelta(deltaY * sensitivity);
    this.velocityX = -deltaX * 0.2;
    this.velocityY = deltaY * 0.2;
  };

  private readonly onPointerUp = (event: PointerEvent) => {
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
    if (this.moved) {
      this.updateCamera();
      this.callbacks.onViewChanged();
      this.callbacks.onHover(event.clientX, event.clientY);
      window.setTimeout(() => {
        this.suppressClick = false;
      }, 0);
      this.scheduleSettledViewChanged();
    }
  };

  private readonly onPointerCancel = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.moved = false;
    this.canvas.classList.remove('dragging');
  };

  private readonly onPointerLeave = () => {
    if (this.pointerId === null) this.callbacks.onLeave();
  };

  private readonly onClick = (event: MouseEvent) => {
    if (!this.enabled) return;
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    this.callbacks.onClick(event.clientX, event.clientY);
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
