import { Fn as ShaderMaterial, H as Group, Ht as RGBAFormat, I as ExtrudeGeometry, K as InstancedBufferGeometry, L as Float32BufferAttribute, Ln as Shape, Ot as OctahedronGeometry, Rn as ShapeGeometry, S as CylinderGeometry, St as MeshToonMaterial, T as DataTexture, Vn as Sphere, X as InterleavedBufferAttribute, dr as Vector3, fr as Vector4, ft as MathUtils, gr as WireframeGeometry, gt as MeshBasicMaterial, h as ConeGeometry, ht as Mesh, i as BoxGeometry, mt as Matrix4, o as BufferGeometry, p as Color, q as InstancedInterleavedBuffer, r as Box3, tr as UniformsUtils, tt as Line3, ur as Vector2, wt as NearestFilter } from "./three.core-DlTOC7bx.js";
import { a as ShaderLib, i as ShaderChunk, n as PAL, o as UniformsLib } from "./palette-CaCEpJJd.js";
//#region ../arrow-cube/node_modules/animejs/dist/modules/core/consts.js
/**
* Anime.js - core - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
var isBrowser = typeof window !== "undefined";
/** @typedef {Window & {AnimeJS: Array}|null} AnimeJSWindow

/** @type {AnimeJSWindow} */
var win = isBrowser ? window : null;
/** @type {Document|null} */
var doc = isBrowser ? document : null;
/** @enum {Number} */
var tweenTypes = {
	OBJECT: 0,
	ATTRIBUTE: 1,
	CSS: 2,
	TRANSFORM: 3,
	CSS_VAR: 4
};
/** @enum {Number} */
var valueTypes = {
	NUMBER: 0,
	UNIT: 1,
	COLOR: 2,
	COMPLEX: 3
};
/** @enum {Number} */
var tickModes = {
	NONE: 0,
	AUTO: 1,
	FORCE: 2
};
/** @enum {Number} */
var compositionTypes = {
	replace: 0,
	none: 1,
	blend: 2
};
var isRegisteredTargetSymbol = Symbol();
var isDomSymbol = Symbol();
var isSvgSymbol = Symbol();
var transformsSymbol = Symbol();
var proxyTargetSymbol = Symbol();
var minValue = 1e-11;
var maxValue = 0xe8d4a51000;
var K = 1e3;
var emptyArray = [];
var shortTransforms = /*#__PURE__*/ (() => {
	const map = /* @__PURE__ */ new Map();
	map.set("x", "translateX");
	map.set("y", "translateY");
	map.set("z", "translateZ");
	return map;
})();
var validTransforms = [
	"perspective",
	"translateX",
	"translateY",
	"translateZ",
	"rotate",
	"rotateX",
	"rotateY",
	"rotateZ",
	"scale",
	"scaleX",
	"scaleY",
	"scaleZ",
	"skew",
	"skewX",
	"skewY"
];
var transformsFragmentStrings = /*#__PURE__*/ validTransforms.reduce((a, v) => ({
	...a,
	[v]: v + "("
}), {});
/** @return {void} */
var noop = () => {};
/**
* @template T
* @param  {T} v
* @return {T}
*/
var noopModifier = (v) => v;
var validRgbHslRgx = /\)\s*[-.\d]/;
var hexTestRgx = /(^#([\da-f]{3}){1,2}$)|(^#([\da-f]{4}){1,2}$)/i;
var rgbExecRgx = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i;
var rgbaExecRgx = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(-?\d+|-?\d*.\d+)\s*\)/i;
var hslExecRgx = /hsl\(\s*(-?\d+|-?\d*.\d+)\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)%\s*\)/i;
var hslaExecRgx = /hsla\(\s*(-?\d+|-?\d*.\d+)\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)\s*\)/i;
var digitWithExponentRgx = /[-+]?\d*\.?\d+(?:e[-+]?\d)?/gi;
var unitsExecRgx = /^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)([a-z]+|%)$/i;
var lowerCaseRgx = /([a-z])([A-Z])/g;
var relativeValuesExecRgx = /(\*=|\+=|-=)/;
var cssVariableMatchRgx = /var\(\s*(--[\w-]+)(?:\s*,\s*([^)]+))?\s*\)/;
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/core/globals.js
/**
* Anime.js - core - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   DefaultsParams,
*   DOMTarget,
* } from '../types/index.js'
*
* @import {
*   Scope,
* } from '../scope/index.js'
*/
/**
* @typedef {Object} EditorGlobals
* @property {boolean} showPanel
* @property {Function} addAnimation
* @property {Function} addSet
* @property {Function} addTimeline
* @property {Function} addTimelineChild
* @property {Function} addTimelineLabel
* @property {Function} addTimelineCall
* @property {Function} addTimelineSync
* @property {Function} resolveStagger
* @property {Object|null} _head
* @property {Object|null} _tail
*/
/** @type {DefaultsParams} */
var defaults = {
	id: null,
	keyframes: null,
	playbackEase: null,
	playbackRate: 1,
	frameRate: 240,
	loop: 0,
	reversed: false,
	alternate: false,
	autoplay: true,
	persist: false,
	duration: K,
	delay: 0,
	loopDelay: 0,
	ease: "out(2)",
	composition: compositionTypes.replace,
	modifier: noopModifier,
	onBegin: noop,
	onBeforeUpdate: noop,
	onUpdate: noop,
	onLoop: noop,
	onPause: noop,
	onComplete: noop,
	onRender: noop
};
var scope = {
	/** @type {Scope} */
	current: null,
	/** @type {Document|DOMTarget} */
	root: doc
};
var globals = {
	/** @type {DefaultsParams} */
	defaults,
	/** @type {Number} */
	precision: 4,
	/** @type {Number} equals 1 in ms mode, 0.001 in s mode */
	timeScale: 1,
	/** @type {Number} */
	tickThreshold: 200,
	/** @type {EditorGlobals|null} */
	editor: null
};
var globalVersions = {
	version: "4.5.0",
	engine: null
};
if (isBrowser) {
	if (!win.AnimeJS) win.AnimeJS = [];
	win.AnimeJS.push(globalVersions);
}
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/core/helpers.js
/**
* Anime.js - core - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   Target,
*   DOMTarget,
* } from '../types/index.js'
*/
/**
* @param  {String} str
* @return {String}
*/
var toLowerCase = (str) => str.replace(lowerCaseRgx, "$1-$2").toLowerCase();
/**
* Prioritize this method instead of regex when possible
* @param  {String} str
* @param  {String} sub
* @return {Boolean}
*/
var stringStartsWith = (str, sub) => str.indexOf(sub) === 0;
var now = Date.now;
var isArr = Array.isArray;
/**@param {any} a @return {a is Record<String, any>} */
var isObj = (a) => a && a.constructor === Object;
/**@param {any} a @return {a is Number} */
var isNum = (a) => typeof a === "number" && !isNaN(a);
/**@param {any} a @return {a is String} */
var isStr = (a) => typeof a === "string";
/**@param {any} a @return {a is Function} */
var isFnc = (a) => typeof a === "function";
/**@param {any} a @return {a is undefined} */
var isUnd = (a) => typeof a === "undefined";
/**@param {any} a @return {a is null | undefined} */
var isNil = (a) => isUnd(a) || a === null;
/**@param {any} a @return {a is SVGElement} */
var isSvg = (a) => isBrowser && a instanceof SVGElement;
/**@param {any} a @return {Boolean} */
var isHex = (a) => hexTestRgx.test(a);
/**@param {any} a @return {Boolean} */
var isRgb = (a) => stringStartsWith(a, "rgb");
/**@param {any} a @return {Boolean} */
var isHsl = (a) => stringStartsWith(a, "hsl");
/**@param {any} a @return {Boolean} */ var isCol = (a) => isHex(a) || (isRgb(a) || isHsl(a)) && (a[a.length - 1] === ")" || !validRgbHslRgx.test(a));
/**@param {any} a @return {Boolean} */
var isKey = (a) => !globals.defaults.hasOwnProperty(a);
var svgCssReservedProperties = [
	"opacity",
	"rotate",
	"overflow",
	"color"
];
/**
* @param  {Target} el
* @param  {String} propertyName
* @return {Boolean}
*/
var isValidSVGAttribute = (el, propertyName) => {
	if (svgCssReservedProperties.includes(propertyName)) return false;
	if (el.getAttribute(propertyName) || propertyName in el) {
		if (propertyName === "scale") {
			const elParentNode = el.parentNode;
			return elParentNode && elParentNode.tagName === "filter";
		}
		return true;
	}
};
var pow = Math.pow;
var sqrt = Math.sqrt;
var sin = Math.sin;
var cos = Math.cos;
var floor = Math.floor;
var asin = Math.asin;
var PI = Math.PI;
var _round = Math.round;
/**
* Clamps a value between min and max bounds
*
* @param  {Number} v - Value to clamp
* @param  {Number} min - Minimum boundary
* @param  {Number} max - Maximum boundary
* @return {Number}
*/
var clamp = (v, min, max) => v < min ? min : v > max ? max : v;
/**
* Rounds a number to specified decimal places
*
* @param  {Number} v - Value to round
* @param  {Number} decimalLength - Number of decimal places
* @return {Number}
*/
var round = (v, decimalLength) => {
	if (decimalLength < 0) return v;
	if (!decimalLength) return _round(v);
	const p = 10 ** decimalLength;
	return _round(v * p) / p;
};
/**
* Linear interpolation between two values
*
* @param  {Number} start - Starting value
* @param  {Number} end - Ending value
* @param  {Number} factor - Interpolation factor in the range [0, 1]
* @return {Number} The interpolated value
*/
var lerp = (start, end, factor) => factor === 1 ? end : factor === 0 ? start : start + (end - start) * factor;
/**
* Replaces infinity with maximum safe value
*
* @param  {Number} v - Value to check
* @return {Number}
*/
var clampInfinity = (v) => v === Infinity ? maxValue : v === -Infinity ? -maxValue : v;
/**
* Normalizes time value with minimum threshold
*
* @param  {Number} v - Time value to normalize
* @return {Number}
*/
var normalizeTime = (v) => v <= 1e-11 ? minValue : clampInfinity(round(v, 11));
/**
* @template T
* @param    {T[]} a
* @return   {T[]}
*/
var cloneArray = (a) => isArr(a) ? [...a] : a;
/**
* @template T
* @template U
* @param    {T} o1
* @param    {U} o2
* @return   {T & U}
*/
var mergeObjects = (o1, o2) => {
	const merged = { ...o1 };
	for (let p in o2) {
		const o1p = o1[p];
		merged[p] = isUnd(o1p) ? o2[p] : o1p;
	}
	return merged;
};
/**
* @param  {Object} parent
* @param  {Function} callback
* @param  {Boolean} [reverse]
* @param  {String} [prevProp]
* @param  {String} [nextProp]
* @return {void}
*/
var forEachChildren = (parent, callback, reverse, prevProp = "_prev", nextProp = "_next") => {
	let next = parent._head;
	let adjustedNextProp = nextProp;
	if (reverse) {
		next = parent._tail;
		adjustedNextProp = prevProp;
	}
	while (next) {
		const currentNext = next[adjustedNextProp];
		callback(next);
		next = currentNext;
	}
};
/**
* @param  {Object} parent
* @param  {Object} child
* @param  {String} [prevProp]
* @param  {String} [nextProp]
* @return {void}
*/
var removeChild = (parent, child, prevProp = "_prev", nextProp = "_next") => {
	const prev = child[prevProp];
	const next = child[nextProp];
	prev ? prev[nextProp] = next : parent._head = next;
	next ? next[prevProp] = prev : parent._tail = prev;
	child[prevProp] = null;
	child[nextProp] = null;
};
/**
* @param  {Object} parent
* @param  {Object} child
* @param  {Function} [sortMethod]
* @param  {String} prevProp
* @param  {String} nextProp
* @return {void}
*/
var addChild = (parent, child, sortMethod, prevProp = "_prev", nextProp = "_next") => {
	let prev = parent._tail;
	while (prev && sortMethod && sortMethod(prev, child)) prev = prev[prevProp];
	const next = prev ? prev[nextProp] : parent._head;
	prev ? prev[nextProp] = child : parent._head = child;
	next ? next[prevProp] = child : parent._tail = child;
	child[prevProp] = prev;
	child[nextProp] = next;
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/core/transforms.js
/**
* Anime.js - core - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   DOMTarget,
* } from '../types/index.js'
*/
/**
* @param  {DOMTarget} target
* @param  {String} propName
* @param  {Object} animationInlineStyles
* @return {String}
*/
var parseInlineTransforms = (target, propName, animationInlineStyles) => {
	const inlineTransforms = target.style.transform;
	if (inlineTransforms) {
		const cachedTransforms = target[transformsSymbol];
		let pos = 0;
		const len = inlineTransforms.length;
		let fullTranslateValue;
		while (pos < len) {
			while (pos < len && inlineTransforms.charCodeAt(pos) === 32) pos++;
			if (pos >= len) break;
			const nameStart = pos;
			while (pos < len && inlineTransforms.charCodeAt(pos) !== 40) pos++;
			if (pos >= len) break;
			const name = inlineTransforms.substring(nameStart, pos);
			let depth = 1;
			const valueStart = pos + 1;
			let c1 = -1, c2 = -1;
			pos++;
			while (pos < len && depth > 0) {
				const c = inlineTransforms.charCodeAt(pos);
				if (c === 40) depth++;
				else if (c === 41) depth--;
				else if (c === 44 && depth === 1) {
					if (c1 === -1) c1 = pos;
					else if (c2 === -1) c2 = pos;
				}
				pos++;
			}
			const valueEnd = pos - 1;
			if (name === "translate" || name === "translate3d") {
				if (c1 === -1) cachedTransforms.translateX = inlineTransforms.substring(valueStart, valueEnd).trim();
				else {
					cachedTransforms.translateX = inlineTransforms.substring(valueStart, c1).trim();
					if (c2 === -1) cachedTransforms.translateY = inlineTransforms.substring(c1 + 1, valueEnd).trim();
					else {
						cachedTransforms.translateY = inlineTransforms.substring(c1 + 1, c2).trim();
						cachedTransforms.translateZ = inlineTransforms.substring(c2 + 1, valueEnd).trim();
					}
				}
				fullTranslateValue = inlineTransforms.substring(valueStart, valueEnd);
			} else if (name === "scale" || name === "scale3d") if (c1 === -1) cachedTransforms.scale = inlineTransforms.substring(valueStart, valueEnd).trim();
			else {
				cachedTransforms.scaleX = inlineTransforms.substring(valueStart, c1).trim();
				if (c2 === -1) cachedTransforms.scaleY = inlineTransforms.substring(c1 + 1, valueEnd).trim();
				else {
					cachedTransforms.scaleY = inlineTransforms.substring(c1 + 1, c2).trim();
					cachedTransforms.scaleZ = inlineTransforms.substring(c2 + 1, valueEnd).trim();
				}
			}
			else cachedTransforms[name] = inlineTransforms.substring(valueStart, valueEnd);
		}
		if (propName === "translate3d" && fullTranslateValue) {
			if (animationInlineStyles) animationInlineStyles[propName] = fullTranslateValue;
			return fullTranslateValue;
		}
		const cached = cachedTransforms[propName];
		if (!isUnd(cached)) {
			if (animationInlineStyles) animationInlineStyles[propName] = cached;
			return cached;
		}
	}
	return propName === "translate3d" ? "0px, 0px, 0px" : propName === "rotate3d" ? "0, 0, 0, 0deg" : stringStartsWith(propName, "scale") ? "1" : stringStartsWith(propName, "rotate") || stringStartsWith(propName, "skew") ? "0deg" : "0px";
};
/**
* Builds a CSS transform string from the target's cached transform properties.
* Iterates validTransforms in order (perspective > translate > rotate > scale > skew > matrix).
* When adjacent axis properties are all present, emits a shorter shorthand (translateX + translateY -> translate(x, y))
* The index is advanced past consumed properties so they are not emitted twice.
* Properties without a grouping partner (e.g. translateY alone, scaleZ alone) emit individually.
*
* @param  {Record<String, String>} props
* @return {String}
*/
var buildTransformString = (props) => {
	let str = "";
	for (let i = 0, l = validTransforms.length; i < l; i++) {
		const key = validTransforms[i];
		const val = props[key];
		if (val !== void 0) {
			if (key === "translateX") {
				const next = props.translateY;
				if (next !== void 0) {
					const next2 = props.translateZ;
					if (next2 !== void 0) {
						str += `translate3d(${val},${next},${next2}) `;
						i += 2;
					} else {
						str += `translate(${val},${next}) `;
						i += 1;
					}
					continue;
				}
			}
			if (key === "scaleX" && props.scale === void 0) {
				const next = props.scaleY;
				if (next !== void 0) {
					const next2 = props.scaleZ;
					if (next2 !== void 0) {
						str += `scale3d(${val},${next},${next2}) `;
						i += 2;
					} else {
						str += `scale(${val},${next}) `;
						i += 1;
					}
					continue;
				}
			}
			str += `${transformsFragmentStrings[key]}${val}) `;
		}
		if (key === "rotateZ") {
			if (props.rotate3d !== void 0) str += `rotate3d(${props.rotate3d}) `;
		}
	}
	if (props.matrix !== void 0) str += `matrix(${props.matrix}) `;
	if (props.matrix3d !== void 0) str += `matrix3d(${props.matrix3d}) `;
	return str;
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/adapters/registry.js
/**
* Anime.js - adapters - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
var adapters = [];
/**
* Internal resolution. Tries every Adapter's target adapters first (in registration order, first match wins), then every Adapter's property resolvers.
*
* @param {any} target
* @param {string} name
* @return {TargetAdapterEntry | null}
*/
function resolveAdapterEntry(target, name) {
	if (!target) return null;
	const al = adapters.length;
	outer: for (let i = 0; i < al; i++) {
		const a = adapters[i];
		if (a.detect && !a.detect(target)) continue;
		const tas = a.targetAdapters;
		for (let j = 0, m = tas.length; j < m; j++) {
			const ta = tas[j];
			if (ta.detect(target)) {
				const entry = ta.props[name];
				if (entry && (!entry.gate || entry.gate(target))) return entry;
				break outer;
			}
		}
	}
	for (let i = 0; i < al; i++) {
		const a = adapters[i];
		if (a.detect && !a.detect(target)) continue;
		const rs = a.propertyResolvers;
		for (let j = 0, m = rs.length; j < m; j++) {
			const entry = rs[j](target, name);
			if (entry) return entry;
		}
	}
	return null;
}
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/core/colors.js
/**
* Anime.js - core - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   ColorArray,
* } from '../types/index.js'
*/
/**
* RGB / RGBA Color value string -> RGBA values array
* @param  {String} rgbValue
* @return {ColorArray}
*/
var rgbToRgba = (rgbValue) => {
	const rgba = rgbExecRgx.exec(rgbValue) || rgbaExecRgx.exec(rgbValue);
	const a = !isUnd(rgba[4]) ? +rgba[4] : 1;
	return [
		+rgba[1],
		+rgba[2],
		+rgba[3],
		a
	];
};
/**
* HEX3 / HEX3A / HEX6 / HEX6A Color value string -> RGBA values array
* @param  {String} hexValue
* @return {ColorArray}
*/
var hexToRgba = (hexValue) => {
	const hexLength = hexValue.length;
	const isShort = hexLength === 4 || hexLength === 5;
	return [
		+("0x" + hexValue[1] + hexValue[isShort ? 1 : 2]),
		+("0x" + hexValue[isShort ? 2 : 3] + hexValue[isShort ? 2 : 4]),
		+("0x" + hexValue[isShort ? 3 : 5] + hexValue[isShort ? 3 : 6]),
		hexLength === 5 || hexLength === 9 ? +(+("0x" + hexValue[isShort ? 4 : 7] + hexValue[isShort ? 4 : 8]) / 255).toFixed(3) : 1
	];
};
/**
* @param  {Number} p
* @param  {Number} q
* @param  {Number} t
* @return {Number}
*/
var hue2rgb = (p, q, t) => {
	if (t < 0) t += 1;
	if (t > 1) t -= 1;
	return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
};
/**
* HSL / HSLA Color value string -> RGBA values array
* @param  {String} hslValue
* @return {ColorArray}
*/
var hslToRgba = (hslValue) => {
	const hsla = hslExecRgx.exec(hslValue) || hslaExecRgx.exec(hslValue);
	const h = +hsla[1] / 360;
	const s = +hsla[2] / 100;
	const l = +hsla[3] / 100;
	const a = !isUnd(hsla[4]) ? +hsla[4] : 1;
	let r, g, b;
	if (s === 0) r = g = b = l;
	else {
		const q = l < .5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = round(hue2rgb(p, q, h + 1 / 3) * 255, 0);
		g = round(hue2rgb(p, q, h) * 255, 0);
		b = round(hue2rgb(p, q, h - 1 / 3) * 255, 0);
	}
	return [
		r,
		g,
		b,
		a
	];
};
/**
* All in one color converter that converts a color string value into an array of RGBA values
* @param  {String} colorString
* @return {ColorArray}
*/
var convertColorStringValuesToRgbaArray = (colorString) => {
	return isRgb(colorString) ? rgbToRgba(colorString) : isHex(colorString) ? hexToRgba(colorString) : isHsl(colorString) ? hslToRgba(colorString) : [
		0,
		0,
		0,
		1
	];
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/core/values.js
/**
* Anime.js - core - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   Target,
*   DOMTarget,
*   Tween,
*   TweenPropValue,
*   TweenDecomposedValue,
*   TargetsArray,
* } from '../types/index.js'
*/
/**
* @template T, D
* @param {T|undefined} targetValue
* @param {D} defaultValue
* @return {T|D}
*/
var setValue = (targetValue, defaultValue) => {
	return isUnd(targetValue) ? defaultValue : targetValue;
};
/**
* Resolve against the target when it's a DOM element, otherwise fall back to :root so non-DOM targets like three.js meshes and custom adapters still pick up CSS variables defined on the document.
*
* @param  {String} value
* @param  {Target} target
* @return {String|Number}
*/
var resolveCssVar = (value, target) => {
	const match = value.match(cssVariableMatchRgx);
	const el = target[isDomSymbol] ? target : document.documentElement;
	let computed = getComputedStyle(el)?.getPropertyValue(match[1]);
	if ((!computed || computed.trim() === "") && match[2]) computed = match[2].trim();
	return computed || 0;
};
/**
* @param  {TweenPropValue} value
* @param  {Target} target
* @param  {Number} index
* @param  {TargetsArray} targets
* @param  {Object|null} store
* @param  {Tween|null} prevTween
* @return {any}
*/
var getFunctionValue = (value, target, index, targets, store, prevTween) => {
	if (isFnc(value)) {
		if (!store) {
			const computed = value(target, index, targets, prevTween);
			return !isNaN(+computed) ? +computed : computed || 0;
		}
		const func = () => {
			const computed = value(target, index, targets, prevTween);
			return !isNaN(+computed) ? +computed : computed || 0;
		};
		store.func = func;
		return func();
	}
	if (isStr(value) && stringStartsWith(value, "var(")) {
		if (!store) return resolveCssVar(value, target);
		const func = () => resolveCssVar(value, target);
		store.func = func;
		return func();
	}
	return value;
};
/**
* @param  {Target} target
* @param  {String} prop
* @return {tweenTypes}
*/
var getTweenType = (target, prop) => {
	return !target[isDomSymbol] ? tweenTypes.OBJECT : target[isSvgSymbol] && isValidSVGAttribute(target, prop) ? tweenTypes.ATTRIBUTE : validTransforms.includes(prop) || shortTransforms.get(prop) ? tweenTypes.TRANSFORM : stringStartsWith(prop, "--") ? tweenTypes.CSS_VAR : prop in target.style ? tweenTypes.CSS : prop in target ? tweenTypes.OBJECT : tweenTypes.ATTRIBUTE;
};
/**
* @param  {DOMTarget} target
* @param  {String} propName
* @param  {Object} animationInlineStyles
* @return {String}
*/
var getCSSValue = (target, propName, animationInlineStyles) => {
	const inlineStyles = target.style[propName];
	if (inlineStyles && animationInlineStyles) animationInlineStyles[propName] = inlineStyles;
	const value = inlineStyles || getComputedStyle(target[proxyTargetSymbol] || target).getPropertyValue(propName);
	return value === "auto" ? "0" : value;
};
/**
* @param {Target} target
* @param {String} propName
* @param {tweenTypes} [tweenType]
* @param {Object|void} [animationInlineStyles]
* @return {String|Number}
*/
var getOriginalAnimatableValue = (target, propName, tweenType, animationInlineStyles) => {
	const type = !isUnd(tweenType) ? tweenType : getTweenType(target, propName);
	const adapterProp = resolveAdapterEntry(target, propName);
	if (adapterProp) {
		const value = adapterProp.get(target);
		if (value && animationInlineStyles) animationInlineStyles[propName] = value;
		return value == null ? 0 : value;
	}
	if (type === tweenTypes.OBJECT) {
		const value = target[propName];
		if (value && animationInlineStyles) animationInlineStyles[propName] = value;
		return value || 0;
	}
	if (type === tweenTypes.ATTRIBUTE) {
		const value = target.getAttribute(propName);
		if (value && animationInlineStyles) animationInlineStyles[propName] = value;
		return value;
	}
	return type === tweenTypes.TRANSFORM ? parseInlineTransforms(target, propName, animationInlineStyles) : type === tweenTypes.CSS_VAR ? getCSSValue(target, propName, animationInlineStyles).trimStart() : getCSSValue(target, propName, animationInlineStyles);
};
/**
* @param  {Number} x
* @param  {Number} y
* @param  {String} operator
* @return {Number}
*/
var getRelativeValue = (x, y, operator) => {
	return operator === "-" ? x - y : operator === "+" ? x + y : x * y;
};
/** @return {TweenDecomposedValue} */
var createDecomposedValueTargetObject = () => {
	return {
		/** @type {valueTypes} */
		t: valueTypes.NUMBER,
		n: 0,
		u: null,
		o: null,
		d: null,
		s: null
	};
};
/**
* @param  {String|Number|Object} rawValue
* @param  {TweenDecomposedValue} targetObject
* @return {TweenDecomposedValue}
*/
var decomposeRawValue = (rawValue, targetObject) => {
	/** @type {valueTypes} */
	targetObject.t = valueTypes.NUMBER;
	targetObject.n = 0;
	targetObject.u = null;
	targetObject.o = null;
	targetObject.d = null;
	targetObject.s = null;
	if (!rawValue) return targetObject;
	const num = +rawValue;
	if (!isNaN(num)) {
		targetObject.n = num;
		return targetObject;
	}
	let str = rawValue;
	if (str[1] === "=") {
		targetObject.o = str[0];
		str = str.slice(2);
	}
	const unitMatch = str.includes(" ") ? false : unitsExecRgx.exec(str);
	if (unitMatch) {
		targetObject.t = valueTypes.UNIT;
		targetObject.n = +unitMatch[1];
		targetObject.u = unitMatch[2];
		return targetObject;
	} else if (targetObject.o) {
		targetObject.n = +str;
		return targetObject;
	} else if (isCol(str)) {
		targetObject.t = valueTypes.COLOR;
		targetObject.d = convertColorStringValuesToRgbaArray(str);
		return targetObject;
	} else {
		const matchedNumbers = str.match(digitWithExponentRgx);
		targetObject.t = valueTypes.COMPLEX;
		targetObject.d = matchedNumbers ? matchedNumbers.map(Number) : [];
		targetObject.s = str.split(digitWithExponentRgx) || [];
		return targetObject;
	}
};
/**
* @param  {Tween} tween
* @param  {TweenDecomposedValue} targetObject
* @return {TweenDecomposedValue}
*/
var decomposeTweenValue = (tween, targetObject) => {
	targetObject.t = tween._valueType;
	targetObject.n = tween._toNumber;
	targetObject.u = tween._unit;
	targetObject.o = null;
	targetObject.d = cloneArray(tween._toNumbers);
	targetObject.s = cloneArray(tween._strings);
	return targetObject;
};
var decomposedOriginalValue = createDecomposedValueTargetObject();
/**
* @param  {Tween} tween
* @param  {Number} progress
* @param  {Number} precision
* @return {String}
*/
var composeComplexValue = (tween, progress, precision) => {
	const mod = tween._modifier;
	const fn = tween._fromNumbers;
	const tn = tween._toNumbers;
	const ts = tween._strings;
	let v = ts[0];
	for (let j = 0, l = tn.length; j < l; j++) {
		const n = mod(round(lerp(fn[j], tn[j], progress), precision));
		const s = ts[j + 1];
		v += `${s ? n + s : n}`;
		tween._numbers[j] = n;
	}
	return v;
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/core/render.js
/**
* Anime.js - core - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   Tickable,
*   Renderable,
*   CallbackArgument,
*   Tween,
*   DOMTarget,
* } from '../types/index.js'
*/
/**
* @import {
*   JSAnimation,
* } from '../animation/animation.js'
*/
/**
* @import {
*   Timeline,
* } from '../timeline/timeline.js'
*/
/**
* @param  {Tickable} tickable
* @param  {Number} time
* @param  {Number} muteCallbacks
* @param  {Number} internalRender
* @param  {tickModes} tickMode
* @return {Number}
*/
var render = (tickable, time, muteCallbacks, internalRender, tickMode) => {
	const parent = tickable.parent;
	const duration = tickable.duration;
	const completed = tickable.completed;
	const iterationDuration = tickable.iterationDuration;
	const iterationCount = tickable.iterationCount;
	const _currentIteration = tickable._currentIteration;
	const _loopDelay = tickable._loopDelay;
	const _reversed = tickable._reversed;
	const _alternate = tickable._alternate;
	const _hasChildren = tickable._hasChildren;
	const tickableDelay = tickable._delay;
	const tickablePrevAbsoluteTime = tickable._currentTime;
	const tickableEndTime = tickableDelay + iterationDuration;
	const tickableAbsoluteTime = time - tickableDelay;
	const tickablePrevTime = clamp(tickablePrevAbsoluteTime, -tickableDelay, duration);
	const tickableCurrentTime = clamp(tickableAbsoluteTime, -tickableDelay, duration);
	const deltaTime = tickableAbsoluteTime - tickablePrevAbsoluteTime;
	const isCurrentTimeAboveZero = tickableCurrentTime > 0;
	const isCurrentTimeEqualOrAboveDuration = tickableCurrentTime >= duration;
	const isSetter = duration <= minValue;
	const forcedTick = tickMode === tickModes.FORCE;
	let isOdd = 0;
	let iterationElapsedTime = tickableAbsoluteTime;
	let hasRendered = 0;
	if (iterationCount > 1) {
		const period = iterationDuration + (isCurrentTimeEqualOrAboveDuration ? 0 : _loopDelay);
		const currentIteration = ~~(tickableCurrentTime / period);
		tickable._currentIteration = clamp(currentIteration, 0, iterationCount);
		if (isCurrentTimeEqualOrAboveDuration) tickable._currentIteration--;
		isOdd = tickable._currentIteration % 2;
		iterationElapsedTime = tickableCurrentTime - currentIteration * period || 0;
	}
	const isReversed = _reversed ^ (_alternate && isOdd);
	const _ease = tickable._ease;
	let iterationTime = isCurrentTimeEqualOrAboveDuration ? isReversed ? 0 : duration : isReversed ? iterationDuration - iterationElapsedTime : iterationElapsedTime;
	if (_ease) iterationTime = iterationDuration * _ease(iterationTime / iterationDuration) || 0;
	const isRunningBackwards = (parent ? parent.backwards : tickableAbsoluteTime < tickablePrevAbsoluteTime) ? !isReversed : !!isReversed;
	tickable._currentTime = tickableAbsoluteTime;
	tickable._iterationTime = iterationTime;
	tickable.backwards = isRunningBackwards;
	if (isCurrentTimeAboveZero && !tickable.began) {
		tickable.began = true;
		if (!muteCallbacks && !(parent && (isRunningBackwards || !parent.began))) tickable.onBegin(tickable);
	} else if (tickableAbsoluteTime <= 0) tickable.began = false;
	if (!muteCallbacks && !_hasChildren && isCurrentTimeAboveZero && tickable._currentIteration !== _currentIteration) tickable.onLoop(tickable);
	if (forcedTick || tickMode === tickModes.AUTO && (time >= (parent && tickableDelay > 0 ? 0 : tickableDelay) && time <= tickableEndTime || time <= tickableDelay && tickablePrevTime > tickableDelay || time >= tickableEndTime && tickablePrevTime !== duration) || iterationTime >= tickableEndTime && tickablePrevTime !== duration || iterationTime <= tickableDelay && tickablePrevTime > 0 && !isCurrentTimeEqualOrAboveDuration || time <= tickablePrevTime && tickablePrevTime === duration && completed || isCurrentTimeEqualOrAboveDuration && !completed && isSetter) {
		if (isCurrentTimeAboveZero) {
			tickable.computeDeltaTime(tickablePrevTime);
			if (!muteCallbacks) tickable.onBeforeUpdate(tickable);
		}
		if (!_hasChildren) {
			const forcedRender = forcedTick || (isRunningBackwards ? deltaTime * -1 : deltaTime) >= globals.tickThreshold;
			const absoluteTime = round(tickable._offset + (parent ? parent._offset : 0) + tickableDelay + iterationTime, 12);
			let tween = tickable._head;
			let tweenTarget;
			let tweenStyle;
			let tweenTargetTransforms;
			let tweenTargetTransformsProperties;
			let tweenTransformsNeedUpdate = 0;
			while (tween) {
				const tweenComposition = tween._composition;
				const tweenCurrentTime = tween._currentTime;
				const tweenChangeDuration = tween._changeDuration;
				const tweenAbsEndTime = tween._absoluteStartTime + tween._changeDuration;
				const tweenNextRep = tween._nextRep;
				const tweenPrevRep = tween._prevRep;
				const tweenHasComposition = tweenComposition !== compositionTypes.none;
				const tweenPrevRepEndTime = tweenPrevRep ? tweenPrevRep._absoluteStartTime + tweenPrevRep._changeDuration : 0;
				const tweenPrevRepIsCrossParent = tweenPrevRep && tweenPrevRep.parent !== tween.parent;
				const tweenNextRepTakeover = !tweenNextRep || tweenNextRep._isOverridden ? tweenAbsEndTime : tweenNextRep.parent === tween.parent ? tweenAbsEndTime + tweenNextRep._delay : tweenNextRep._absoluteStartTime < tweenNextRep._absoluteUpdateStartTime ? tweenNextRep._absoluteStartTime : tweenNextRep._absoluteUpdateStartTime;
				if ((forcedRender || (tweenCurrentTime !== tweenChangeDuration || absoluteTime <= tweenNextRepTakeover || tweenPrevRep && !tweenPrevRepIsCrossParent && (!tweenNextRep || tweenNextRep.parent !== tween.parent)) && (tweenCurrentTime !== 0 || absoluteTime >= tween._absoluteStartTime || tweenPrevRepIsCrossParent && !tween._hasFromValue && !tweenPrevRep._isOverridden && absoluteTime >= tweenPrevRepEndTime || tweenNextRep && !tweenNextRep._isOverridden && tweenNextRep.parent === tween.parent && tweenNextRep._currentTime !== 0 && iterationTime < tweenNextRep._startTime)) && (!tweenPrevRep || tweenPrevRepIsCrossParent || iterationTime >= tween._startTime) && (!tweenHasComposition || !tween._isOverridden && (!tween._isOverlapped || absoluteTime <= tweenAbsEndTime) && (!tweenNextRep || tweenNextRep._isOverridden || absoluteTime <= tweenNextRepTakeover) && (!tweenPrevRep || tweenPrevRep._isOverridden || (!tweenPrevRepIsCrossParent ? absoluteTime >= tweenPrevRepEndTime + tween._delay : absoluteTime >= tween._absoluteStartTime || !tween._hasFromValue && absoluteTime >= tweenPrevRepEndTime)))) {
					const tweenNewTime = tween._currentTime = clamp(iterationTime - tween._startTime, 0, tweenChangeDuration);
					const tweenProgress = tween._ease(tweenNewTime / tween._updateDuration);
					const tweenModifier = tween._modifier;
					const tweenValueType = tween._valueType;
					const tweenType = tween._tweenType;
					const tweenIsObject = tweenType === tweenTypes.OBJECT;
					const tweenIsNumber = tweenValueType === valueTypes.NUMBER;
					const tweenPrecision = tweenIsNumber && tweenIsObject || tweenProgress === 0 || tweenProgress === 1 ? -1 : globals.precision;
					/** @type {String|Number} */
					let value;
					/** @type {Number} */
					let number;
					if (tweenIsNumber) value = number = tweenModifier(round(lerp(tween._fromNumber, tween._toNumber, tweenProgress), tweenPrecision));
					else if (tweenValueType === valueTypes.UNIT) {
						number = tweenModifier(round(lerp(tween._fromNumber, tween._toNumber, tweenProgress), tweenPrecision));
						value = `${number}${tween._unit}`;
					} else if (tweenValueType === valueTypes.COLOR) {
						const ns = tween._numbers;
						const fn = tween._fromNumbers;
						const tn = tween._toNumbers;
						const omt = 1 - tweenProgress;
						const fr = fn[0], fg = fn[1], fb = fn[2];
						const tr = tn[0], tg = tn[1], tb = tn[2];
						ns[0] = tweenModifier(Math.sqrt(fr * fr * omt + tr * tr * tweenProgress));
						ns[1] = tweenModifier(Math.sqrt(fg * fg * omt + tg * tg * tweenProgress));
						ns[2] = tweenModifier(Math.sqrt(fb * fb * omt + tb * tb * tweenProgress));
						ns[3] = tweenModifier(lerp(fn[3], tn[3], tweenProgress));
						if (!tween._setter || internalRender) value = `rgba(${round(ns[0], 0)},${round(ns[1], 0)},${round(ns[2], 0)},${ns[3]})`;
					} else if (tweenValueType === valueTypes.COMPLEX) value = composeComplexValue(tween, tweenProgress, tweenPrecision);
					if (tweenHasComposition) tween._number = number;
					if (!internalRender && tweenComposition !== compositionTypes.blend) {
						const tweenProperty = tween.property;
						tweenTarget = tween.target;
						if (tween._setter) tween._setter(tweenTarget, number, tween);
						else if (tweenIsObject) tweenTarget[tweenProperty] = value;
						else if (tweenType === tweenTypes.ATTRIBUTE)
 /** @type {DOMTarget} */ tweenTarget.setAttribute(tweenProperty, value);
						else {
							tweenStyle = tweenTarget.style;
							if (tweenType === tweenTypes.TRANSFORM) {
								if (tweenTarget !== tweenTargetTransforms) {
									tweenTargetTransforms = tweenTarget;
									tweenTargetTransformsProperties = tweenTarget[transformsSymbol];
								}
								tweenTargetTransformsProperties[tweenProperty] = value;
								tweenTransformsNeedUpdate = 1;
							} else if (tweenType === tweenTypes.CSS) tweenStyle[tweenProperty] = value;
							else if (tweenType === tweenTypes.CSS_VAR) tweenStyle.setProperty(tweenProperty, value);
						}
						if (isCurrentTimeAboveZero) hasRendered = 1;
					} else tween._value = value;
				} else if (tweenCurrentTime && tweenPrevRep && !tweenPrevRepIsCrossParent && iterationTime < tween._startTime) tween._currentTime = 0;
				if (tweenTransformsNeedUpdate && tween._renderTransforms) {
					tweenStyle.transform = buildTransformString(tweenTargetTransformsProperties);
					tweenTransformsNeedUpdate = 0;
				}
				tween = tween._next;
			}
			if (!muteCallbacks && hasRendered)
 /** @type {JSAnimation} */ tickable.onRender(tickable);
		}
		if (!muteCallbacks && isCurrentTimeAboveZero) tickable.onUpdate(tickable);
	}
	if (parent && isSetter) {
		if (!muteCallbacks && (parent.began && !isRunningBackwards && tickableAbsoluteTime > 0 && !completed || isRunningBackwards && tickableAbsoluteTime <= 1e-11 && completed)) {
			tickable.onComplete(tickable);
			tickable.completed = !isRunningBackwards;
		}
	} else if (isCurrentTimeAboveZero && isCurrentTimeEqualOrAboveDuration) {
		if (iterationCount === Infinity) tickable._startTime += tickable.duration;
		else if (tickable._currentIteration >= iterationCount - 1) {
			tickable.paused = true;
			if (!completed && !_hasChildren) {
				tickable.completed = true;
				if (!muteCallbacks && !(parent && (isRunningBackwards || !parent.began))) {
					tickable.onComplete(tickable);
					tickable._resolve(tickable);
				}
			}
		}
	} else tickable.completed = false;
	return hasRendered;
};
/**
* @param  {Tickable} tickable
* @param  {Number} time
* @param  {Number} muteCallbacks
* @param  {Number} internalRender
* @param  {Number} tickMode
* @return {void}
*/
var tick = (tickable, time, muteCallbacks, internalRender, tickMode) => {
	const _currentIteration = tickable._currentIteration;
	render(tickable, time, muteCallbacks, internalRender, tickMode);
	if (tickable._hasChildren) {
		const tl = tickable;
		const tlIsRunningBackwards = tl.backwards;
		const tlChildrenTime = internalRender ? time : tl._iterationTime;
		const tlCildrenTickTime = now();
		let tlChildrenHasRendered = 0;
		let tlChildrenHaveCompleted = true;
		if (!internalRender && tl._currentIteration !== _currentIteration) {
			const tlIterationDuration = tl.iterationDuration;
			forEachChildren(tl, (child) => {
				if (!tlIsRunningBackwards) {
					if (!child.completed && !child.backwards && child._currentTime < child.iterationDuration) render(child, tlIterationDuration, muteCallbacks, 1, tickModes.FORCE);
					child.began = false;
					child.completed = false;
				} else {
					const childDuration = child.duration;
					const childStartTime = child._offset + child._delay;
					const childEndTime = childStartTime + childDuration;
					if (!muteCallbacks && childDuration <= 1e-11 && (!childStartTime || childEndTime === tlIterationDuration)) child.onComplete(child);
				}
			});
			if (!muteCallbacks) tl.onLoop(tl);
		}
		forEachChildren(tl, (child) => {
			const childTime = round((tlChildrenTime - child._offset) * child._speed, 12);
			if (tlIsRunningBackwards && childTime > child._delay + child.duration) return;
			const childTickMode = child._fps < tl._fps ? child.requestTick(tlCildrenTickTime) : tickMode;
			tlChildrenHasRendered += render(child, childTime, muteCallbacks, internalRender, childTickMode);
			if (!child.completed && tlChildrenHaveCompleted) tlChildrenHaveCompleted = false;
		}, tlIsRunningBackwards);
		if (!muteCallbacks && tlChildrenHasRendered) tl.onRender(tl);
		if ((tlChildrenHaveCompleted || tlIsRunningBackwards) && tl._currentTime >= tl.duration) {
			tl.paused = true;
			if (!tl.completed) {
				tl.completed = true;
				if (!muteCallbacks) {
					tl.onComplete(tl);
					tl._resolve(tl);
				}
			}
		}
	}
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/core/styles.js
/**
* Anime.js - core - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   JSAnimation,
* } from '../animation/animation.js'
*/
/**
* @import {
*   Target,
*   DOMTarget,
*   Renderable,
*   Tween,
* } from '../types/index.js'
*/
var propertyNamesCache = {};
/**
* @param  {String} propertyName
* @param  {Target} target
* @param  {tweenTypes} tweenType
* @return {String}
*/
var sanitizePropertyName = (propertyName, target, tweenType) => {
	if (tweenType === tweenTypes.TRANSFORM) {
		const t = shortTransforms.get(propertyName);
		return t ? t : propertyName;
	} else if (tweenType === tweenTypes.CSS || tweenType === tweenTypes.ATTRIBUTE && isSvg(target) && propertyName in target.style) {
		const cachedPropertyName = propertyNamesCache[propertyName];
		if (cachedPropertyName) return cachedPropertyName;
		else {
			const lowerCaseName = propertyName ? toLowerCase(propertyName) : propertyName;
			propertyNamesCache[propertyName] = lowerCaseName;
			return lowerCaseName;
		}
	} else return propertyName;
};
/**
* @template {Renderable} T
* @param {T} renderable
* @param {Boolean} [inlineStylesOnly]
* @return {T}
*/
var revertValues = (renderable, inlineStylesOnly = false) => {
	if (renderable._hasChildren) forEachChildren(renderable, (child) => revertValues(child, inlineStylesOnly), true);
	else {
		const animation = renderable;
		animation.pause();
		forEachChildren(animation, (tween) => {
			const tweenProperty = tween.property;
			const tweenTarget = tween.target;
			const tweenType = tween._tweenType;
			const originalInlinedValue = tween._inlineValue;
			const tweenHadNoInlineValue = isNil(originalInlinedValue) || originalInlinedValue === "";
			if (tween._setter) {
				if (!inlineStylesOnly && !tweenHadNoInlineValue) {
					decomposeRawValue(originalInlinedValue, decomposedOriginalValue);
					if (decomposedOriginalValue.d) {
						const src = decomposedOriginalValue.d;
						const dst = tween._numbers;
						for (let i = 0, l = src.length; i < l; i++) dst[i] = src[i];
					} else tween._number = decomposedOriginalValue.n;
					tween._setter(tween.target, tween._number, tween);
				}
			} else if (tweenType === tweenTypes.OBJECT) {
				if (!inlineStylesOnly && !tweenHadNoInlineValue) tweenTarget[tweenProperty] = originalInlinedValue;
			} else if (tweenTarget[isDomSymbol]) if (tweenType === tweenTypes.ATTRIBUTE) {
				if (!inlineStylesOnly) if (tweenHadNoInlineValue)
 /** @type {DOMTarget} */ tweenTarget.removeAttribute(tweenProperty);
				else
 /** @type {DOMTarget} */ tweenTarget.setAttribute(tweenProperty, originalInlinedValue);
			} else {
				const targetStyle = tweenTarget.style;
				if (tweenType === tweenTypes.TRANSFORM) {
					const cachedTransforms = tweenTarget[transformsSymbol];
					if (tweenHadNoInlineValue) delete cachedTransforms[tweenProperty];
					else cachedTransforms[tweenProperty] = originalInlinedValue;
					if (tween._renderTransforms) if (!Object.keys(cachedTransforms).length) targetStyle.removeProperty("transform");
					else targetStyle.transform = buildTransformString(cachedTransforms);
				} else if (tweenHadNoInlineValue) targetStyle.removeProperty(toLowerCase(tweenProperty));
				else targetStyle[tweenProperty] = originalInlinedValue;
			}
			if (tweenTarget[isDomSymbol] && animation._tail === tween) animation.targets.forEach((t) => {
				if (t.getAttribute && t.getAttribute("style") === "") t.removeAttribute("style");
			});
		});
	}
	return renderable;
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/core/clock.js
/**
* Anime.js - core - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   Tickable,
*   Tween,
* } from '../types/index.js'
*/
var Clock = class {
	/** @param {Number} [initTime] */
	constructor(initTime = 0) {
		/** @type {Number} */
		this.deltaTime = 0;
		/** @type {Number} */
		this._currentTime = initTime;
		/** @type {Number} */
		this._lastTickTime = initTime;
		/** @type {Number} */
		this._startTime = initTime;
		/** @type {Number} */
		this._lastTime = initTime;
		/** @type {Number} */
		this._frameDuration = K / 240;
		/** @type {Number} */
		this._fps = 240;
		/** @type {Number} */
		this._speed = 1;
		/** @type {Boolean} */
		this._hasChildren = false;
		/** @type {Tickable|Tween} */
		this._head = null;
		/** @type {Tickable|Tween} */
		this._tail = null;
	}
	get fps() {
		return this._fps;
	}
	set fps(frameRate) {
		const fr = +frameRate;
		const fps = fr < 1e-11 ? minValue : fr;
		const frameDuration = K / fps;
		if (fps > defaults.frameRate) defaults.frameRate = fps;
		this._fps = fps;
		this._frameDuration = frameDuration;
	}
	get speed() {
		return this._speed;
	}
	set speed(playbackRate) {
		const pbr = +playbackRate;
		this._speed = pbr < 1e-11 ? minValue : pbr;
	}
	/**
	* @param  {Number} time
	* @return {tickModes}
	*/
	requestTick(time) {
		const frameDuration = this._frameDuration;
		const elapsed = time - this._lastTickTime;
		const scaled = frameDuration * .25;
		if (elapsed + (scaled < 4 ? scaled : 4) < frameDuration) return tickModes.NONE;
		this._lastTickTime = elapsed >= frameDuration ? time - elapsed % frameDuration : time;
		return tickModes.AUTO;
	}
	/**
	* @param  {Number} time
	* @return {Number}
	*/
	computeDeltaTime(time) {
		const delta = time - this._lastTime;
		this.deltaTime = delta;
		this._lastTime = time;
		return delta;
	}
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/animation/additive.js
/**
* Anime.js - animation - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
var additive = {
	animation: null,
	update: noop
};
/**
* @import {
*   Tween,
*   TweenAdditiveLookups,
* } from '../types/index.js'
*/
/**
* @typedef AdditiveAnimation
* @property {Number} duration
* @property {Number} _offset
* @property {Number} _delay
* @property {Tween} _head
* @property {Tween} _tail
*/
/**
* @param  {TweenAdditiveLookups} lookups
* @return {AdditiveAnimation}
*/
var addAdditiveAnimation = (lookups) => {
	let animation = additive.animation;
	if (!animation) {
		animation = {
			duration: minValue,
			computeDeltaTime: noop,
			_offset: 0,
			_delay: 0,
			_head: null,
			_tail: null
		};
		additive.animation = animation;
		additive.update = () => {
			lookups.forEach((propertyAnimation) => {
				for (let propertyName in propertyAnimation) {
					const tweens = propertyAnimation[propertyName];
					const lookupTween = tweens._head;
					if (lookupTween) {
						const valueType = lookupTween._valueType;
						const additiveValues = valueType === valueTypes.COMPLEX || valueType === valueTypes.COLOR ? cloneArray(lookupTween._fromNumbers) : null;
						let additiveValue = lookupTween._fromNumber;
						let tween = tweens._tail;
						while (tween && tween !== lookupTween) {
							if (additiveValues) for (let i = 0, l = tween._numbers.length; i < l; i++) additiveValues[i] += tween._numbers[i];
							else additiveValue += tween._number;
							tween = tween._prevAdd;
						}
						lookupTween._toNumber = additiveValue;
						lookupTween._toNumbers = additiveValues;
					}
				}
			});
			render(animation, 1, 1, 0, tickModes.FORCE);
		};
	}
	return animation;
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/engine/engine.js
/**
* Anime.js - engine - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   DefaultsParams,
* } from '../types/index.js'
*/
/**
* @import {
*   Tickable,
* } from '../types/index.js'
*/
var engineTickMethod = /*#__PURE__*/ (() => isBrowser ? requestAnimationFrame : setImmediate)();
var engineCancelMethod = /*#__PURE__*/ (() => isBrowser ? cancelAnimationFrame : clearImmediate)();
var Engine = class extends Clock {
	/** @param {Number} [initTime] */
	constructor(initTime) {
		super(initTime);
		this.useDefaultMainLoop = true;
		this.pauseOnDocumentHidden = true;
		/** @type {DefaultsParams} */
		this.defaults = defaults;
		this.paused = true;
		/** @type {Number|NodeJS.Immediate} */
		this.reqId = 0;
	}
	update() {
		const time = this._currentTime = now();
		if (this.requestTick(time)) {
			this.computeDeltaTime(time);
			const engineSpeed = this._speed;
			const engineFps = this._fps;
			let activeTickable = this._head;
			while (activeTickable) {
				const nextTickable = activeTickable._next;
				if (!activeTickable.paused) tick(activeTickable, (time - activeTickable._startTime) * activeTickable._speed * engineSpeed, 0, 0, activeTickable._fps < engineFps ? activeTickable.requestTick(time) : tickModes.AUTO);
				else {
					removeChild(this, activeTickable);
					this._hasChildren = !!this._tail;
					activeTickable._running = false;
					if (activeTickable.completed && !activeTickable._cancelled) activeTickable.cancel();
				}
				activeTickable = nextTickable;
			}
			additive.update();
		}
	}
	wake() {
		if (this.useDefaultMainLoop && !this.reqId) {
			this.requestTick(now());
			this.reqId = engineTickMethod(tickEngine);
		}
		return this;
	}
	pause() {
		if (!this.reqId) return;
		this.paused = true;
		return killEngine();
	}
	resume() {
		if (!this.paused) return;
		this.paused = false;
		forEachChildren(this, (child) => child.resetTime());
		return this.wake();
	}
	get speed() {
		return this._speed * (globals.timeScale === 1 ? 1 : K);
	}
	set speed(playbackRate) {
		const speed = playbackRate * globals.timeScale;
		if (this._speed === speed) return;
		this._speed = speed;
		forEachChildren(this, (child) => child.speed = child._speed);
	}
	get timeUnit() {
		return globals.timeScale === 1 ? "ms" : "s";
	}
	set timeUnit(unit) {
		const secondsScale = .001;
		const isSecond = unit === "s";
		const newScale = isSecond ? secondsScale : 1;
		if (globals.timeScale !== newScale) {
			globals.timeScale = newScale;
			globals.tickThreshold = 200 * newScale;
			const scaleFactor = isSecond ? secondsScale : K;
			/** @type {Number} */
			this.defaults.duration *= scaleFactor;
			this._speed *= scaleFactor;
		}
	}
	get precision() {
		return globals.precision;
	}
	set precision(precision) {
		globals.precision = precision;
	}
};
var engine = /*#__PURE__*/ (() => {
	const engine = new Engine(now());
	if (isBrowser) {
		globalVersions.engine = engine;
		doc.addEventListener("visibilitychange", () => {
			if (!engine.pauseOnDocumentHidden) return;
			doc.hidden ? engine.pause() : engine.resume();
		});
	}
	return engine;
})();
var tickEngine = () => {
	if (engine._head) {
		engine.reqId = engineTickMethod(tickEngine);
		engine.update();
	} else engine.reqId = 0;
};
var killEngine = () => {
	engineCancelMethod(engine.reqId);
	engine.reqId = 0;
	return engine;
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/animation/composition.js
/**
* Anime.js - animation - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   TweenReplaceLookups,
*   TweenAdditiveLookups,
*   TweenPropertySiblings,
*   Tween,
*   Target,
*   TargetsArray,
*   Renderable,
* } from '../types/index.js'
*
* @import {
*   JSAnimation,
* } from '../animation/animation.js'
*/
var lookups = {
	/** @type {TweenReplaceLookups} */
	_rep: /* @__PURE__ */ new WeakMap(),
	/** @type {TweenAdditiveLookups} */
	_add: /* @__PURE__ */ new Map()
};
/**
* @param  {Target} target
* @param  {String} property
* @param  {String} lookup
* @return {TweenPropertySiblings}
*/
var getTweenSiblings = (target, property, lookup = "_rep") => {
	const lookupMap = lookups[lookup];
	let targetLookup = lookupMap.get(target);
	if (!targetLookup) {
		targetLookup = {};
		lookupMap.set(target, targetLookup);
	}
	return targetLookup[property] ? targetLookup[property] : targetLookup[property] = {
		_head: null,
		_tail: null
	};
};
/**
* @param  {Tween} p
* @param  {Tween} c
* @return {Number|Boolean}
*/
var addTweenSortMethod = (p, c) => {
	return p._isOverridden || p._absoluteStartTime > c._absoluteStartTime;
};
/**
* @param {Tween} tween
*/
var overrideTween = (tween) => {
	tween._isOverlapped = 1;
	tween._isOverridden = 1;
	tween._changeDuration = minValue;
	tween._currentTime = minValue;
};
/**
* @param  {Tween} tween
* @param  {TweenPropertySiblings} siblings
* @return {Tween}
*/
var composeTween = (tween, siblings) => {
	const tweenCompositionType = tween._composition;
	if (tweenCompositionType === compositionTypes.replace) {
		const tweenAbsStartTime = tween._absoluteStartTime;
		addChild(siblings, tween, addTweenSortMethod, "_prevRep", "_nextRep");
		const prevSibling = tween._prevRep;
		if (prevSibling) {
			const prevParent = prevSibling.parent;
			const prevAbsEndTime = prevSibling._absoluteEndTime;
			if (tween.parent.id !== prevParent.id && prevParent.iterationCount > 1 && prevAbsEndTime + (prevParent.duration - prevParent.iterationDuration) > tweenAbsStartTime) {
				overrideTween(prevSibling);
				let prevPrevSibling = prevSibling._prevRep;
				while (prevPrevSibling && prevPrevSibling.parent.id === prevParent.id) {
					overrideTween(prevPrevSibling);
					prevPrevSibling = prevPrevSibling._prevRep;
				}
			}
			const absoluteUpdateStartTime = tween._absoluteUpdateStartTime;
			if (prevAbsEndTime > absoluteUpdateStartTime) {
				const prevChangeStartTime = prevSibling._startTime;
				const updatedPrevChangeDuration = round(absoluteUpdateStartTime - (prevAbsEndTime - (prevChangeStartTime + prevSibling._updateDuration)) - prevChangeStartTime, 12);
				prevSibling._changeDuration = updatedPrevChangeDuration;
				prevSibling._currentTime = updatedPrevChangeDuration;
				prevSibling._isOverlapped = 1;
				if (updatedPrevChangeDuration < 1e-11) overrideTween(prevSibling);
			}
			const tweenParentTL = tween.parent.parent;
			if (!tweenParentTL || tweenParentTL !== prevParent.parent) {
				let pausePrevParentAnimation = true;
				forEachChildren(prevParent, (t) => {
					if (!t._isOverlapped) pausePrevParentAnimation = false;
				});
				if (pausePrevParentAnimation) {
					const prevParentTL = prevParent.parent;
					if (prevParentTL) {
						let pausePrevParentTL = true;
						forEachChildren(prevParentTL, (a) => {
							if (a !== prevParent) forEachChildren(a, (t) => {
								if (!t._isOverlapped) pausePrevParentTL = false;
							});
						});
						if (pausePrevParentTL) prevParentTL.cancel();
					} else prevParent.cancel();
				}
			}
		}
	} else if (tweenCompositionType === compositionTypes.blend) {
		const additiveTweenSiblings = getTweenSiblings(tween.target, tween.property, "_add");
		const additiveAnimation = addAdditiveAnimation(lookups._add);
		let lookupTween = additiveTweenSiblings._head;
		if (!lookupTween) {
			lookupTween = { ...tween };
			lookupTween._composition = compositionTypes.replace;
			lookupTween._updateDuration = minValue;
			lookupTween._startTime = 0;
			lookupTween._numbers = cloneArray(tween._fromNumbers);
			lookupTween._number = 0;
			lookupTween._next = null;
			lookupTween._prev = null;
			addChild(additiveTweenSiblings, lookupTween);
			addChild(additiveAnimation, lookupTween);
		}
		const toNumber = tween._toNumber;
		tween._fromNumber = lookupTween._fromNumber - toNumber;
		tween._toNumber = 0;
		tween._numbers = cloneArray(tween._fromNumbers);
		tween._number = 0;
		lookupTween._fromNumber = toNumber;
		if (tween._toNumbers.length) {
			const toNumbers = cloneArray(tween._toNumbers);
			toNumbers.forEach((value, i) => {
				tween._fromNumbers[i] = lookupTween._fromNumbers[i] - value;
				tween._toNumbers[i] = 0;
			});
			lookupTween._fromNumbers = toNumbers;
		}
		addChild(additiveTweenSiblings, tween, null, "_prevAdd", "_nextAdd");
	}
	return tween;
};
/**
* @param  {Tween} tween
* @return {Tween}
*/
var removeTweenSliblings = (tween) => {
	const tweenComposition = tween._composition;
	if (tweenComposition !== compositionTypes.none) {
		const tweenTarget = tween.target;
		const tweenProperty = tween.property;
		const tweenReplaceSiblings = lookups._rep.get(tweenTarget)[tweenProperty];
		removeChild(tweenReplaceSiblings, tween, "_prevRep", "_nextRep");
		if (tweenComposition === compositionTypes.blend) {
			const addTweensLookup = lookups._add;
			const addTargetProps = addTweensLookup.get(tweenTarget);
			if (!addTargetProps) return;
			const additiveTweenSiblings = addTargetProps[tweenProperty];
			const additiveAnimation = additive.animation;
			removeChild(additiveTweenSiblings, tween, "_prevAdd", "_nextAdd");
			const lookupTween = additiveTweenSiblings._head;
			if (lookupTween && lookupTween === additiveTweenSiblings._tail) {
				removeChild(additiveTweenSiblings, lookupTween, "_prevAdd", "_nextAdd");
				removeChild(additiveAnimation, lookupTween);
				let shouldClean = true;
				for (let prop in addTargetProps) if (addTargetProps[prop]._head) {
					shouldClean = false;
					break;
				}
				if (shouldClean) addTweensLookup.delete(tweenTarget);
			}
		}
	}
	return tween;
};
/**
* @param  {TargetsArray} targetsArray
* @param  {JSAnimation} animation
* @param  {String} [propertyName]
* @return {Boolean}
*/
var removeTargetsFromJSAnimation = (targetsArray, animation, propertyName) => {
	let tweensMatchesTargets = false;
	forEachChildren(animation, (tween) => {
		const tweenTarget = tween.target;
		if (targetsArray.includes(tweenTarget)) {
			const tweenName = tween.property;
			const tweenType = tween._tweenType;
			const normalizePropName = sanitizePropertyName(propertyName, tweenTarget, tweenType);
			if (!normalizePropName || normalizePropName && normalizePropName === tweenName) {
				if (tween.parent._tail === tween && tween._tweenType === tweenTypes.TRANSFORM && tween._prev && tween._prev._tweenType === tweenTypes.TRANSFORM) tween._prev._renderTransforms = 1;
				removeChild(animation, tween);
				removeTweenSliblings(tween);
				tweensMatchesTargets = true;
			}
		}
	}, true);
	return tweensMatchesTargets;
};
/**
* @param  {TargetsArray} targetsArray
* @param  {Renderable} [renderable]
* @param  {String} [propertyName]
*/
var removeTargetsFromRenderable = (targetsArray, renderable, propertyName) => {
	const parent = renderable ? renderable : engine;
	let removeMatches;
	if (parent._hasChildren) {
		let iterationDuration = 0;
		forEachChildren(parent, (child) => {
			if (!child._hasChildren) {
				removeMatches = removeTargetsFromJSAnimation(targetsArray, child, propertyName);
				if (removeMatches && !child._head) {
					child.cancel();
					removeChild(parent, child);
				} else {
					const childDur = child._offset + child._delay + child.duration;
					if (childDur > iterationDuration) iterationDuration = childDur;
				}
			}
			if (child._head) removeTargetsFromRenderable(targetsArray, child, propertyName);
			else child._hasChildren = false;
		}, true);
		if (!isUnd(
			/** @type {Renderable} */
			parent.iterationDuration
		))
 /** @type {Renderable} */ parent.iterationDuration = iterationDuration;
	} else removeMatches = removeTargetsFromJSAnimation(targetsArray, parent, propertyName);
	if (removeMatches && !parent._head) {
		parent._hasChildren = false;
		if (parent.cancel) /** @type {Renderable} */ parent.cancel();
	}
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/timer/timer.js
/**
* Anime.js - timer - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   Callback,
*   TimerParams,
*   Renderable,
*   Tween,
* } from '../types/index.js'
*/
/**
* @import {
*   ScrollObserver,
* } from '../events/scroll.js'
*/
/**
* @import {
*   Timeline,
* } from '../timeline/timeline.js'
*/
/**
* @param  {Timer} timer
* @return {Timer}
*/
var resetTimerProperties = (timer) => {
	timer.paused = true;
	timer.began = false;
	timer.completed = false;
	return timer;
};
/**
* @param  {Timer} timer
* @return {Timer}
*/
var reviveTimer = (timer) => {
	if (!timer._cancelled) return timer;
	if (timer._hasChildren) forEachChildren(timer, reviveTimer);
	else forEachChildren(timer, (tween) => {
		if (tween._composition !== compositionTypes.none) composeTween(tween, getTweenSiblings(tween.target, tween.property));
	});
	timer._cancelled = 0;
	return timer;
};
var timerId = 0;
/** @param {Timer} prev @param {Timer} child */
var sortByPriority = (prev, child) => prev._priority > child._priority;
/**
* Base class used to create Timers, Animations and Timelines
*/
var Timer = class extends Clock {
	/**
	* @param {TimerParams} [parameters]
	* @param {Timeline} [parent]
	* @param {Number} [parentPosition]
	*/
	constructor(parameters = {}, parent = null, parentPosition = 0) {
		super(0);
		++timerId;
		const { id, delay, duration, reversed, alternate, loop, loopDelay, autoplay, frameRate, playbackRate, priority, onComplete, onLoop, onPause, onBegin, onBeforeUpdate, onUpdate } = parameters;
		if (scope.current) scope.current.register(this);
		const timerInitTime = parent ? 0 : engine._lastTickTime;
		const timerDefaults = parent ? parent.defaults : globals.defaults;
		const timerDelay = isFnc(delay) || isUnd(delay) ? timerDefaults.delay : +delay;
		const timerDuration = isFnc(duration) || isUnd(duration) ? Infinity : +duration;
		const timerLoop = setValue(loop, timerDefaults.loop);
		const timerLoopDelay = setValue(loopDelay, timerDefaults.loopDelay);
		let timerIterationCount = timerLoop === true || timerLoop === Infinity || timerLoop < 0 ? Infinity : 
		/** @type {Number} */ timerLoop + 1;
		let offsetPosition = 0;
		if (parent) offsetPosition = parentPosition;
		else {
			if (!engine.reqId) engine.requestTick(now());
			offsetPosition = (engine._lastTickTime - engine._startTime) * globals.timeScale;
		}
		/** @type {String|Number} */
		this.id = !isUnd(id) ? id : timerId;
		/** @type {Timeline} */
		this.parent = parent;
		this.duration = clampInfinity((timerDuration + timerLoopDelay) * timerIterationCount - timerLoopDelay) || 1e-11;
		/** @type {Boolean} */
		this.backwards = false;
		/** @type {Boolean} */
		this.paused = true;
		/** @type {Boolean} */
		this.began = false;
		/** @type {Boolean} */
		this.completed = false;
		/** @type {Callback<this>} */
		this.onBegin = onBegin || timerDefaults.onBegin;
		/** @type {Callback<this>} */
		this.onBeforeUpdate = onBeforeUpdate || timerDefaults.onBeforeUpdate;
		/** @type {Callback<this>} */
		this.onUpdate = onUpdate || timerDefaults.onUpdate;
		/** @type {Callback<this>} */
		this.onLoop = onLoop || timerDefaults.onLoop;
		/** @type {Callback<this>} */
		this.onPause = onPause || timerDefaults.onPause;
		/** @type {Callback<this>} */
		this.onComplete = onComplete || timerDefaults.onComplete;
		/** @type {Number} */
		this.iterationDuration = timerDuration;
		/** @type {Number} */
		this.iterationCount = timerIterationCount;
		/** @type {Boolean|ScrollObserver} */
		this._autoplay = parent ? false : setValue(autoplay, timerDefaults.autoplay);
		/** @type {Number} */
		this._offset = offsetPosition;
		/** @type {Number} */
		this._delay = timerDelay;
		/** @type {Number} */
		this._loopDelay = timerLoopDelay;
		/** @type {Number} */
		this._iterationTime = 0;
		/** @type {Number} */
		this._currentIteration = 0;
		/** @type {Function} */
		this._resolve = noop;
		/** @type {Boolean} */
		this._running = false;
		/** @type {Number} */
		this._reversed = +setValue(reversed, timerDefaults.reversed);
		/** @type {Number} */
		this._reverse = this._reversed;
		/** @type {Number} */
		this._cancelled = 0;
		/** @type {Boolean} */
		this._alternate = setValue(alternate, timerDefaults.alternate);
		/** @type {Renderable} */
		this._prev = null;
		/** @type {Renderable} */
		this._next = null;
		/** @type {Number} */
		this._lastTickTime = timerInitTime;
		/** @type {Number} */
		this._startTime = timerInitTime;
		/** @type {Number} */
		this._lastTime = timerInitTime;
		/** @type {Number} */
		this._fps = setValue(frameRate, timerDefaults.frameRate);
		/** @type {Number} */
		this._speed = setValue(playbackRate, timerDefaults.playbackRate);
		/** @type {Number} */
		this._priority = +setValue(priority, 1);
	}
	get cancelled() {
		return !!this._cancelled;
	}
	set cancelled(cancelled) {
		cancelled ? this.cancel() : this.reset(true).play();
	}
	get currentTime() {
		return clamp(round(this._currentTime, globals.precision), -this._delay, this.duration);
	}
	set currentTime(time) {
		const paused = this.paused;
		this.pause().seek(+time);
		if (!paused) this.resume();
	}
	get iterationCurrentTime() {
		return clamp(round(this._iterationTime, globals.precision), 0, this.iterationDuration);
	}
	set iterationCurrentTime(time) {
		this.currentTime = this.iterationDuration * this._currentIteration + time;
	}
	get progress() {
		return clamp(round(this._currentTime / this.duration, 10), 0, 1);
	}
	set progress(progress) {
		this.currentTime = this.duration * progress;
	}
	get iterationProgress() {
		return clamp(round(this._iterationTime / this.iterationDuration, 10), 0, 1);
	}
	set iterationProgress(progress) {
		const iterationDuration = this.iterationDuration;
		this.currentTime = iterationDuration * this._currentIteration + iterationDuration * progress;
	}
	get currentIteration() {
		return this._currentIteration;
	}
	set currentIteration(iterationCount) {
		this.currentTime = this.iterationDuration * clamp(+iterationCount, 0, this.iterationCount - 1);
	}
	get reversed() {
		return !!this._reversed;
	}
	set reversed(reverse) {
		reverse ? this.reverse() : this.play();
	}
	get speed() {
		return super.speed;
	}
	set speed(playbackRate) {
		super.speed = playbackRate;
		this.resetTime();
	}
	/**
	* @param  {Boolean} [softReset]
	* @return {this}
	*/
	reset(softReset = false) {
		reviveTimer(this);
		if (this._reversed && !this._reverse) this.reversed = false;
		this._iterationTime = this.iterationDuration;
		tick(this, 0, 1, ~~softReset, tickModes.FORCE);
		resetTimerProperties(this);
		if (this._hasChildren) forEachChildren(this, resetTimerProperties);
		return this;
	}
	/**
	* @param  {Boolean} internalRender
	* @return {this}
	*/
	init(internalRender = false) {
		this.fps = this._fps;
		this.speed = this._speed;
		if (!internalRender && this._hasChildren) tick(this, this.duration, 1, ~~internalRender, tickModes.FORCE);
		this.reset(internalRender);
		const autoplay = this._autoplay;
		if (autoplay === true) this.resume();
		else if (autoplay && !isUnd(
			/** @type {ScrollObserver} */
			autoplay.linked
		))
 /** @type {ScrollObserver} */ autoplay.link(this);
		return this;
	}
	/** @return {this} */
	resetTime() {
		const timeScale = 1 / (this._speed * engine._speed);
		this._startTime = now() - (this._currentTime + this._delay) * timeScale;
		return this;
	}
	/** @return {this} */
	pause() {
		if (this.paused) return this;
		this.paused = true;
		this.onPause(this);
		return this;
	}
	/** @return {this} */
	resume() {
		if (!this.paused) return this;
		this.paused = false;
		if (this.duration <= 1e-11 && !this._hasChildren) tick(this, minValue, 0, 0, tickModes.FORCE);
		else {
			if (!this._running) {
				addChild(engine, this, sortByPriority);
				engine._hasChildren = true;
				this._running = true;
			}
			this.resetTime();
			this._startTime -= 12;
			engine.wake();
		}
		return this;
	}
	/** @return {this} */
	restart() {
		return this.reset().resume();
	}
	/**
	* @param  {Number} time
	* @param  {Boolean|Number} [muteCallbacks]
	* @param  {Boolean|Number} [internalRender]
	* @return {this}
	*/
	seek(time, muteCallbacks = 0, internalRender = 0) {
		reviveTimer(this);
		this.completed = false;
		const isPaused = this.paused;
		this.paused = true;
		tick(this, time + this._delay, ~~muteCallbacks, ~~internalRender, tickModes.AUTO);
		return isPaused ? this : this.resume();
	}
	/** @return {this} */
	alternate() {
		const reversed = this._reversed;
		const count = this.iterationCount;
		const duration = this.iterationDuration;
		const iterations = count === Infinity ? floor(maxValue / duration) : count;
		this._reversed = +(this._alternate && !(iterations % 2) ? reversed : !reversed);
		if (count === Infinity) this.iterationProgress = this._reversed ? 1 - this.iterationProgress : this.iterationProgress;
		else this.seek(duration * iterations - this._currentTime);
		this.resetTime();
		return this;
	}
	/** @return {this} */
	play() {
		if (this._reversed) this.alternate();
		return this.resume();
	}
	/** @return {this} */
	reverse() {
		if (!this._reversed) this.alternate();
		return this.resume();
	}
	/** @return {this} */
	cancel() {
		if (this._hasChildren) forEachChildren(this, (child) => child.cancel(), true);
		else forEachChildren(this, removeTweenSliblings);
		this._cancelled = 1;
		return this.pause();
	}
	/**
	* @param  {Number} newDuration
	* @return {this}
	*/
	stretch(newDuration) {
		const currentDuration = this.duration;
		const normlizedDuration = normalizeTime(newDuration);
		if (currentDuration === normlizedDuration) return this;
		const timeScale = newDuration / currentDuration;
		const isSetter = newDuration <= minValue;
		this.duration = isSetter ? minValue : normlizedDuration;
		this.iterationDuration = isSetter ? minValue : normalizeTime(this.iterationDuration * timeScale);
		this._offset *= timeScale;
		this._delay *= timeScale;
		this._loopDelay *= timeScale;
		return this;
	}
	/**
	* Cancels the timer by seeking it back to 0 and reverting the attached scroller if necessary
	* @return {this}
	*/
	revert() {
		tick(this, 0, 1, 0, tickModes.AUTO);
		const ap = this._autoplay;
		if (ap && ap.linked && ap.linked === this) ap.revert();
		return this.cancel();
	}
	/**
	* Imediatly completes the timer, cancels it and triggers the onComplete callback
	* @param  {Boolean|Number} [muteCallbacks]
	* @return {this}
	*/
	complete(muteCallbacks = 0) {
		return this.seek(this.duration, muteCallbacks).cancel();
	}
	/**
	* @typedef {this & {then: null}} ResolvedTimer
	*/
	/**
	* @param  {Callback<ResolvedTimer>} [callback]
	* @return Promise<this>
	*/
	then(callback = noop) {
		const then = this.then;
		const onResolve = () => {
			this.then = null;
			callback(this);
			this.then = then;
			this._resolve = noop;
		};
		return new Promise((r) => {
			this._resolve = () => r(onResolve());
			if (this.completed) this._resolve();
			return this;
		});
	}
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/core/targets.js
/**
* Anime.js - core - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   DOMTarget,
*   DOMTargetsParam,
*   JSTargetsArray,
*   TargetsParam,
*   JSTargetsParam,
*   TargetsArray,
*   DOMTargetsArray,
* } from '../types/index.js'
*/
/**
* @param  {DOMTargetsParam|TargetsParam} v
* @return {NodeList|HTMLCollection}
*/
function getNodeList(v) {
	const n = isStr(v) ? scope.root.querySelectorAll(v) : v;
	if (n instanceof NodeList || n instanceof HTMLCollection) return n;
}
/**
* @overload
* @param  {DOMTargetsParam} targets
* @return {DOMTargetsArray}
*
* @overload
* @param  {JSTargetsParam} targets
* @return {JSTargetsArray}
*
* @overload
* @param  {TargetsParam} targets
* @return {TargetsArray}
*
* @param  {DOMTargetsParam|JSTargetsParam|TargetsParam} targets
*/
function parseTargets(targets) {
	if (isNil(targets)) return [];
	if (!isBrowser) return isArr(targets) && targets.flat(Infinity) || [targets];
	if (isArr(targets)) {
		const flattened = targets.flat(Infinity);
		/** @type {TargetsArray} */
		const parsed = [];
		for (let i = 0, l = flattened.length; i < l; i++) {
			const item = flattened[i];
			if (!isNil(item)) {
				const nodeList = getNodeList(item);
				if (nodeList) for (let j = 0, jl = nodeList.length; j < jl; j++) {
					const subItem = nodeList[j];
					if (!isNil(subItem)) {
						let isDuplicate = false;
						for (let k = 0, kl = parsed.length; k < kl; k++) if (parsed[k] === subItem) {
							isDuplicate = true;
							break;
						}
						if (!isDuplicate) parsed.push(subItem);
					}
				}
				else {
					let isDuplicate = false;
					for (let j = 0, jl = parsed.length; j < jl; j++) if (parsed[j] === item) {
						isDuplicate = true;
						break;
					}
					if (!isDuplicate) parsed.push(item);
				}
			}
		}
		return parsed;
	}
	const nodeList = getNodeList(targets);
	if (nodeList) return Array.from(nodeList);
	return [targets];
}
/**
* @overload
* @param  {DOMTargetsParam} targets
* @return {DOMTargetsArray}
*
* @overload
* @param  {JSTargetsParam} targets
* @return {JSTargetsArray}
*
* @overload
* @param  {TargetsParam} targets
* @return {TargetsArray}
*
* @param  {DOMTargetsParam|JSTargetsParam|TargetsParam} targets
*/
function registerTargets(targets) {
	const parsedTargetsArray = parseTargets(targets);
	const parsedTargetsLength = parsedTargetsArray.length;
	for (let i = 0; i < parsedTargetsLength; i++) {
		const target = parsedTargetsArray[i];
		if (!target[isRegisteredTargetSymbol]) {
			target[isRegisteredTargetSymbol] = true;
			const isSvgType = isSvg(target);
			if (target.nodeType || isSvgType) {
				target[isDomSymbol] = true;
				target[isSvgSymbol] = isSvgType;
				target[transformsSymbol] = {};
			}
		}
	}
	return parsedTargetsArray;
}
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/core/units.js
/**
* Anime.js - core - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
var angleUnitsMap = {
	"deg": 1,
	"rad": 180 / PI,
	"turn": 360
};
var convertedValuesCache = {};
/**
* @import {
*   DOMTarget,
*   TweenDecomposedValue,
* } from '../types/index.js'
*/
/**
* @param  {DOMTarget} el
* @param  {TweenDecomposedValue} decomposedValue
* @param  {String} unit
* @param  {Boolean} [force]
* @return {TweenDecomposedValue}
*/
var convertValueUnit = (el, decomposedValue, unit, force = false) => {
	const currentUnit = decomposedValue.u;
	const currentNumber = decomposedValue.n;
	if (decomposedValue.t === valueTypes.UNIT && currentUnit === unit) return decomposedValue;
	const cachedKey = currentNumber + currentUnit + unit;
	const cached = convertedValuesCache[cachedKey];
	if (!isUnd(cached) && !force) decomposedValue.n = cached;
	else {
		let convertedValue;
		if (currentUnit in angleUnitsMap) convertedValue = currentNumber * angleUnitsMap[currentUnit] / angleUnitsMap[unit];
		else {
			const baseline = 100;
			const tempEl = el.cloneNode();
			const parentNode = el.parentNode;
			const parentEl = parentNode && parentNode !== doc ? parentNode : doc.body;
			parentEl.appendChild(tempEl);
			const elStyle = tempEl.style;
			elStyle.width = baseline + currentUnit;
			const currentUnitWidth = tempEl.offsetWidth || baseline;
			elStyle.width = baseline + unit;
			const factor = currentUnitWidth / (tempEl.offsetWidth || baseline);
			parentEl.removeChild(tempEl);
			convertedValue = factor * currentNumber;
		}
		decomposedValue.n = convertedValue;
		convertedValuesCache[cachedKey] = convertedValue;
	}
	decomposedValue.t, valueTypes.UNIT;
	decomposedValue.u = unit;
	return decomposedValue;
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/easings/none.js
/**
* Anime.js - easings - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   EasingFunction,
* } from '../types/index.js'
*/
/** @type {EasingFunction} */
var none = (t) => t;
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/easings/eases/parser.js
/**
* Anime.js - easings - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   EasingFunction,
*   EasingFunctionWithParams,
*   EasingParam,
*   BackEasing,
*   ElasticEasing,
*   PowerEasing,
* } from '../../types/index.js'
*/
/** @type {PowerEasing} */
var easeInPower = (p = 1.68) => (t) => pow(t, +p);
/**
* @callback EaseType
* @param {EasingFunction} Ease
* @return {EasingFunction}
*/
/** @type {Record<String, EaseType>} */
var easeTypes = {
	in: (easeIn) => (t) => easeIn(t),
	out: (easeIn) => (t) => 1 - easeIn(1 - t),
	inOut: (easeIn) => (t) => t < .5 ? easeIn(t * 2) / 2 : 1 - easeIn(t * -2 + 2) / 2,
	outIn: (easeIn) => (t) => t < .5 ? (1 - easeIn(1 - t * 2)) / 2 : (easeIn(t * 2 - 1) + 1) / 2
};
/**
* Easing functions adapted and simplified from https://robertpenner.com/easing/
* (c) 2001 Robert Penner
*/
var halfPI = PI / 2;
var doublePI = PI * 2;
/** @type {Record<String, EasingFunctionWithParams|EasingFunction>} */
var easeInFunctions = {
	[""]: easeInPower,
	Quad: easeInPower(2),
	Cubic: easeInPower(3),
	Quart: easeInPower(4),
	Quint: easeInPower(5),
	/** @type {EasingFunction} */
	Sine: (t) => 1 - cos(t * halfPI),
	/** @type {EasingFunction} */
	Circ: (t) => 1 - sqrt(1 - t * t),
	/** @type {EasingFunction} */
	Expo: (t) => t ? pow(2, 10 * t - 10) : 0,
	/** @type {EasingFunction} */
	Bounce: (t) => {
		let pow2, b = 4;
		while (t < ((pow2 = pow(2, --b)) - 1) / 11);
		return 1 / pow(4, 3 - b) - 7.5625 * pow((pow2 * 3 - 2) / 22 - t, 2);
	},
	/** @type {BackEasing} */
	Back: (overshoot = 1.7) => (t) => (+overshoot + 1) * t * t * t - +overshoot * t * t,
	/** @type {ElasticEasing} */
	Elastic: (amplitude = 1, period = .3) => {
		const a = clamp(+amplitude, 1, 10);
		const p = clamp(+period, minValue, 2);
		const s = p / doublePI * asin(1 / a);
		const e = doublePI / p;
		return (t) => t === 0 || t === 1 ? t : -a * pow(2, -10 * (1 - t)) * sin((1 - t - s) * e);
	}
};
/**
* @typedef  {Object} EasesFunctions
* @property {EasingFunction} linear
* @property {EasingFunction} none
* @property {PowerEasing} in
* @property {PowerEasing} out
* @property {PowerEasing} inOut
* @property {PowerEasing} outIn
* @property {EasingFunction} inQuad
* @property {EasingFunction} outQuad
* @property {EasingFunction} inOutQuad
* @property {EasingFunction} outInQuad
* @property {EasingFunction} inCubic
* @property {EasingFunction} outCubic
* @property {EasingFunction} inOutCubic
* @property {EasingFunction} outInCubic
* @property {EasingFunction} inQuart
* @property {EasingFunction} outQuart
* @property {EasingFunction} inOutQuart
* @property {EasingFunction} outInQuart
* @property {EasingFunction} inQuint
* @property {EasingFunction} outQuint
* @property {EasingFunction} inOutQuint
* @property {EasingFunction} outInQuint
* @property {EasingFunction} inSine
* @property {EasingFunction} outSine
* @property {EasingFunction} inOutSine
* @property {EasingFunction} outInSine
* @property {EasingFunction} inCirc
* @property {EasingFunction} outCirc
* @property {EasingFunction} inOutCirc
* @property {EasingFunction} outInCirc
* @property {EasingFunction} inExpo
* @property {EasingFunction} outExpo
* @property {EasingFunction} inOutExpo
* @property {EasingFunction} outInExpo
* @property {EasingFunction} inBounce
* @property {EasingFunction} outBounce
* @property {EasingFunction} inOutBounce
* @property {EasingFunction} outInBounce
* @property {BackEasing} inBack
* @property {BackEasing} outBack
* @property {BackEasing} inOutBack
* @property {BackEasing} outInBack
* @property {ElasticEasing} inElastic
* @property {ElasticEasing} outElastic
* @property {ElasticEasing} inOutElastic
* @property {ElasticEasing} outInElastic
*/
var eases = /*#__PURE__ */ (() => {
	const list = {
		linear: none,
		none
	};
	for (let type in easeTypes) for (let name in easeInFunctions) {
		const easeIn = easeInFunctions[name];
		const easeType = easeTypes[type];
		list[type + name] = name === "" || name === "Back" || name === "Elastic" ? (a, b) => easeType(
			/** @type {EasingFunctionWithParams} */
			easeIn(a, b)
		) : easeType(easeIn);
	}
	return list;
})();
/** @type {Record<String, EasingFunction>} */
var easesLookups = {
	linear: none,
	none
};
/**
* @param  {String} string
* @return {EasingFunction}
*/
var parseEaseString = (string) => {
	if (easesLookups[string]) return easesLookups[string];
	if (string.indexOf("(") <= -1) {
		const parsedFn = easeTypes[string] || string.includes("Back") || string.includes("Elastic") ? eases[string]() : eases[string];
		return parsedFn ? easesLookups[string] = parsedFn : none;
	} else {
		const split = string.slice(0, -1).split("(");
		const parsedFn = eases[split[0]];
		return parsedFn ? easesLookups[string] = parsedFn(...split[1].split(",")) : none;
	}
};
var deprecated = [
	"steps(",
	"irregular(",
	"linear(",
	"cubicBezier("
];
/**
* @param  {EasingParam} ease
* @return {EasingFunction}
*/
var parseEase = (ease) => {
	if (isStr(ease)) {
		for (let i = 0, l = deprecated.length; i < l; i++) if (stringStartsWith(ease, deprecated[i])) {
			console.warn(`String syntax for \`ease: "${ease}"\` has been removed from the core and replaced by importing and passing the easing function directly: \`ease: ${ease}\``);
			return none;
		}
	}
	return isFnc(ease) ? ease : isStr(ease) ? parseEaseString(ease) : none;
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/animation/animation.js
/**
* Anime.js - animation - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   Tween,
*   TweenKeyValue,
*   TweenParamsOptions,
*   TweenValues,
*   DurationKeyframes,
*   PercentageKeyframes,
*   AnimationParams,
*   TweenPropValue,
*   ArraySyntaxValue,
*   TargetsParam,
*   TimerParams,
*   TweenParamValue,
*   DOMTarget,
*   TargetsArray,
*   Callback,
*   EasingFunction,
* } from '../types/index.js'
*
* @import {
*   Timeline,
* } from '../timeline/timeline.js'
*
* @import {
*   Spring,
* } from '../easings/spring/index.js'
*/
var fromTargetObject = createDecomposedValueTargetObject();
var toTargetObject = createDecomposedValueTargetObject();
var inlineStylesStore = {};
var toFunctionStore = { func: null };
var fromFunctionStore = { func: null };
var keyframesTargetArray = [null];
var fastSetValuesArray = [null, null];
/** @type {TweenKeyValue} */
var keyObjectTarget = { to: null };
var tweenId = 0;
var JSAnimationId = 0;
var keyframes;
/** @type {TweenParamsOptions & TweenValues} */
var key;
/**
* @param {DurationKeyframes | PercentageKeyframes} keyframes
* @param {AnimationParams} parameters
* @return {AnimationParams}
*/
var generateKeyframes = (keyframes, parameters) => {
	/** @type {AnimationParams} */
	const properties = {};
	if (isArr(keyframes)) {
		const propertyNames = [].concat(...keyframes.map((key) => Object.keys(key))).filter(isKey);
		for (let i = 0, l = propertyNames.length; i < l; i++) {
			const propName = propertyNames[i];
			properties[propName] = keyframes.map((key) => {
				/** @type {TweenKeyValue} */
				const newKey = {};
				for (let p in key) {
					const keyValue = key[p];
					if (isKey(p)) {
						if (p === propName) newKey.to = keyValue;
					} else newKey[p] = keyValue;
				}
				return newKey;
			});
		}
	} else {
		const totalDuration = setValue(parameters.duration, globals.defaults.duration);
		Object.keys(keyframes).map((key) => {
			return {
				o: parseFloat(key) / 100,
				p: keyframes[key]
			};
		}).sort((a, b) => a.o - b.o).forEach((key) => {
			const offset = key.o;
			const prop = key.p;
			for (let name in prop) if (isKey(name)) {
				let propArray = properties[name];
				if (!propArray) propArray = properties[name] = [];
				const duration = offset * totalDuration;
				let length = propArray.length;
				let prevKey = propArray[length - 1];
				const keyObj = { to: prop[name] };
				let durProgress = 0;
				for (let i = 0; i < length; i++) durProgress += propArray[i].duration;
				if (length === 1) keyObj.from = prevKey.to;
				if (prop.ease) keyObj.ease = prop.ease;
				keyObj.duration = duration - (length ? durProgress : 0);
				propArray.push(keyObj);
			}
			return key;
		});
		for (let name in properties) {
			const propArray = properties[name];
			let prevEase;
			for (let i = 0, l = propArray.length; i < l; i++) {
				const prop = propArray[i];
				const currentEase = prop.ease;
				prop.ease = prevEase ? prevEase : void 0;
				prevEase = currentEase;
			}
			if (!propArray[0].duration) propArray.shift();
		}
	}
	return properties;
};
var JSAnimation = class extends Timer {
	/**
	* @param {TargetsParam} targets
	* @param {AnimationParams} parameters
	* @param {Timeline} [parent]
	* @param {Number} [parentPosition]
	* @param {Boolean} [fastSet=false]
	* @param {Number} [index=0]
	* @param {TargetsArray} [allTargets]
	*/
	constructor(targets, parameters, parent, parentPosition, fastSet = false, index = 0, allTargets) {
		super(parameters, parent, parentPosition);
		/** @type {Tween} */
		this._head;
		/** @type {Tween} */
		this._tail;
		++JSAnimationId;
		const parsedTargets = registerTargets(targets);
		const targetsLength = parsedTargets.length;
		const kfParams = parameters.keyframes;
		const params = kfParams ? mergeObjects(generateKeyframes(kfParams, parameters), parameters) : parameters;
		const { id, delay, duration, ease, playbackEase, modifier, composition, onRender } = params;
		const animDefaults = parent ? parent.defaults : globals.defaults;
		const animEase = setValue(ease, animDefaults.ease);
		const animPlaybackEase = setValue(playbackEase, animDefaults.playbackEase);
		const parsedAnimPlaybackEase = animPlaybackEase ? parseEase(animPlaybackEase) : null;
		const hasSpring = !isUnd(
			/** @type {Spring} */
			animEase.ease
		);
		const tEasing = hasSpring ? animEase.ease : setValue(ease, parsedAnimPlaybackEase ? "linear" : animDefaults.ease);
		const tDuration = hasSpring ? animEase.settlingDuration : setValue(duration, animDefaults.duration);
		const tDelay = setValue(delay, animDefaults.delay);
		const tModifier = modifier || animDefaults.modifier;
		const tComposition = isUnd(composition) && targetsLength >= 1e3 ? compositionTypes.none : !isUnd(composition) ? composition : animDefaults.composition;
		const absoluteOffsetTime = this._offset + (parent ? parent._offset : 0);
		if (hasSpring) /** @type {Spring} */ animEase.parent = this;
		let iterationDuration = NaN;
		let iterationDelay = NaN;
		let animationAnimationLength = 0;
		let shouldTriggerRender = 0;
		for (let targetIndex = 0; targetIndex < targetsLength; targetIndex++) {
			const target = parsedTargets[targetIndex];
			const ti = index || targetIndex;
			const tl = allTargets || parsedTargets;
			let lastTransformGroupIndex = NaN;
			let lastTransformGroupLength = NaN;
			for (let p in params) if (isKey(p)) {
				const tweenType = getTweenType(target, p);
				const adapterProp = resolveAdapterEntry(target, p);
				const propName = sanitizePropertyName(p, target, tweenType);
				let propValue = params[p];
				const isPropValueArray = isArr(propValue);
				if (fastSet && !isPropValueArray) {
					fastSetValuesArray[0] = propValue;
					fastSetValuesArray[1] = propValue;
					propValue = fastSetValuesArray;
				}
				if (isPropValueArray) {
					const arrayLength = propValue.length;
					const isNotObjectValue = !isObj(propValue[0]);
					if (arrayLength === 2 && isNotObjectValue) {
						keyObjectTarget.to = propValue;
						keyframesTargetArray[0] = keyObjectTarget;
						keyframes = keyframesTargetArray;
					} else if (arrayLength > 2 && isNotObjectValue) {
						keyframes = [];
						/** @type {Array.<Number>} */ propValue.forEach((v, i) => {
							if (!i) fastSetValuesArray[0] = v;
							else if (i === 1) {
								fastSetValuesArray[1] = v;
								keyframes.push(fastSetValuesArray);
							} else keyframes.push(v);
						});
					} else keyframes = propValue;
				} else {
					keyframesTargetArray[0] = propValue;
					keyframes = keyframesTargetArray;
				}
				let siblings = null;
				let prevTween = null;
				let firstTweenChangeStartTime = NaN;
				let lastTweenChangeEndTime = 0;
				let tweenIndex = 0;
				for (let l = keyframes.length; tweenIndex < l; tweenIndex++) {
					const keyframe = keyframes[tweenIndex];
					if (isObj(keyframe)) key = keyframe;
					else {
						keyObjectTarget.to = keyframe;
						key = keyObjectTarget;
					}
					toFunctionStore.func = null;
					fromFunctionStore.func = null;
					const computedComposition = getFunctionValue(setValue(key.composition, tComposition), target, ti, tl, null, null);
					const tweenComposition = isNum(computedComposition) ? computedComposition : compositionTypes[computedComposition];
					if (!siblings && tweenComposition !== compositionTypes.none) siblings = getTweenSiblings(target, propName);
					const tailTween = siblings ? siblings._tail : null;
					const prevSiblingTween = parent && tailTween && tailTween.parent.parent === parent ? tailTween : prevTween;
					const computedToValue = getFunctionValue(key.to, target, ti, tl, toFunctionStore, prevSiblingTween);
					let tweenToValue;
					if (isObj(computedToValue) && !isUnd(computedToValue.to)) {
						key = computedToValue;
						tweenToValue = computedToValue.to;
					} else tweenToValue = computedToValue;
					const tweenFromValue = getFunctionValue(key.from, target, ti, tl, fromFunctionStore, prevSiblingTween);
					const easeToParse = key.ease || tEasing;
					const easeFunctionResult = getFunctionValue(easeToParse, target, ti, tl, null, prevSiblingTween);
					const keyEasing = isFnc(easeFunctionResult) || isStr(easeFunctionResult) ? easeFunctionResult : easeToParse;
					const hasSpring = !isUnd(keyEasing) && !isUnd(
						/** @type {Spring} */
						keyEasing.ease
					);
					const tweenEasing = hasSpring ? keyEasing.ease : keyEasing;
					const tweenDuration = hasSpring ? keyEasing.settlingDuration : getFunctionValue(setValue(key.duration, l > 1 ? getFunctionValue(tDuration, target, ti, tl, null, prevSiblingTween) / l : tDuration), target, ti, tl, null, prevSiblingTween);
					const tweenDelay = getFunctionValue(setValue(key.delay, !tweenIndex ? tDelay : 0), target, ti, tl, null, prevSiblingTween);
					const tweenModifier = key.modifier || tModifier;
					const hasFromvalue = !isUnd(tweenFromValue);
					const hasToValue = !isUnd(tweenToValue);
					const isFromToArray = isArr(tweenToValue);
					const isFromToValue = isFromToArray || hasFromvalue && hasToValue;
					const tweenUpdateStartLocal = prevTween ? lastTweenChangeEndTime : 0;
					const tweenStartTime = prevTween ? lastTweenChangeEndTime + tweenDelay : tweenDelay;
					const absoluteStartTime = round(absoluteOffsetTime + tweenStartTime, 12);
					const absoluteUpdateStartTime = round(absoluteOffsetTime + tweenUpdateStartLocal, 12);
					if (!shouldTriggerRender && (hasFromvalue || isFromToArray)) shouldTriggerRender = 1;
					let prevSibling = prevTween;
					if (tweenComposition !== compositionTypes.none) {
						let nextSibling = siblings._head;
						while (nextSibling && nextSibling._absoluteStartTime <= absoluteStartTime) {
							if (!nextSibling._isOverridden) prevSibling = nextSibling;
							nextSibling = nextSibling._nextRep;
							if (nextSibling && nextSibling._absoluteStartTime >= absoluteStartTime) while (nextSibling) {
								overrideTween(nextSibling);
								nextSibling = nextSibling._nextRep;
							}
						}
					}
					if (isFromToValue) {
						decomposeRawValue(isFromToArray ? getFunctionValue(tweenToValue[0], target, ti, tl, fromFunctionStore, prevSiblingTween) : tweenFromValue, fromTargetObject);
						decomposeRawValue(isFromToArray ? getFunctionValue(tweenToValue[1], target, ti, tl, toFunctionStore, prevSiblingTween) : tweenToValue, toTargetObject);
						const originalValue = getOriginalAnimatableValue(target, propName, tweenType, inlineStylesStore);
						if (fromTargetObject.t === valueTypes.NUMBER) if (prevSibling) {
							if (prevSibling._valueType === valueTypes.UNIT) {
								fromTargetObject.t = valueTypes.UNIT;
								fromTargetObject.u = prevSibling._unit;
							}
						} else {
							decomposeRawValue(originalValue, decomposedOriginalValue);
							if (decomposedOriginalValue.t === valueTypes.UNIT) {
								fromTargetObject.t = valueTypes.UNIT;
								fromTargetObject.u = decomposedOriginalValue.u;
							}
						}
					} else {
						if (hasToValue) decomposeRawValue(tweenToValue, toTargetObject);
						else if (prevTween) decomposeTweenValue(prevTween, toTargetObject);
						else decomposeRawValue(parent && prevSibling && prevSibling.parent.parent === parent ? prevSibling._value : getOriginalAnimatableValue(target, propName, tweenType, inlineStylesStore), toTargetObject);
						if (hasFromvalue) decomposeRawValue(tweenFromValue, fromTargetObject);
						else if (prevTween) decomposeTweenValue(prevTween, fromTargetObject);
						else decomposeRawValue(parent && prevSibling && prevSibling.parent.parent === parent ? prevSibling._value : getOriginalAnimatableValue(target, propName, tweenType, inlineStylesStore), fromTargetObject);
					}
					if (fromTargetObject.o) fromTargetObject.n = getRelativeValue(!prevSibling ? decomposeRawValue(getOriginalAnimatableValue(target, propName, tweenType, inlineStylesStore), decomposedOriginalValue).n : prevSibling._toNumber, fromTargetObject.n, fromTargetObject.o);
					if (toTargetObject.o) toTargetObject.n = getRelativeValue(fromTargetObject.n, toTargetObject.n, toTargetObject.o);
					if (fromTargetObject.t !== toTargetObject.t) {
						if (fromTargetObject.t === valueTypes.COMPLEX || toTargetObject.t === valueTypes.COMPLEX) {
							const complexValue = fromTargetObject.t === valueTypes.COMPLEX ? fromTargetObject : toTargetObject;
							const notComplexValue = fromTargetObject.t === valueTypes.COMPLEX ? toTargetObject : fromTargetObject;
							notComplexValue.t = valueTypes.COMPLEX;
							notComplexValue.s = cloneArray(complexValue.s);
							notComplexValue.d = complexValue.d.map(() => notComplexValue.n);
						} else if (fromTargetObject.t === valueTypes.UNIT || toTargetObject.t === valueTypes.UNIT) {
							const unitValue = fromTargetObject.t === valueTypes.UNIT ? fromTargetObject : toTargetObject;
							const notUnitValue = fromTargetObject.t === valueTypes.UNIT ? toTargetObject : fromTargetObject;
							notUnitValue.t = valueTypes.UNIT;
							notUnitValue.u = unitValue.u;
						} else if (fromTargetObject.t === valueTypes.COLOR || toTargetObject.t === valueTypes.COLOR) {
							const colorValue = fromTargetObject.t === valueTypes.COLOR ? fromTargetObject : toTargetObject;
							const notColorValue = fromTargetObject.t === valueTypes.COLOR ? toTargetObject : fromTargetObject;
							notColorValue.t = valueTypes.COLOR;
							notColorValue.d = colorValue.d.map(() => 0);
						}
					}
					if (fromTargetObject.u !== toTargetObject.u) {
						let valueToConvert = toTargetObject.u ? fromTargetObject : toTargetObject;
						valueToConvert = convertValueUnit(target, valueToConvert, toTargetObject.u ? toTargetObject.u : fromTargetObject.u, false);
					}
					if (toTargetObject.d && fromTargetObject.d && toTargetObject.d.length !== fromTargetObject.d.length) {
						const longestValue = fromTargetObject.d.length > toTargetObject.d.length ? fromTargetObject : toTargetObject;
						const shortestValue = longestValue === fromTargetObject ? toTargetObject : fromTargetObject;
						shortestValue.d = longestValue.d.map((_, i) => isUnd(shortestValue.d[i]) ? 0 : shortestValue.d[i]);
						shortestValue.s = cloneArray(longestValue.s);
					}
					const tweenUpdateDuration = round(+tweenDuration || 1e-11, 12);
					let inlineValue = inlineStylesStore[propName];
					if (!isNil(inlineValue)) inlineStylesStore[propName] = null;
					const tweenSetter = adapterProp ? adapterProp.set : null;
					lastTweenChangeEndTime = round(tweenStartTime + tweenUpdateDuration, 12);
					const fromD = fromTargetObject.d;
					const toD = toTargetObject.d;
					const toS = toTargetObject.s;
					/** @type {Tween} */
					const tween = {
						parent: this,
						id: tweenId++,
						property: propName,
						target,
						_value: null,
						_toFunc: toFunctionStore.func,
						_fromFunc: fromFunctionStore.func,
						_ease: parseEase(tweenEasing),
						_fromNumbers: fromD ? cloneArray(fromD) : emptyArray,
						_toNumbers: toD ? cloneArray(toD) : emptyArray,
						_strings: toS ? cloneArray(toS) : emptyArray,
						_fromNumber: fromTargetObject.n,
						_toNumber: toTargetObject.n,
						_numbers: fromD ? cloneArray(fromD) : emptyArray,
						_number: fromTargetObject.n,
						_unit: toTargetObject.u,
						_modifier: tweenModifier,
						_currentTime: 0,
						_startTime: tweenStartTime,
						_delay: +tweenDelay,
						_updateDuration: tweenUpdateDuration,
						_changeDuration: tweenUpdateDuration,
						_absoluteStartTime: absoluteStartTime,
						_absoluteUpdateStartTime: absoluteUpdateStartTime,
						_absoluteEndTime: round(absoluteOffsetTime + lastTweenChangeEndTime, 12),
						_hasFromValue: hasFromvalue || isFromToArray ? 1 : 0,
						_tweenType: tweenType,
						_setter: tweenSetter,
						_valueType: toTargetObject.t,
						_composition: tweenComposition,
						_isOverlapped: 0,
						_isOverridden: 0,
						_renderTransforms: 0,
						_inlineValue: inlineValue,
						_prevRep: null,
						_nextRep: null,
						_prevAdd: null,
						_nextAdd: null,
						_prev: null,
						_next: null
					};
					if (tweenComposition !== compositionTypes.none) composeTween(tween, siblings);
					const vt = tween._valueType;
					if (vt === valueTypes.COMPLEX) tween._value = composeComplexValue(tween, 1, -1);
					else if (vt === valueTypes.UNIT) tween._value = `${tweenModifier(tween._toNumber)}${tween._unit}`;
					else if (vt === valueTypes.COLOR) {
						const d = toTargetObject.d;
						tween._value = `rgba(${round(d[0], 0)},${round(d[1], 0)},${round(d[2], 0)},${d[3]})`;
					} else tween._value = tweenModifier(tween._toNumber);
					if (isNaN(firstTweenChangeStartTime)) firstTweenChangeStartTime = tween._startTime;
					prevTween = tween;
					animationAnimationLength++;
					addChild(this, tween);
				}
				if (isNaN(iterationDelay) || firstTweenChangeStartTime < iterationDelay) iterationDelay = firstTweenChangeStartTime;
				if (isNaN(iterationDuration) || lastTweenChangeEndTime > iterationDuration) iterationDuration = lastTweenChangeEndTime;
				if (tweenType === tweenTypes.TRANSFORM) {
					lastTransformGroupIndex = animationAnimationLength - tweenIndex;
					lastTransformGroupLength = animationAnimationLength;
				}
			}
			if (!isNaN(lastTransformGroupIndex)) {
				let i = 0;
				forEachChildren(this, (tween) => {
					if (i >= lastTransformGroupIndex && i < lastTransformGroupLength) {
						tween._renderTransforms = 1;
						if (tween._composition === compositionTypes.blend) forEachChildren(additive.animation, (additiveTween) => {
							if (additiveTween.id === tween.id) additiveTween._renderTransforms = 1;
						});
					}
					i++;
				});
			}
		}
		if (!targetsLength) console.warn(`No target found. Make sure the element you're trying to animate is accessible before creating your animation.`);
		if (iterationDelay) {
			forEachChildren(this, (tween) => {
				if (!(tween._startTime - tween._delay)) tween._delay -= iterationDelay;
				tween._startTime -= iterationDelay;
			});
			iterationDuration -= iterationDelay;
		} else iterationDelay = 0;
		if (!iterationDuration) {
			iterationDuration = minValue;
			this.iterationCount = 0;
		}
		/** @type {TargetsArray} */
		this.targets = parsedTargets;
		/** @type {String|Number} */
		this.id = !isUnd(id) ? id : JSAnimationId;
		/** @type {Number} */
		this.duration = iterationDuration === 1e-11 ? minValue : clampInfinity((iterationDuration + this._loopDelay) * this.iterationCount - this._loopDelay) || 1e-11;
		/** @type {Callback<this>} */
		this.onRender = onRender || animDefaults.onRender;
		/** @type {EasingFunction} */
		this._ease = parsedAnimPlaybackEase;
		/** @type {Number} */
		this._delay = iterationDelay;
		/** @type {Number} */
		this.iterationDuration = iterationDuration;
		if (!this._autoplay && shouldTriggerRender) this.onRender(this);
	}
	/**
	* @param  {Number} newDuration
	* @return {this}
	*/
	stretch(newDuration) {
		const currentDuration = this.duration;
		if (currentDuration === normalizeTime(newDuration)) return this;
		const timeScale = newDuration / currentDuration;
		forEachChildren(this, (tween) => {
			tween._updateDuration = normalizeTime(tween._updateDuration * timeScale);
			tween._changeDuration = normalizeTime(tween._changeDuration * timeScale);
			tween._currentTime *= timeScale;
			tween._delay *= timeScale;
			tween._startTime *= timeScale;
			tween._absoluteStartTime *= timeScale;
			tween._absoluteUpdateStartTime *= timeScale;
			tween._absoluteEndTime *= timeScale;
		});
		return super.stretch(newDuration);
	}
	/**
	* @return {this}
	*/
	refresh() {
		forEachChildren(this, (tween) => {
			const toFunc = tween._toFunc;
			const fromFunc = tween._fromFunc;
			if (toFunc || fromFunc) {
				if (fromFunc) {
					decomposeRawValue(fromFunc(), fromTargetObject);
					if (fromTargetObject.u !== tween._unit && tween.target[isDomSymbol]) convertValueUnit(tween.target, fromTargetObject, tween._unit, true);
					tween._fromNumbers = cloneArray(fromTargetObject.d);
					tween._fromNumber = fromTargetObject.n;
				} else if (toFunc) {
					decomposeRawValue(getOriginalAnimatableValue(tween.target, tween.property, tween._tweenType), decomposedOriginalValue);
					tween._fromNumbers = cloneArray(decomposedOriginalValue.d);
					tween._fromNumber = decomposedOriginalValue.n;
				}
				if (toFunc) {
					decomposeRawValue(toFunc(), toTargetObject);
					tween._toNumbers = cloneArray(toTargetObject.d);
					tween._strings = cloneArray(toTargetObject.s);
					tween._toNumber = toTargetObject.o ? getRelativeValue(tween._fromNumber, toTargetObject.n, toTargetObject.o) : toTargetObject.n;
				}
			}
		});
		if (this.duration === 1e-11) this.restart();
		return this;
	}
	/**
	* Cancel the animation and revert all the values affected by this animation to their original state
	* @return {this}
	*/
	revert() {
		super.revert();
		return revertValues(this);
	}
	/**
	* @typedef {this & {then: null}} ResolvedJSAnimation
	*/
	/**
	* @param  {Callback<ResolvedJSAnimation>} [callback]
	* @return Promise<this>
	*/
	then(callback) {
		return super.then(callback);
	}
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/timeline/position.js
/**
* Anime.js - timeline - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   Tickable,
*   TimelinePosition,
* } from '../types/index.js'
*/
/**
* @import {
*   Timeline,
* } from './timeline.js'
*/
/**
* Timeline's children offsets positions parser
* @param  {Timeline} timeline
* @param  {String} timePosition
* @return {Number}
*/
var getPrevChildOffset = (timeline, timePosition) => {
	if (stringStartsWith(timePosition, "<")) {
		const goToPrevAnimationOffset = timePosition[1] === "<";
		const prevAnimation = timeline._tail;
		const prevOffset = prevAnimation ? prevAnimation._offset + prevAnimation._delay : 0;
		return goToPrevAnimationOffset ? prevOffset : prevOffset + prevAnimation.duration;
	}
};
/**
* @param  {Timeline} timeline
* @param  {TimelinePosition} [timePosition]
* @return {Number}
*/
var parseTimelinePosition = (timeline, timePosition) => {
	let tlDuration = timeline.iterationDuration;
	if (tlDuration === 1e-11) tlDuration = 0;
	if (isUnd(timePosition)) return tlDuration;
	if (isNum(+timePosition)) return +timePosition;
	const timePosStr = timePosition;
	const tlLabels = timeline ? timeline.labels : null;
	const hasLabels = !isNil(tlLabels);
	const prevOffset = getPrevChildOffset(timeline, timePosStr);
	const hasSibling = !isUnd(prevOffset);
	const matchedRelativeOperator = relativeValuesExecRgx.exec(timePosStr);
	if (matchedRelativeOperator) {
		const fullOperator = matchedRelativeOperator[0];
		const split = timePosStr.split(fullOperator);
		const labelOffset = hasLabels && split[0] ? tlLabels[split[0]] : tlDuration;
		return getRelativeValue(hasSibling ? prevOffset : hasLabels ? labelOffset : tlDuration, +split[1], fullOperator[0]);
	} else return hasSibling ? prevOffset : hasLabels ? !isUnd(tlLabels[timePosStr]) ? tlLabels[timePosStr] : tlDuration : tlDuration;
};
//#endregion
//#region ../arrow-cube/node_modules/animejs/dist/modules/timeline/timeline.js
/**
* Anime.js - timeline - ESM
* @version v4.5.0
* @license MIT
* @copyright 2026 - Julian Garnier
*/
/**
* @import {
*   TargetsParam,
*   Callback,
*   Tickable,
*   TimerParams,
*   AnimationParams,
*   Target,
*   Renderable,
*   TimelineParams,
*   DefaultsParams,
*   TimelinePosition,
*   StaggerFunction,
*   TargetsArray,
*   TweakRegister,
* } from '../types/index.js'
*/
/**
* @import {
*   WAAPIAnimation,
* } from '../waapi/waapi.js'
*/
/**
* @param {Timeline} tl
* @return {Number}
*/
function getTimelineTotalDuration(tl) {
	return clampInfinity((tl.iterationDuration + tl._loopDelay) * tl.iterationCount - tl._loopDelay) || 1e-11;
}
/**
* @overload
* @param  {TimerParams} childParams
* @param  {Timeline} tl
* @param  {Number} timePosition
* @return {Timeline}
*
* @overload
* @param  {AnimationParams} childParams
* @param  {Timeline} tl
* @param  {Number} timePosition
* @param  {TargetsParam} targets
* @param  {Number} [index]
* @param  {TargetsArray} [allTargets]
* @return {Timeline}
*
* @param  {TimerParams|AnimationParams} childParams
* @param  {Timeline} tl
* @param  {Number} timePosition
* @param  {TargetsParam} [targets]
* @param  {Number} [index]
* @param  {TargetsArray} [allTargets]
*/
function addTlChild(childParams, tl, timePosition, targets, index, allTargets) {
	const adjustedPosition = isNum(childParams.duration) && childParams.duration <= 1e-11 ? timePosition - minValue : timePosition;
	if (tl.composition) tick(tl, adjustedPosition, 1, 1, tickModes.AUTO);
	const tlChild = targets ? new JSAnimation(targets, childParams, tl, adjustedPosition, false, index, allTargets) : new Timer(childParams, tl, adjustedPosition);
	if (tl.composition) tlChild.init(true);
	addChild(tl, tlChild);
	forEachChildren(tl, (child) => {
		const childDur = child._offset + child._delay + child.duration;
		if (childDur > tl.iterationDuration) tl.iterationDuration = childDur;
	});
	tl.duration = getTimelineTotalDuration(tl);
	return tl;
}
var TLId = 0;
var Timeline = class extends Timer {
	/**
	* @param {TimelineParams} [parameters]
	*/
	constructor(parameters = {}) {
		super(parameters, null, 0);
		++TLId;
		/** @type {String|Number} */
		this.id = !isUnd(parameters.id) ? parameters.id : TLId;
		/** @type {Number} */
		this.duration = 0;
		/** @type {Record<String, Number>} */
		this.labels = {};
		const defaultsParams = parameters.defaults;
		const globalDefaults = globals.defaults;
		/** @type {DefaultsParams} */
		this.defaults = defaultsParams ? mergeObjects(defaultsParams, globalDefaults) : globalDefaults;
		/** @type {Boolean} */
		this.composition = setValue(parameters.composition, true);
		/** @type {Callback<this>} */
		this.onRender = parameters.onRender || globalDefaults.onRender;
		const tlPlaybackEase = setValue(parameters.playbackEase, globalDefaults.playbackEase);
		this._ease = tlPlaybackEase ? parseEase(tlPlaybackEase) : null;
		/** @type {Number} */
		this.iterationDuration = 0;
	}
	/**
	* @overload
	* @param {TargetsParam} a1
	* @param {AnimationParams} a2
	* @param {TimelinePosition|StaggerFunction<Number|String>|TweakRegister} [a3]
	* @return {this}
	*
	* @overload
	* @param {TimerParams} a1
	* @param {TimelinePosition} [a2]
	* @return {this}
	*
	* @param {TargetsParam|TimerParams} a1
	* @param {TimelinePosition|AnimationParams} a2
	* @param {TimelinePosition|StaggerFunction<Number|String>|TweakRegister} [a3]
	*/
	add(a1, a2, a3) {
		const isAnim = isObj(a2);
		const isTimer = isObj(a1);
		if (isAnim || isTimer) {
			this._hasChildren = true;
			if (isAnim) {
				const childParams = a2;
				const editorHook = globals.editor && globals.editor.addTimelineChild;
				const isStaggerType = a3 && a3.type === "Stagger" && globals.editor;
				const staggeredPosition = isFnc(a3) ? a3 : null;
				if (staggeredPosition || isStaggerType) {
					const parsedTargetsArray = parseTargets(a1);
					const tlDuration = this.duration;
					const tlIterationDuration = this.iterationDuration;
					const id = childParams.id;
					let i = 0;
					/** @type {Number} */
					const parsedLength = parsedTargetsArray.length;
					const resolvedParams = editorHook ? editorHook(a1, childParams, this.id, a3, parsedLength) : null;
					const staggerFn = staggeredPosition || globals.editor.resolveStagger(
						/** @type {TweakRegister} */
						a3.defaultValue
					);
					parsedTargetsArray.forEach((target) => {
						const staggeredChildParams = { ...resolvedParams || childParams };
						this.duration = tlDuration;
						this.iterationDuration = tlIterationDuration;
						if (!isUnd(id)) staggeredChildParams.id = id + "-" + i;
						const staggeredTimePosition = parseTimelinePosition(this, staggerFn(target, i, parsedTargetsArray, null, this));
						addTlChild(staggeredChildParams, this, staggeredTimePosition, target, i, parsedTargetsArray);
						i++;
					});
				} else {
					const resolvedChildParams = editorHook ? editorHook(a1, childParams, this.id, a3) : childParams;
					const resolvedPosition = a3 && a3.type ? a3.defaultValue : a3;
					addTlChild(resolvedChildParams, this, parseTimelinePosition(this, resolvedPosition), a1);
				}
			} else addTlChild(a1, this, parseTimelinePosition(this, a2));
			if (this.composition) this.init(true);
			return this;
		}
	}
	/**
	* @overload
	* @param {Tickable} [synced]
	* @param {TimelinePosition} [position]
	* @return {this}
	*
	* @overload
	* @param {globalThis.Animation} [synced]
	* @param {TimelinePosition} [position]
	* @return {this}
	*
	* @overload
	* @param {WAAPIAnimation} [synced]
	* @param {TimelinePosition} [position]
	* @return {this}
	*
	* @param {Tickable|WAAPIAnimation|globalThis.Animation} [synced]
	* @param {TimelinePosition} [position]
	*/
	sync(synced, position) {
		if (isUnd(synced) || synced && isUnd(synced.pause)) return this;
		synced.pause();
		const duration = +(synced.effect ? synced.effect.getTiming().duration : /** @type {Tickable} */ synced.duration);
		if (!isUnd(synced) && !isUnd(
			/** @type {WAAPIAnimation} */
			synced.persist
		))
 /** @type {WAAPIAnimation} */ synced.persist = true;
		const editor = globals.editor;
		const childHook = editor && editor.addTimelineChild;
		if (editor && editor.addTimelineSync) {
			position = editor.addTimelineSync(synced, position, this.id);
			editor.addTimelineChild = null;
		}
		const result = this.add(synced, {
			currentTime: [0, duration],
			duration,
			delay: 0,
			ease: "linear",
			playbackEase: "linear"
		}, position);
		if (editor) editor.addTimelineChild = childHook;
		return result;
	}
	/**
	* @param  {TargetsParam} targets
	* @param  {AnimationParams} parameters
	* @param  {TimelinePosition|StaggerFunction<Number|String>|TweakRegister} [position]
	* @return {this}
	*/
	set(targets, parameters, position) {
		if (isUnd(parameters)) return this;
		parameters.duration = minValue;
		parameters.composition = compositionTypes.replace;
		return this.add(targets, parameters, position);
	}
	/**
	* @param {Callback<Timer>} callback
	* @param {TimelinePosition} [position]
	* @return {this}
	*/
	call(callback, position) {
		if (isUnd(callback) || callback && !isFnc(callback)) return this;
		if (globals.editor && globals.editor.addTimelineCall) position = globals.editor.addTimelineCall(callback, position, this.id);
		return this.add({
			duration: 0,
			delay: 0,
			onComplete: () => callback(this)
		}, position);
	}
	/**
	* @param {String} labelName
	* @param {TimelinePosition} [position]
	* @return {this}
	*
	*/
	label(labelName, position) {
		if (isUnd(labelName) || labelName && !isStr(labelName)) return this;
		if (globals.editor && globals.editor.addTimelineLabel) position = globals.editor.addTimelineLabel(labelName, position, this.id);
		this.labels[labelName] = parseTimelinePosition(this, position);
		return this;
	}
	/**
	* @param  {TargetsParam} targets
	* @param  {String} [propertyName]
	* @return {this}
	*/
	remove(targets, propertyName) {
		removeTargetsFromRenderable(parseTargets(targets), this, propertyName);
		return this;
	}
	/**
	* @param  {Number} newDuration
	* @return {this}
	*/
	stretch(newDuration) {
		const currentDuration = this.duration;
		if (currentDuration === normalizeTime(newDuration)) return this;
		const timeScale = newDuration / currentDuration;
		const labels = this.labels;
		forEachChildren(this, (child) => child.stretch(child.duration * timeScale));
		for (let labelName in labels) labels[labelName] *= timeScale;
		return super.stretch(newDuration);
	}
	/**
	* @return {this}
	*/
	refresh() {
		forEachChildren(this, (child) => {
			if (child.refresh) /** @type {JSAnimation} */ child.refresh();
		});
		return this;
	}
	/**
	* @return {this}
	*/
	revert() {
		super.revert();
		forEachChildren(this, (child) => child.revert, true);
		return revertValues(this);
	}
	/**
	* @typedef {this & {then: null}} ResolvedTimeline
	*/
	/**
	* @param  {Callback<ResolvedTimeline>} [callback]
	* @return Promise<this>
	*/
	then(callback) {
		return super.then(callback);
	}
};
/**
* @param {TimelineParams} [parameters]
* @return {Timeline}
*/
var createTimeline = (parameters) => {
	if (globals.editor) return globals.editor.addTimeline(parameters);
	return new Timeline(parameters).init();
};
//#endregion
//#region ../arrow-cube/node_modules/three/examples/jsm/renderers/CSS2DRenderer.js
var _vector$1 = new Vector3();
var _viewMatrix = new Matrix4();
var _viewProjectionMatrix = new Matrix4();
var _a = new Vector3();
var _b = new Vector3();
/**
* This renderer is a simplified version of {@link CSS3DRenderer}. The only transformation that is
* supported is translation.
*
* The renderer is very useful if you want to combine HTML based labels with 3D objects. Here too,
* the respective DOM elements are wrapped into an instance of {@link CSS2DObject} and added to the
* scene graph. All other types of renderable 3D objects (like meshes or point clouds) are ignored.
*
* `CSS2DRenderer` only supports 100% browser and display zoom.
*
* @three_import import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
*/
var CSS2DRenderer = class {
	/**
	* Constructs a new CSS2D renderer.
	*
	* @param {CSS2DRenderer~Parameters} [parameters] - The parameters.
	*/
	constructor(parameters = {}) {
		const _this = this;
		let _width, _height;
		let _widthHalf, _heightHalf;
		const cache = { objects: /* @__PURE__ */ new WeakMap() };
		const domElement = parameters.element !== void 0 ? parameters.element : document.createElement("div");
		domElement.style.overflow = "hidden";
		/**
		* The DOM where the renderer appends its child-elements.
		*
		* @type {HTMLElement}
		*/
		this.domElement = domElement;
		/**
		* Controls whether the renderer assigns `z-index` values to CSS2DObject DOM elements.
		* If set to `true`, z-index values are assigned first based on the `renderOrder`
		* and secondly - the distance to the camera. If set to `false`, no z-index values are assigned.
		*
		* @type {boolean}
		* @default true
		*/
		this.sortObjects = true;
		/**
		* Returns an object containing the width and height of the renderer.
		*
		* @return {{width:number,height:number}} The size of the renderer.
		*/
		this.getSize = function() {
			return {
				width: _width,
				height: _height
			};
		};
		/**
		* Renders the given scene using the given camera.
		*
		* @param {Object3D} scene - A scene or any other type of 3D object.
		* @param {Camera} camera - The camera.
		*/
		this.render = function(scene, camera) {
			if (scene.matrixWorldAutoUpdate === true) scene.updateMatrixWorld();
			if (camera.parent === null && camera.matrixWorldAutoUpdate === true) camera.updateMatrixWorld();
			_viewMatrix.copy(camera.matrixWorldInverse);
			_viewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, _viewMatrix);
			renderObject(scene, scene, camera);
			if (this.sortObjects) zOrder(scene);
		};
		/**
		* Resizes the renderer to the given width and height.
		*
		* @param {number} width - The width of the renderer.
		* @param {number} height - The height of the renderer.
		*/
		this.setSize = function(width, height) {
			_width = width;
			_height = height;
			_widthHalf = _width / 2;
			_heightHalf = _height / 2;
			domElement.style.width = width + "px";
			domElement.style.height = height + "px";
		};
		function hideObject(object) {
			if (object.isCSS2DObject) object.element.style.display = "none";
			for (let i = 0, l = object.children.length; i < l; i++) hideObject(object.children[i]);
		}
		function renderObject(object, scene, camera) {
			if (object.visible === false) {
				hideObject(object);
				return;
			}
			if (object.isCSS2DObject) {
				_vector$1.setFromMatrixPosition(object.matrixWorld);
				_vector$1.applyMatrix4(_viewProjectionMatrix);
				const visible = _vector$1.z >= -1 && _vector$1.z <= 1 && object.layers.test(camera.layers) === true;
				const element = object.element;
				element.style.display = visible === true ? "" : "none";
				if (visible === true) {
					object.onBeforeRender(_this, scene, camera);
					element.style.transform = "translate(" + -100 * object.center.x + "%," + -100 * object.center.y + "%)translate(" + (_vector$1.x * _widthHalf + _widthHalf) + "px," + (-_vector$1.y * _heightHalf + _heightHalf) + "px)";
					if (element.parentNode !== domElement) domElement.appendChild(element);
					object.onAfterRender(_this, scene, camera);
				}
				const objectData = { distanceToCameraSquared: getDistanceToSquared(camera, object) };
				cache.objects.set(object, objectData);
			}
			for (let i = 0, l = object.children.length; i < l; i++) renderObject(object.children[i], scene, camera);
		}
		function getDistanceToSquared(object1, object2) {
			_a.setFromMatrixPosition(object1.matrixWorld);
			_b.setFromMatrixPosition(object2.matrixWorld);
			return _a.distanceToSquared(_b);
		}
		function filterAndFlatten(scene) {
			const result = [];
			scene.traverseVisible(function(object) {
				if (object.isCSS2DObject) result.push(object);
			});
			return result;
		}
		function zOrder(scene) {
			const sorted = filterAndFlatten(scene).sort(function(a, b) {
				if (a.renderOrder !== b.renderOrder) return b.renderOrder - a.renderOrder;
				return cache.objects.get(a).distanceToCameraSquared - cache.objects.get(b).distanceToCameraSquared;
			});
			const zMax = sorted.length;
			for (let i = 0, l = sorted.length; i < l; i++) sorted[i].element.style.zIndex = zMax - i;
		}
	}
};
//#endregion
//#region ../arrow-cube/node_modules/three/examples/jsm/lines/LineSegmentsGeometry.js
var _box$1 = new Box3();
var _vector = new Vector3();
/**
* A series of vertex pairs, forming line segments.
*
* This is used in {@link LineSegments2} to describe the shape.
*
* @augments InstancedBufferGeometry
* @three_import import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
*/
var LineSegmentsGeometry = class extends InstancedBufferGeometry {
	/**
	* Constructs a new line segments geometry.
	*/
	constructor() {
		super();
		/**
		* This flag can be used for type testing.
		*
		* @type {boolean}
		* @readonly
		* @default true
		*/
		this.isLineSegmentsGeometry = true;
		this.type = "LineSegmentsGeometry";
		const positions = [
			-1,
			2,
			0,
			1,
			2,
			0,
			-1,
			1,
			0,
			1,
			1,
			0,
			-1,
			0,
			0,
			1,
			0,
			0,
			-1,
			-1,
			0,
			1,
			-1,
			0
		];
		const uvs = [
			-1,
			2,
			1,
			2,
			-1,
			1,
			1,
			1,
			-1,
			-1,
			1,
			-1,
			-1,
			-2,
			1,
			-2
		];
		this.setIndex([
			0,
			2,
			1,
			2,
			3,
			1,
			2,
			4,
			3,
			4,
			5,
			3,
			4,
			6,
			5,
			6,
			7,
			5
		]);
		this.setAttribute("position", new Float32BufferAttribute(positions, 3));
		this.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
	}
	/**
	* Applies the given 4x4 transformation matrix to the geometry.
	*
	* @param {Matrix4} matrix - The matrix to apply.
	* @return {LineSegmentsGeometry} A reference to this instance.
	*/
	applyMatrix4(matrix) {
		const start = this.attributes.instanceStart;
		const end = this.attributes.instanceEnd;
		if (start !== void 0) {
			start.applyMatrix4(matrix);
			end.applyMatrix4(matrix);
			start.needsUpdate = true;
		}
		if (this.boundingBox !== null) this.computeBoundingBox();
		if (this.boundingSphere !== null) this.computeBoundingSphere();
		return this;
	}
	/**
	* Sets the given line positions for this geometry. The length must be a multiple of six since
	* each line segment is defined by a start end vertex in the pattern `(xyz xyz)`.
	*
	* @param {Float32Array|Array<number>} array - The position data to set.
	* @return {LineSegmentsGeometry} A reference to this geometry.
	*/
	setPositions(array) {
		let lineSegments;
		if (array instanceof Float32Array) lineSegments = array;
		else if (Array.isArray(array)) lineSegments = new Float32Array(array);
		const instanceBuffer = new InstancedInterleavedBuffer(lineSegments, 6, 1);
		this.setAttribute("instanceStart", new InterleavedBufferAttribute(instanceBuffer, 3, 0));
		this.setAttribute("instanceEnd", new InterleavedBufferAttribute(instanceBuffer, 3, 3));
		this.instanceCount = this.attributes.instanceStart.count;
		this.computeBoundingBox();
		this.computeBoundingSphere();
		return this;
	}
	/**
	* Sets the given line colors for this geometry. The length must be a multiple of six since
	* each line segment is defined by a start end color in the pattern `(rgb rgb)`.
	*
	* @param {Float32Array|Array<number>} array - The position data to set.
	* @return {LineSegmentsGeometry} A reference to this geometry.
	*/
	setColors(array) {
		let colors;
		if (array instanceof Float32Array) colors = array;
		else if (Array.isArray(array)) colors = new Float32Array(array);
		const instanceColorBuffer = new InstancedInterleavedBuffer(colors, 6, 1);
		this.setAttribute("instanceColorStart", new InterleavedBufferAttribute(instanceColorBuffer, 3, 0));
		this.setAttribute("instanceColorEnd", new InterleavedBufferAttribute(instanceColorBuffer, 3, 3));
		return this;
	}
	/**
	* Setups this line segments geometry from the given wireframe geometry.
	*
	* @param {WireframeGeometry} geometry - The geometry that should be used as a data source for this geometry.
	* @return {LineSegmentsGeometry} A reference to this geometry.
	*/
	fromWireframeGeometry(geometry) {
		this.setPositions(geometry.attributes.position.array);
		return this;
	}
	/**
	* Setups this line segments geometry from the given edges geometry.
	*
	* @param {EdgesGeometry} geometry - The geometry that should be used as a data source for this geometry.
	* @return {LineSegmentsGeometry} A reference to this geometry.
	*/
	fromEdgesGeometry(geometry) {
		this.setPositions(geometry.attributes.position.array);
		return this;
	}
	/**
	* Setups this line segments geometry from the given mesh.
	*
	* @param {Mesh} mesh - The mesh geometry that should be used as a data source for this geometry.
	* @return {LineSegmentsGeometry} A reference to this geometry.
	*/
	fromMesh(mesh) {
		this.fromWireframeGeometry(new WireframeGeometry(mesh.geometry));
		return this;
	}
	/**
	* Setups this line segments geometry from the given line segments.
	*
	* @param {LineSegments} lineSegments - The line segments that should be used as a data source for this geometry.
	* Assumes the source geometry is not using indices.
	* @return {LineSegmentsGeometry} A reference to this geometry.
	*/
	fromLineSegments(lineSegments) {
		const geometry = lineSegments.geometry;
		this.setPositions(geometry.attributes.position.array);
		return this;
	}
	computeBoundingBox() {
		if (this.boundingBox === null) this.boundingBox = new Box3();
		const start = this.attributes.instanceStart;
		const end = this.attributes.instanceEnd;
		if (start !== void 0 && end !== void 0) {
			this.boundingBox.setFromBufferAttribute(start);
			_box$1.setFromBufferAttribute(end);
			this.boundingBox.union(_box$1);
		}
	}
	computeBoundingSphere() {
		if (this.boundingSphere === null) this.boundingSphere = new Sphere();
		if (this.boundingBox === null) this.computeBoundingBox();
		const start = this.attributes.instanceStart;
		const end = this.attributes.instanceEnd;
		if (start !== void 0 && end !== void 0) {
			const center = this.boundingSphere.center;
			this.boundingBox.getCenter(center);
			let maxRadiusSq = 0;
			for (let i = 0, il = start.count; i < il; i++) {
				_vector.fromBufferAttribute(start, i);
				maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_vector));
				_vector.fromBufferAttribute(end, i);
				maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_vector));
			}
			this.boundingSphere.radius = Math.sqrt(maxRadiusSq);
			if (isNaN(this.boundingSphere.radius)) console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.", this);
		}
	}
	toJSON() {}
};
//#endregion
//#region ../arrow-cube/node_modules/three/examples/jsm/lines/LineMaterial.js
UniformsLib.line = {
	worldUnits: { value: 1 },
	linewidth: { value: 1 },
	resolution: { value: new Vector2(1, 1) },
	dashOffset: { value: 0 },
	dashScale: { value: 1 },
	dashSize: { value: 1 },
	gapSize: { value: 1 }
};
ShaderLib["line"] = {
	uniforms: UniformsUtils.merge([
		UniformsLib.common,
		UniformsLib.fog,
		UniformsLib.line
	]),
	vertexShader: `
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		void trimSegment( const in vec4 start, inout vec4 end ) {

			// trim end segment so it terminates between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
			float nearEstimate = - 0.5 * b / a;

			float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

			end.xyz = mix( start.xyz, end.xyz, alpha );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
				vUv = uv;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					trimSegment( start, end );

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					trimSegment( end, start );

				}

			}

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,
	fragmentShader: `
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			float alpha = opacity;
			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`
};
/**
* A material for drawing wireframe-style geometries.
*
* Unlike {@link LineBasicMaterial}, it supports arbitrary line widths and allows using world units
* instead of screen space units. This material is used with {@link LineSegments2} and {@link Line2}.
*
* This module can only be used with {@link WebGLRenderer}. When using {@link WebGPURenderer},
* use {@link Line2NodeMaterial}.
*
* @augments ShaderMaterial
* @three_import import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
*/
var LineMaterial = class extends ShaderMaterial {
	/**
	* Constructs a new line segments geometry.
	*
	* @param {Object} [parameters] - An object with one or more properties
	* defining the material's appearance. Any property of the material
	* (including any property from inherited materials) can be passed
	* in here. Color values can be passed any type of value accepted
	* by {@link Color#set}.
	*/
	constructor(parameters) {
		super({
			type: "LineMaterial",
			uniforms: UniformsUtils.clone(ShaderLib["line"].uniforms),
			vertexShader: ShaderLib["line"].vertexShader,
			fragmentShader: ShaderLib["line"].fragmentShader,
			clipping: true
		});
		/**
		* This flag can be used for type testing.
		*
		* @type {boolean}
		* @readonly
		* @default true
		*/
		this.isLineMaterial = true;
		this.setValues(parameters);
	}
	/**
	* The material's color.
	*
	* @type {Color}
	* @default (1,1,1)
	*/
	get color() {
		return this.uniforms.diffuse.value;
	}
	set color(value) {
		this.uniforms.diffuse.value = value;
	}
	/**
	* Whether the material's sizes (width, dash gaps) are in world units.
	*
	* @type {boolean}
	* @default false
	*/
	get worldUnits() {
		return "WORLD_UNITS" in this.defines;
	}
	set worldUnits(value) {
		if (value === true !== this.worldUnits) this.needsUpdate = true;
		if (value === true) this.defines.WORLD_UNITS = "";
		else delete this.defines.WORLD_UNITS;
	}
	/**
	* Controls line thickness in CSS pixel units when `worldUnits` is `false` (default),
	* or in world units when `worldUnits` is `true`.
	*
	* @type {number}
	* @default 1
	*/
	get linewidth() {
		return this.uniforms.linewidth.value;
	}
	set linewidth(value) {
		if (!this.uniforms.linewidth) return;
		this.uniforms.linewidth.value = value;
	}
	/**
	* Whether the line is dashed, or solid.
	*
	* @type {boolean}
	* @default false
	*/
	get dashed() {
		return "USE_DASH" in this.defines;
	}
	set dashed(value) {
		if (value === true !== this.dashed) this.needsUpdate = true;
		if (value === true) this.defines.USE_DASH = "";
		else delete this.defines.USE_DASH;
	}
	/**
	* The scale of the dashes and gaps.
	*
	* @type {number}
	* @default 1
	*/
	get dashScale() {
		return this.uniforms.dashScale.value;
	}
	set dashScale(value) {
		this.uniforms.dashScale.value = value;
	}
	/**
	* The size of the dash.
	*
	* @type {number}
	* @default 1
	*/
	get dashSize() {
		return this.uniforms.dashSize.value;
	}
	set dashSize(value) {
		this.uniforms.dashSize.value = value;
	}
	/**
	* Where in the dash cycle the dash starts.
	*
	* @type {number}
	* @default 0
	*/
	get dashOffset() {
		return this.uniforms.dashOffset.value;
	}
	set dashOffset(value) {
		this.uniforms.dashOffset.value = value;
	}
	/**
	* The size of the gap.
	*
	* @type {number}
	* @default 0
	*/
	get gapSize() {
		return this.uniforms.gapSize.value;
	}
	set gapSize(value) {
		this.uniforms.gapSize.value = value;
	}
	/**
	* The opacity.
	*
	* @type {number}
	* @default 1
	*/
	get opacity() {
		return this.uniforms.opacity.value;
	}
	set opacity(value) {
		if (!this.uniforms) return;
		this.uniforms.opacity.value = value;
	}
	/**
	* The size of the viewport, in screen pixels. This must be kept updated to make
	* screen-space rendering accurate. The `LineSegments2.onBeforeRender` callback
	* performs the update for visible objects.
	*
	* @type {Vector2}
	*/
	get resolution() {
		return this.uniforms.resolution.value;
	}
	set resolution(value) {
		this.uniforms.resolution.value.copy(value);
	}
	/**
	* Whether to use alphaToCoverage or not. When enabled, this can improve the
	* anti-aliasing of line edges when using MSAA.
	*
	* @type {boolean}
	*/
	get alphaToCoverage() {
		return "USE_ALPHA_TO_COVERAGE" in this.defines;
	}
	set alphaToCoverage(value) {
		if (!this.defines) return;
		if (value === true !== this.alphaToCoverage) this.needsUpdate = true;
		if (value === true) this.defines.USE_ALPHA_TO_COVERAGE = "";
		else delete this.defines.USE_ALPHA_TO_COVERAGE;
	}
};
//#endregion
//#region ../arrow-cube/node_modules/three/examples/jsm/lines/LineSegments2.js
var _viewport = new Vector4();
var _start = new Vector3();
var _end = new Vector3();
var _start4 = new Vector4();
var _end4 = new Vector4();
var _ssOrigin = new Vector4();
var _ssOrigin3 = new Vector3();
var _mvMatrix = new Matrix4();
var _line = new Line3();
var _closestPoint = new Vector3();
var _box = new Box3();
var _sphere = new Sphere();
var _clipToWorldVector = new Vector4();
var _ray;
var _lineWidth;
function getWorldSpaceHalfWidth(camera, distance, resolution) {
	_clipToWorldVector.set(0, 0, -distance, 1).applyMatrix4(camera.projectionMatrix);
	_clipToWorldVector.multiplyScalar(1 / _clipToWorldVector.w);
	_clipToWorldVector.x = _lineWidth / resolution.width;
	_clipToWorldVector.y = _lineWidth / resolution.height;
	_clipToWorldVector.applyMatrix4(camera.projectionMatrixInverse);
	_clipToWorldVector.multiplyScalar(1 / _clipToWorldVector.w);
	return Math.abs(Math.max(_clipToWorldVector.x, _clipToWorldVector.y));
}
function raycastWorldUnits(lineSegments, intersects) {
	const matrixWorld = lineSegments.matrixWorld;
	const geometry = lineSegments.geometry;
	const instanceStart = geometry.attributes.instanceStart;
	const instanceEnd = geometry.attributes.instanceEnd;
	const segmentCount = Math.min(geometry.instanceCount, instanceStart.count);
	for (let i = 0, l = segmentCount; i < l; i++) {
		_line.start.fromBufferAttribute(instanceStart, i);
		_line.end.fromBufferAttribute(instanceEnd, i);
		_line.applyMatrix4(matrixWorld);
		const pointOnLine = new Vector3();
		const point = new Vector3();
		_ray.distanceSqToSegment(_line.start, _line.end, point, pointOnLine);
		if (point.distanceTo(pointOnLine) < _lineWidth * .5) intersects.push({
			point,
			pointOnLine,
			distance: _ray.origin.distanceTo(point),
			object: lineSegments,
			face: null,
			faceIndex: i,
			uv: null,
			uv1: null
		});
	}
}
function raycastScreenSpace(lineSegments, camera, intersects) {
	const projectionMatrix = camera.projectionMatrix;
	const resolution = lineSegments.material.resolution;
	const matrixWorld = lineSegments.matrixWorld;
	const geometry = lineSegments.geometry;
	const instanceStart = geometry.attributes.instanceStart;
	const instanceEnd = geometry.attributes.instanceEnd;
	const segmentCount = Math.min(geometry.instanceCount, instanceStart.count);
	const near = -camera.near;
	_ray.at(1, _ssOrigin);
	_ssOrigin.w = 1;
	_ssOrigin.applyMatrix4(camera.matrixWorldInverse);
	_ssOrigin.applyMatrix4(projectionMatrix);
	_ssOrigin.multiplyScalar(1 / _ssOrigin.w);
	_ssOrigin.x *= resolution.x / 2;
	_ssOrigin.y *= resolution.y / 2;
	_ssOrigin.z = 0;
	_ssOrigin3.copy(_ssOrigin);
	_mvMatrix.multiplyMatrices(camera.matrixWorldInverse, matrixWorld);
	for (let i = 0, l = segmentCount; i < l; i++) {
		_start4.fromBufferAttribute(instanceStart, i);
		_end4.fromBufferAttribute(instanceEnd, i);
		_start4.w = 1;
		_end4.w = 1;
		_start4.applyMatrix4(_mvMatrix);
		_end4.applyMatrix4(_mvMatrix);
		if (_start4.z > near && _end4.z > near) continue;
		if (_start4.z > near) {
			const deltaDist = _start4.z - _end4.z;
			const t = (_start4.z - near) / deltaDist;
			_start4.lerp(_end4, t);
		} else if (_end4.z > near) {
			const deltaDist = _end4.z - _start4.z;
			const t = (_end4.z - near) / deltaDist;
			_end4.lerp(_start4, t);
		}
		_start4.applyMatrix4(projectionMatrix);
		_end4.applyMatrix4(projectionMatrix);
		_start4.multiplyScalar(1 / _start4.w);
		_end4.multiplyScalar(1 / _end4.w);
		_start4.x *= resolution.x / 2;
		_start4.y *= resolution.y / 2;
		_end4.x *= resolution.x / 2;
		_end4.y *= resolution.y / 2;
		_line.start.copy(_start4);
		_line.start.z = 0;
		_line.end.copy(_end4);
		_line.end.z = 0;
		const param = _line.closestPointToPointParameter(_ssOrigin3, true);
		_line.at(param, _closestPoint);
		const zPos = MathUtils.lerp(_start4.z, _end4.z, param);
		const isInClipSpace = zPos >= -1 && zPos <= 1;
		const isInside = _ssOrigin3.distanceTo(_closestPoint) < _lineWidth * .5;
		if (isInClipSpace && isInside) {
			_line.start.fromBufferAttribute(instanceStart, i);
			_line.end.fromBufferAttribute(instanceEnd, i);
			_line.start.applyMatrix4(matrixWorld);
			_line.end.applyMatrix4(matrixWorld);
			const pointOnLine = new Vector3();
			const point = new Vector3();
			_ray.distanceSqToSegment(_line.start, _line.end, point, pointOnLine);
			intersects.push({
				point,
				pointOnLine,
				distance: _ray.origin.distanceTo(point),
				object: lineSegments,
				face: null,
				faceIndex: i,
				uv: null,
				uv1: null
			});
		}
	}
}
/**
* A series of lines drawn between pairs of vertices.
*
* This adds functionality beyond {@link LineSegments}, like arbitrary line width and changing width
* to be in world units. {@link Line2} extends this object, forming a polyline instead of individual
* segments.
*
* This module can only be used with {@link WebGLRenderer}. When using {@link WebGPURenderer},
* import the class from `lines/webgpu/LineSegments2.js`.
*
*  ```js
* const geometry = new LineSegmentsGeometry();
* geometry.setPositions( positions );
* geometry.setColors( colors );
*
* const material = new LineMaterial( { linewidth: 5, vertexColors: true } };
*
* const lineSegments = new LineSegments2( geometry, material );
* scene.add( lineSegments );
* ```
*
* @augments Mesh
* @three_import import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
*/
var LineSegments2 = class extends Mesh {
	/**
	* Constructs a new wide line.
	*
	* @param {LineSegmentsGeometry} [geometry] - The line geometry.
	* @param {LineMaterial} [material] - The line material.
	*/
	constructor(geometry = new LineSegmentsGeometry(), material = new LineMaterial({ color: Math.random() * 16777215 })) {
		super(geometry, material);
		/**
		* This flag can be used for type testing.
		*
		* @type {boolean}
		* @readonly
		* @default true
		*/
		this.isLineSegments2 = true;
		this.type = "LineSegments2";
	}
	/**
	* Computes an array of distance values which are necessary for rendering dashed lines.
	* For each vertex in the geometry, the method calculates the cumulative length from the
	* current point to the very beginning of the line.
	*
	* @return {LineSegments2} A reference to this instance.
	*/
	computeLineDistances() {
		const geometry = this.geometry;
		const instanceStart = geometry.attributes.instanceStart;
		const instanceEnd = geometry.attributes.instanceEnd;
		const lineDistances = new Float32Array(2 * instanceStart.count);
		for (let i = 0, j = 0, l = instanceStart.count; i < l; i++, j += 2) {
			_start.fromBufferAttribute(instanceStart, i);
			_end.fromBufferAttribute(instanceEnd, i);
			lineDistances[j] = j === 0 ? 0 : lineDistances[j - 1];
			lineDistances[j + 1] = lineDistances[j] + _start.distanceTo(_end);
		}
		const instanceDistanceBuffer = new InstancedInterleavedBuffer(lineDistances, 2, 1);
		geometry.setAttribute("instanceDistanceStart", new InterleavedBufferAttribute(instanceDistanceBuffer, 1, 0));
		geometry.setAttribute("instanceDistanceEnd", new InterleavedBufferAttribute(instanceDistanceBuffer, 1, 1));
		return this;
	}
	/**
	* Computes intersection points between a casted ray and this instance.
	*
	* @param {Raycaster} raycaster - The raycaster.
	* @param {Array<Object>} intersects - The target array that holds the intersection points.
	*/
	raycast(raycaster, intersects) {
		const worldUnits = this.material.worldUnits;
		const camera = raycaster.camera;
		if (camera === null && !worldUnits) console.error("LineSegments2: \"Raycaster.camera\" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.");
		const threshold = raycaster.params.Line2 !== void 0 ? raycaster.params.Line2.threshold || 0 : 0;
		_ray = raycaster.ray;
		const matrixWorld = this.matrixWorld;
		const geometry = this.geometry;
		const material = this.material;
		_lineWidth = material.linewidth + threshold;
		if (geometry.boundingSphere === null) geometry.computeBoundingSphere();
		_sphere.copy(geometry.boundingSphere).applyMatrix4(matrixWorld);
		let sphereMargin;
		if (worldUnits) sphereMargin = _lineWidth * .5;
		else sphereMargin = getWorldSpaceHalfWidth(camera, Math.max(camera.near, _sphere.distanceToPoint(_ray.origin)), material.resolution);
		_sphere.radius += sphereMargin;
		if (_ray.intersectsSphere(_sphere) === false) return;
		if (geometry.boundingBox === null) geometry.computeBoundingBox();
		_box.copy(geometry.boundingBox).applyMatrix4(matrixWorld);
		let boxMargin;
		if (worldUnits) boxMargin = _lineWidth * .5;
		else boxMargin = getWorldSpaceHalfWidth(camera, Math.max(camera.near, _box.distanceToPoint(_ray.origin)), material.resolution);
		_box.expandByScalar(boxMargin);
		if (_ray.intersectsBox(_box) === false) return;
		if (worldUnits) raycastWorldUnits(this, intersects);
		else raycastScreenSpace(this, camera, intersects);
	}
	onBeforeRender(renderer) {
		const uniforms = this.material.uniforms;
		if (uniforms && uniforms.resolution) {
			renderer.getViewport(_viewport);
			this.material.uniforms.resolution.value.set(_viewport.z, _viewport.w);
		}
	}
};
//#endregion
//#region ../arrow-cube/node_modules/three/examples/jsm/lines/LineGeometry.js
/**
* A chain of vertices, forming a polyline.
*
* This is used in {@link Line2} to describe the shape.
*
* ```js
* const points = [
* 	new THREE.Vector3( - 10, 0, 0 ),
* 	new THREE.Vector3( 0, 5, 0 ),
* 	new THREE.Vector3( 10, 0, 0 ),
* ];
*
* const geometry = new LineGeometry();
* geometry.setFromPoints( points );
* ```
*
* @augments LineSegmentsGeometry
* @three_import import { LineLineGeometry2 } from 'three/addons/lines/LineGeometry.js';
*/
var LineGeometry = class extends LineSegmentsGeometry {
	/**
	* Constructs a new line geometry.
	*/
	constructor() {
		super();
		/**
		* This flag can be used for type testing.
		*
		* @type {boolean}
		* @readonly
		* @default true
		*/
		this.isLineGeometry = true;
		this.type = "LineGeometry";
	}
	/**
	* Sets the given line positions for this geometry.
	*
	* @param {Float32Array|Array<number>} array - The position data to set.
	* @return {LineGeometry} A reference to this geometry.
	*/
	setPositions(array) {
		const length = array.length - 3;
		const points = new Float32Array(2 * length);
		for (let i = 0; i < length; i += 3) {
			points[2 * i] = array[i];
			points[2 * i + 1] = array[i + 1];
			points[2 * i + 2] = array[i + 2];
			points[2 * i + 3] = array[i + 3];
			points[2 * i + 4] = array[i + 4];
			points[2 * i + 5] = array[i + 5];
		}
		super.setPositions(points);
		return this;
	}
	/**
	* Sets the given line colors for this geometry.
	*
	* @param {Float32Array|Array<number>} array - The position data to set.
	* @return {LineGeometry} A reference to this geometry.
	*/
	setColors(array) {
		const length = array.length - 3;
		const colors = new Float32Array(2 * length);
		for (let i = 0; i < length; i += 3) {
			colors[2 * i] = array[i];
			colors[2 * i + 1] = array[i + 1];
			colors[2 * i + 2] = array[i + 2];
			colors[2 * i + 3] = array[i + 3];
			colors[2 * i + 4] = array[i + 4];
			colors[2 * i + 5] = array[i + 5];
		}
		super.setColors(colors);
		return this;
	}
	/**
	* Setups this line segments geometry from the given sequence of points.
	*
	* @param {Array<Vector3|Vector2>} points - An array of points in 2D or 3D space.
	* @return {LineGeometry} A reference to this geometry.
	*/
	setFromPoints(points) {
		const length = points.length - 1;
		const positions = new Float32Array(6 * length);
		for (let i = 0; i < length; i++) {
			positions[6 * i] = points[i].x;
			positions[6 * i + 1] = points[i].y;
			positions[6 * i + 2] = points[i].z || 0;
			positions[6 * i + 3] = points[i + 1].x;
			positions[6 * i + 4] = points[i + 1].y;
			positions[6 * i + 5] = points[i + 1].z || 0;
		}
		super.setPositions(positions);
		return this;
	}
	/**
	* Setups this line segments geometry from the given line.
	*
	* @param {Line} line - The line that should be used as a data source for this geometry.
	* @return {LineGeometry} A reference to this geometry.
	*/
	fromLine(line) {
		const geometry = line.geometry;
		this.setPositions(geometry.attributes.position.array);
		return this;
	}
};
//#endregion
//#region ../arrow-cube/node_modules/three/examples/jsm/lines/Line2.js
/**
* A polyline drawn between vertices.
*
* This adds functionality beyond {@link Line}, like arbitrary line width and changing width to
* be in world units.It extends {@link LineSegments2}, simplifying constructing segments from a
* chain of points.
*
* This module can only be used with {@link WebGLRenderer}. When using {@link WebGPURenderer},
* import the class from `lines/webgpu/Line2.js`.
*
* ```js
* const geometry = new LineGeometry();
* geometry.setPositions( positions );
* geometry.setColors( colors );
*
* const material = new LineMaterial( { linewidth: 5, vertexColors: true } };
*
* const line = new Line2( geometry, material );
* scene.add( line );
* ```
*
* @augments LineSegments2
* @three_import import { Line2 } from 'three/addons/lines/Line2.js';
*/
var Line2 = class extends LineSegments2 {
	/**
	* Constructs a new wide line.
	*
	* @param {LineGeometry} [geometry] - The line geometry.
	* @param {LineMaterial} [material] - The line material.
	*/
	constructor(geometry = new LineGeometry(), material = new LineMaterial({ color: Math.random() * 16777215 })) {
		super(geometry, material);
		/**
		* This flag can be used for type testing.
		*
		* @type {boolean}
		* @readonly
		* @default true
		*/
		this.isLine2 = true;
		this.type = "Line2";
	}
};
//#endregion
//#region src/style/toon.ts
var RAMPS = {
	2: [96, 255],
	3: [
		92,
		178,
		255
	],
	4: [
		80,
		142,
		202,
		255
	],
	soft: [180, 255]
};
var rampCache = /* @__PURE__ */ new Map();
function gradientMap(bands = 3) {
	const key = String(bands);
	const cached = rampCache.get(key);
	if (cached) return cached;
	const stops = RAMPS[key] ?? RAMPS["3"];
	const data = new Uint8Array(stops.length * 4);
	stops.forEach((stop, index) => {
		data[index * 4] = stop;
		data[index * 4 + 1] = stop;
		data[index * 4 + 2] = stop;
		data[index * 4 + 3] = 255;
	});
	const texture = new DataTexture(data, stops.length, 1, RGBAFormat);
	texture.minFilter = NearestFilter;
	texture.magFilter = NearestFilter;
	texture.generateMipmaps = false;
	texture.needsUpdate = true;
	rampCache.set(key, texture);
	return texture;
}
var chunkName = "lights_toon_pars_fragment";
var sourceLine = "vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;";
var sourceChunk = ShaderChunk[chunkName];
var patchedChunk = sourceChunk?.includes(sourceLine) ? `uniform vec3 uShadowTint;\n${sourceChunk.replace(sourceLine, `vec3 celBand = getGradientIrradiance( geometryNormal, directLight.direction );
       vec3 irradiance = celBand * mix( uShadowTint, vec3( 1.0 ), celBand ) * directLight.color;`)}` : null;
function cel(options) {
	const tint = options.tint ?? 7102348;
	const material = new MeshToonMaterial({
		color: options.color,
		gradientMap: gradientMap(options.bands ?? 3),
		transparent: options.transparent ?? false,
		opacity: options.opacity ?? 1,
		emissive: options.emissive ?? 0,
		emissiveIntensity: options.emissiveIntensity ?? 1
	});
	material.flatShading = options.flatShading ?? true;
	if (patchedChunk) {
		const uniform = { value: new Color(tint) };
		material.userData.shadowTint = uniform;
		material.onBeforeCompile = (shader) => {
			shader.uniforms.uShadowTint = uniform;
			shader.fragmentShader = shader.fragmentShader.replace(`#include <${chunkName}>`, patchedChunk);
		};
		material.customProgramCacheKey = () => `sakura-cel-${new Color(tint).getHexString()}`;
	}
	return material;
}
function flat(color, options = {}) {
	return new MeshBasicMaterial({
		color,
		...options
	});
}
//#endregion
//#region src/skill/SkillPresentationController.ts
var emptyDiagnostics = () => ({
	phase: "idle",
	phaseHistory: [],
	skillId: null,
	targetCount: 0,
	labelCount: 0,
	lineCount: 0,
	meshCount: 0,
	materialCount: 0,
	activeTimelines: 0,
	riceCableVisualScale: 1,
	autoRemovalOrder: [],
	autoRemovalStartsMs: [],
	radioPulseOrder: [],
	radioGuideTargetIds: [],
	radioGuideCurrentId: null,
	radioGuideVisibleCount: 0,
	cleanupCount: 0,
	sweepPassCount: 0,
	sweepActiveCableCount: 0,
	colorCycleCount: 0,
	colorCycleSpeed: 0,
	colorPreviewStrength: 0,
	colorPreviewActiveCableCount: 0,
	colorCommitCount: 0,
	recolorProgress: 0,
	recolorActiveCableCount: 0
});
function resolveBlenderColorCycle(progress) {
	const normalized = MathUtils.clamp(progress, 0, 1);
	return {
		position: normalized * 5 + normalized * normalized * normalized * 17,
		speed: (5 + 51 * normalized * normalized) / 4.4
	};
}
var makeMaterial = (color) => {
	const material = cel({
		color,
		bands: 3,
		tint: 6445172,
		flatShading: true
	});
	material.depthTest = false;
	material.depthWrite = false;
	return material;
};
var makeOccludedMaterial = (color) => {
	const material = makeMaterial(color);
	material.depthTest = true;
	material.polygonOffset = true;
	material.polygonOffsetFactor = -1;
	material.polygonOffsetUnits = -1;
	return material;
};
function createLowPolyRiceGeometry() {
	const radialSegments = 6;
	const rings = [
		{
			x: -.072,
			radius: .038
		},
		{
			x: 0,
			radius: .052
		},
		{
			x: .072,
			radius: .038
		}
	];
	const positions = [
		-.12,
		0,
		0
	];
	for (const ring of rings) for (let index = 0; index < radialSegments; index += 1) {
		const angle = index / radialSegments * Math.PI * 2;
		positions.push(ring.x, Math.sin(angle) * ring.radius, Math.cos(angle) * ring.radius * .68);
	}
	positions.push(.12, 0, 0);
	const indices = [];
	for (let segment = 0; segment < radialSegments; segment += 1) {
		const next = (segment + 1) % radialSegments;
		indices.push(0, 1 + next, 1 + segment);
	}
	for (let ring = 0; ring < rings.length - 1; ring += 1) {
		const current = 1 + ring * radialSegments;
		const nextRing = current + radialSegments;
		for (let segment = 0; segment < radialSegments; segment += 1) {
			const next = (segment + 1) % radialSegments;
			indices.push(current + segment, current + next, nextRing + segment, current + next, nextRing + next, nextRing + segment);
		}
	}
	const finalTip = 1 + rings.length * radialSegments;
	const lastRing = 1 + (rings.length - 1) * radialSegments;
	for (let segment = 0; segment < radialSegments; segment += 1) {
		const next = (segment + 1) % radialSegments;
		indices.push(lastRing + segment, lastRing + next, finalTip);
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	geometry.userData.skillShape = "low-poly-rice-kernel";
	return geometry;
}
function samplePath(points, progress, position, tangent) {
	if (points.length < 2) {
		position.copy(points[0] ?? new Vector3());
		tangent.set(1, 0, 0);
		return;
	}
	const lengths = points.slice(1).map((point, index) => point.distanceTo(points[index]));
	const total = lengths.reduce((sum, length) => sum + length, 0);
	let remaining = MathUtils.clamp(progress, 0, 1) * total;
	for (let index = 0; index < lengths.length; index += 1) {
		const length = lengths[index];
		if (remaining > length && index < lengths.length - 1) {
			remaining -= length;
			continue;
		}
		position.lerpVectors(points[index], points[index + 1], length > 0 ? remaining / length : 0);
		tangent.subVectors(points[index + 1], points[index]).normalize();
		if (tangent.lengthSq() < .001) tangent.set(1, 0, 0);
		return;
	}
}
var SkillPresentationController = class {
	scene;
	camera;
	hooks;
	root = new Group();
	cssRenderer = new CSS2DRenderer();
	transient = new Group();
	radioGuide = new Group();
	materials = /* @__PURE__ */ new Set();
	radioGuideMaterials = /* @__PURE__ */ new Set();
	radioGuideEntries = [];
	timeline = null;
	statusTimeline = null;
	transientTimers = /* @__PURE__ */ new Set();
	generation = 0;
	diagnosticsValue = emptyDiagnostics();
	riceVisualScale = 1;
	sweepCableIds = /* @__PURE__ */ new Set();
	colorShuffleCableIds = /* @__PURE__ */ new Set();
	hairDryerRecolorCableIds = /* @__PURE__ */ new Set();
	constructor(scene, camera, hooks) {
		this.scene = scene;
		this.camera = camera;
		this.hooks = hooks;
		this.root.name = "skill-presentation-root";
		this.transient.name = "skill-presentation-transient";
		this.radioGuide.name = "radio-route-guide";
		this.root.add(this.transient, this.radioGuide);
		this.scene.add(this.root);
		this.cssRenderer.domElement.className = "skill-world-overlay";
		this.cssRenderer.domElement.setAttribute("aria-hidden", "true");
		Object.assign(this.cssRenderer.domElement.style, {
			position: "absolute",
			inset: "0",
			pointerEvents: "none",
			overflow: "hidden",
			zIndex: "7"
		});
		document.querySelector("#app")?.append(this.cssRenderer.domElement);
	}
	get diagnostics() {
		return {
			...this.diagnosticsValue,
			materialCount: this.materials.size,
			riceCableVisualScale: this.hooks.getRiceCableVisualScale(),
			radioGuideTargetIds: this.radioGuideEntries.map(({ cableId }) => cableId),
			radioGuideCurrentId: this.radioGuideEntries[0]?.cableId ?? null,
			radioGuideVisibleCount: this.radioGuideEntries.length
		};
	}
	play(resolution, targets) {
		this.cancelTransient(false);
		const token = ++this.generation;
		const normalizedTargets = targets.map((target, index) => target instanceof Vector3 ? {
			cableId: resolution.targetCableIds[index] ?? `target-${index + 1}`,
			position: target
		} : target);
		this.diagnosticsValue = {
			...emptyDiagnostics(),
			phase: "cue",
			phaseHistory: ["cue"],
			skillId: resolution.skillId,
			targetCount: normalizedTargets.length,
			activeTimelines: 1,
			riceCableVisualScale: this.hooks.getRiceCableVisualScale()
		};
		if (resolution.appliance === "radio") return this.playRadio(resolution, normalizedTargets, token);
		if (resolution.appliance === "robot-vacuum") return this.playRobotVacuum(resolution, normalizedTargets, token);
		if (resolution.appliance === "rice-cooker") return this.playRiceCooker(resolution, normalizedTargets, token);
		if (resolution.appliance === "stand-mixer") return this.playStandMixer(normalizedTargets, token);
		if (resolution.appliance === "blender") return this.playBlender(resolution, normalizedTargets, token);
		if (resolution.appliance === "hair-dryer") return this.playHairDryer(resolution, token);
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			phase: "settle",
			activeTimelines: 0
		};
		return resolution.topologyChanged ? 900 : 650;
	}
	syncRiceStatus(statusId) {
		const target = statusId === "rice-thick-cable" ? 1.5 : 1;
		if (target === 1.5 && this.diagnosticsValue.skillId === "rice-thick-cable" && [
			"cue",
			"target-lock",
			"commit"
		].includes(this.diagnosticsValue.phase)) return;
		if (Math.abs(target - this.riceVisualScale) < .01 && Math.abs(target - this.hooks.getRiceCableVisualScale()) < .01) return;
		this.riceVisualScale = target;
		this.statusTimeline?.cancel();
		const state = { scale: this.hooks.getRiceCableVisualScale() };
		this.statusTimeline = createTimeline({
			defaults: { ease: "out(3)" },
			onUpdate: () => this.hooks.setCableVisualScale(state.scale),
			onComplete: () => {
				this.hooks.setCableVisualScale(target);
				this.statusTimeline = null;
			}
		}).add(state, {
			scale: target,
			duration: statusId === "rice-thick-cable" ? 420 : 340
		});
	}
	update(elapsed) {
		this.radioGuideEntries.forEach(({ root }, index) => {
			const baseScale = index === 0 ? .96 : .78;
			const pulse = index === 0 ? 1 + Math.sin(elapsed * 5.4) * .08 : 1;
			root.scale.setScalar(baseScale * pulse);
		});
	}
	syncRadioGuide(targets) {
		const targetIds = targets.map(({ cableId }) => cableId);
		const currentIds = this.radioGuideEntries.map(({ cableId }) => cableId);
		if (targetIds.length !== currentIds.length || targetIds.some((id, index) => id !== currentIds[index])) {
			this.clearRadioGuide();
			this.radioGuideEntries = targets.map((target, index) => ({
				cableId: target.cableId,
				root: this.createPersistentRadioGuide(index)
			}));
		}
		const screenUp = new Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
		const screenRight = new Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
		const inverseCamera = this.camera.quaternion.clone().invert();
		targets.forEach((target, index) => {
			const entry = this.radioGuideEntries[index];
			if (!entry) return;
			const cameraDirection = (target.direction ?? screenUp).clone().normalize().applyQuaternion(inverseCamera);
			const projectedDirection = new Vector2(cameraDirection.x, cameraDirection.y);
			if (projectedDirection.lengthSq() > .001) projectedDirection.normalize();
			const upwardOverlap = MathUtils.smoothstep(projectedDirection.y, .2, .86);
			const lateralOffset = (index % 2 === 0 ? 1 : -1) * upwardOverlap * .5;
			const verticalOffset = .79 - upwardOverlap * .08;
			entry.root.position.copy(target.position).addScaledVector(screenUp, verticalOffset).addScaledVector(screenRight, lateralOffset);
			const tail = entry.root.getObjectByName("radio-guide-tail");
			if (tail) {
				const towardPlug = new Vector2(-lateralOffset, -verticalOffset).normalize();
				tail.position.set(towardPlug.x * .47, towardPlug.y * .37, .095);
				tail.rotation.z = Math.atan2(-towardPlug.x, towardPlug.y);
			}
		});
	}
	render() {
		this.transient.traverse((object) => {
			if (object.userData.skillBillboard === true) object.quaternion.copy(this.camera.quaternion);
		});
		this.radioGuide.traverse((object) => {
			if (object.userData.skillBillboard === true) object.quaternion.copy(this.camera.quaternion);
		});
		this.cssRenderer.render(this.scene, this.camera);
	}
	resize(width, height) {
		this.cssRenderer.setSize(Math.max(1, width), Math.max(1, height));
		this.transient.traverse((object) => {
			const line = object;
			if (line.material instanceof LineMaterial) line.material.resolution.set(width, height);
		});
	}
	reset() {
		this.generation += 1;
		this.cancelTransient(true);
		this.clearRadioGuide();
		this.statusTimeline?.cancel();
		this.statusTimeline = null;
		this.riceVisualScale = 1;
		this.hooks.setCableVisualScale(1);
	}
	complete() {
		this.cancelTransient(true);
	}
	freezeForEvidence(timeMs) {
		if (!this.timeline || this.diagnosticsValue.skillId === null) return false;
		this.timeline.pause();
		this.timeline.seek(Math.max(0, Math.min(timeMs, this.timeline.duration)), false);
		this.transient.traverse((object) => {
			if (object instanceof Mesh || object instanceof Line2) {
				object.visible = true;
				if (object.scale.lengthSq() < .01) object.scale.setScalar(1);
				(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
					if ("opacity" in material) material.opacity = Math.max(material.opacity, .9);
				});
			}
		});
		if (this.diagnosticsValue.skillId === "route-broadcast") this.transient.children.filter((child) => child.name.startsWith("skill-target-beacon-")).forEach((child) => child.scale.setScalar(.52));
		else if (this.diagnosticsValue.skillId === "rice-thick-cable") {
			const position = new Vector3();
			const tangent = new Vector3();
			this.transient.children.filter((child) => child.name.startsWith("rice-signal-")).forEach((child, index) => {
				const path = child.userData.skillRicePath;
				if (path) {
					samplePath(path, .48 + index % 2 * .12, position, tangent);
					child.position.copy(position);
					child.position.y += .24;
					child.quaternion.setFromUnitVectors(new Vector3(1, 0, 0), tangent);
				}
				child.scale.setScalar(1.2);
			});
		}
		this.root.updateMatrixWorld(true);
		this.scene.updateMatrixWorld(true);
		return true;
	}
	dispose() {
		this.reset();
		this.cssRenderer.domElement.remove();
		this.root.removeFromParent();
		this.materials.forEach((material) => material.dispose());
		this.materials.clear();
		this.radioGuideMaterials.forEach((material) => material.dispose());
		this.radioGuideMaterials.clear();
	}
	playRadio(resolution, targets, token) {
		const timeline = this.makeTimeline(token);
		timeline.label("cue", 0);
		timeline.call(() => this.setPhase("target-lock", token), 0);
		timeline.call(() => this.setPhase("commit", token), 180);
		timeline.call(() => this.setPhase("result", token), 360);
		timeline.call(() => this.finishTimeline(token), 520);
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			labelCount: 0,
			lineCount: 0,
			meshCount: 0
		};
		return 560;
	}
	playRiceCooker(resolution, targets, token) {
		const selected = targets.length > 0 ? targets.slice(0, 12) : [{
			cableId: "fallback",
			position: new Vector3(0, .3, 0),
			path: [new Vector3(-.4, .3, 0), new Vector3(.4, .3, 0)]
		}];
		const grainGeometry = createLowPolyRiceGeometry();
		const creaseGeometry = new CylinderGeometry(.008, .008, .11, 4);
		creaseGeometry.rotateZ(Math.PI * .5);
		const bodyMaterials = [makeOccludedMaterial(16773821), makeOccludedMaterial(15777109)];
		const creaseMaterial = makeOccludedMaterial(10449983);
		bodyMaterials.forEach((material) => this.materials.add(material));
		this.materials.add(creaseMaterial);
		const grains = [];
		selected.forEach((target, index) => {
			const fallbackPath = [target.position.clone().add(new Vector3(-.45, 0, 0)), target.position];
			const path = target.path && target.path.length > 1 ? target.path : fallbackPath;
			for (let grainIndex = 0; grainIndex < 2; grainIndex += 1) {
				const root = new Group();
				root.name = `rice-signal-${target.cableId}-${grainIndex + 1}`;
				root.userData.skillRicePath = path;
				root.scale.setScalar(.01);
				const body = new Mesh(grainGeometry, bodyMaterials[grainIndex]);
				body.renderOrder = 90;
				const crease = new Mesh(creaseGeometry, creaseMaterial);
				crease.position.y = .052;
				crease.renderOrder = 91;
				root.add(body, crease);
				this.transient.add(root);
				grains.push({
					root,
					path,
					state: {
						scale: .01,
						progress: -.18 - grainIndex * .14,
						turn: index * .3
					}
				});
			}
		});
		const samplePosition = new Vector3();
		const sampleTangent = new Vector3();
		const localX = new Vector3(1, 0, 0);
		const updateGrain = (grain) => {
			const progress = MathUtils.clamp(grain.state.progress, 0, 1);
			samplePath(grain.path, progress, samplePosition, sampleTangent);
			grain.root.position.copy(samplePosition);
			grain.root.position.y += .12 + Math.sin(progress * Math.PI) * .16;
			grain.root.quaternion.setFromUnitVectors(localX, sampleTangent);
			grain.root.rotateX(grain.state.turn);
			grain.root.scale.setScalar(grain.state.scale * MathUtils.smoothstep(progress, 0, .1) * 1.65);
		};
		const timeline = this.makeTimeline(token);
		timeline.call(() => this.setPhase("target-lock", token), 120);
		grains.forEach((grain, index) => {
			timeline.add(grain.state, {
				scale: 1.4,
				progress: 1,
				turn: grain.state.turn + Math.PI * 1.2,
				duration: 500,
				ease: "inOut(2)",
				onUpdate: () => updateGrain(grain)
			}, 120 + index % 2 * 80);
		});
		timeline.call(() => this.setPhase("commit", token), 430);
		timeline.call(() => this.setPhase("impact", token), 620);
		const thickness = { scale: this.hooks.getRiceCableVisualScale() };
		timeline.add(thickness, {
			scale: 1.5,
			duration: 420,
			ease: "outBack(1.15)",
			onUpdate: () => this.hooks.setCableVisualScale(thickness.scale),
			onComplete: () => {
				this.riceVisualScale = 1.5;
				this.hooks.setCableVisualScale(1.5);
			}
		}, 620);
		timeline.call(() => this.setPhase("result", token), 960);
		grains.forEach((grain, index) => timeline.add(grain.state, {
			scale: 0,
			progress: 1.06,
			duration: 220,
			onUpdate: () => updateGrain(grain)
		}, 980 + index * 12));
		timeline.call(() => this.finishTimeline(token), 1320);
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			meshCount: grains.length
		};
		return 1380;
	}
	playStandMixer(targets, token) {
		const selected = targets.filter((target) => target.path && target.path.length > 1);
		this.sweepCableIds = new Set(selected.map(({ cableId }) => cableId));
		const sweep = {
			progress: -.16,
			strength: 0,
			pass: 1
		};
		const applySweep = () => {
			const color = sweep.pass === 1 ? PAL.purple : 7787724;
			selected.forEach(({ cableId }) => this.hooks.setCableSkillSweep(cableId, sweep.progress, sweep.strength, color));
		};
		const timeline = this.makeTimeline(token);
		timeline.call(() => this.setPhase("target-lock", token), 100);
		timeline.add(sweep, {
			progress: 1.16,
			strength: 1,
			duration: 680,
			ease: "inOut(2)",
			onUpdate: applySweep
		}, 120);
		timeline.call(() => {
			sweep.pass = 2;
			this.setPhase("commit", token);
		}, 820);
		timeline.add(sweep, {
			progress: -.16,
			strength: .86,
			duration: 680,
			ease: "inOut(2)",
			onUpdate: applySweep
		}, 840);
		timeline.call(() => this.setPhase("impact", token), 1540);
		timeline.add(sweep, {
			strength: 0,
			duration: 180,
			ease: "out(3)",
			onUpdate: applySweep
		}, 1540);
		timeline.call(() => this.setPhase("result", token), 1740);
		timeline.call(() => this.finishTimeline(token), 1860);
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			lineCount: selected.length,
			meshCount: 0,
			sweepPassCount: 2,
			sweepActiveCableCount: selected.length
		};
		return 1920;
	}
	playBlender(resolution, targets, token) {
		const changes = resolution.commands.flatMap((command) => command.type === "recolor" ? command.changes : []);
		const palette = [...new Set(changes.map(({ color }) => color))];
		this.colorShuffleCableIds = new Set(changes.map(({ cableId }) => cableId));
		const offsets = new Map(changes.map(({ cableId }, index) => {
			let hash = 2166136261;
			for (let character = 0; character < cableId.length; character += 1) hash = Math.imul(hash ^ cableId.charCodeAt(character), 16777619) >>> 0;
			return [cableId, hash % 997 / 997 * Math.max(1, palette.length) + index * .37];
		}));
		const state = { progress: 0 };
		const previewColor = new Color();
		const applyPreview = () => {
			if (token !== this.generation || palette.length === 0) return;
			const colorCycle = resolveBlenderColorCycle(MathUtils.clamp(state.progress, 0, 1));
			const cyclePosition = colorCycle.position;
			let peakStrength = 0;
			changes.forEach((change, index) => {
				const phase = cyclePosition + (offsets.get(change.cableId) ?? index);
				let paletteIndex = Math.floor(phase) % palette.length;
				const baseColor = this.hooks.getCableBaseColor(change.cableId);
				if (palette.length > 1 && palette[paletteIndex] === baseColor) paletteIndex = (paletteIndex + 1) % palette.length;
				const paletteColor = palette[paletteIndex] ?? change.color;
				previewColor.set(paletteColor);
				const strength = 1;
				peakStrength = Math.max(peakStrength, strength);
				this.hooks.setCableSkillTint(change.cableId, previewColor.getHex(), strength, 0);
			});
			this.diagnosticsValue = {
				...this.diagnosticsValue,
				colorCycleCount: Math.floor(cyclePosition),
				colorCycleSpeed: colorCycle.speed,
				colorPreviewStrength: peakStrength,
				colorPreviewActiveCableCount: changes.length
			};
		};
		const clearPreview = () => {
			this.colorShuffleCableIds.forEach((cableId) => this.hooks.setCableSkillTint(cableId, null, 0, 0));
		};
		const timeline = this.makeTimeline(token);
		timeline.call(() => this.setPhase("target-lock", token), 120);
		timeline.add(state, {
			progress: 1,
			duration: 4400,
			ease: "linear",
			onUpdate: applyPreview
		}, 180);
		timeline.call(() => {
			if (token !== this.generation) return;
			clearPreview();
			this.hooks.commitCableColors(changes);
			this.setPhase("commit", token);
			this.diagnosticsValue = {
				...this.diagnosticsValue,
				colorCommitCount: changes.length,
				colorPreviewActiveCableCount: 0
			};
		}, 4680);
		timeline.call(() => this.setPhase("result", token), 4840);
		timeline.call(() => this.finishTimeline(token), 5120);
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			lineCount: targets.length,
			meshCount: 0,
			colorPreviewActiveCableCount: changes.length
		};
		return 5200;
	}
	playHairDryer(resolution, token) {
		const changes = resolution.commands.flatMap((command) => command.type === "recolor" ? command.changes : []);
		const timeline = this.makeTimeline(token);
		timeline.call(() => this.setPhase("target-lock", token), 80);
		if (changes.length === 0) {
			timeline.call(() => this.setPhase("commit", token), 180);
			timeline.call(() => this.setPhase("result", token), 2180);
			timeline.call(() => this.finishTimeline(token), 2340);
			return 2400;
		}
		this.hairDryerRecolorCableIds = new Set(changes.map(({ cableId }) => cableId));
		const state = { progress: 0 };
		const applyRecolor = () => {
			if (token !== this.generation) return;
			const progress = MathUtils.clamp(state.progress, 0, 1);
			changes.forEach(({ cableId, color }) => this.hooks.setCableSkillRecolor(cableId, color, progress));
			this.diagnosticsValue = {
				...this.diagnosticsValue,
				recolorProgress: progress,
				recolorActiveCableCount: changes.length
			};
		};
		timeline.add(state, {
			progress: 1,
			duration: 1820,
			ease: "inOut(2)",
			onUpdate: applyRecolor
		}, 180);
		timeline.call(() => {
			if (token !== this.generation) return;
			changes.forEach(({ cableId }) => this.hooks.setCableSkillRecolor(cableId, null, 0));
			this.hooks.commitCableColors(changes);
			this.setPhase("commit", token);
			this.diagnosticsValue = {
				...this.diagnosticsValue,
				colorCommitCount: changes.length,
				recolorProgress: 1,
				recolorActiveCableCount: 0
			};
		}, 2040);
		timeline.call(() => this.setPhase("result", token), 2180);
		timeline.call(() => this.finishTimeline(token), 2340);
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			lineCount: changes.length,
			meshCount: 0,
			recolorActiveCableCount: changes.length
		};
		return 2400;
	}
	playRobotVacuum(resolution, targets, token) {
		const timeline = this.makeTimeline(token);
		timeline.call(() => this.setPhase("target-lock", token), 0);
		const commitAt = 520;
		timeline.call(() => this.setPhase("commit", token), commitAt);
		this.scheduleAutoRemovals(resolution.targetCableIds, token, commitAt);
		const resultAt = commitAt + Math.max(0, resolution.targetCableIds.length - 1) * 100 + 520;
		timeline.call(() => this.setPhase("result", token), resultAt);
		timeline.call(() => this.finishTimeline(token), resultAt + 320);
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			meshCount: 0,
			autoRemovalOrder: [],
			autoRemovalStartsMs: []
		};
		return resultAt + 380;
	}
	createPersistentRadioGuide(index) {
		const root = new Group();
		root.name = `radio-route-guide-${index + 1}`;
		root.userData.skillBillboard = true;
		root.renderOrder = 150;
		const material = (color) => {
			const result = makeMaterial(color);
			result.transparent = true;
			result.opacity = 1;
			result.needsUpdate = true;
			this.radioGuideMaterials.add(result);
			return result;
		};
		const plateMaterial = material(index === 0 ? 16773583 : 16775400);
		const frameMaterial = flat(index === 0 ? PAL.blossomDeep : 6277569);
		frameMaterial.transparent = true;
		frameMaterial.opacity = 1;
		frameMaterial.depthTest = false;
		frameMaterial.depthWrite = false;
		frameMaterial.needsUpdate = true;
		this.radioGuideMaterials.add(frameMaterial);
		const inkMaterial = flat(4537176);
		inkMaterial.transparent = true;
		inkMaterial.opacity = 1;
		inkMaterial.depthTest = false;
		inkMaterial.depthWrite = false;
		inkMaterial.needsUpdate = true;
		this.radioGuideMaterials.add(inkMaterial);
		const darkMaterial = material(4537176);
		const signalMaterial = material(index === 0 ? PAL.blossomDeep : 6277569);
		const makePlateGeometry = (scale = 1, volumetric = true) => {
			const shape = new Shape();
			shape.moveTo(-.43 * scale, -.3 * scale);
			shape.lineTo(.31 * scale, -.32 * scale);
			shape.lineTo(.43 * scale, -.19 * scale);
			shape.lineTo(.41 * scale, .25 * scale);
			shape.lineTo(.29 * scale, .34 * scale);
			shape.lineTo(-.35 * scale, .32 * scale);
			shape.lineTo(-.44 * scale, .18 * scale);
			shape.closePath();
			if (!volumetric) return new ShapeGeometry(shape);
			const geometry = new ExtrudeGeometry(shape, {
				depth: .07,
				bevelEnabled: true,
				bevelThickness: .028,
				bevelSize: .026,
				bevelOffset: 0,
				bevelSegments: 1,
				curveSegments: 1
			});
			geometry.translate(0, 0, -.035);
			return geometry;
		};
		const outerInk = new Mesh(makePlateGeometry(1.055), inkMaterial);
		outerInk.name = "radio-guide-outer-ink";
		outerInk.renderOrder = 149;
		outerInk.userData.outlineTier = "main";
		outerInk.userData.outlineStable = true;
		root.add(outerInk);
		const frame = new Mesh(makePlateGeometry(), frameMaterial);
		frame.name = "radio-guide-frame";
		frame.renderOrder = 150;
		root.add(frame);
		const plate = new Mesh(makePlateGeometry(.88, false), plateMaterial);
		plate.name = "radio-guide-bubble";
		plate.position.z = .055;
		plate.renderOrder = 153;
		root.add(plate);
		const tail = new Mesh(new ConeGeometry(.12, .22, 3), frameMaterial);
		tail.name = "radio-guide-tail";
		tail.position.set(0, -.37, .095);
		tail.rotation.z = Math.PI;
		tail.renderOrder = 151;
		root.add(tail);
		const mast = new Mesh(new ConeGeometry(.085, .36, 4), darkMaterial);
		mast.name = "radio-guide-mast";
		mast.position.set(0, -.025, .13);
		mast.renderOrder = 154;
		root.add(mast);
		const cap = new Mesh(new OctahedronGeometry(.075, 0), signalMaterial);
		cap.position.set(0, .19, .14);
		cap.renderOrder = 155;
		root.add(cap);
		[-1, 1].forEach((side) => {
			[0, 1].forEach((level) => {
				const wave = new Mesh(new BoxGeometry(.19 + level * .07, level === 0 ? .065 : .055, .065), signalMaterial);
				wave.position.set(side * (.2 + level * .085), .07 - level * .12, .14);
				wave.rotation.z = side * (.38 + level * .05);
				wave.renderOrder = 154;
				root.add(wave);
			});
		});
		this.radioGuide.add(root);
		return root;
	}
	clearRadioGuide() {
		this.clearGroup(this.radioGuide);
		this.radioGuideEntries = [];
		this.radioGuideMaterials.forEach((material) => material.dispose());
		this.radioGuideMaterials.clear();
	}
	makeTimeline(token) {
		this.timeline?.cancel();
		const timeline = createTimeline({
			defaults: { ease: "out(3)" },
			onComplete: () => {
				if (token === this.generation) this.finishTimeline(token);
			}
		});
		this.timeline = timeline;
		return timeline;
	}
	setPhase(phase, token) {
		if (token !== this.generation || this.diagnosticsValue.phase === phase) return;
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			phase,
			phaseHistory: [...this.diagnosticsValue.phaseHistory, phase]
		};
	}
	finishTimeline(token) {
		if (token !== this.generation) return;
		this.setPhase("settle", token);
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			activeTimelines: 0
		};
	}
	scheduleAutoRemovals(cableIds, token, delay) {
		const commitNext = (index) => {
			if (index >= cableIds.length || token !== this.generation) return;
			const timer = window.setTimeout(() => {
				this.transientTimers.delete(timer);
				if (token !== this.generation) return;
				const cableId = cableIds[index];
				this.hooks.commitAutoRemoval(cableId);
				if (this.diagnosticsValue.phase === "commit" || this.diagnosticsValue.phase === "target-lock") this.setPhase("impact", token);
				this.diagnosticsValue = {
					...this.diagnosticsValue,
					autoRemovalOrder: [...this.diagnosticsValue.autoRemovalOrder, cableId],
					autoRemovalStartsMs: [...this.diagnosticsValue.autoRemovalStartsMs, performance.now()]
				};
				commitNext(index + 1);
			}, index === 0 ? delay : 100);
			this.transientTimers.add(timer);
		};
		commitNext(0);
	}
	cancelTransient(countCleanup) {
		const lastAutoRemovalOrder = this.diagnosticsValue.autoRemovalOrder;
		const lastAutoRemovalStartsMs = this.diagnosticsValue.autoRemovalStartsMs;
		const lastRadioPulseOrder = this.diagnosticsValue.radioPulseOrder;
		const phaseHistory = this.diagnosticsValue.skillId === null ? this.diagnosticsValue.phaseHistory : [
			...this.diagnosticsValue.phaseHistory,
			...this.diagnosticsValue.phaseHistory.includes("settle") ? [] : ["settle"],
			"cleanup"
		];
		this.timeline?.cancel();
		this.timeline = null;
		this.transientTimers.forEach((timer) => window.clearTimeout(timer));
		this.transientTimers.clear();
		this.sweepCableIds.forEach((cableId) => this.hooks.setCableSkillSweep(cableId, 0, 0, PAL.purple));
		this.sweepCableIds.clear();
		this.colorShuffleCableIds.forEach((cableId) => this.hooks.setCableSkillTint(cableId, null, 0, 0));
		this.colorShuffleCableIds.clear();
		this.hairDryerRecolorCableIds.forEach((cableId) => this.hooks.setCableSkillRecolor(cableId, null, 0));
		this.hairDryerRecolorCableIds.clear();
		this.clearGroup(this.transient);
		this.diagnosticsValue = {
			...emptyDiagnostics(),
			cleanupCount: this.diagnosticsValue.cleanupCount + Number(countCleanup || this.diagnosticsValue.skillId !== null),
			riceCableVisualScale: this.hooks.getRiceCableVisualScale(),
			autoRemovalOrder: lastAutoRemovalOrder,
			autoRemovalStartsMs: lastAutoRemovalStartsMs,
			radioPulseOrder: lastRadioPulseOrder,
			phaseHistory,
			sweepPassCount: this.diagnosticsValue.sweepPassCount,
			sweepActiveCableCount: this.diagnosticsValue.sweepActiveCableCount
		};
	}
	clearGroup(group) {
		[...group.children].forEach((child) => {
			child.removeFromParent();
			child.traverse((object) => {
				if (object instanceof Mesh || object instanceof Line2) {
					object.geometry.dispose();
					(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
						if (!this.materials.has(material)) return;
						material.dispose();
						this.materials.delete(material);
					});
				}
			});
		});
	}
};
//#endregion
export { cel as n, SkillPresentationController as t };
