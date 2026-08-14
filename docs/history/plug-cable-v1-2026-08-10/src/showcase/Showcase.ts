import * as THREE from 'three';
import { createPlugHead, PLUG_STYLE_IDS, PLUG_STYLE_LABELS, type PlugHead } from '../render/PlugParts';
import { ARROW_COLORS, PAL } from '../style/palette';
import { cel } from '../style/toon';
import { APPLIANCE_CATALOG } from '../systems/ApplianceCatalog';
import { ApplianceTarget } from '../systems/ApplianceScene';

export type ShowcaseMode = 'plugs' | 'appliances';

export class Showcase {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 60);
  private readonly plugHeads: PlugHead[] = [];
  private readonly appliances: ApplianceTarget[] = [];
  private readonly disposables: THREE.BufferGeometry[] = [];
  private frameId = 0;
  private previousTime = performance.now() * 0.001;
  private readonly onResize = () => this.resize();

  constructor(private readonly canvas: HTMLCanvasElement, private readonly mode: ShowcaseMode) {
    document.body.classList.add('showcase-mode');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
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
    this.camera.position.set(0, 0.4, 14);
    this.camera.lookAt(0, 0, 0);

    if (mode === 'plugs') this.buildPlugBoard();
    else this.buildApplianceBoard();
    this.buildHeading();
    this.resize();
    window.addEventListener('resize', this.onResize);
  }

  start(): void {
    const tick = () => {
      const now = performance.now() * 0.001;
      const delta = Math.min(0.05, now - this.previousTime);
      this.previousTime = now;
      this.appliances.forEach((appliance) => appliance.update(delta, now));
      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(tick);
    };
    tick();
  }

  dispose(): void {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.plugHeads.forEach((head) => head.dispose());
    this.appliances.forEach((appliance) => appliance.dispose());
    this.disposables.forEach((geometry) => geometry.dispose());
    this.renderer.dispose();
    document.querySelector('.showcase-overlay')?.remove();
    document.body.classList.remove('showcase-mode');
  }

  private buildPlugBoard(): void {
    const spacing = 2.25;
    PLUG_STYLE_IDS.forEach((styleId, index) => {
      const color = ARROW_COLORS[index];
      const group = new THREE.Group();
      group.position.set((index - 3) * spacing, -0.25, 0);
      group.rotation.set(0.12, -0.36, -0.08);
      const head = createPlugHead(color, 3.25, index === 1 || index === 6, styleId);
      const cableGeometry = new THREE.CylinderGeometry(0.105, 0.105, 0.82, 10);
      cableGeometry.translate(0, -0.4, 0);
      this.disposables.push(cableGeometry);
      const cable = new THREE.Mesh(cableGeometry, cel({ color, bands: 3, tint: 0x6c5f8c }));
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
    document.querySelector('#app')?.append(overlay);
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
