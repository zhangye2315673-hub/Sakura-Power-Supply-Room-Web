const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./Showcase-DU9uD3df.js","./three.core-DlTOC7bx.js","./palette-knpLSfXB.js","./ApplianceCatalog-2_-hlaHk.js","./BufferGeometryUtils-B_UDylAy.js","./ApplianceScene-WEwWE_VL.js","./outline-BxlNUz10.js","./alarmClock-BNlAQNeN.js","./rolldown-runtime-D7D4PA-g.js","./blender-BDBHYjdo.js","./bubbleMachine-D2b3QY1Z.js","./coffeeMaker-B2t1DEA1.js","./dehumidifier-8cAY-H4Y.js","./desktopComputer-CG4Fq4Jb.js","./fan-BMhmD4-i.js","./gameController-D1xOIvTz.js","./gumballMachine-BY4TpQxR.js","./hairDryer-BrQ5r1Ff.js","./humidifier-t_mXQZ6z.js","./inductionCooktop-D_3vZVVR.js","./kettle--aaeMZVw.js","./lamp-DScv1mJm.js","./microwave-CxH7q6I_.js","./phone-XQIskcS6.js","./popcornMachine-BHftRIvL.js","./ParametricGeometry-CNqXT5Mu.js","./portableSpeaker-B5SWK5eq.js","./printer-Zr8hcY-8.js","./radio-L7jYXCvV.js","./recordPlayer-XJTtlw6v.js","./refrigerator-bFxs-Qd0.js","./riceCooker-CGLqYEX-.js","./robotVacuum-D0csz3kr.js","./smartBin-DJVpKjGh.js","./standMixer-BZzMtHNs.js","./television-CF1VEOG3.js","./toaster-DCkoL_wG.js","./washer-CyT15SzA.js","./Game-C6fBlxsp.js","./SkillCardPresentation-a3SX2Cg4.js","./SkillCardPresentation-DjLJF6gD.css","./PetalField-Db8ZGoQQ.js","./SkillPresentationController-Cu0MYo2a.js"])))=>i.map(i=>d[i]);
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
	autoElapsedValue = 0;
	automaticValue = true;
	automaticTransition = false;
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
			source: this.sourceValue,
			automatic: this.automaticValue,
			autoElapsed: this.autoElapsedValue,
			autoInterval: 45,
			autoRemaining: Math.max(0, 45 - this.autoElapsedValue)
		};
	}
	toggle() {
		this.setMode(this.target === "night" ? "day" : "night", true);
	}
	setMode(mode, persist = false) {
		this.automaticTransition = false;
		if (persist) {
			this.autoElapsedValue = 0;
			this.sourceValue = "manual";
			try {
				localStorage.setItem(STORAGE_KEY, mode);
			} catch {}
		}
		if (mode === this.target && !persist) return;
		this.target = mode;
		this.emit();
	}
	update(delta, automatic = true) {
		const now = performance.now();
		const elapsed = Math.min(1, Math.max(0, delta, (now - this.lastUpdateAt) / 1e3));
		this.automaticValue = automatic;
		if (automatic && !document.hidden) {
			this.autoElapsedValue += elapsed;
			if (this.autoElapsedValue >= 45) {
				this.autoElapsedValue %= 45;
				this.sourceValue = "automatic";
				this.setMode(this.target === "night" ? "day" : "night");
				this.automaticTransition = true;
			}
		}
		const wallDelta = Math.min(this.automaticTransition ? 1 : .05, elapsed);
		this.lastUpdateAt = now;
		const targetProgress = this.target === "night" ? 1 : 0;
		if (this.progressValue === targetProgress) return;
		const duration = this.reducedMotionValue ? this.target === "night" ? .2 : .16 : this.automaticTransition ? 5 : this.target === "night" ? 1.1 : .8;
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
			const { Showcase } = await import("./Showcase-DU9uD3df.js");
			return { Showcase };
		}, __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37]), import.meta.url);
		experience = new Showcase(canvas, showcaseMode, showcaseTheme ?? void 0);
	} else {
		const { Game } = await __vitePreload(async () => {
			const { Game } = await import("./Game-C6fBlxsp.js");
			return { Game };
		}, __vite__mapDeps([38,1,2,39,3,40,4,41,42,6,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37]), import.meta.url);
		experience = new Game(canvas);
	}
	experience.start();
}
//#endregion
export { ThemeController as t };
