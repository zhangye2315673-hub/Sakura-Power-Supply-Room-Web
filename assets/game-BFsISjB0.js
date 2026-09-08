const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./Showcase-CYQrTxFc.js","./three.core-DlTOC7bx.js","./palette-CaCEpJJd.js","./ApplianceCatalog-2_-hlaHk.js","./BufferGeometryUtils-Bf_-bT2g.js","./ApplianceScene-CX3l5-cl.js","./outline-Brkgge31.js","./alarmClock-DapLoRtU.js","./rolldown-runtime-D7D4PA-g.js","./blender-D3SUTsso.js","./bubbleMachine-C8qJWgMF.js","./coffeeMaker-BayCLVWo.js","./dehumidifier-CTcn8U8a.js","./desktopComputer-9F9NWp_c.js","./fan-CWMxlgrl.js","./gameController-Banx8Yuu.js","./gumballMachine-BjLcMUlR.js","./hairDryer-Rbu24a5c.js","./humidifier-CiX5SZb9.js","./inductionCooktop-6pZRMZiZ.js","./kettle-DQ0-awcn.js","./lamp-u_hXl3EH.js","./microwave-CsGOMMka.js","./phone-8TF9hijf.js","./popcornMachine-BLx5vYyi.js","./ParametricGeometry-B8cqH16S.js","./portableSpeaker-CACSoz-x.js","./printer-YiClCeLS.js","./radio-Bbam5g2u.js","./recordPlayer-CrSQrUV-.js","./refrigerator-CdvVnztT.js","./riceCooker-D5hHPZl-.js","./robotVacuum-BFFHDfj_.js","./smartBin-DhQKDqV5.js","./standMixer-Dsx5uCx_.js","./television-CMOKW76F.js","./toaster-DiU7ds3y.js","./washer-DBzI1vUj.js","./Game-iyQCvabh.js","./SkillCardPresentation-DHqhExU7.js","./SkillCardPresentation-BSlqHYEv.css","./PetalField-DFT0OWiW.js","./SkillPresentationController-D9rBle5u.js"])))=>i.map(i=>d[i]);
import "./modulepreload-polyfill-BsPm7yBB.js";
import { ft as MathUtils, p as Color } from "./three.core-DlTOC7bx.js";
import { t as __vitePreload } from "./preload-helper-DHlaQ_oz.js";
//#region src/theme/ThemeController.ts
var STORAGE_KEY = "sakura.theme";
var DAY_COLOR = new Color(13953274);
var NIGHT_COLOR = new Color(1119532);
var START_INK_DAY = new Color(3748431);
var START_INK_NIGHT = new Color(14277096);
var START_MUTED_DAY = new Color(6445938);
var START_MUTED_NIGHT = new Color(12040397);
var START_FAINT_DAY = new Color(8485263);
var START_FAINT_NIGHT = new Color(9870008);
function resolveInitialTheme(search, savedTheme, internalEntry) {
	const query = new URLSearchParams(search).get("theme");
	if (query === "day" || query === "night") return {
		mode: query,
		source: "query"
	};
	if (!internalEntry && (savedTheme === "day" || savedTheme === "night")) return {
		mode: savedTheme,
		source: "saved"
	};
	return {
		mode: "day",
		source: "default"
	};
}
var ThemeController = class {
	progressValue;
	target;
	sourceValue;
	listeners = /* @__PURE__ */ new Set();
	motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
	reducedMotionValue = this.motionQuery.matches;
	lastUpdateAt = performance.now();
	constructor(options = {}) {
		let savedTheme = null;
		try {
			savedTheme = localStorage.getItem(STORAGE_KEY);
		} catch {}
		const initial = resolveInitialTheme(window.location.search, savedTheme, options.internalEntry ?? false);
		this.target = initial.mode;
		this.progressValue = initial.mode === "night" ? 1 : 0;
		this.sourceValue = initial.source;
		this.motionQuery.addEventListener("change", this.onMotionPreferenceChange);
		this.applyDocumentTheme();
	}
	get progress() {
		return this.progressValue;
	}
	get targetMode() {
		return this.target;
	}
	get snapshot() {
		return {
			mode: this.progressValue <= 0 ? "day" : this.progressValue >= 1 ? "night" : this.target,
			targetMode: this.target,
			progress: this.progressValue,
			transitioning: this.progressValue > 0 && this.progressValue < 1,
			reducedMotion: this.reducedMotionValue,
			source: this.sourceValue
		};
	}
	toggle() {
		this.setMode(this.target === "night" ? "day" : "night", true);
	}
	setMode(mode, persist = false) {
		if (persist) {
			this.sourceValue = "manual";
			try {
				localStorage.setItem(STORAGE_KEY, mode);
			} catch {}
		}
		if (mode === this.target && !persist) return;
		this.target = mode;
		this.emit();
	}
	update(delta) {
		const now = performance.now();
		const wallDelta = Math.min(.05, Math.max(delta, Math.max(0, (now - this.lastUpdateAt) / 1e3)));
		this.lastUpdateAt = now;
		const targetProgress = this.target === "night" ? 1 : 0;
		if (this.progressValue === targetProgress) return;
		const duration = this.reducedMotionValue ? this.target === "night" ? .2 : .16 : this.target === "night" ? 1.1 : .8;
		this.progressValue = MathUtils.clamp(this.progressValue + Math.sign(targetProgress - this.progressValue) * wallDelta / duration, 0, 1);
		if (Math.abs(this.progressValue - targetProgress) < 1e-4) this.progressValue = targetProgress;
		this.applyDocumentTheme();
		this.emit();
	}
	subscribe(listener) {
		this.listeners.add(listener);
		listener(this.snapshot);
		return () => this.listeners.delete(listener);
	}
	dispose() {
		this.motionQuery.removeEventListener("change", this.onMotionPreferenceChange);
		this.listeners.clear();
	}
	onMotionPreferenceChange = (event) => {
		this.reducedMotionValue = event.matches;
		this.applyDocumentTheme();
		this.emit();
	};
	emit() {
		const snapshot = this.snapshot;
		this.listeners.forEach((listener) => listener(snapshot));
	}
	applyDocumentTheme() {
		const color = DAY_COLOR.clone().lerp(NIGHT_COLOR, this.progressValue);
		const startInk = START_INK_DAY.clone().lerp(START_INK_NIGHT, this.progressValue);
		const startMuted = START_MUTED_DAY.clone().lerp(START_MUTED_NIGHT, this.progressValue);
		const startFaint = START_FAINT_DAY.clone().lerp(START_FAINT_NIGHT, this.progressValue);
		const cssColor = `#${color.getHexString()}`;
		const root = document.documentElement;
		root.style.setProperty("--theme-progress", this.progressValue.toFixed(4));
		root.style.setProperty("--page-background", cssColor);
		root.style.setProperty("--start-night-opacity", this.progressValue.toFixed(4));
		root.style.setProperty("--start-ink", `#${startInk.getHexString()}`);
		root.style.setProperty("--start-muted", `#${startMuted.getHexString()}`);
		root.style.setProperty("--start-faint", `#${startFaint.getHexString()}`);
		root.dataset.theme = this.progressValue >= .5 ? "night" : "day";
		root.classList.toggle("theme-transitioning", this.progressValue > 0 && this.progressValue < 1);
		root.classList.toggle("reduced-motion", this.reducedMotionValue);
		document.body.style.backgroundColor = cssColor;
		const meta = document.querySelector("meta[name=\"theme-color\"]");
		if (meta) meta.content = cssColor;
	}
};
//#endregion
//#region src/main.ts
var canvas = document.querySelector("#game-canvas");
if (!canvas) throw new Error("Missing #game-canvas element.");
var showcaseMode = new URLSearchParams(window.location.search).get("showcase");
var experience = null;
var showcaseTheme = null;
if (showcaseMode === "plugs" || showcaseMode === "appliances") showcaseTheme = new ThemeController({ internalEntry: true });
requestAnimationFrame(() => {
	document.documentElement.classList.add("app-ready");
	requestAnimationFrame(() => void boot());
});
async function boot() {
	if (showcaseMode === "plugs" || showcaseMode === "appliances") {
		document.documentElement.classList.remove("opening-active");
		const startScreen = document.querySelector("#start-screen");
		if (startScreen) startScreen.hidden = true;
		const { Showcase } = await __vitePreload(async () => {
			const { Showcase } = await import("./Showcase-CYQrTxFc.js");
			return { Showcase };
		}, __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37]), import.meta.url);
		experience = new Showcase(canvas, showcaseMode, showcaseTheme ?? void 0);
	} else {
		const { Game } = await __vitePreload(async () => {
			const { Game } = await import("./Game-iyQCvabh.js");
			return { Game };
		}, __vite__mapDeps([38,1,2,39,3,40,4,41,42,6,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37]), import.meta.url);
		experience = new Game(canvas);
	}
	experience.start();
}
//#endregion
export { ThemeController as t };
