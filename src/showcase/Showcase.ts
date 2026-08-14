import * as THREE from 'three';
import { createPlugHead, PLUG_STYLE_IDS, PLUG_STYLE_LABELS, type PlugHead } from '../render/PlugParts';
import { ARROW_COLORS, PAL } from '../style/palette';
import { createCableToonMaterial, createRoundedCableGeometry } from '../render/CableGeometry';
import { APPLIANCE_CATALOG } from '../systems/ApplianceCatalog';
import { ApplianceTarget } from '../systems/ApplianceScene';
import type { ThemeController } from '../theme/ThemeController';

export type ShowcaseMode = 'plugs' | 'appliances';

export class Showcase {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 60);
  private readonly plugHeads: PlugHead[] = [];
  private readonly appliances: ApplianceTarget[] = [];
  private readonly disposables: THREE.BufferGeometry[] = [];
  private readonly disposableMaterials = new Set<THREE.Material>();
  private readonly debugMeshes: THREE.Mesh[] = [];
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private frameId = 0;
  private previousTime = performance.now() * 0.001;
  private readonly onResize = () => this.resize();
  private readonly query = new URLSearchParams(window.location.search);
  private readonly plugView = this.query.get('view') ?? 'three-quarter';
  private readonly explodeAmount = THREE.MathUtils.clamp(Number(this.query.get('explode') ?? 0) || 0, 0, 1);
  private readonly plugDebugEnabled = this.query.get('parts') === '1' || this.explodeAmount > 0;
  private selectedPart: string | null = null;
  private readonly onPointerDown = (event: PointerEvent) => this.pickPlugPart(event);

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly mode: ShowcaseMode,
    theme?: ThemeController,
  ) {
    document.body.classList.add('showcase-mode');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(PAL.fog, 1);
    this.scene.background = new THREE.Color(PAL.fog);
    this.scene.add(new THREE.HemisphereLight(PAL.hemiSky, PAL.hemiGround, 1.55));
    const sun = new THREE.DirectionalLight(PAL.sun, 2.35);
    sun.position.set(-5, 9, 8);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(PAL.fill, 0.9);
    fill.position.set(7, 3, 6);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(PAL.blossomLight, 0.34);
    rim.position.set(-7, 5, -6);
    this.scene.add(rim);
    if (theme?.targetMode === 'night') {
      this.renderer.setClearColor(0x171b30, 1);
      this.scene.background = new THREE.Color(0x171b30);
      sun.color.set(0x8195d8);
      sun.intensity = 0.48;
      fill.color.set(0x52648f);
      fill.intensity = 0.34;
      rim.color.set(0x9b7392);
      rim.intensity = 0.2;
    }
    this.camera.position.set(0, 0.4, 14);
    this.camera.lookAt(0, 0, 0);

    if (mode === 'plugs') this.buildPlugBoard();
    else this.buildApplianceBoard();
    this.buildHeading();
    this.resize();
    window.addEventListener('resize', this.onResize);
    if (mode === 'plugs' && this.plugDebugEnabled) {
      this.canvas.addEventListener('pointerdown', this.onPointerDown);
    }
    this.publishPlugDiagnostics();
  }

  start(): void {
    const tick = () => {
      const now = performance.now() * 0.001;
      const delta = Math.min(0.05, now - this.previousTime);
      this.previousTime = now;
      this.appliances.forEach((appliance) => appliance.update(delta, now));
      this.renderer.render(this.scene, this.camera);
      this.publishPlugDiagnostics();
      this.frameId = requestAnimationFrame(tick);
    };
    tick();
  }

  dispose(): void {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.plugHeads.forEach((head) => head.dispose());
    this.appliances.forEach((appliance) => appliance.dispose());
    this.disposables.forEach((geometry) => geometry.dispose());
    this.disposableMaterials.forEach((material) => material.dispose());
    this.renderer.dispose();
    document.querySelector('.showcase-overlay')?.remove();
    document.body.classList.remove('showcase-mode');
    delete window.__PLUG_SHOWCASE_DIAGNOSTICS__;
  }

  private buildPlugBoard(): void {
    const spacing = 2.25;
    PLUG_STYLE_IDS.forEach((styleId, index) => {
      const color = ARROW_COLORS[index];
      const group = new THREE.Group();
      group.position.set((index - 3) * spacing, -0.25, 0);
      if (this.plugView === 'front') group.rotation.set(0.06, 0, -0.04);
      else if (this.plugView === 'side') group.rotation.set(0.06, -Math.PI * 0.5, -0.04);
      else group.rotation.set(0.12, -0.36, -0.08);
      const head = createPlugHead(color, 3.25, index === 1 || index === 6, styleId);
      this.applyPlugDebug(head);
      const cableGeometry = createRoundedCableGeometry([
        new THREE.Vector3(0, -0.82, 0),
        new THREE.Vector3(0, 0.02, 0),
      ]).geometry;
      this.disposables.push(cableGeometry);
      const cableMaterial = createCableToonMaterial(color);
      this.disposableMaterials.add(cableMaterial);
      const cable = new THREE.Mesh(cableGeometry, cableMaterial);
      cable.castShadow = true;
      group.add(cable, head.root);
      this.plugHeads.push(head);
      this.scene.add(group);
    });
  }

  private buildApplianceBoard(): void {
    const spacing = 2.45;
    APPLIANCE_CATALOG.forEach((definition, index) => {
      const color = ARROW_COLORS[index % ARROW_COLORS.length];
      const appliance = new ApplianceTarget(definition, color, [0.5, 0.5]);
      const column = index % 7;
      const row = Math.floor(index / 7);
      appliance.root.rotation.y = row === 0 ? 0.42 : -0.42;
      appliance.root.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(appliance.root);
      const baseline = row === 0 ? 1.05 : -3.05;
      appliance.root.position.set((column - 3) * spacing, baseline - bounds.min.y, 0);
      appliance.activate(color);
      this.appliances.push(appliance);
      this.scene.add(appliance.root);
    });
  }

  private buildHeading(): void {
    const overlay = document.createElement('section');
    overlay.className = `showcase-overlay showcase-${this.mode}`;
    const title = this.mode === 'plugs' ? '7 PLUG SPIRIT FORMS' : '14 HOME APPLIANCES';
    const subtitle = this.mode === 'plugs'
      ? '统一圆柱语言 · 同一安全包络 · 七种接电端'
      : 'S / M / L / XL 真实体块比例 · Sakura 家电目录';
    overlay.innerHTML = `<header><span>SAKURA HOME CIRCUIT / STYLE BOARD</span><h1>${title}</h1><p>${subtitle}</p></header>`;
    const labels = document.createElement('div');
    labels.className = 'showcase-labels';
    const items = this.mode === 'plugs'
      ? PLUG_STYLE_IDS.map((id) => PLUG_STYLE_LABELS[id])
      : APPLIANCE_CATALOG.map((item) => `${item.label} · ${item.sizeTier}`);
    items.forEach((label, index) => {
      const item = document.createElement('span');
      item.textContent = label;
      item.style.setProperty('--column', String(index % 7));
      item.style.setProperty('--row', String(Math.floor(index / 7)));
      labels.append(item);
    });
    overlay.append(labels);
    if (this.mode === 'plugs' && this.plugDebugEnabled) {
      const status = document.createElement('output');
      status.className = 'showcase-debug-status';
      status.textContent = `PART DEBUG · EXPLODE ${this.explodeAmount.toFixed(2)} · CLICK A COMPONENT`;
      Object.assign(status.style, {
        position: 'absolute',
        right: '2.2rem',
        bottom: '4.4rem',
        padding: '0.55rem 0.75rem',
        border: `1px solid #${PAL.ink.toString(16).padStart(6, '0')}`,
        background: 'rgba(248, 243, 238, 0.92)',
        color: `#${PAL.ink.toString(16).padStart(6, '0')}`,
        font: '600 11px/1.2 monospace',
        letterSpacing: '0.08em',
      });
      overlay.append(status);
    }
    document.querySelector('#app')?.append(overlay);
  }

  private applyPlugDebug(head: PlugHead): void {
    const runtime = head.root.userData.sculptRuntime as {
      nodes: Record<string, THREE.Object3D>;
    };
    const offsets: Record<string, THREE.Vector3> = {
      'strain-relief': new THREE.Vector3(0, -0.18, 0),
      'rear-neck': new THREE.Vector3(0, -0.09, 0),
      'outer-shell': new THREE.Vector3(0, 0, 0),
      'front-shoulder': new THREE.Vector3(0, 0.12, 0),
      'interface-faceplate': new THREE.Vector3(0, 0.2, 0),
      'terminal-assembly': new THREE.Vector3(0, 0.34, 0),
      'status-indicator': new THREE.Vector3(0.13, 0.03, 0),
    };
    Object.entries(offsets).forEach(([partId, offset]) => {
      const node = runtime.nodes[partId];
      if (!node) return;
      node.userData.partId = partId;
      node.position.addScaledVector(offset, this.explodeAmount);
    });
    head.root.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.partId && !object.userData.isOutline) {
        this.debugMeshes.push(object);
      }
    });
  }

  private pickPlugPart(event: PointerEvent): void {
    if (!this.plugDebugEnabled || this.mode !== 'plugs') return;
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.debugMeshes, false)[0]?.object;
    if (!hit) return;
    const partId = String(hit.userData.partId ?? 'unknown-part');
    const styleId = String(hit.userData.plugStyleId ?? hit.parent?.userData.plugStyleId ?? 'unknown-style');
    this.selectedPart = `${styleId}:${partId}`;
    document.body.dataset.selectedPlugPart = this.selectedPart;
    this.plugHeads.forEach((head) => head.setHovered(head.styleId === styleId));
    const status = document.querySelector<HTMLOutputElement>('.showcase-debug-status');
    if (status) status.textContent = `SELECTED · ${this.selectedPart}`;
    this.publishPlugDiagnostics();
  }

  private publishPlugDiagnostics(): void {
    if (this.mode !== 'plugs') return;
    window.__PLUG_SHOWCASE_DIAGNOSTICS__ = {
      styleCount: this.plugHeads.length,
      view: this.plugView,
      debugEnabled: this.plugDebugEnabled,
      explodeAmount: this.explodeAmount,
      selectableParts: [...new Set(this.debugMeshes.map((mesh) => String(mesh.userData.partId)))].sort(),
      selectedPart: this.selectedPart,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
    };
  }

  private resize(): void {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    const aspect = width / height;
    const vertical = this.mode === 'plugs' ? 5.1 : 5.3;
    this.camera.top = vertical;
    this.camera.bottom = -vertical;
    this.camera.left = -vertical * aspect;
    this.camera.right = vertical * aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(width, height, false);
  }
}
