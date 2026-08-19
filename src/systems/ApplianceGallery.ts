import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createApplianceModel } from '../appliances/models';
import {
  poweredAnimationState,
  poweredPreviewCycleDuration,
} from '../appliances/poweredAnimation';
import type { ApplianceModelBuild } from '../appliances/ApplianceModelKit';
import { ARROW_COLORS, PAL } from '../style/palette';
import { APPLIANCE_CATALOG, type ApplianceDefinition, type ApplianceKind } from './ApplianceCatalog';
import { SoftDeformController } from './SoftDeformController';
import { AppliancePerformanceSystem, type AppliancePerformanceTarget } from './AppliancePerformanceSystem';
import { PetalField } from './PetalField';
import type { ThemeController } from '../theme/ThemeController';
import type { AudioManager } from '../audio/AudioManager';
import { ApplianceSensoryController } from '../appliances/ApplianceSensoryController';

export class ApplianceGallery {
  private readonly element = document.createElement('section');
  private readonly canvas = document.createElement('canvas');
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(31, 1, 0.1, 80);
  private readonly controls: OrbitControls;
  private readonly modelStage = new THREE.Group();
  private readonly performances = new AppliancePerformanceSystem();
  private readonly sensory = new ApplianceSensoryController(0.48);
  private readonly petals = new PetalField();
  private readonly floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.5, 48),
    new THREE.ShadowMaterial({ color: 0x5f5570, opacity: 0.14 }),
  );
  private readonly title = document.createElement('strong');
  private readonly subtitle = document.createElement('span');
  private readonly accuracy = document.createElement('p');
  private readonly list = document.createElement('div');
  private readonly resetButton = document.createElement('button');
  private readonly rotateButton = document.createElement('button');
  private readonly closeButton = document.createElement('button');
  private readonly resizeObserver: ResizeObserver;
  private current: ApplianceModelBuild | null = null;
  private galleryTarget: AppliancePerformanceTarget | null = null;
  private currentDefinition: ApplianceDefinition = APPLIANCE_CATALOG[0];
  private frameId = 0;
  private demoElapsed = 0;
  private previousCycle = -1;
  private lastFrameAt = 0;
  private isOpen = false;
  private softDeform: SoftDeformController | null = null;
  private deformPointerId: number | null = null;
  private resumeAutoRotateAfterDeform = false;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly deformPlane = new THREE.Plane();
  private readonly deformPlanePoint = new THREE.Vector3();
  private readonly cameraForward = new THREE.Vector3();
  private readonly deformSurfaceNormal = new THREE.Vector3();
  private readonly deformNormalMatrix = new THREE.Matrix3();
  private readonly key = new THREE.DirectionalLight(PAL.sun, 2.35);
  private readonly fill = new THREE.DirectionalLight(PAL.fill, 1.08);
  private readonly rim = new THREE.DirectionalLight(0xf7c8da, 0.48);
  private readonly hemi = new THREE.HemisphereLight(PAL.hemiSky, PAL.hemiGround, 1.2);

  constructor(
    private readonly theme: ThemeController,
    private readonly audio: AudioManager,
  ) {
    this.element.id = 'appliance-gallery';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.innerHTML = `
      <div class="appliance-gallery-shell">
        <header class="appliance-gallery-header">
          <div><span>SAKURA APPLIANCE ARCHIVE</span></div>
          <nav></nav>
        </header>
        <div class="appliance-gallery-stage"></div>
        <footer class="appliance-gallery-footer">
          <div class="appliance-gallery-copy"></div>
        </footer>
      </div>`;
    const headerCopy = this.element.querySelector('.appliance-gallery-header div');
    const headerNav = this.element.querySelector('.appliance-gallery-header nav');
    const stage = this.element.querySelector('.appliance-gallery-stage');
    const footer = this.element.querySelector('.appliance-gallery-footer');
    const copy = this.element.querySelector('.appliance-gallery-copy');
    if (!headerCopy || !headerNav || !stage || !footer || !copy) {
      throw new Error('Unable to create appliance gallery UI.');
    }
    this.title.textContent = '家电图鉴';
    this.subtitle.textContent = '拖动旋转 · 滚轮缩放 · 通电动画自动循环';
    headerCopy.append(this.title, this.subtitle);
    this.resetButton.type = 'button';
    this.resetButton.textContent = '重置视角';
    this.rotateButton.type = 'button';
    this.rotateButton.textContent = '暂停自转';
    this.closeButton.type = 'button';
    this.closeButton.textContent = '关闭';
    headerNav.append(this.resetButton, this.rotateButton, this.closeButton);
    this.canvas.className = 'appliance-gallery-canvas';
    stage.append(this.canvas, this.accuracy);
    this.list.className = 'appliance-gallery-list';
    footer.prepend(this.list);
    document.querySelector('#app')?.append(this.element);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(PAL.fog, 0);
    this.scene.background = new THREE.Color(0xe9edf6);
    this.scene.fog = new THREE.Fog(0xe9edf6, 18, 42);
    this.scene.add(this.modelStage);
    this.scene.add(this.petals.mesh);
    this.scene.add(this.performances.root);
    this.scene.add(this.sensory.root);
    this.floor.rotation.x = -Math.PI * 0.5;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
    this.createLighting();
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.15;
    this.controls.minDistance = 1.4;
    this.controls.maxDistance = 20;

    APPLIANCE_CATALOG.forEach((definition, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.applianceKind = definition.id;
      button.innerHTML = `<i style="--accent:#${ARROW_COLORS[index % ARROW_COLORS.length].toString(16).padStart(6, '0')}"></i><b>${definition.label}</b><small>${definition.sizeTier} · ${definition.plugStyleId}</small>`;
      button.addEventListener('click', () => this.select(definition.id));
      this.list.append(button);
    });

    this.resetButton.addEventListener('click', this.resetView);
    this.rotateButton.addEventListener('click', this.toggleRotation);
    this.closeButton.addEventListener('click', this.close);
    this.canvas.addEventListener('pointerdown', this.onDeformPointerDown, true);
    this.canvas.addEventListener('pointermove', this.onDeformPointerMove, true);
    this.canvas.addEventListener('pointerup', this.onDeformPointerUp, true);
    this.canvas.addEventListener('pointercancel', this.onDeformPointerCancel, true);
    this.list.addEventListener('wheel', this.onListWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(stage);
  }

  get visible(): boolean {
    return this.isOpen;
  }

  show(): void {
    this.open();
  }

  dispose(): void {
    this.close();
    this.resetButton.removeEventListener('click', this.resetView);
    this.rotateButton.removeEventListener('click', this.toggleRotation);
    this.closeButton.removeEventListener('click', this.close);
    this.canvas.removeEventListener('pointerdown', this.onDeformPointerDown, true);
    this.canvas.removeEventListener('pointermove', this.onDeformPointerMove, true);
    this.canvas.removeEventListener('pointerup', this.onDeformPointerUp, true);
    this.canvas.removeEventListener('pointercancel', this.onDeformPointerCancel, true);
    this.list.removeEventListener('wheel', this.onListWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    this.resizeObserver.disconnect();
    this.disposeCurrent();
    this.performances.dispose();
    this.sensory.dispose();
    this.petals.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    this.element.remove();
    delete window.__APPLIANCE_GALLERY_DIAGNOSTICS__;
  }

  private readonly open = () => {
    if (this.isOpen) return;
    this.isOpen = true;
    this.element.classList.add('visible');
    this.element.setAttribute('aria-hidden', 'false');
    document.body.classList.add('appliance-gallery-open');
    this.select(this.currentDefinition.id);
    this.demoElapsed = 0;
    this.lastFrameAt = performance.now() * 0.001;
    this.previousCycle = -1;
    this.resize();
    this.animate();
  };

  private readonly close = () => {
    if (!this.isOpen) return;
    this.isOpen = false;
    cancelAnimationFrame(this.frameId);
    this.element.classList.remove('visible');
    this.element.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('appliance-gallery-open');
    if (this.galleryTarget) {
      this.galleryTarget.state = 'idle';
      this.performances.stop(this.galleryTarget);
    }
    this.audio.update(this.theme.progress, []);
    this.sensory.update([], this.theme.progress, this.demoElapsed);
    this.performances.reset();
    this.finishDeformPointer(true);
    this.softDeform?.reset();
    if (this.resumeAutoRotateAfterDeform) {
      this.controls.autoRotate = true;
      this.rotateButton.textContent = '暂停自转';
    }
    this.resumeAutoRotateAfterDeform = false;
    if (window.__APPLIANCE_GALLERY_DIAGNOSTICS__) {
      window.__APPLIANCE_GALLERY_DIAGNOSTICS__.open = false;
      window.__APPLIANCE_GALLERY_DIAGNOSTICS__.active = false;
      window.__APPLIANCE_GALLERY_DIAGNOSTICS__.power = 0;
    }
  };

  private select(kind: ApplianceKind): void {
    const definition = APPLIANCE_CATALOG.find((item) => item.id === kind);
    if (!definition) return;
    this.currentDefinition = definition;
    if (this.galleryTarget) {
      this.galleryTarget.state = 'idle';
      this.performances.stop(this.galleryTarget);
    }
    this.audio.update(this.theme.progress, []);
    this.sensory.update([], this.theme.progress, this.demoElapsed);
    this.performances.reset();
    this.disposeCurrent();
    const catalogIndex = APPLIANCE_CATALOG.indexOf(definition);
    const accent = ARROW_COLORS[catalogIndex % ARROW_COLORS.length];
    const current = createApplianceModel(definition.id, {
      id: definition.id,
      accent,
      referencePath: definition.referencePath,
    });
    this.current = current;
    this.galleryTarget = {
      root: current.root,
      state: 'active',
      kind: definition.id,
      facingSide: 1,
      getActiveElapsed: () => Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__)
        ? Math.max(0, window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ as number)
        : this.demoElapsed,
    };
    this.modelStage.add(current.root);
    this.softDeform = new SoftDeformController(current.root);
    this.title.textContent = definition.label;
    this.subtitle.textContent = `${definition.sizeTier} · ${definition.plugStyleId} · 通电动画自动循环`;
    const inferred = current.accuracy.inferred;
    this.accuracy.textContent = inferred.length > 0
      ? `参考图可见结构已重建；推测区域：${inferred.join('、')}`
      : '参考图可见轮廓、结构层次和身份细节已重建。';
    this.list.querySelectorAll('button').forEach((button) => {
      button.classList.toggle('active', (button as HTMLElement).dataset.applianceKind === kind);
    });
    this.resetView();
    this.demoElapsed = 0;
    this.previousCycle = -1;
  }

  private readonly resetView = () => {
    if (!this.current) return;
    this.softDeform?.reset();
    this.modelStage.position.set(0, 0, 0);
    this.modelStage.updateMatrixWorld(true);
    this.current.root.position.set(0, 0, 0);
    this.current.root.rotation.set(0, 0, 0);
    this.current.root.scale.setScalar(1);
    this.current.root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(this.current.root);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    // Every appliance is framed around the same canvas-space origin. Keep the
    // model root untouched because powered animations are allowed to vibrate
    // or rotate it; the stable gallery stage owns the centering correction.
    this.modelStage.position.copy(center).multiplyScalar(-1);
    if (this.currentDefinition.id === 'radio') this.modelStage.position.y -= 1.65;
    const radius = Math.max(size.x, size.y, size.z) * 0.58;
    const modelFramingScale = Number(this.current.root.userData.previewFramingScale ?? 1);
    const framingDistance = (this.currentDefinition.id === 'refrigerator'
      ? 1.32
      : this.currentDefinition.id === 'radio'
        ? 1.45
      : this.currentDefinition.id === 'toaster'
        ? 1.16
        : 1) * modelFramingScale;
    const distance = radius / Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5)) * 1.18 * framingDistance;
    const direction = this.currentDefinition.id === 'robot-vacuum'
      ? new THREE.Vector3(1.15, 1.9, 2.1)
      : this.currentDefinition.id === 'washer'
        ? new THREE.Vector3(1.32, 0.74, 2.5)
        : this.currentDefinition.id === 'refrigerator'
          ? new THREE.Vector3(1.35, 0.68, 2.55)
          : new THREE.Vector3(1.35, 0.82, 2.45);
    const focusOffsetY = Number(this.current.root.userData.previewFocusOffsetY ?? 0);
    this.camera.position.copy(direction.normalize().multiplyScalar(Math.max(2.4, distance)));
    this.camera.position.y += focusOffsetY;
    this.camera.near = Math.max(0.01, distance / 80);
    this.camera.far = Math.max(30, distance * 10);
    this.camera.updateProjectionMatrix();
    this.controls.target.set(0, focusOffsetY, 0);
    this.controls.update();
    this.floor.position.y = -size.y * 0.5 - 0.04;
    this.floor.scale.setScalar(Math.max(0.7, Math.max(size.x, size.z) * 0.42));
  };

  private readonly toggleRotation = () => {
    this.resumeAutoRotateAfterDeform = false;
    this.controls.autoRotate = !this.controls.autoRotate;
    this.rotateButton.textContent = this.controls.autoRotate ? '暂停自转' : '继续自转';
  };

  private readonly onDeformPointerDown = (event: PointerEvent) => {
    if (
      event.button !== 0 ||
      this.deformPointerId !== null ||
      !this.current ||
      !this.softDeform
    ) return;

    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.camera.updateMatrixWorld(true);
    this.scene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.current.interactiveMeshes, false)[0];
    if (!hit) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    this.deformPointerId = event.pointerId;
    this.camera.getWorldDirection(this.cameraForward);
    if (hit.face) {
      this.deformNormalMatrix.getNormalMatrix(hit.object.matrixWorld);
      this.deformSurfaceNormal.copy(hit.face.normal).applyNormalMatrix(this.deformNormalMatrix);
    } else {
      this.deformSurfaceNormal.copy(this.cameraForward).negate();
    }
    this.deformPlane.setFromNormalAndCoplanarPoint(this.cameraForward, hit.point);
    const size = new THREE.Box3().setFromObject(this.current.root).getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    this.softDeform.begin(
      hit.point,
      size.length() * 0.72,
      maxDimension * 0.52,
      this.cameraForward,
      this.deformSurfaceNormal,
    );
    this.resumeAutoRotateAfterDeform = this.controls.autoRotate;
    this.controls.autoRotate = false;
    this.rotateButton.textContent = '继续自转';
    this.canvas.classList.add('squishing');
    this.canvas.setPointerCapture(event.pointerId);
  };

  private readonly onDeformPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== this.deformPointerId || !this.softDeform) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.camera.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (this.raycaster.ray.intersectPlane(this.deformPlane, this.deformPlanePoint)) {
      this.softDeform.setPointerWorld(this.deformPlanePoint);
    }
  };

  private readonly onDeformPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.deformPointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.finishDeformPointer(true);
  };

  private readonly onDeformPointerCancel = (event: PointerEvent) => {
    if (event.pointerId !== this.deformPointerId) return;
    event.stopImmediatePropagation();
    this.finishDeformPointer(true);
  };

  private finishDeformPointer(release: boolean): void {
    const pointerId = this.deformPointerId;
    if (release) this.softDeform?.release();
    this.deformPointerId = null;
    this.canvas.classList.remove('squishing');
    if (pointerId === null) return;
    try {
      if (this.canvas.hasPointerCapture(pointerId)) this.canvas.releasePointerCapture(pointerId);
    } catch {
      // Pointer capture may already be released when the gallery closes.
    }
  }

  private readonly onListWheel = (event: WheelEvent) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    this.list.scrollLeft += event.deltaY;
  };

  private animate = () => {
    if (!this.isOpen) return;
    const now = performance.now() * 0.001;
    const delta = Math.min(0.05, Math.max(0, now - this.lastFrameAt));
    this.lastFrameAt = now;
    const kneading = this.deformPointerId !== null;
    if (!kneading) {
      const cycleDuration = poweredPreviewCycleDuration(this.currentDefinition.id);
      this.demoElapsed = (this.demoElapsed + delta) % cycleDuration;
      if (this.demoElapsed < this.previousCycle) {
        this.performances.reset();
      }
      this.previousCycle = this.demoElapsed;
    }
    const cycle = this.demoElapsed;
    const powered = poweredAnimationState(cycle, this.currentDefinition.id);
    const presentationPower = kneading ? 0 : powered.power;
    this.softDeform?.update(delta);
    this.petals.update(delta);
    if (this.galleryTarget && !kneading) {
      this.galleryTarget.state = powered.active ? 'active' : 'idle';
      this.sensory.register([this.galleryTarget]);
      this.performances.update(delta, cycle, this.camera, [this.galleryTarget], this.petals);
      this.sensory.update([this.galleryTarget], this.theme.progress, cycle);
      this.audio.update(this.theme.progress, [this.galleryTarget], this.camera);
    } else {
      this.sensory.update([], this.theme.progress, cycle);
      this.audio.update(this.theme.progress, []);
    }
    this.applyTheme();
    if (
      this.resumeAutoRotateAfterDeform &&
      this.deformPointerId === null &&
      this.softDeform?.isSettled
    ) {
      this.controls.autoRotate = true;
      this.rotateButton.textContent = '暂停自转';
      this.resumeAutoRotateAfterDeform = false;
    }
    this.controls.update(delta);
    this.renderer.render(this.scene, this.camera);
    const performanceState = this.performances.getStateSummary();
    const sensoryState = this.sensory.getDiagnostics().find(
      (item) => item.kind === this.currentDefinition.id,
    );
    window.__APPLIANCE_GALLERY_DIAGNOSTICS__ = {
      open: this.isOpen,
      selected: this.currentDefinition.id,
      catalogSize: APPLIANCE_CATALOG.length,
      active: powered.active && !kneading,
      cycle,
      power: presentationPower,
      animationSignal: this.galleryTarget?.root.userData.appliancePerformanceSignal ?? 0,
      neonMaterialCount: sensoryState?.neonMaterialCount ?? 0,
      neonIntensity: sensoryState?.neonIntensity ?? 0,
      lidRotationX: this.current?.root.getObjectByName('rice-cooker-lid-hinge-pivot')?.rotation.x ?? null,
      refrigeratorDoorRotationY: this.current?.root.getObjectByName('refrigerator-upper-door-pivot')?.rotation.y ?? null,
      refrigeratorInteriorVisible: this.current?.root.getObjectByName('refrigerator-upper-interior-content')?.visible ?? null,
      deforming: this.softDeform ? !this.softDeform.isSettled : false,
      deformPull: this.softDeform?.pullLength ?? 0,
      deformSignedPull: this.softDeform?.signedPull ?? 0,
      deformReboundPullRatio: this.softDeform?.lastReboundPullRatio ?? 0,
      deformReboundResponse: this.softDeform?.lastReboundResponse ?? 0,
      deformEnabled: this.softDeform !== null,
      deformRenderableMeshes: this.softDeform?.totalRenderableMeshes ?? 0,
      deformBoundRenderableMeshes: this.softDeform?.boundRenderableMeshes ?? 0,
      deformGrabEdgeFactor: this.softDeform?.currentGrabProfile.edgeFactor ?? 0,
      deformGrabCornerFactor: this.softDeform?.currentGrabProfile.cornerFactor ?? 0,
      deformGrabCenterFactor: this.softDeform?.currentGrabProfile.centerFactor ?? 0,
      deformWholeCoupling: this.softDeform?.currentGrabProfile.wholeCoupling ?? 0,
      deformLocalGain: this.softDeform?.currentGrabProfile.localGain ?? 0,
      deformIndentStrength: this.softDeform?.currentGrabProfile.indentStrength ?? 0,
      orbitAzimuth: this.controls.getAzimuthalAngle(),
      performanceSessions: performanceState.sessions,
      performanceTimelineOwners: performanceState.timelineOwners,
      performanceElapsed: performanceState.elapsedByKind[this.currentDefinition.id] ?? 0,
      performanceActiveByKind: performanceState.activeByKind,
      performanceCapacityByKind: performanceState.capacityByKind,
      activeToastNdc: performanceState.activeToastNdc,
      lampBeam: performanceState.lampBeam,
      radio: performanceState.radio,
      hairDryer: performanceState.hairDryer,
      refrigerator: performanceState.refrigerator,
      spectacleSessions: performanceState.sessions,
      spectacleActiveTotal: performanceState.activeTotal,
      petalBurstCount: this.petals.activeBurstCount,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
    };
    this.frameId = requestAnimationFrame(this.animate);
  };

  private resize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect || rect.width < 1 || rect.height < 1) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(rect.width, rect.height, false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
  }

  private disposeCurrent(): void {
    this.finishDeformPointer(false);
    this.softDeform?.reset();
    this.softDeform = null;
    if (this.galleryTarget) this.performances.stop(this.galleryTarget);
    this.galleryTarget = null;
    if (!this.current) return;
    this.current.root.removeFromParent();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>(this.current.materials);
    this.current.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      const entries = Array.isArray(object.material) ? object.material : [object.material];
      entries.forEach((material) => materials.add(material));
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    this.current = null;
  }

  private createLighting(): void {
    const key = this.key;
    key.position.set(-5.5, 8, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    const fill = this.fill;
    fill.position.set(6, 3, 5);
    const rim = this.rim;
    rim.position.set(0, 4, -6);
    this.scene.add(key, fill, rim, this.hemi);
  }

  private applyTheme(): void {
    const progress = this.theme.progress;
    const dayBackground = new THREE.Color(0xe9edf6);
    const nightBackground = new THREE.Color(0x2f3150);
    const background = dayBackground.lerp(nightBackground, progress);
    this.scene.background = background;
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(background);
    }
    this.key.color.set(PAL.sun).lerp(new THREE.Color(0xd6ddf4), progress);
    this.fill.color.set(PAL.fill).lerp(new THREE.Color(0xaeb8d5), progress);
    this.rim.color.set(0xf7c8da).lerp(new THREE.Color(0xc4a8bd), progress);
    this.hemi.color.set(PAL.hemiSky).lerp(new THREE.Color(0xb5c2dc), progress);
    this.hemi.groundColor.set(PAL.hemiGround).lerp(new THREE.Color(0x77788e), progress);
    this.key.intensity = THREE.MathUtils.lerp(2.35, 0.84, progress);
    this.fill.intensity = THREE.MathUtils.lerp(1.08, 0.62, progress);
    this.rim.intensity = THREE.MathUtils.lerp(0.48, 0.28, progress);
    this.hemi.intensity = THREE.MathUtils.lerp(1.2, 0.7, progress);
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.isOpen) this.close();
  };
}
