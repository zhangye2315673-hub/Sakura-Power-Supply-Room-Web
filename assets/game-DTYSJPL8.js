const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./Showcase-p5RxV2cX.js","./three.core-DlTOC7bx.js","./palette-knpLSfXB.js","./ApplianceCatalog-B_KJFoGh.js","./BufferGeometryUtils-CtH-hlZf.js","./ApplianceScene-0iT7RH1c.js","./outline-Cv1Jem2g.js","./alarmClock-DoTzNaPP.js","./rolldown-runtime-D7D4PA-g.js","./blender-N2eRuMD0.js","./bubbleMachine-Bw4WD49q.js","./coffeeMaker-B1MQF_Jg.js","./dehumidifier-BIvhccY7.js","./desktopComputer-C3rQd50i.js","./fan-B2o33Ay6.js","./gameController-BwCNJ2kl.js","./gumballMachine-Cr6dlZBK.js","./hairDryer-CqPdH-Dt.js","./humidifier-CojYbIlp.js","./inductionCooktop-DD5owD9D.js","./kettle-rP3ttAo7.js","./lamp-kvdyvhRA.js","./microwave-CqFxoCzU.js","./phone-DOXnLHvV.js","./popcornMachine-DwzZCN_D.js","./ParametricGeometry-CNqXT5Mu.js","./portableSpeaker-B_u6x5Nw.js","./printer-ChnJT7sE.js","./radio-BtjqkBIi.js","./recordPlayer-CceWS5ql.js","./refrigerator-DN6Lytqq.js","./riceCooker-1uhEi14Y.js","./robotVacuum-DBGIBbfo.js","./smartBin-CqTKJ_OO.js","./standMixer-CWdHDvAL.js","./television-BLz4LXUF.js","./toaster-DCU0xvOs.js","./washer-LtxQTif2.js","./Game-BRzZ9y1j.js","./SkillCardPresentation-BKsci2Gv.js","./SkillCardPresentation-DjLJF6gD.css","./PetalField-BZccXHdn.js","./SkillPresentationController-Cu0MYo2a.js"])))=>i.map(i=>d[i]);
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
var query = new URLSearchParams(window.location.search);
var showcaseMode = query.get("showcase");
if (query.get("record") === "1" || query.get("recording") === "1") document.documentElement.classList.add("recording-mode");
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
			const { Showcase } = await import("./Showcase-p5RxV2cX.js");
			return { Showcase };
		}, __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37]), import.meta.url);
		experience = new Showcase(canvas, showcaseMode, showcaseTheme ?? void 0);
	} else {
		const { Game } = await __vitePreload(async () => {
			const { Game } = await import("./Game-BRzZ9y1j.js");
			return { Game };
		}, __vite__mapDeps([38,1,2,39,3,40,4,41,42,6,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37]), import.meta.url);
		experience = new Game(canvas);
	}
	experience.start();
}
//#endregion
export { ThemeController as t };
