import { Cn as Raycaster, H as Group, Mn as SRGBColorSpace, Pn as Scene, W as HemisphereLight, dr as Vector3, ft as MathUtils, ht as Mesh, k as DirectionalLight, kt as OrthographicCamera, p as Color, r as Box3, ur as Vector2 } from "./three.core-DlTOC7bx.js";
import { n as PAL, s as WebGLRenderer, t as ARROW_COLORS } from "./palette-knpLSfXB.js";
import { t as APPLIANCE_CATALOG } from "./ApplianceCatalog-B_KJFoGh.js";
import { T as installJellyEnvironment } from "./BufferGeometryUtils-CSuwXBGj.js";
import { C as createCableToonMaterial, h as createPlugHead, m as PLUG_STYLE_LABELS, n as ApplianceTarget, p as PLUG_STYLE_IDS, w as createRoundedCableGeometry } from "./ApplianceScene-BAgDuc3d.js";
//#region src/showcase/Showcase.ts
var Showcase = class {
	canvas;
	mode;
	renderer;
	scene = new Scene();
	disposeJellyEnvironment = null;
	camera = new OrthographicCamera(-8, 8, 4.5, -4.5, .1, 60);
	plugHeads = [];
	appliances = [];
	disposables = [];
	disposableMaterials = /* @__PURE__ */ new Set();
	debugMeshes = [];
	raycaster = new Raycaster();
	pointer = new Vector2();
	frameId = 0;
	previousTime = performance.now() * .001;
	onResize = () => this.resize();
	query = new URLSearchParams(window.location.search);
	plugView = this.query.get("view") ?? "three-quarter";
	explodeAmount = MathUtils.clamp(Number(this.query.get("explode") ?? 0) || 0, 0, 1);
	plugDebugEnabled = this.query.get("parts") === "1" || this.explodeAmount > 0;
	selectedPart = null;
	onPointerDown = (event) => this.pickPlugPart(event);
	constructor(canvas, mode, theme) {
		this.canvas = canvas;
		this.mode = mode;
		document.body.classList.add("showcase-mode");
		this.renderer = new WebGLRenderer({
			canvas,
			antialias: true,
			powerPreference: "high-performance"
		});
		this.renderer.outputColorSpace = SRGBColorSpace;
		this.renderer.toneMapping = 0;
		this.renderer.toneMappingExposure = 1;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = 1;
		this.renderer.setClearColor(PAL.fog, 1);
		this.scene.background = new Color(PAL.fog);
		this.disposeJellyEnvironment = installJellyEnvironment(this.renderer, this.scene);
		this.scene.add(new HemisphereLight(PAL.hemiSky, PAL.hemiGround, 1.55));
		const sun = new DirectionalLight(PAL.sun, 2.35);
		sun.position.set(-5, 9, 8);
		this.scene.add(sun);
		const fill = new DirectionalLight(PAL.fill, .9);
		fill.position.set(7, 3, 6);
		this.scene.add(fill);
		const rim = new DirectionalLight(PAL.blossomLight, .34);
		rim.position.set(-7, 5, -6);
		this.scene.add(rim);
		if (theme?.targetMode === "night") {
			this.renderer.setClearColor(1514288, 1);
			this.scene.background = new Color(1514288);
			sun.color.set(8492504);
			sun.intensity = .48;
			fill.color.set(5399695);
			fill.intensity = .34;
			rim.color.set(10187666);
			rim.intensity = .2;
		}
		this.camera.position.set(0, .4, 14);
		this.camera.lookAt(0, 0, 0);
		if (mode === "plugs") this.buildPlugBoard();
		else this.buildApplianceBoard();
		this.buildHeading();
		this.resize();
		window.addEventListener("resize", this.onResize);
		if (mode === "plugs" && this.plugDebugEnabled) this.canvas.addEventListener("pointerdown", this.onPointerDown);
		this.publishPlugDiagnostics();
	}
	start() {
		const tick = () => {
			const now = performance.now() * .001;
			const delta = Math.min(.05, now - this.previousTime);
			this.previousTime = now;
			this.appliances.forEach((appliance) => appliance.update(delta, now));
			this.renderer.render(this.scene, this.camera);
			this.publishPlugDiagnostics();
			this.frameId = requestAnimationFrame(tick);
		};
		tick();
	}
	dispose() {
		cancelAnimationFrame(this.frameId);
		window.removeEventListener("resize", this.onResize);
		this.canvas.removeEventListener("pointerdown", this.onPointerDown);
		this.plugHeads.forEach((head) => head.dispose());
		this.appliances.forEach((appliance) => appliance.dispose());
		this.disposables.forEach((geometry) => geometry.dispose());
		this.disposableMaterials.forEach((material) => material.dispose());
		this.disposeJellyEnvironment?.();
		this.renderer.dispose();
		document.querySelector(".showcase-overlay")?.remove();
		document.body.classList.remove("showcase-mode");
		delete window.__PLUG_SHOWCASE_DIAGNOSTICS__;
	}
	buildPlugBoard() {
		const spacing = 2.25;
		PLUG_STYLE_IDS.forEach((styleId, index) => {
			const color = ARROW_COLORS[index];
			const group = new Group();
			group.position.set((index - 3) * spacing, -.25, 0);
			if (this.plugView === "front") group.rotation.set(.06, 0, -.04);
			else if (this.plugView === "side") group.rotation.set(.06, -Math.PI * .5, -.04);
			else group.rotation.set(.12, -.36, -.08);
			const head = createPlugHead(color, 3.25, index === 1 || index === 6, styleId);
			this.applyPlugDebug(head);
			const cableGeometry = createRoundedCableGeometry([new Vector3(0, -.82, 0), new Vector3(0, .02, 0)]).geometry;
			this.disposables.push(cableGeometry);
			const cableMaterial = createCableToonMaterial(color);
			this.disposableMaterials.add(cableMaterial);
			const cable = new Mesh(cableGeometry, cableMaterial);
			cable.castShadow = true;
			group.add(cable, head.root);
			this.plugHeads.push(head);
			this.scene.add(group);
		});
	}
	buildApplianceBoard() {
		const spacing = 2.45;
		APPLIANCE_CATALOG.forEach((definition, index) => {
			const color = ARROW_COLORS[index % ARROW_COLORS.length];
			const appliance = new ApplianceTarget(definition, color, [.5, .5]);
			const column = index % 7;
			const row = Math.floor(index / 7);
			appliance.root.rotation.y = row === 0 ? .42 : -.42;
			appliance.root.updateMatrixWorld(true);
			const bounds = new Box3().setFromObject(appliance.root);
			const baseline = row === 0 ? 1.05 : -3.05;
			appliance.root.position.set((column - 3) * spacing, baseline - bounds.min.y, 0);
			appliance.activate(color);
			this.appliances.push(appliance);
			this.scene.add(appliance.root);
		});
	}
	buildHeading() {
		const overlay = document.createElement("section");
		overlay.className = `showcase-overlay showcase-${this.mode}`;
		overlay.innerHTML = `<header><span>SAKURA HOME CIRCUIT / STYLE BOARD</span><h1>${this.mode === "plugs" ? "7 PLUG SPIRIT FORMS" : "14 HOME APPLIANCES"}</h1><p>${this.mode === "plugs" ? "统一圆柱语言 · 同一安全包络 · 七种接电端" : "S / M / L / XL 真实体块比例 · Sakura 家电目录"}</p></header>`;
		const labels = document.createElement("div");
		labels.className = "showcase-labels";
		(this.mode === "plugs" ? PLUG_STYLE_IDS.map((id) => PLUG_STYLE_LABELS[id]) : APPLIANCE_CATALOG.map((item) => `${item.label} · ${item.sizeTier}`)).forEach((label, index) => {
			const item = document.createElement("span");
			item.textContent = label;
			item.style.setProperty("--column", String(index % 7));
			item.style.setProperty("--row", String(Math.floor(index / 7)));
			labels.append(item);
		});
		overlay.append(labels);
		if (this.mode === "plugs" && this.plugDebugEnabled) {
			const status = document.createElement("output");
			status.className = "showcase-debug-status";
			status.textContent = `PART DEBUG · EXPLODE ${this.explodeAmount.toFixed(2)} · CLICK A COMPONENT`;
			Object.assign(status.style, {
				position: "absolute",
				right: "2.2rem",
				bottom: "4.4rem",
				padding: "0.55rem 0.75rem",
				border: `1px solid #${PAL.ink.toString(16).padStart(6, "0")}`,
				background: "rgba(248, 243, 238, 0.92)",
				color: `#${PAL.ink.toString(16).padStart(6, "0")}`,
				font: "600 11px/1.2 monospace",
				letterSpacing: "0.08em"
			});
			overlay.append(status);
		}
		document.querySelector("#app")?.append(overlay);
	}
	applyPlugDebug(head) {
		const runtime = head.root.userData.sculptRuntime;
		const offsets = {
			"strain-relief": new Vector3(0, -.18, 0),
			"rear-neck": new Vector3(0, -.09, 0),
			"outer-shell": new Vector3(0, 0, 0),
			"front-shoulder": new Vector3(0, .12, 0),
			"interface-faceplate": new Vector3(0, .2, 0),
			"terminal-assembly": new Vector3(0, .34, 0),
			"status-indicator": new Vector3(.13, .03, 0)
		};
		Object.entries(offsets).forEach(([partId, offset]) => {
			const node = runtime.nodes[partId];
			if (!node) return;
			node.userData.partId = partId;
			node.position.addScaledVector(offset, this.explodeAmount);
		});
		head.root.traverse((object) => {
			if (object instanceof Mesh && object.userData.partId && !object.userData.isOutline) this.debugMeshes.push(object);
		});
	}
	pickPlugPart(event) {
		if (!this.plugDebugEnabled || this.mode !== "plugs") return;
		const bounds = this.canvas.getBoundingClientRect();
		this.pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
		this.raycaster.setFromCamera(this.pointer, this.camera);
		const hit = this.raycaster.intersectObjects(this.debugMeshes, false)[0]?.object;
		if (!hit) return;
		const partId = String(hit.userData.partId ?? "unknown-part");
		const styleId = String(hit.userData.plugStyleId ?? hit.parent?.userData.plugStyleId ?? "unknown-style");
		this.selectedPart = `${styleId}:${partId}`;
		document.body.dataset.selectedPlugPart = this.selectedPart;
		this.plugHeads.forEach((head) => head.setHovered(head.styleId === styleId));
		const status = document.querySelector(".showcase-debug-status");
		if (status) status.textContent = `SELECTED · ${this.selectedPart}`;
		this.publishPlugDiagnostics();
	}
	publishPlugDiagnostics() {
		if (this.mode !== "plugs") return;
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
			textures: this.renderer.info.memory.textures
		};
	}
	resize() {
		const width = Math.max(1, this.canvas.clientWidth);
		const height = Math.max(1, this.canvas.clientHeight);
		const aspect = width / height;
		const vertical = this.mode === "plugs" ? 5.1 : 5.3;
		this.camera.top = vertical;
		this.camera.bottom = -vertical;
		this.camera.left = -vertical * aspect;
		this.camera.right = vertical * aspect;
		this.camera.updateProjectionMatrix();
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
		this.renderer.setSize(width, height, false);
	}
};
//#endregion
export { Showcase };
