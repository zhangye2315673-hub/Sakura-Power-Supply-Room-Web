import { A as DodecahedronGeometry, Dt as Object3D, Fn as ShaderMaterial, G as IcosahedronGeometry, H as Group, Hn as SphereGeometry, I as ExtrudeGeometry, It as Quaternion, J as InstancedMesh, Ln as Shape, Mt as Plane, N as Euler, Qn as TubeGeometry, Rn as ShapeGeometry, S as CylinderGeometry, Sn as Ray, Un as Spherical, Wn as SpotLight, a as BufferAttribute, bt as MeshPhysicalMaterial, d as CircleGeometry, dr as Vector3, ft as MathUtils, g as Controls, gt as MeshBasicMaterial, ht as Mesh, i as BoxGeometry, l as CapsuleGeometry, mt as Matrix4, p as Color, qn as TOUCH, u as CatmullRomCurve3, ur as Vector2, ut as MOUSE } from "./three.core-DlTOC7bx.js";
import { n as PAL } from "./palette-knpLSfXB.js";
import { C as PRINTER_PAPER_PROFILES, D as jelly, a as createRecordPlayerPerformance, d as applyPortableSpeakerPerformance, f as resetPortableSpeakerPerformance, g as resetHairDryerPerformance, i as RoundedBoxGeometry, m as applyHairDryerPerformance, s as createRobotVacuumPerformance, t as mergeGeometries, w as PRINTER_PAPER_STOP_END, x as poweredAnimationState } from "./BufferGeometryUtils-B_UDylAy.js";
//#region node_modules/three/examples/jsm/controls/OrbitControls.js
/**
* Fires when the camera has been transformed by the controls.
*
* @event OrbitControls#change
* @type {Object}
*/
var _changeEvent = { type: "change" };
/**
* Fires when an interaction was initiated.
*
* @event OrbitControls#start
* @type {Object}
*/
var _startEvent = { type: "start" };
/**
* Fires when an interaction has finished.
*
* @event OrbitControls#end
* @type {Object}
*/
var _endEvent = { type: "end" };
var _ray = new Ray();
var _plane = new Plane();
var _TILT_LIMIT = Math.cos(70 * MathUtils.DEG2RAD);
var _v = new Vector3();
var _twoPI = 2 * Math.PI;
var _STATE = {
	NONE: -1,
	ROTATE: 0,
	DOLLY: 1,
	PAN: 2,
	TOUCH_ROTATE: 3,
	TOUCH_PAN: 4,
	TOUCH_DOLLY_PAN: 5,
	TOUCH_DOLLY_ROTATE: 6
};
var _EPS = 1e-6;
/**
* Orbit controls allow the camera to orbit around a target.
*
* OrbitControls performs orbiting, dollying (zooming), and panning. Unlike {@link TrackballControls},
* it maintains the "up" direction `object.up` (+Y by default).
*
* - Orbit: Left mouse / touch: one-finger move.
* - Zoom: Middle mouse, or mousewheel / touch: two-finger spread or squish.
* - Pan: Right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move.
*
* ```js
* const controls = new OrbitControls( camera, renderer.domElement );
*
* // controls.update() must be called after any manual changes to the camera's transform
* camera.position.set( 0, 20, 100 );
* controls.update();
*
* function animate() {
*
* 	// required if controls.enableDamping or controls.autoRotate are set to true
* 	controls.update();
*
* 	renderer.render( scene, camera );
*
* }
* ```
*
* @augments Controls
* @three_import import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
*/
var OrbitControls = class extends Controls {
	/**
	* Constructs a new controls instance.
	*
	* @param {Object3D} object - The object that is managed by the controls.
	* @param {?HTMLElement} domElement - The HTML element used for event listeners.
	*/
	constructor(object, domElement = null) {
		super(object, domElement);
		this.state = _STATE.NONE;
		/**
		* The focus point of the controls, the `object` orbits around this.
		* It can be updated manually at any point to change the focus of the controls.
		*
		* @type {Vector3}
		*/
		this.target = new Vector3();
		/**
		* The focus point of the `minTargetRadius` and `maxTargetRadius` limits.
		* It can be updated manually at any point to change the center of interest
		* for the `target`.
		*
		* @type {Vector3}
		*/
		this.cursor = new Vector3();
		/**
		* How far you can dolly in (perspective camera only).
		*
		* @type {number}
		* @default 0
		*/
		this.minDistance = 0;
		/**
		* How far you can dolly out (perspective camera only).
		*
		* @type {number}
		* @default Infinity
		*/
		this.maxDistance = Infinity;
		/**
		* How far you can zoom in (orthographic camera only).
		*
		* @type {number}
		* @default 0
		*/
		this.minZoom = 0;
		/**
		* How far you can zoom out (orthographic camera only).
		*
		* @type {number}
		* @default Infinity
		*/
		this.maxZoom = Infinity;
		/**
		* How close you can get the target to the 3D `cursor`.
		*
		* @type {number}
		* @default 0
		*/
		this.minTargetRadius = 0;
		/**
		* How far you can move the target from the 3D `cursor`.
		*
		* @type {number}
		* @default Infinity
		*/
		this.maxTargetRadius = Infinity;
		/**
		* How far you can orbit vertically, lower limit. Range is `[0, Math.PI]` radians.
		*
		* @type {number}
		* @default 0
		*/
		this.minPolarAngle = 0;
		/**
		* How far you can orbit vertically, upper limit. Range is `[0, Math.PI]` radians.
		*
		* @type {number}
		* @default Math.PI
		*/
		this.maxPolarAngle = Math.PI;
		/**
		* How far you can orbit horizontally, lower limit. If set, the interval `[ min, max ]`
		* must be a sub-interval of `[ - 2 PI, 2 PI ]`, with `( max - min < 2 PI )`.
		*
		* @type {number}
		* @default -Infinity
		*/
		this.minAzimuthAngle = -Infinity;
		/**
		* How far you can orbit horizontally, upper limit. If set, the interval `[ min, max ]`
		* must be a sub-interval of `[ - 2 PI, 2 PI ]`, with `( max - min < 2 PI )`.
		*
		* @type {number}
		* @default -Infinity
		*/
		this.maxAzimuthAngle = Infinity;
		/**
		* Set to `true` to enable damping (inertia), which can be used to give a sense of weight
		* to the controls. Note that if this is enabled, you must call `update()` in your animation
		* loop.
		*
		* @type {boolean}
		* @default false
		*/
		this.enableDamping = false;
		/**
		* The damping inertia used if `enableDamping` is set to `true`.
		*
		* Note that for this to work, you must call `update()` in your animation loop.
		*
		* @type {number}
		* @default 0.05
		*/
		this.dampingFactor = .05;
		/**
		* Enable or disable zooming (dollying) of the camera.
		*
		* @type {boolean}
		* @default true
		*/
		this.enableZoom = true;
		/**
		* Speed of zooming / dollying.
		*
		* @type {number}
		* @default 1
		*/
		this.zoomSpeed = 1;
		/**
		* Enable or disable horizontal and vertical rotation of the camera.
		*
		* Note that it is possible to disable a single axis by setting the min and max of the
		* `minPolarAngle` or `minAzimuthAngle` to the same value, which will cause the vertical
		* or horizontal rotation to be fixed at that value.
		*
		* @type {boolean}
		* @default true
		*/
		this.enableRotate = true;
		/**
		* Speed of rotation.
		*
		* @type {number}
		* @default 1
		*/
		this.rotateSpeed = 1;
		/**
		* How fast to rotate the camera when the keyboard is used.
		*
		* @type {number}
		* @default 1
		*/
		this.keyRotateSpeed = 1;
		/**
		* Enable or disable camera panning.
		*
		* @type {boolean}
		* @default true
		*/
		this.enablePan = true;
		/**
		* Speed of panning.
		*
		* @type {number}
		* @default 1
		*/
		this.panSpeed = 1;
		/**
		* Defines how the camera's position is translated when panning. If `true`, the camera pans
		* in screen space. Otherwise, the camera pans in the plane orthogonal to the camera's up
		* direction.
		*
		* @type {boolean}
		* @default true
		*/
		this.screenSpacePanning = true;
		/**
		* How fast to pan the camera when the keyboard is used in
		* pixels per keypress.
		*
		* @type {number}
		* @default 7
		*/
		this.keyPanSpeed = 7;
		/**
		* Setting this property to `true` allows to zoom to the cursor's position.
		*
		* @type {boolean}
		* @default false
		*/
		this.zoomToCursor = false;
		/**
		* Set to true to automatically rotate around the target
		*
		* Note that if this is enabled, you must call `update()` in your animation loop.
		* If you want the auto-rotate speed to be independent of the frame rate (the refresh
		* rate of the display), you must pass the time `deltaTime`, in seconds, to `update()`.
		*
		* @type {boolean}
		* @default false
		*/
		this.autoRotate = false;
		/**
		* How fast to rotate around the target if `autoRotate` is `true`. The default  equates to 30 seconds
		* per orbit at 60fps.
		*
		* Note that if `autoRotate` is enabled, you must call `update()` in your animation loop.
		*
		* @type {number}
		* @default 2
		*/
		this.autoRotateSpeed = 2;
		/**
		* This object contains references to the keycodes for controlling camera panning.
		*
		* ```js
		* controls.keys = {
		* 	LEFT: 'ArrowLeft', //left arrow
		* 	UP: 'ArrowUp', // up arrow
		* 	RIGHT: 'ArrowRight', // right arrow
		* 	BOTTOM: 'ArrowDown' // down arrow
		* }
		* ```
		* @type {Object}
		*/
		this.keys = {
			LEFT: "ArrowLeft",
			UP: "ArrowUp",
			RIGHT: "ArrowRight",
			BOTTOM: "ArrowDown"
		};
		/**
		* This object contains references to the mouse actions used by the controls.
		*
		* ```js
		* controls.mouseButtons = {
		* 	LEFT: THREE.MOUSE.ROTATE,
		* 	MIDDLE: THREE.MOUSE.DOLLY,
		* 	RIGHT: THREE.MOUSE.PAN
		* }
		* ```
		* @type {Object}
		*/
		this.mouseButtons = {
			LEFT: MOUSE.ROTATE,
			MIDDLE: MOUSE.DOLLY,
			RIGHT: MOUSE.PAN
		};
		/**
		* This object contains references to the touch actions used by the controls.
		*
		* ```js
		* controls.mouseButtons = {
		* 	ONE: THREE.TOUCH.ROTATE,
		* 	TWO: THREE.TOUCH.DOLLY_PAN
		* }
		* ```
		* @type {Object}
		*/
		this.touches = {
			ONE: TOUCH.ROTATE,
			TWO: TOUCH.DOLLY_PAN
		};
		/**
		* Used internally by `saveState()` and `reset()`.
		*
		* @type {Vector3}
		*/
		this.target0 = this.target.clone();
		/**
		* Used internally by `saveState()` and `reset()`.
		*
		* @type {Vector3}
		*/
		this.position0 = this.object.position.clone();
		/**
		* Used internally by `saveState()` and `reset()`.
		*
		* @type {number}
		*/
		this.zoom0 = this.object.zoom;
		this._cursorStyle = "auto";
		this._domElementKeyEvents = null;
		this._lastPosition = new Vector3();
		this._lastQuaternion = new Quaternion();
		this._lastTargetPosition = new Vector3();
		this._quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0));
		this._quatInverse = this._quat.clone().invert();
		this._spherical = new Spherical();
		this._sphericalDelta = new Spherical();
		this._scale = 1;
		this._panOffset = new Vector3();
		this._rotateStart = new Vector2();
		this._rotateEnd = new Vector2();
		this._rotateDelta = new Vector2();
		this._panStart = new Vector2();
		this._panEnd = new Vector2();
		this._panDelta = new Vector2();
		this._dollyStart = new Vector2();
		this._dollyEnd = new Vector2();
		this._dollyDelta = new Vector2();
		this._dollyDirection = new Vector3();
		this._mouse = new Vector2();
		this._performCursorZoom = false;
		this._pointers = [];
		this._pointerPositions = {};
		this._controlActive = false;
		this._onPointerMove = onPointerMove.bind(this);
		this._onPointerDown = onPointerDown.bind(this);
		this._onPointerUp = onPointerUp.bind(this);
		this._onContextMenu = onContextMenu.bind(this);
		this._onMouseWheel = onMouseWheel.bind(this);
		this._onKeyDown = onKeyDown.bind(this);
		this._onTouchStart = onTouchStart.bind(this);
		this._onTouchMove = onTouchMove.bind(this);
		this._onMouseDown = onMouseDown.bind(this);
		this._onMouseMove = onMouseMove.bind(this);
		this._interceptControlDown = interceptControlDown.bind(this);
		this._interceptControlUp = interceptControlUp.bind(this);
		if (this.domElement !== null) this.connect(this.domElement);
		this.update();
	}
	/**
	* Defines the visual representation of the cursor.
	*
	* @type {('auto'|'grab')}
	* @default 'auto'
	*/
	set cursorStyle(type) {
		this._cursorStyle = type;
		if (type === "grab") this.domElement.style.cursor = "grab";
		else this.domElement.style.cursor = "auto";
	}
	get cursorStyle() {
		return this._cursorStyle;
	}
	connect(element) {
		super.connect(element);
		this.domElement.addEventListener("pointerdown", this._onPointerDown);
		this.domElement.addEventListener("pointercancel", this._onPointerUp);
		this.domElement.addEventListener("contextmenu", this._onContextMenu);
		this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: false });
		this.domElement.getRootNode().addEventListener("keydown", this._interceptControlDown, {
			passive: true,
			capture: true
		});
		this.domElement.style.touchAction = "none";
	}
	disconnect() {
		this.domElement.removeEventListener("pointerdown", this._onPointerDown);
		this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove);
		this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp);
		this.domElement.removeEventListener("pointercancel", this._onPointerUp);
		this.domElement.removeEventListener("wheel", this._onMouseWheel);
		this.domElement.removeEventListener("contextmenu", this._onContextMenu);
		this.stopListenToKeyEvents();
		this.domElement.getRootNode().removeEventListener("keydown", this._interceptControlDown, { capture: true });
		this.domElement.style.touchAction = "";
	}
	dispose() {
		this.disconnect();
	}
	/**
	* Get the current vertical rotation, in radians.
	*
	* @return {number} The current vertical rotation, in radians.
	*/
	getPolarAngle() {
		return this._spherical.phi;
	}
	/**
	* Get the current horizontal rotation, in radians.
	*
	* @return {number} The current horizontal rotation, in radians.
	*/
	getAzimuthalAngle() {
		return this._spherical.theta;
	}
	/**
	* Returns the distance from the camera to the target.
	*
	* @return {number} The distance from the camera to the target.
	*/
	getDistance() {
		return this.object.position.distanceTo(this.target);
	}
	/**
	* Adds key event listeners to the given DOM element.
	* `window` is a recommended argument for using this method.
	*
	* @param {HTMLElement} domElement - The DOM element
	*/
	listenToKeyEvents(domElement) {
		domElement.addEventListener("keydown", this._onKeyDown);
		this._domElementKeyEvents = domElement;
	}
	/**
	* Removes the key event listener previously defined with `listenToKeyEvents()`.
	*/
	stopListenToKeyEvents() {
		if (this._domElementKeyEvents !== null) {
			this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown);
			this._domElementKeyEvents = null;
		}
	}
	/**
	* Save the current state of the controls. This can later be recovered with `reset()`.
	*/
	saveState() {
		this.target0.copy(this.target);
		this.position0.copy(this.object.position);
		this.zoom0 = this.object.zoom;
	}
	/**
	* Reset the controls to their state from either the last time the `saveState()`
	* was called, or the initial state.
	*/
	reset() {
		this.target.copy(this.target0);
		this.object.position.copy(this.position0);
		this.object.zoom = this.zoom0;
		this.object.updateProjectionMatrix();
		this.dispatchEvent(_changeEvent);
		this.update();
		this.state = _STATE.NONE;
	}
	/**
	* Programmatically pan the camera.
	*
	* @param {number} deltaX - The horizontal pan amount in pixels.
	* @param {number} deltaY - The vertical pan amount in pixels.
	*/
	pan(deltaX, deltaY) {
		this._pan(deltaX, deltaY);
		this.update();
	}
	/**
	* Programmatically dolly in (zoom in for perspective camera).
	*
	* @param {number} dollyScale - The dolly scale factor.
	*/
	dollyIn(dollyScale) {
		this._dollyIn(dollyScale);
		this.update();
	}
	/**
	* Programmatically dolly out (zoom out for perspective camera).
	*
	* @param {number} dollyScale - The dolly scale factor.
	*/
	dollyOut(dollyScale) {
		this._dollyOut(dollyScale);
		this.update();
	}
	/**
	* Programmatically rotate the camera left (around the vertical axis).
	*
	* @param {number} angle - The rotation angle in radians.
	*/
	rotateLeft(angle) {
		this._rotateLeft(angle);
		this.update();
	}
	/**
	* Programmatically rotate the camera up (around the horizontal axis).
	*
	* @param {number} angle - The rotation angle in radians.
	*/
	rotateUp(angle) {
		this._rotateUp(angle);
		this.update();
	}
	update(deltaTime = null) {
		const position = this.object.position;
		_v.copy(position).sub(this.target);
		_v.applyQuaternion(this._quat);
		this._spherical.setFromVector3(_v);
		if (this.autoRotate && this.state === _STATE.NONE) this._rotateLeft(this._getAutoRotationAngle(deltaTime));
		if (this.enableDamping) {
			this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor;
			this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor;
		} else {
			this._spherical.theta += this._sphericalDelta.theta;
			this._spherical.phi += this._sphericalDelta.phi;
		}
		let min = this.minAzimuthAngle;
		let max = this.maxAzimuthAngle;
		if (isFinite(min) && isFinite(max)) {
			if (min < -Math.PI) min += _twoPI;
			else if (min > Math.PI) min -= _twoPI;
			if (max < -Math.PI) max += _twoPI;
			else if (max > Math.PI) max -= _twoPI;
			if (min <= max) this._spherical.theta = Math.max(min, Math.min(max, this._spherical.theta));
			else this._spherical.theta = this._spherical.theta > (min + max) / 2 ? Math.max(min, this._spherical.theta) : Math.min(max, this._spherical.theta);
		}
		this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi));
		this._spherical.makeSafe();
		if (this.enableDamping === true) this.target.addScaledVector(this._panOffset, this.dampingFactor);
		else this.target.add(this._panOffset);
		this.target.sub(this.cursor);
		this.target.clampLength(this.minTargetRadius, this.maxTargetRadius);
		this.target.add(this.cursor);
		let zoomChanged = false;
		if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera) this._spherical.radius = this._clampDistance(this._spherical.radius);
		else {
			const prevRadius = this._spherical.radius;
			this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale);
			zoomChanged = prevRadius != this._spherical.radius;
		}
		_v.setFromSpherical(this._spherical);
		_v.applyQuaternion(this._quatInverse);
		position.copy(this.target).add(_v);
		this.object.lookAt(this.target);
		if (this.enableDamping === true) {
			this._sphericalDelta.theta *= 1 - this.dampingFactor;
			this._sphericalDelta.phi *= 1 - this.dampingFactor;
			this._panOffset.multiplyScalar(1 - this.dampingFactor);
		} else {
			this._sphericalDelta.set(0, 0, 0);
			this._panOffset.set(0, 0, 0);
		}
		if (this.zoomToCursor && this._performCursorZoom) {
			let newRadius = null;
			if (this.object.isPerspectiveCamera) {
				const prevRadius = _v.length();
				newRadius = this._clampDistance(prevRadius * this._scale);
				const radiusDelta = prevRadius - newRadius;
				this.object.position.addScaledVector(this._dollyDirection, radiusDelta);
				this.object.updateMatrixWorld();
				zoomChanged = !!radiusDelta;
			} else if (this.object.isOrthographicCamera) {
				const mouseBefore = new Vector3(this._mouse.x, this._mouse.y, 0);
				mouseBefore.unproject(this.object);
				const prevZoom = this.object.zoom;
				this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale));
				this.object.updateProjectionMatrix();
				zoomChanged = prevZoom !== this.object.zoom;
				const mouseAfter = new Vector3(this._mouse.x, this._mouse.y, 0);
				mouseAfter.unproject(this.object);
				this.object.position.sub(mouseAfter).add(mouseBefore);
				this.object.updateMatrixWorld();
				newRadius = _v.length();
			} else {
				console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.");
				this.zoomToCursor = false;
			}
			if (newRadius !== null) if (this.screenSpacePanning) this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(newRadius).add(this.object.position);
			else {
				_ray.origin.copy(this.object.position);
				_ray.direction.set(0, 0, -1).transformDirection(this.object.matrix);
				if (Math.abs(this.object.up.dot(_ray.direction)) < _TILT_LIMIT) this.object.lookAt(this.target);
				else {
					_plane.setFromNormalAndCoplanarPoint(this.object.up, this.target);
					_ray.intersectPlane(_plane, this.target);
				}
			}
		} else if (this.object.isOrthographicCamera) {
			const prevZoom = this.object.zoom;
			this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale));
			if (prevZoom !== this.object.zoom) {
				this.object.updateProjectionMatrix();
				zoomChanged = true;
			}
		}
		this._scale = 1;
		this._performCursorZoom = false;
		if (zoomChanged || this._lastPosition.distanceToSquared(this.object.position) > _EPS || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > _EPS || this._lastTargetPosition.distanceToSquared(this.target) > _EPS) {
			this.dispatchEvent(_changeEvent);
			this._lastPosition.copy(this.object.position);
			this._lastQuaternion.copy(this.object.quaternion);
			this._lastTargetPosition.copy(this.target);
			return true;
		}
		return false;
	}
	_getAutoRotationAngle(deltaTime) {
		if (deltaTime !== null) return _twoPI / 60 * this.autoRotateSpeed * deltaTime;
		else return _twoPI / 60 / 60 * this.autoRotateSpeed;
	}
	_getZoomScale(delta) {
		const normalizedDelta = Math.abs(delta * .01);
		return Math.pow(.95, this.zoomSpeed * normalizedDelta);
	}
	_rotateLeft(angle) {
		this._sphericalDelta.theta -= angle;
	}
	_rotateUp(angle) {
		this._sphericalDelta.phi -= angle;
	}
	_panLeft(distance, objectMatrix) {
		_v.setFromMatrixColumn(objectMatrix, 0);
		_v.multiplyScalar(-distance);
		this._panOffset.add(_v);
	}
	_panUp(distance, objectMatrix) {
		if (this.screenSpacePanning === true) _v.setFromMatrixColumn(objectMatrix, 1);
		else {
			_v.setFromMatrixColumn(objectMatrix, 0);
			_v.crossVectors(this.object.up, _v);
		}
		_v.multiplyScalar(distance);
		this._panOffset.add(_v);
	}
	_pan(deltaX, deltaY) {
		const element = this.domElement;
		if (this.object.isPerspectiveCamera) {
			const position = this.object.position;
			_v.copy(position).sub(this.target);
			let targetDistance = _v.length();
			targetDistance *= Math.tan(this.object.fov / 2 * Math.PI / 180);
			this._panLeft(2 * deltaX * targetDistance / element.clientHeight, this.object.matrix);
			this._panUp(2 * deltaY * targetDistance / element.clientHeight, this.object.matrix);
		} else if (this.object.isOrthographicCamera) {
			this._panLeft(deltaX * (this.object.right - this.object.left) / this.object.zoom / element.clientWidth, this.object.matrix);
			this._panUp(deltaY * (this.object.top - this.object.bottom) / this.object.zoom / element.clientHeight, this.object.matrix);
		} else {
			console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.");
			this.enablePan = false;
		}
	}
	_dollyOut(dollyScale) {
		if (this.object.isPerspectiveCamera || this.object.isOrthographicCamera) this._scale /= dollyScale;
		else {
			console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
			this.enableZoom = false;
		}
	}
	_dollyIn(dollyScale) {
		if (this.object.isPerspectiveCamera || this.object.isOrthographicCamera) this._scale *= dollyScale;
		else {
			console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
			this.enableZoom = false;
		}
	}
	_updateZoomParameters(x, y) {
		if (!this.zoomToCursor) return;
		this._performCursorZoom = true;
		const rect = this.domElement.getBoundingClientRect();
		const dx = x - rect.left;
		const dy = y - rect.top;
		const w = rect.width;
		const h = rect.height;
		this._mouse.x = dx / w * 2 - 1;
		this._mouse.y = -(dy / h) * 2 + 1;
		this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
	}
	_clampDistance(dist) {
		return Math.max(this.minDistance, Math.min(this.maxDistance, dist));
	}
	_handleMouseDownRotate(event) {
		this._rotateStart.set(event.clientX, event.clientY);
	}
	_handleMouseDownDolly(event) {
		this._updateZoomParameters(event.clientX, event.clientX);
		this._dollyStart.set(event.clientX, event.clientY);
	}
	_handleMouseDownPan(event) {
		this._panStart.set(event.clientX, event.clientY);
	}
	_handleMouseMoveRotate(event) {
		this._rotateEnd.set(event.clientX, event.clientY);
		this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
		const element = this.domElement;
		this._rotateLeft(_twoPI * this._rotateDelta.x / element.clientHeight);
		this._rotateUp(_twoPI * this._rotateDelta.y / element.clientHeight);
		this._rotateStart.copy(this._rotateEnd);
		this.update();
	}
	_handleMouseMoveDolly(event) {
		this._dollyEnd.set(event.clientX, event.clientY);
		this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart);
		if (this._dollyDelta.y > 0) this._dollyOut(this._getZoomScale(this._dollyDelta.y));
		else if (this._dollyDelta.y < 0) this._dollyIn(this._getZoomScale(this._dollyDelta.y));
		this._dollyStart.copy(this._dollyEnd);
		this.update();
	}
	_handleMouseMovePan(event) {
		this._panEnd.set(event.clientX, event.clientY);
		this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed);
		this._pan(this._panDelta.x, this._panDelta.y);
		this._panStart.copy(this._panEnd);
		this.update();
	}
	_handleMouseWheel(event) {
		this._updateZoomParameters(event.clientX, event.clientY);
		if (event.deltaY < 0) this._dollyIn(this._getZoomScale(event.deltaY));
		else if (event.deltaY > 0) this._dollyOut(this._getZoomScale(event.deltaY));
		this.update();
	}
	_handleKeyDown(event) {
		let needsUpdate = false;
		switch (event.code) {
			case this.keys.UP:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) this._rotateUp(_twoPI * this.keyRotateSpeed / this.domElement.clientHeight);
				} else if (this.enablePan) this._pan(0, this.keyPanSpeed);
				needsUpdate = true;
				break;
			case this.keys.BOTTOM:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) this._rotateUp(-_twoPI * this.keyRotateSpeed / this.domElement.clientHeight);
				} else if (this.enablePan) this._pan(0, -this.keyPanSpeed);
				needsUpdate = true;
				break;
			case this.keys.LEFT:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) this._rotateLeft(_twoPI * this.keyRotateSpeed / this.domElement.clientHeight);
				} else if (this.enablePan) this._pan(this.keyPanSpeed, 0);
				needsUpdate = true;
				break;
			case this.keys.RIGHT:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) this._rotateLeft(-_twoPI * this.keyRotateSpeed / this.domElement.clientHeight);
				} else if (this.enablePan) this._pan(-this.keyPanSpeed, 0);
				needsUpdate = true;
		}
		if (needsUpdate) {
			event.preventDefault();
			this.update();
		}
	}
	_handleTouchStartRotate(event) {
		if (this._pointers.length === 1) this._rotateStart.set(event.pageX, event.pageY);
		else {
			const position = this._getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this._rotateStart.set(x, y);
		}
	}
	_handleTouchStartPan(event) {
		if (this._pointers.length === 1) this._panStart.set(event.pageX, event.pageY);
		else {
			const position = this._getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this._panStart.set(x, y);
		}
	}
	_handleTouchStartDolly(event) {
		const position = this._getSecondPointerPosition(event);
		const dx = event.pageX - position.x;
		const dy = event.pageY - position.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		this._dollyStart.set(0, distance);
	}
	_handleTouchStartDollyPan(event) {
		if (this.enableZoom) this._handleTouchStartDolly(event);
		if (this.enablePan) this._handleTouchStartPan(event);
	}
	_handleTouchStartDollyRotate(event) {
		if (this.enableZoom) this._handleTouchStartDolly(event);
		if (this.enableRotate) this._handleTouchStartRotate(event);
	}
	_handleTouchMoveRotate(event) {
		if (this._pointers.length == 1) this._rotateEnd.set(event.pageX, event.pageY);
		else {
			const position = this._getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this._rotateEnd.set(x, y);
		}
		this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
		const element = this.domElement;
		this._rotateLeft(_twoPI * this._rotateDelta.x / element.clientHeight);
		this._rotateUp(_twoPI * this._rotateDelta.y / element.clientHeight);
		this._rotateStart.copy(this._rotateEnd);
	}
	_handleTouchMovePan(event) {
		if (this._pointers.length === 1) this._panEnd.set(event.pageX, event.pageY);
		else {
			const position = this._getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this._panEnd.set(x, y);
		}
		this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed);
		this._pan(this._panDelta.x, this._panDelta.y);
		this._panStart.copy(this._panEnd);
	}
	_handleTouchMoveDolly(event) {
		const position = this._getSecondPointerPosition(event);
		const dx = event.pageX - position.x;
		const dy = event.pageY - position.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		this._dollyEnd.set(0, distance);
		this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed));
		this._dollyOut(this._dollyDelta.y);
		this._dollyStart.copy(this._dollyEnd);
		const centerX = (event.pageX + position.x) * .5;
		const centerY = (event.pageY + position.y) * .5;
		this._updateZoomParameters(centerX, centerY);
	}
	_handleTouchMoveDollyPan(event) {
		if (this.enableZoom) this._handleTouchMoveDolly(event);
		if (this.enablePan) this._handleTouchMovePan(event);
	}
	_handleTouchMoveDollyRotate(event) {
		if (this.enableZoom) this._handleTouchMoveDolly(event);
		if (this.enableRotate) this._handleTouchMoveRotate(event);
	}
	_addPointer(event) {
		this._pointers.push(event.pointerId);
	}
	_removePointer(event) {
		delete this._pointerPositions[event.pointerId];
		for (let i = 0; i < this._pointers.length; i++) if (this._pointers[i] == event.pointerId) {
			this._pointers.splice(i, 1);
			return;
		}
	}
	_isTrackingPointer(event) {
		for (let i = 0; i < this._pointers.length; i++) if (this._pointers[i] == event.pointerId) return true;
		return false;
	}
	_trackPointer(event) {
		let position = this._pointerPositions[event.pointerId];
		if (position === void 0) {
			position = new Vector2();
			this._pointerPositions[event.pointerId] = position;
		}
		position.set(event.pageX, event.pageY);
	}
	_getSecondPointerPosition(event) {
		const pointerId = event.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
		return this._pointerPositions[pointerId];
	}
	_customWheelEvent(event) {
		const mode = event.deltaMode;
		const newEvent = {
			clientX: event.clientX,
			clientY: event.clientY,
			deltaY: event.deltaY
		};
		switch (mode) {
			case 1:
				newEvent.deltaY *= 16;
				break;
			case 2: newEvent.deltaY *= 100;
		}
		if (event.ctrlKey && !this._controlActive) newEvent.deltaY *= 10;
		return newEvent;
	}
};
function onPointerDown(event) {
	if (this.enabled === false) return;
	if (this._pointers.length === 0) {
		this.domElement.setPointerCapture(event.pointerId);
		this.domElement.ownerDocument.addEventListener("pointermove", this._onPointerMove);
		this.domElement.ownerDocument.addEventListener("pointerup", this._onPointerUp);
	}
	if (this._isTrackingPointer(event)) return;
	this._addPointer(event);
	if (event.pointerType === "touch") this._onTouchStart(event);
	else this._onMouseDown(event);
	if (this._cursorStyle === "grab") this.domElement.style.cursor = "grabbing";
}
function onPointerMove(event) {
	if (this.enabled === false) return;
	if (event.pointerType === "touch") this._onTouchMove(event);
	else this._onMouseMove(event);
}
function onPointerUp(event) {
	this._removePointer(event);
	switch (this._pointers.length) {
		case 0:
			this.domElement.releasePointerCapture(event.pointerId);
			this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove);
			this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp);
			this.dispatchEvent(_endEvent);
			this.state = _STATE.NONE;
			if (this._cursorStyle === "grab") this.domElement.style.cursor = "grab";
			break;
		case 1:
			const pointerId = this._pointers[0];
			const position = this._pointerPositions[pointerId];
			this._onTouchStart({
				pointerId,
				pageX: position.x,
				pageY: position.y
			});
	}
}
function onMouseDown(event) {
	let mouseAction;
	switch (event.button) {
		case 0:
			mouseAction = this.mouseButtons.LEFT;
			break;
		case 1:
			mouseAction = this.mouseButtons.MIDDLE;
			break;
		case 2:
			mouseAction = this.mouseButtons.RIGHT;
			break;
		default: mouseAction = -1;
	}
	switch (mouseAction) {
		case MOUSE.DOLLY:
			if (this.enableZoom === false) return;
			this._handleMouseDownDolly(event);
			this.state = _STATE.DOLLY;
			break;
		case MOUSE.ROTATE:
			if (event.ctrlKey || event.metaKey || event.shiftKey) {
				if (this.enablePan === false) return;
				this._handleMouseDownPan(event);
				this.state = _STATE.PAN;
			} else {
				if (this.enableRotate === false) return;
				this._handleMouseDownRotate(event);
				this.state = _STATE.ROTATE;
			}
			break;
		case MOUSE.PAN:
			if (event.ctrlKey || event.metaKey || event.shiftKey) {
				if (this.enableRotate === false) return;
				this._handleMouseDownRotate(event);
				this.state = _STATE.ROTATE;
			} else {
				if (this.enablePan === false) return;
				this._handleMouseDownPan(event);
				this.state = _STATE.PAN;
			}
			break;
		default: this.state = _STATE.NONE;
	}
	if (this.state !== _STATE.NONE) this.dispatchEvent(_startEvent);
}
function onMouseMove(event) {
	switch (this.state) {
		case _STATE.ROTATE:
			if (this.enableRotate === false) return;
			this._handleMouseMoveRotate(event);
			break;
		case _STATE.DOLLY:
			if (this.enableZoom === false) return;
			this._handleMouseMoveDolly(event);
			break;
		case _STATE.PAN:
			if (this.enablePan === false) return;
			this._handleMouseMovePan(event);
	}
}
function onMouseWheel(event) {
	if (this.enabled === false || this.enableZoom === false || this.state !== _STATE.NONE) return;
	event.preventDefault();
	this.dispatchEvent(_startEvent);
	this._handleMouseWheel(this._customWheelEvent(event));
	this.dispatchEvent(_endEvent);
}
function onKeyDown(event) {
	if (this.enabled === false) return;
	this._handleKeyDown(event);
}
function onTouchStart(event) {
	this._trackPointer(event);
	switch (this._pointers.length) {
		case 1:
			switch (this.touches.ONE) {
				case TOUCH.ROTATE:
					if (this.enableRotate === false) return;
					this._handleTouchStartRotate(event);
					this.state = _STATE.TOUCH_ROTATE;
					break;
				case TOUCH.PAN:
					if (this.enablePan === false) return;
					this._handleTouchStartPan(event);
					this.state = _STATE.TOUCH_PAN;
					break;
				default: this.state = _STATE.NONE;
			}
			break;
		case 2:
			switch (this.touches.TWO) {
				case TOUCH.DOLLY_PAN:
					if (this.enableZoom === false && this.enablePan === false) return;
					this._handleTouchStartDollyPan(event);
					this.state = _STATE.TOUCH_DOLLY_PAN;
					break;
				case TOUCH.DOLLY_ROTATE:
					if (this.enableZoom === false && this.enableRotate === false) return;
					this._handleTouchStartDollyRotate(event);
					this.state = _STATE.TOUCH_DOLLY_ROTATE;
					break;
				default: this.state = _STATE.NONE;
			}
			break;
		default: this.state = _STATE.NONE;
	}
	if (this.state !== _STATE.NONE) this.dispatchEvent(_startEvent);
}
function onTouchMove(event) {
	this._trackPointer(event);
	switch (this.state) {
		case _STATE.TOUCH_ROTATE:
			if (this.enableRotate === false) return;
			this._handleTouchMoveRotate(event);
			this.update();
			break;
		case _STATE.TOUCH_PAN:
			if (this.enablePan === false) return;
			this._handleTouchMovePan(event);
			this.update();
			break;
		case _STATE.TOUCH_DOLLY_PAN:
			if (this.enableZoom === false && this.enablePan === false) return;
			this._handleTouchMoveDollyPan(event);
			this.update();
			break;
		case _STATE.TOUCH_DOLLY_ROTATE:
			if (this.enableZoom === false && this.enableRotate === false) return;
			this._handleTouchMoveDollyRotate(event);
			this.update();
			break;
		default: this.state = _STATE.NONE;
	}
}
function onContextMenu(event) {
	if (this.enabled === false) return;
	event.preventDefault();
}
function interceptControlDown(event) {
	if (event.key === "Control") {
		this._controlActive = true;
		this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, {
			passive: true,
			capture: true
		});
	}
}
function interceptControlUp(event) {
	if (event.key === "Control") {
		this._controlActive = false;
		this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, {
			passive: true,
			capture: true
		});
	}
}
//#endregion
//#region src/appliances/performance/LampPerformance.ts
var LAMP_PERFORMANCE_DURATION = 5.2;
var LAMP_BEAM_SOURCE_RADIUS_LOCAL = .565;
var LAMP_BEAM_FAR_TO_NEAR_RATIO = 3.35;
var LAMP_BEAM_DEFAULT_LENGTH_LOCAL = 5.4;
function createLampVolumetricBeam(name = "lamp-volumetric-light-cone") {
	const material = new ShaderMaterial({
		uniforms: { uOpacity: { value: .15 } },
		vertexShader: `
      varying float vAxial;
      void main() {
        vAxial = clamp(position.y + 0.5, 0.0, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
		fragmentShader: `
      varying float vAxial;
      uniform float uOpacity;
      void main() {
        float nearFeather = smoothstep(0.0, 0.08, vAxial);
        float farFeather = 1.0 - smoothstep(0.72, 1.0, vAxial);
        float body = mix(0.92, 0.34, vAxial);
        vec3 warm = mix(vec3(1.0, 0.94, 0.66), vec3(1.0, 0.73, 0.34), vAxial);
        gl_FragColor = vec4(warm, uOpacity * body * nearFeather * farFeather);
      }
    `,
		transparent: true,
		side: 2,
		depthWrite: false,
		blending: 2
	});
	const geometry = new CylinderGeometry(LAMP_BEAM_FAR_TO_NEAR_RATIO, 1, 1, 32, 6, true);
	const beam = new Mesh(geometry, material);
	beam.name = name;
	beam.visible = false;
	beam.renderOrder = 5;
	beam.frustumCulled = false;
	return beam;
}
/**
* One non-looping character timeline. Every directional look explicitly comes
* back through the authored rest pose, so a segment boundary never resets the
* hinge and the final settle cannot replay an earlier snap.
*/
var LAMP_HEAD_KEYFRAMES = [
	{
		time: 0,
		pitch: 0,
		roll: 0,
		phase: "wake"
	},
	{
		time: .34,
		pitch: 0,
		roll: 0,
		phase: "wake"
	},
	{
		time: .7,
		pitch: 0,
		roll: .48,
		phase: "look-left"
	},
	{
		time: .98,
		pitch: 0,
		roll: .48,
		phase: "look-left"
	},
	{
		time: 1.28,
		pitch: 0,
		roll: 0,
		phase: "return-from-left"
	},
	{
		time: 1.48,
		pitch: 0,
		roll: 0,
		phase: "return-from-left"
	},
	{
		time: 1.82,
		pitch: 0,
		roll: -.48,
		phase: "look-right"
	},
	{
		time: 2.1,
		pitch: 0,
		roll: -.48,
		phase: "look-right"
	},
	{
		time: 2.42,
		pitch: 0,
		roll: 0,
		phase: "return-from-right"
	},
	{
		time: 2.64,
		pitch: 0,
		roll: 0,
		phase: "return-from-right"
	},
	{
		time: 3.06,
		pitch: -.5,
		roll: 0,
		phase: "look-up"
	},
	{
		time: 3.52,
		pitch: -.5,
		roll: 0,
		phase: "look-up"
	},
	{
		time: 3.94,
		pitch: -.08,
		roll: 0,
		phase: "settle"
	},
	{
		time: 4.72,
		pitch: -.08,
		roll: 0,
		phase: "settle"
	},
	{
		time: LAMP_PERFORMANCE_DURATION,
		pitch: 0,
		roll: 0,
		phase: "settle"
	}
];
function sampleLampHeadPose(time) {
	const clamped = MathUtils.clamp(time, 0, LAMP_PERFORMANCE_DURATION);
	for (let index = 1; index < LAMP_HEAD_KEYFRAMES.length; index += 1) {
		const previous = LAMP_HEAD_KEYFRAMES[index - 1];
		const next = LAMP_HEAD_KEYFRAMES[index];
		if (clamped > next.time) continue;
		const duration = Math.max(1e-6, next.time - previous.time);
		const raw = MathUtils.clamp((clamped - previous.time) / duration, 0, 1);
		const eased = raw * raw * (3 - 2 * raw);
		return {
			pitch: MathUtils.lerp(previous.pitch, next.pitch, eased),
			roll: MathUtils.lerp(previous.roll, next.roll, eased),
			phase: next.phase,
			segmentProgress: eased
		};
	}
	const final = LAMP_HEAD_KEYFRAMES[LAMP_HEAD_KEYFRAMES.length - 1];
	return {
		pitch: final.pitch,
		roll: final.roll,
		phase: final.phase,
		segmentProgress: 1
	};
}
//#endregion
//#region src/appliances/performance/BlenderPerformance.ts
var BLENDER_ACTIVE_DURATION = 5.2;
function smoothPulse$3(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function phaseAt$17(time, power) {
	if (power <= .01) return "idle";
	if (time < .62) return "startup";
	if (time < 1.72) return "chop";
	if (time < 3.08) return "blend";
	if (time < 4.05) return "lid-bounce";
	return "settle";
}
/**
* Blender-only performance definition. It deliberately does not target any
* stand-mixer node, so changing this choreography cannot alter the mixer.
* ApplianceMechanics restores the captured model baseline before every call.
*/
function applyBlenderPerformance(root, time, power) {
	const p = MathUtils.clamp(power, 0, 1);
	const startup = MathUtils.smoothstep(time, .08, .55);
	const settle = 1 - MathUtils.smoothstep(time, 4.58, BLENDER_ACTIVE_DURATION);
	const run = startup * settle * p;
	const node = (name) => root.getObjectByName(name) ?? null;
	const basePivot = node("blender-motor-base-pivot");
	const jarPivot = node("blender-removable-jar-pivot");
	const jarSeat = node("blender-jar-seat-pivot");
	const lidPivot = node("blender-removable-lid-pivot");
	const wholeFruit = node("blender-whole-fruit-pivot");
	const fruitChunks = node("blender-cut-fruit-chunk-pivot");
	const liquidPivot = node("blender-powered-liquid-vortex-pivot");
	const liquid = node("blender-powered-rising-smoothie-volume");
	const liquidSurface = node("blender-powered-smoothie-concave-surface");
	const liquidSpiral = node("blender-powered-smoothie-vortex-highlight");
	const baseSway = (Math.sin(time * 12.2) * .028 + Math.sin(time * 21.7 + .4) * .01) * run;
	const jarSway = (Math.sin(time * 12.2 - .46) * .081 + Math.sin(time * 19.1 + 1.08) * .027) * run;
	const jarPitch = (Math.sin(time * 9.3 - .85) * .036 + Math.sin(time * 16.8 + .2) * .015) * run;
	const jarRoll = (Math.sin(time * 12.2 - .55) * .071 + Math.sin(time * 24.4 + .7) * .018) * run;
	if (basePivot) {
		basePivot.position.x += baseSway;
		basePivot.rotation.z += baseSway * .28;
	}
	if (jarSeat) {
		jarSeat.position.x += baseSway * .72;
		jarSeat.rotation.z += baseSway * .16;
	}
	if (jarPivot) {
		jarPivot.position.x += jarSway;
		jarPivot.position.y += Math.sin(time * 23.6 + .9) * .008 * run;
		jarPivot.rotation.x += jarPitch;
		jarPivot.rotation.z += jarRoll;
	}
	const dial = node("blender-front-speed-dial-pivot");
	if (dial) dial.rotation.z = -Math.PI * .82 * MathUtils.smoothstep(time, .05, .48) * p;
	const blades = node("blender-four-blade-rotation-pivot");
	if (blades) blades.rotation.y = time * (24 + MathUtils.smoothstep(time, 1.1, 2.3) * 22) * run;
	if (liquidPivot) liquidPivot.rotation.y = -time * (7.5 + MathUtils.smoothstep(time, 1.6, 3.1) * 5.5) * run;
	const chopA = MathUtils.smoothstep(time, .72, 1.42);
	const chopB = MathUtils.smoothstep(time, 1.42, 2.72);
	const wholeFruitScale = p <= .01 ? 1 : MathUtils.lerp(1, .64, chopA) * (1 - chopB);
	if (wholeFruit) {
		wholeFruit.visible = wholeFruitScale > .025;
		wholeFruit.scale.multiplyScalar(Math.max(.001, wholeFruitScale));
		wholeFruit.rotation.y += time * 2.8 * run;
		wholeFruit.rotation.x += Math.sin(time * 7.2) * .08 * run;
	}
	const chunkAppear = MathUtils.smoothstep(time, .92, 1.34);
	const chunkFade = 1 - MathUtils.smoothstep(time, 2.25, 3.08);
	const chunkScale = p <= .01 ? 0 : chunkAppear * chunkFade;
	if (fruitChunks) {
		fruitChunks.visible = chunkScale > .015;
		fruitChunks.scale.multiplyScalar(Math.max(.001, chunkScale));
		fruitChunks.rotation.y += time * 8.6 * run;
		fruitChunks.rotation.z += Math.sin(time * 6.4) * .16 * run;
		fruitChunks.children.forEach((chunk, index) => {
			chunk.rotation.x += time * (1.7 + index * .11) * run;
			chunk.rotation.z += time * (1.1 + index * .08) * run;
		});
	}
	const juiceFill = p <= .01 ? 0 : MathUtils.smoothstep(time, .74, 3.28) * settle;
	if (liquid) {
		liquid.visible = juiceFill > .012;
		liquid.scale.y *= Math.max(.012, juiceFill);
	}
	if (liquidSurface) {
		liquidSurface.visible = juiceFill > .012;
		liquidSurface.position.y *= Math.max(.012, juiceFill);
		liquidSurface.scale.setScalar(MathUtils.lerp(.76, 1, juiceFill));
	}
	if (liquidSpiral) {
		liquidSpiral.visible = juiceFill > .28;
		liquidSpiral.position.y -= 2.15 * (1 - juiceFill);
		liquidSpiral.scale.setScalar(MathUtils.lerp(.7, 1, juiceFill));
		liquidSpiral.rotation.y += time * 3.2 * run;
	}
	const lidPreSway = smoothPulse$3(time, 2.55, 2.84, 3.16) * p;
	const firstBounce = smoothPulse$3(time, 3.08, 3.4, 3.64) * p;
	const secondBounce = smoothPulse$3(time, 3.54, 3.76, 4.03) * p;
	const lidLift = firstBounce * .48 + secondBounce * .29;
	if (lidPivot) {
		lidPivot.position.y += lidLift;
		lidPivot.position.x += Math.sin(time * 18.5) * .09 * lidPreSway;
		lidPivot.rotation.z += Math.sin(time * 17.2 + .45) * .11 * lidPreSway + firstBounce * .1 - secondBounce * .065;
		lidPivot.rotation.x += -firstBounce * .12 + secondBounce * .07;
	}
	let lidBounceCount = 0;
	if (time >= 3.08) lidBounceCount = 1;
	if (time >= 3.54) lidBounceCount = 2;
	root.userData.blenderPerformanceDiagnostics = {
		timelineTime: time,
		phase: phaseAt$17(time, p),
		baseSway,
		jarSway,
		jarToBaseAmplitudeRatio: Math.abs(baseSway) > 1e-5 ? Math.abs(jarSway / baseSway) : 3.8,
		wholeFruitScale,
		chunkScale,
		juiceFill,
		lidLift,
		lidBounceCount,
		splashSocket: "blender-splash-mouth-socket",
		forbiddenLegacyEffects: [
			"PlaneGeometry",
			"Line",
			"Sprite"
		]
	};
}
//#endregion
//#region src/appliances/performance/RefrigeratorPerformance.ts
var CABINET_HALF_X = 1.42;
var SIDE_ROUTE_X = 1.92;
var FRONT_ROUTE_Z = 2.62;
function smoothRange(time, start, end) {
	return MathUtils.smoothstep(time, start, end);
}
function phaseAt$16(time, power) {
	if (power <= .01 || time < .12) return "idle";
	if (time < .88) return "open";
	if (time < 4.7) return "hold";
	return "close";
}
function currentHome(root, meta, target) {
	if (!meta.doorPivotName || !meta.doorLocalHome) return target.fromArray(meta.homePosition);
	const door = root.getObjectByName(meta.doorPivotName);
	if (!door) return target.fromArray(meta.homePosition);
	target.fromArray(meta.doorLocalHome);
	door.localToWorld(target);
	root.worldToLocal(target);
	return target;
}
function partyWaypoints(meta, home) {
	const side = meta.routeSide;
	const band = meta.launchIndex % 3;
	const partyY = MathUtils.clamp(home.y + .35 + band * .22, 1.05, 4.75);
	const [gatherX, gatherY] = [
		[-1.55, 4.35],
		[-.55, 4.82],
		[.64, 4.3],
		[-1.62, 2.86],
		[-.5, 3.28],
		[.78, 2.78],
		[1.55, 1.48]
	][meta.launchIndex] ?? [0, 2.5];
	return [
		new Vector3(home.x * .65, partyY, FRONT_ROUTE_Z),
		new Vector3(side * SIDE_ROUTE_X, partyY + .32, FRONT_ROUTE_Z),
		new Vector3(side * SIDE_ROUTE_X, partyY + .5, 2.8000000000000003),
		new Vector3(side * .48, partyY + .26, 2.92),
		new Vector3(side * SIDE_ROUTE_X, partyY + .12, 2.74),
		new Vector3(side * SIDE_ROUTE_X, partyY + .42, FRONT_ROUTE_Z),
		new Vector3(gatherX, gatherY, 2.92 + meta.launchIndex % 2 * .14)
	];
}
function samplePolyline(target, points, progress) {
	if (points.length === 0) return;
	if (points.length === 1) {
		target.copy(points[0]);
		return;
	}
	const scaled = MathUtils.clamp(progress, 0, 1) * (points.length - 1);
	const index = Math.min(points.length - 2, Math.floor(scaled));
	target.copy(points[index]).lerp(points[index + 1], scaled - index);
}
function danceOffset(target, time, index) {
	const phase = index * 1.73;
	target.set(Math.sin(time * 7.2 + phase) * .11, Math.sin(time * 9.1 + phase * .7) * .08, Math.cos(time * 6.4 + phase) * .06);
	return target;
}
/**
* Refrigerator-only choreography. Food stays inside the cabinet; the skill's
* cold front is presented by the screen, snow and cable frost systems instead
* of unrelated models flying through the puzzle.
*/
function applyRefrigeratorPerformance(root, time, power) {
	const p = MathUtils.clamp(power, 0, 1);
	const opening = smoothRange(time, .14, .76);
	const closing = 1 - smoothRange(time, 4.72, 5.16);
	const doorOpen = p > .01 ? opening * closing : 0;
	const upperDoor = root.getObjectByName("refrigerator-upper-door-pivot");
	const lowerDoor = root.getObjectByName("refrigerator-lower-door-pivot");
	const upperDoorAngle = 2.62 * doorOpen;
	const lowerDoorAngle = 2.46 * doorOpen;
	if (upperDoor) upperDoor.rotation.y = upperDoorAngle;
	if (lowerDoor) lowerDoor.rotation.y = lowerDoorAngle;
	const interiorVisible = doorOpen > .08;
	const upperInterior = root.getObjectByName("refrigerator-upper-interior-content");
	const lowerInterior = root.getObjectByName("refrigerator-lower-interior-content");
	if (upperInterior) upperInterior.visible = interiorVisible;
	if (lowerInterior) lowerInterior.visible = interiorVisible;
	root.updateMatrixWorld(true);
	const foodRoot = root.getObjectByName("refrigerator-food-performance-root");
	const foodVisible = interiorVisible;
	if (foodRoot) foodRoot.visible = foodVisible;
	const props = (foodRoot?.children ?? []).filter((object) => object.userData.refrigeratorProp);
	const diagnostics = [];
	const home = new Vector3();
	const position = new Vector3();
	let launchedProps = 0;
	let gatheredProps = 0;
	let returnedProps = 0;
	props.forEach((prop, index) => {
		const meta = prop.userData.refrigeratorProp;
		currentHome(root, meta, home);
		const waypoints = partyWaypoints(meta, home);
		const fullPath = [home, ...waypoints];
		position.copy(home);
		const launch = MathUtils.smoothstep(time, .98, 1.55);
		const gather = MathUtils.smoothstep(time, 1.55, 2.05);
		const returnProgress = MathUtils.smoothstep(time, 2.62, 3.08);
		let propPhase = "home";
		if (interiorVisible && time >= .98 && time < 1.55) {
			samplePolyline(position, fullPath, launch * .65);
			propPhase = "launch";
			launchedProps += 1;
		} else if (interiorVisible && time >= 1.55 && time < 2.62) {
			samplePolyline(position, fullPath, MathUtils.lerp(.65, 1, gather));
			const offset = new Vector3();
			danceOffset(offset, time, index).multiplyScalar(MathUtils.smoothstep(time, 1.55, 1.68));
			position.add(offset);
			propPhase = "dance";
			gatheredProps += 1;
		} else if (interiorVisible && time >= 2.62 && time < 3.08) {
			const danced = new Vector3();
			samplePolyline(danced, waypoints, 1);
			const offset = new Vector3();
			danceOffset(offset, time, index);
			danced.add(offset);
			position.copy(danced).lerp(home, returnProgress);
			propPhase = "return";
			returnedProps += 1;
		}
		prop.position.copy(position);
		prop.rotation.set(propPhase === "home" ? 0 : Math.sin(time * 5.8 + index) * .16, propPhase === "home" ? 0 : Math.cos(time * 4.9 + index * .7) * .2, propPhase === "home" ? 0 : Math.sin(time * 7.1 + index * .4) * .18);
		prop.scale.setScalar(propPhase === "home" ? 1 : 1 + Math.sin(time * 8 + index) * .035);
		diagnostics.push({
			id: meta.id,
			category: meta.category,
			homeZone: meta.homeZone,
			homeSocket: meta.homeSocket,
			phase: propPhase,
			position: [
				position.x,
				position.y,
				position.z
			],
			currentHome: [
				home.x,
				home.y,
				home.z
			],
			distanceFromHome: position.distanceTo(home),
			routeSide: meta.routeSide,
			routeWaypoints: waypoints.map((point) => [
				point.x,
				point.y,
				point.z
			]),
			crossedBehindCabinet: false,
			rearToFrontViaSide: true,
			minimumSideClearance: .5
		});
	});
	const service = root.getObjectByName("refrigerator-compressor-pivot");
	if (service) {
		const serviceRun = opening * closing * p;
		service.position.x += Math.sin(time * 19) * .012 * serviceRun;
		service.position.y += Math.sin(time * 23 + .7) * .008 * serviceRun;
	}
	root.userData.refrigeratorPerformanceDiagnostics = {
		timelineTime: time,
		phase: phaseAt$16(time, p),
		doorOpen,
		upperDoorAngle,
		lowerDoorAngle,
		visibleProps: foodVisible ? props.length : 0,
		launchedProps,
		gatheredProps,
		returnedProps,
		pathClearancePass: diagnostics.every((prop) => prop.minimumSideClearance >= .48 && prop.rearToFrontViaSide),
		cabinetHalfWidth: CABINET_HALF_X,
		sideRouteX: SIDE_ROUTE_X,
		props: diagnostics,
		timelineOwner: "AppliancePerformanceSystem",
		modelOwner: "refrigerator-food-performance-root",
		forbiddenLegacyEffects: [
			"PlaneGeometry",
			"Line",
			"Sprite",
			"flying-food",
			"generic-food-pool",
			"generic-debris-pool"
		]
	};
}
//#endregion
//#region src/appliances/performance/GameControllerPerformance.ts
function pulse$9(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function pressPulse(time, at, duration = .14) {
	return pulse$9(time, at, at + duration * .3, at + duration);
}
function phaseAt$15(time) {
	if (time < .44) return "anticipation";
	if (time < .94) return "heartbeat-start";
	if (time < 2.66) return "frenzy-input";
	if (time < 4.04) return "ultimate-burst";
	if (time < 5.08) return "ready-finale";
	return "settled";
}
function glow$1(node, strength, color) {
	if (!(node instanceof Mesh)) return;
	(Array.isArray(node.material) ? node.material : [node.material]).forEach((material) => {
		const toon = material;
		if (!toon.emissive) return;
		toon.emissive.setHex(strength > .01 ? color : 0);
		toon.emissiveIntensity = strength * 2.1;
	});
}
/**
* One authored five-act timeline shared by game and gallery through
* AppliancePerformanceSystem. The caller restores the captured rig baseline
* before every sample, so this function only adds deterministic offsets.
*/
function applyGameControllerPerformance(root, time, power) {
	const p = MathUtils.clamp(power, 0, 1);
	const node = (name) => root.getObjectByName(name) ?? null;
	const prefixed = (prefix) => {
		const result = [];
		root.traverse((object) => {
			if (object.name.startsWith(prefix) && object.userData.performanceEffect) result.push(object);
		});
		return result;
	};
	const motion = node("game-controller-motion-pivot");
	const sink = MathUtils.smoothstep(time, .02, .2) * (1 - MathUtils.smoothstep(time, .42, .7)) * p;
	const rebound = pulse$9(time, .4, .61, .92) * p;
	const frenzyGate = MathUtils.smoothstep(time, .9, 1.06) * (1 - MathUtils.smoothstep(time, 2.5, 2.68)) * p;
	const ultimateGate = MathUtils.smoothstep(time, 2.58, 2.76) * (1 - MathUtils.smoothstep(time, 3.92, 4.12)) * p;
	const readyFlash = pulse$9(time, 4.01, 4.2, 4.48) * p;
	if (motion) {
		motion.position.y += -.44 * sink + .23 * rebound;
		motion.scale.x *= 1 + sink * .035 - rebound * .025;
		motion.scale.y *= 1 - sink * .11 + rebound * .08;
		motion.scale.z *= 1 + sink * .04;
		motion.position.x += Math.sin(time * 38) * .035 * frenzyGate;
		motion.position.z += Math.sin(time * 31 + .8) * .055 * frenzyGate;
		motion.rotation.x += Math.sin(time * 19) * .075 * frenzyGate;
		motion.rotation.z += Math.sin(time * 27 + .45) * .055 * frenzyGate;
		const jumpProgress = MathUtils.clamp((time - 4.16) / .58, 0, 1);
		const jump = time >= 4.16 && time <= 4.74 ? Math.sin(jumpProgress * Math.PI) * .88 * p : 0;
		const landing = pulse$9(time, 4.67, 4.76, 4.92) * p;
		const aftershake = (pressPulse(time, 4.78, .13) - pressPulse(time, 4.95, .11)) * p;
		motion.position.y += jump - landing * .15;
		motion.scale.set(motion.scale.x * (1 + landing * .07), motion.scale.y * (1 - landing * .13), motion.scale.z * (1 + landing * .045));
		motion.rotation.z += aftershake * .075;
	}
	const heartbeatPress = pulse$9(time, .43, .59, .82) * p;
	glow$1(node("game-controller-round-home-button"), Math.max(heartbeatPress, readyFlash), 16732025);
	glow$1(node("game-controller-rose-status-lens"), Math.max(heartbeatPress * 1.35, readyFlash), 16724319);
	const stickPivots = [node("game-controller-stick-1-pivot"), node("game-controller-stick-2-pivot")];
	stickPivots.forEach((stick) => {
		if (stick) stick.position.z -= heartbeatPress * .19;
	});
	const facePresses = [
		0,
		1,
		2,
		3
	].map((index) => Math.max(pressPulse(time, .98 + index * .13), pressPulse(time, 1.58 + (3 - index) * .115), pressPulse(time, 2.13 + index * .09, .12)) * p);
	facePresses.forEach((press, index) => {
		const button = node(`game-controller-face-button-${index + 1}-pivot`);
		if (button) button.position.z -= press * .13;
		glow$1(node(`game-controller-face-button-${index + 1}`), readyFlash, 16729455);
	});
	const dpad = node("game-controller-dpad-pivot");
	const dpadTimes = [
		1.06,
		1.37,
		1.69,
		2.01,
		2.36
	];
	let dpadIntensity = 0;
	dpadTimes.forEach((at, index) => {
		const press = pressPulse(time, at, .15) * p;
		dpadIntensity = Math.max(dpadIntensity, press);
		if (!dpad) return;
		const angle = index * Math.PI * .5;
		dpad.rotation.x += Math.cos(angle) * press * .19;
		dpad.rotation.y += Math.sin(angle) * press * .19;
		dpad.position.z -= press * .045;
	});
	glow$1(node("game-controller-rounded-cross-dpad"), readyFlash, 16729455);
	const shoulderNames = [
		"game-controller-left-bumper-pivot",
		"game-controller-right-bumper-pivot",
		"game-controller-left-trigger-pivot",
		"game-controller-right-trigger-pivot"
	];
	[
		1.18,
		1.46,
		1.78,
		2.08,
		2.34,
		2.51
	].forEach((at, beatIndex) => {
		const target = node(shoulderNames[beatIndex % shoulderNames.length]);
		const press = pressPulse(time, at, .16) * p;
		if (target) target.rotation.x += press * .31;
	});
	[
		"game-controller-left-pink-bumper",
		"game-controller-right-pink-bumper",
		"game-controller-left-pink-trigger",
		"game-controller-right-pink-trigger",
		"game-controller-stick-1-pink-cap",
		"game-controller-stick-2-pink-cap",
		"game-controller-horizontal-select-button"
	].forEach((name) => glow$1(node(name), readyFlash, 16729455));
	let stickOrbitRadians = 0;
	if (ultimateGate > .001) {
		stickOrbitRadians = MathUtils.clamp((time - 2.62) / 1.12, 0, 1) * Math.PI * 2;
		stickPivots.forEach((stick, index) => {
			if (!stick) return;
			const angle = stickOrbitRadians + index * Math.PI;
			stick.rotation.x += Math.sin(angle) * .55 * ultimateGate;
			stick.rotation.y += Math.cos(angle) * .55 * ultimateGate;
		});
	}
	let visibleStars = 0;
	prefixed("game-controller-ultimate-star-").forEach((effect, index) => {
		const local = ((time - 2.68 - index * .105) % .74 + .74) % .74;
		const life = Math.sin(MathUtils.clamp(local / .62, 0, 1) * Math.PI) * ultimateGate;
		effect.visible = life > .08;
		if (!effect.visible) return;
		visibleStars += 1;
		const side = index % 2 === 0 ? -1 : 1;
		effect.position.x += side * local * .42;
		effect.position.y += local * (.46 + index * .035);
		effect.position.z += local * .22;
		effect.rotation.z += time * (2.4 + index * .22) * side;
		effect.scale.setScalar(.42 + life * .82);
	});
	let visibleElectricBolts = 0;
	prefixed("game-controller-ultimate-electric-bolt-").forEach((effect, index) => {
		const flicker = Math.sin(time * 31 + index * 2.2) > -.28;
		effect.visible = ultimateGate > .16 && flicker;
		if (!effect.visible) return;
		visibleElectricBolts += 1;
		effect.scale.set(.72 + ultimateGate * .38, .78 + ultimateGate * .45, .82);
		effect.rotation.y += Math.sin(time * 12 + index) * .18;
	});
	let visibleImpactBodies = 0;
	prefixed("game-controller-ultimate-impact-shard-").forEach((effect, index) => {
		const angle = Number(effect.userData.burstAngle ?? index / 8 * Math.PI * 2);
		const burst = MathUtils.clamp((time - 2.72 - index % 3 * .08) / .82, 0, 1);
		const life = Math.sin(burst * Math.PI) * ultimateGate;
		effect.visible = life > .06;
		if (!effect.visible) return;
		visibleImpactBodies += 1;
		effect.position.x += Math.cos(angle) * burst * 1.18;
		effect.position.y += Math.sin(angle) * burst * .88 + burst * .24;
		effect.position.z += burst * .52;
		effect.rotation.set(time * (2.1 + index * .17), angle, time * 3.2);
		effect.scale.multiplyScalar(.48 + life * .72);
	});
	let visibleEnergyPoints = 0;
	prefixed("game-controller-ultimate-energy-point-").forEach((effect, index) => {
		const angle = time * 4.4 + index * (Math.PI * 2 / 6);
		effect.visible = ultimateGate > .1;
		if (!effect.visible) return;
		visibleEnergyPoints += 1;
		effect.position.x = Math.cos(angle) * (2.9 + ultimateGate * .32);
		effect.position.y = .18 + Math.sin(angle) * (2.2 + ultimateGate * .28);
		effect.position.z += Math.sin(time * 7 + index) * .22;
		effect.scale.setScalar(.72 + Math.sin(time * 11 + index) * .16);
	});
	const maxFacePress = Math.max(...facePresses);
	root.userData.gameControllerPerformanceDiagnostics = {
		time,
		phase: phaseAt$15(time),
		wholeBodyDrop: sink,
		inputIntensity: Math.max(maxFacePress, dpadIntensity, frenzyGate * .35),
		stickOrbitRadians,
		visibleStars,
		visibleElectricBolts,
		visibleImpactBodies,
		visibleEnergyPoints,
		readyFlash,
		timelineOwner: "AppliancePerformanceSystem",
		effectOwner: "game-controller-model-rig",
		forbiddenPrimitives: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
}
function resetGameControllerPerformance(root) {
	root.userData.gameControllerPerformanceDiagnostics = {
		time: 0,
		phase: "settled",
		wholeBodyDrop: 0,
		inputIntensity: 0,
		stickOrbitRadians: 0,
		visibleStars: 0,
		visibleElectricBolts: 0,
		visibleImpactBodies: 0,
		visibleEnergyPoints: 0,
		readyFlash: 0,
		timelineOwner: "AppliancePerformanceSystem",
		effectOwner: "game-controller-model-rig",
		forbiddenPrimitives: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
}
//#endregion
//#region src/appliances/performance/DehumidifierPerformance.ts
var DEHUMIDIFIER_TIMELINE_OWNER = "AppliancePerformanceSystem";
var UP = new Vector3(0, 1, 0);
var start = new Vector3();
var control = new Vector3();
var target = new Vector3();
var point = new Vector3();
var tangent = new Vector3();
function pulse$8(time, startTime, peakTime, endTime) {
	return MathUtils.smoothstep(time, startTime, peakTime) * (1 - MathUtils.smoothstep(time, peakTime, endTime));
}
function readVector(value, fallback) {
	if (Array.isArray(value) && value.length >= 3) fallback.set(Number(value[0]), Number(value[1]), Number(value[2]));
	else fallback.set(0, 0, 0);
	return fallback;
}
function phaseAt$14(time) {
	if (time < .58) return "startup";
	if (time < 1.42) return "gather";
	if (time < 3.25) return "working";
	if (time < 4.26) return "climax";
	return "satisfied";
}
/**
* One authored dehumidifier skill used by both gameplay and gallery sessions.
* All machine deformation targets the whole-machine pivot. Humidity actors are
* root siblings and follow curved, accelerating 3D trajectories into the crown.
*/
function applyDehumidifierPerformance(root, time, power) {
	const p = MathUtils.clamp(power, 0, 1);
	const whole = root.getObjectByName("dehumidifier-whole-machine-pivot");
	const controlButton = root.getObjectByName("dehumidifier-front-control-button-pivot");
	const controlFace = root.getObjectByName("dehumidifier-front-round-sakura-control");
	const controlGlint = root.getObjectByName("dehumidifier-control-button-glint");
	const water = root.getObjectByName("dehumidifier-visible-collected-water-column");
	const suctionRim = root.getObjectByName("dehumidifier-mint-top-exhaust-rim");
	const startupDip = pulse$8(time, .02, .24, .62) * p;
	const working = MathUtils.smoothstep(time, .48, .86) * (1 - MathUtils.smoothstep(time, 4.2, 4.58)) * p;
	const breathing = Math.sin((time - .52) * 10.8) * .5 + .5;
	const climaxSquash = pulse$8(time, 3.22, 3.56, 3.78) * p;
	const climaxRebound = pulse$8(time, 3.58, 3.82, 4.08) * p;
	const satisfiedGate = MathUtils.smoothstep(time, 4.24, 4.36) * (1 - MathUtils.smoothstep(time, 4.36, 5.18)) * p;
	if (whole) {
		const breathAmount = breathing * working;
		whole.scale.set(1 + breathAmount * .022 + climaxSquash * .06 - climaxRebound * .028, 1 - breathAmount * .032 - climaxSquash * .145 + climaxRebound * .095, 1 + breathAmount * .018 + climaxSquash * .048 - climaxRebound * .022);
		whole.position.x += Math.sin(time * 31) * (.011 + climaxSquash * .022) * working;
		whole.position.y += -startupDip * .065 + Math.sin(time * 37 + .4) * .008 * working + Math.abs(Math.sin((time - 4.24) * 10.6)) * .075 * satisfiedGate;
		whole.rotation.z += Math.sin(time * 28) * .006 * working + Math.sin((time - 4.24) * 9.2) * .035 * satisfiedGate;
	}
	if (controlButton) {
		const pressed = MathUtils.smoothstep(time, .06, .3) * (1 - MathUtils.smoothstep(time, 4.32, 4.78)) * p;
		controlButton.position.z -= pressed * .018;
	}
	if (controlFace) controlFace.visible = true;
	if (controlGlint) controlGlint.visible = true;
	const waterFill = MathUtils.smoothstep(time, .86, 4.34) * p;
	if (water) {
		water.scale.y = .12 + waterFill * .68;
		water.position.y = -.2332 + waterFill * .18;
	}
	if (suctionRim) {
		const materials = Array.isArray(suctionRim.material) ? suctionRim.material : [suctionRim.material];
		const glowStrength = (MathUtils.smoothstep(time, .28, .82) * .72 + climaxSquash * 1.7 + climaxRebound * .75) * p;
		materials.forEach((material) => {
			const toon = material;
			toon.emissive?.setHex(glowStrength > .01 ? 8183295 : 0);
			if (typeof toon.emissiveIntensity === "number") toon.emissiveIntensity = glowStrength;
		});
	}
	const particles = [];
	root.traverse((object) => {
		if (object.name.startsWith("dehumidifier-humidity-particle-pivot-")) particles.push(object);
	});
	const visibleByKind = {
		droplet: 0,
		mist: 0,
		wisp: 0
	};
	const climaxPull = MathUtils.smoothstep(time, 3.26, 4.08);
	particles.forEach((particle, index) => {
		const spawnTime = Number(particle.userData.spawnTime ?? 0);
		const captureTime = Number(particle.userData.captureTime ?? 4.1);
		const kind = String(particle.userData.effectKind ?? "mist");
		const accelerated = MathUtils.clamp((time - spawnTime) / Math.max(.01, captureTime - spawnTime), 0, 1) ** 1.85;
		const progress = MathUtils.clamp(accelerated, 0, 1);
		particle.visible = time >= spawnTime && progress < .992 && p > .01;
		if (!particle.visible) return;
		visibleByKind[kind] += 1;
		readVector(particle.userData.trajectoryStart, start);
		readVector(particle.userData.trajectoryControl, control);
		readVector(particle.userData.trajectoryTarget, target);
		const inverse = 1 - progress;
		point.copy(start).multiplyScalar(inverse * inverse).addScaledVector(control, 2 * inverse * progress).addScaledVector(target, progress * progress);
		particle.position.copy(point);
		tangent.copy(control).sub(start).multiplyScalar(2 * inverse).add(target.clone().sub(control).multiplyScalar(2 * progress));
		if (tangent.lengthSq() > 1e-6) {
			tangent.normalize();
			particle.quaternion.setFromUnitVectors(UP, tangent);
		}
		const appear = MathUtils.smoothstep(time, spawnTime, spawnTime + .16);
		const vanish = 1 - MathUtils.smoothstep(progress, .88, .995);
		const flutter = 1 + Math.sin(time * 5.4 + index * 1.77) * .09;
		if (kind === "droplet") particle.scale.set(appear * vanish * (.96 - progress * .36), appear * vanish * (1 + progress * progress * 1.4), appear * vanish * (.96 - progress * .36));
		else if (kind === "wisp") {
			particle.scale.set(appear * vanish * (.92 - progress * .3), appear * vanish * (1 + progress * 1.35), appear * vanish * (.92 - progress * .3));
			particle.rotation.y += time * (index % 2 === 0 ? 1.8 : -1.8);
		} else {
			particle.scale.setScalar(appear * vanish * flutter * (1 - progress * .24));
			particle.rotation.y += time * (index % 2 === 0 ? 1.2 : -1.2);
			particle.rotation.z += Math.sin(time * 2.6 + index) * .22;
		}
	});
	root.userData.dehumidifierPerformance = {
		timelineOwner: DEHUMIDIFIER_TIMELINE_OWNER,
		phase: phaseAt$14(time),
		time,
		machineMotionRoot: "dehumidifier-whole-machine-pivot",
		fanRotates: false,
		visibleHumidity: visibleByKind,
		visibleHumidityTotal: visibleByKind.droplet + visibleByKind.mist + visibleByKind.wisp,
		climaxPull,
		waterFill
	};
}
function resetDehumidifierPerformance(root) {
	delete root.userData.dehumidifierPerformance;
}
//#endregion
//#region src/appliances/performance/DesktopComputerPerformance.ts
function smoothPulse$2(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function mesh(root, name) {
	const object = root.getObjectByName(name);
	return object instanceof Mesh ? object : null;
}
function setGlow$1(target, strength, color) {
	if (!target) return;
	(Array.isArray(target.material) ? target.material : [target.material]).forEach((material) => {
		const toon = material;
		toon.color?.setHex(strength > .02 ? 16767204 : 8485263);
		toon.emissive?.setHex(strength > .02 ? color : 0);
		if (typeof toon.emissiveIntensity === "number") toon.emissiveIntensity = strength * 2.1;
	});
}
function phaseAt$13(time) {
	if (time < .82) return "boot";
	if (time < 2.15) return "working";
	if (time < 3.55) return "straining";
	if (time < 4.48) return "overload";
	return "settle";
}
function createDesktopComputerPerformance(root) {
	const named = {
		tower: root.getObjectByName("desktop-computer-tower-assembly-pivot") ?? null,
		monitor: root.getObjectByName("desktop-computer-monitor-assembly-pivot") ?? null,
		screenTilt: root.getObjectByName("desktop-computer-screen-tilt-pivot") ?? null,
		mouse: root.getObjectByName("desktop-computer-mouse-assembly-pivot") ?? null,
		mouseButton: root.getObjectByName("desktop-computer-mouse-button-pivot") ?? null,
		mouseWheel: root.getObjectByName("desktop-computer-mouse-wheel-pivot") ?? null,
		powerButton: root.getObjectByName("desktop-computer-power-button-pivot") ?? null,
		screen: root.getObjectByName("desktop-computer-screen-state-pivot") ?? null,
		boot: root.getObjectByName("desktop-computer-boot-logo-pivot") ?? null,
		main: root.getObjectByName("desktop-computer-main-window-pivot") ?? null,
		secondary: root.getObjectByName("desktop-computer-secondary-window-pivot") ?? null,
		cursor: root.getObjectByName("desktop-computer-screen-cursor-pivot") ?? null,
		blue: root.getObjectByName("desktop-computer-classic-blue-screen-pivot") ?? null,
		powerLed: mesh(root, "desktop-computer-power-led"),
		monitorLed: mesh(root, "desktop-computer-monitor-status-dot"),
		keys: [],
		smoke: []
	};
	root.traverse((object) => {
		if (object.name.startsWith("desktop-computer-active-key-") && object.name.endsWith("-pivot")) named.keys.push(object);
		if (object instanceof Mesh && object.name.startsWith("desktop-computer-volumetric-smoke-puff-")) named.smoke.push(object);
	});
	named.smoke.sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true }));
	const applySmoke = (time, power, overload) => {
		let visible = 0;
		named.smoke.forEach((puff, index) => {
			const delay = 2.05 + index * .205;
			const life = 1.55 + index % 3 * .2;
			const local = time - delay;
			const progress = MathUtils.clamp(local / life, 0, 1);
			const alpha = local >= 0 && local < life ? MathUtils.smoothstep(progress, 0, .16) * (1 - MathUtils.smoothstep(progress, .68, 1)) * power : 0;
			puff.visible = alpha > .012;
			if (!puff.visible) return;
			visible += 1;
			const side = index % 2 === 0 ? -1 : 1;
			const rise = .55 + progress * (1.25 + index % 4 * .23) + overload * progress * .32;
			const drift = side * progress * (.2 + index % 3 * .13) + Math.sin(progress * Math.PI * 2.4 + index) * .08;
			puff.position.set(drift, rise, Math.cos(index * 1.7 + progress * 4.2) * .15 * progress);
			puff.rotation.set(progress * (.7 + index % 3 * .21), progress * side * (1.2 + index % 4 * .18), progress * (.45 + index % 2 * .34));
			const growth = .28 + MathUtils.smoothstep(progress, 0, .78) * (1.12 + index % 3 * .13);
			const billow = Math.sin(progress * Math.PI * 3 + index * .8) * .07 * (1 - progress);
			puff.scale.set(growth * (.86 + index % 2 * .16 + billow), growth * (1.02 + index % 3 * .08 - billow * .5), growth * (.78 + (index + 1) % 3 * .11 + billow * .35));
			(Array.isArray(puff.material) ? puff.material : [puff.material]).forEach((material) => {
				material.opacity = alpha * (.58 + index % 3 * .08);
			});
		});
		return visible;
	};
	return {
		apply: (time, power) => {
			const p = MathUtils.clamp(power, 0, 1);
			const startup = MathUtils.smoothstep(time, .03, .42) * p;
			const strain = MathUtils.smoothstep(time, 1.72, 3.42) * (1 - MathUtils.smoothstep(time, 4.35, 5.12)) * p;
			const overload = smoothPulse$2(time, 3.18, 4.04, 4.7) * p;
			const settle = MathUtils.smoothstep(time, 4.42, 4.62) * p;
			const settleDecay = settle * Math.exp(-Math.max(0, time - 4.42) * 5.2);
			const inputEnvelope = MathUtils.smoothstep(time, .78, 1.2) * (1 - MathUtils.smoothstep(time, 4.04, 4.45)) * p;
			const towerShake = strain * (.025 + overload * .075);
			const monitorWobble = strain * .015 + overload * .03 + settleDecay * .045;
			if (named.powerButton) named.powerButton.position.z -= MathUtils.smoothstep(time, .02, .16) * .055 * p;
			setGlow$1(named.powerLed, startup, 16737405);
			setGlow$1(named.monitorLed, startup * (.82 + overload * .18), overload > .35 ? 16743016 : 7530483);
			named.keys.forEach((key, index) => {
				const rhythm = Math.max(0, Math.sin(time * (19 + strain * 15) + index * 1.73)) ** (5 - overload * 2);
				key.position.y -= rhythm * (.055 + overload * .075) * inputEnvelope;
			});
			if (named.mouse) {
				named.mouse.position.x += Math.sin(time * (2.8 + strain * 4.5)) * (.18 + strain * .22) * inputEnvelope;
				named.mouse.position.z += Math.cos(time * (3.4 + strain * 3.1)) * (.15 + strain * .2) * inputEnvelope;
				named.mouse.rotation.y += Math.sin(time * 5.2) * strain * .045;
			}
			if (named.mouseButton) named.mouseButton.rotation.x -= Math.max(0, Math.sin(time * 15.5)) ** 7 * .1 * inputEnvelope;
			if (named.mouseWheel) named.mouseWheel.rotation.x += time * (4 + strain * 8) * inputEnvelope;
			if (named.tower) {
				named.tower.position.x += Math.sin(time * (29 + overload * 15)) * towerShake;
				named.tower.position.z += Math.cos(time * (24 + overload * 12)) * towerShake * .64;
				named.tower.rotation.z += Math.sin(time * 21) * towerShake * .12 + Math.sin((time - 4.42) * 19) * settleDecay * .035;
				named.tower.scale.set(1 + overload * .018, 1 - overload * .026, 1 + overload * .016);
			}
			if (named.monitor) {
				named.monitor.position.y += Math.sin(time * 23) * monitorWobble;
				named.monitor.rotation.z += Math.sin(time * 18.5) * monitorWobble * .45 + Math.sin((time - 4.42) * 17) * settleDecay * .024;
			}
			if (named.screenTilt) named.screenTilt.rotation.x += Math.sin(time * 27) * overload * .014;
			const blueVisible = time >= 3.72 && time < 4.55;
			if (named.screen) named.screen.visible = startup > .01;
			if (named.boot) named.boot.visible = time >= .12 && time < .82;
			if (named.main) {
				named.main.visible = time >= .62 && !blueVisible;
				named.main.scale.setScalar(Math.max(.001, MathUtils.smoothstep(time, .62, 1.05)));
			}
			if (named.secondary) {
				named.secondary.visible = time >= .92 && !blueVisible;
				named.secondary.scale.setScalar(Math.max(.001, MathUtils.smoothstep(time, .92, 1.38)));
			}
			if (named.cursor) named.cursor.visible = time >= 1.15 && time < 3.72;
			if (named.blue) {
				named.blue.visible = blueVisible;
				const hit = MathUtils.smoothstep(time, 3.72, 3.82);
				named.blue.scale.set(1 + (1 - hit) * .08, 1 - (1 - hit) * .08, 1);
			}
			const visibleSmokePuffs = applySmoke(time, p, overload);
			root.userData.desktopComputerPerformanceDiagnostics = {
				timelineTime: time,
				phase: phaseAt$13(time),
				runEnvelope: startup,
				strain,
				overload,
				settle,
				towerShake,
				monitorWobble,
				visibleSmokePuffs,
				smokeGeometry: "irregular-multi-lobed-low-poly-volume",
				smokeSource: "desktop-computer-top-vent-socket",
				fanPropRemoved: true,
				screenContentPreserved: true,
				timelineOwner: "AppliancePerformanceSystem"
			};
		},
		reset: () => {
			delete root.userData.desktopComputerPerformanceDiagnostics;
		}
	};
}
//#endregion
//#region src/appliances/performance/StandMixerPerformance.ts
var SLOW_START = .28;
var ACCEL_START = .62;
var HIGH_SPEED_START = 1.25;
var DECEL_START = 4.1;
var SPIN_END = 4.72;
var ACTIVE_END = 5.2;
var SLOW_SPEED = 5.5;
var HIGH_SPEED = 34;
function wrap(value, period) {
	return (value % period + period) % period;
}
function angularVelocityAt(time) {
	if (time < SLOW_START || time >= SPIN_END) return 0;
	if (time < ACCEL_START) return SLOW_SPEED;
	if (time < HIGH_SPEED_START) {
		const progress = (time - ACCEL_START) / .63;
		return MathUtils.lerp(SLOW_SPEED, HIGH_SPEED, progress);
	}
	if (time < DECEL_START) return HIGH_SPEED;
	const progress = (time - DECEL_START) / .6200000000000001;
	return MathUtils.lerp(HIGH_SPEED, 0, MathUtils.clamp(progress, 0, 1));
}
/** Integral of angularVelocityAt(), keeping the sampled rig deterministic. */
function rotationPhaseAt(time) {
	if (time <= SLOW_START) return 0;
	const slowDuration = .33999999999999997;
	const accelDuration = .63;
	const slowPhase = SLOW_SPEED * slowDuration;
	if (time <= ACCEL_START) return SLOW_SPEED * (time - SLOW_START);
	if (time <= HIGH_SPEED_START) {
		const elapsed = time - ACCEL_START;
		const acceleration = 28.5 / accelDuration;
		return slowPhase + SLOW_SPEED * elapsed + .5 * acceleration * elapsed * elapsed;
	}
	if (time <= DECEL_START) return 14.3125 + HIGH_SPEED * (time - HIGH_SPEED_START);
	if (time <= SPIN_END) {
		const elapsed = time - DECEL_START;
		const deceleration = HIGH_SPEED / .6200000000000001;
		return 111.21249999999999 + HIGH_SPEED * elapsed - .5 * deceleration * elapsed * elapsed;
	}
	return 121.7525;
}
function phaseAt$12(time, power) {
	if (power <= .01) return "idle";
	if (time < SLOW_START) return "dial-start";
	if (time < ACCEL_START) return "slow-whisk";
	if (time < HIGH_SPEED_START) return "acceleration";
	if (time < DECEL_START) return "overspeed";
	if (time < SPIN_END) return "wind-down";
	if (time < ACTIVE_END) return "inertia-settle";
	return "settled";
}
function resetDiagnostics(root) {
	const diagnostics = {
		time: 0,
		phase: "idle",
		dialRotation: 0,
		beaterAngularVelocity: 0,
		planetaryAngularVelocity: 0,
		bowlSwingRadians: 0,
		bowlSwingAmplitude: 0,
		bowlShake: 0,
		bowlHop: 0,
		machineShake: 0,
		vortexStrength: 0,
		peakStrength: 0,
		visiblePullArcs: 0,
		visibleLargeDollops: 0,
		visibleDroplets: 0,
		returnedLiquidBodies: 0,
		run: 0,
		overspeed: 0,
		activeDrops: 0,
		activeSplats: 0,
		shake: 0,
		timelineOwner: "AppliancePerformanceSystem",
		effectOwner: "stand-mixer-model-rig",
		sharedSpectacleEffects: "disabled",
		forbiddenPrimitives: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
	root.userData.standMixerPerformanceDiagnostics = diagnostics;
	root.userData.standMixerAnimation = diagnostics;
}
/**
* Mixer-only authored performance. ApplianceMechanics restores the captured
* baseline before each sample; this module adds deterministic offsets to the
* model-owned action rig used by both the live game and the gallery preview.
*/
function applyStandMixerPerformance(root, time, power) {
	const p = MathUtils.clamp(power, 0, 1);
	const powered = p > .01 ? 1 : 0;
	const node = (name) => root.getObjectByName(name) ?? null;
	const waveRidges = [];
	const pullArcs = [];
	const dollops = [];
	const droplets = [];
	root.traverse((object) => {
		if (object.name.startsWith("stand-mixer-mixture-wave-ridge-")) waveRidges.push(object);
		else if (object.name.startsWith("stand-mixer-liquid-pull-arc-")) pullArcs.push(object);
		else if (object.name.startsWith("stand-mixer-volumetric-cream-dollop-")) dollops.push(object);
		else if (object.name.startsWith("stand-mixer-volumetric-liquid-droplet-")) droplets.push(object);
	});
	const dialRotation = -1.08 * (MathUtils.smoothstep(time, .035, .3) * (1 - MathUtils.smoothstep(time, 4.5, 4.96)) * powered);
	const dial = node("stand-mixer-front-speed-dial-pivot");
	if (dial) dial.rotation.z += dialRotation;
	const beaterAngularVelocity = angularVelocityAt(time) * powered;
	const planetaryAngularVelocity = beaterAngularVelocity * .42;
	const terminalPhase = rotationPhaseAt(SPIN_END);
	const terminalOffset = Math.atan2(Math.sin(terminalPhase), Math.cos(terminalPhase));
	const returnProgress = MathUtils.smootherstep(time, SPIN_END, ACTIVE_END);
	const rotationPhase = (time <= SPIN_END ? rotationPhaseAt(time) : terminalOffset * (1 - returnProgress)) * powered;
	const planetary = node("stand-mixer-planetary-pivot");
	const beater = node("stand-mixer-beater-spin-pivot");
	if (planetary) planetary.rotation.y += rotationPhase * .42;
	if (beater) beater.rotation.y -= rotationPhase;
	const run = MathUtils.smoothstep(time, SLOW_START, .82) * (1 - MathUtils.smoothstep(time, 4.18, SPIN_END)) * powered;
	const overspeed = MathUtils.smoothstep(time, 1.08, 1.65) * (1 - MathUtils.smoothstep(time, 3.98, 4.36)) * powered;
	const inertia = MathUtils.smoothstep(time, 4.08, 4.36) * (1 - MathUtils.smoothstep(time, 4.98, 5.16)) * powered;
	const bowlSwingAmplitude = (.055 + overspeed * .085) * run + inertia * .045;
	const bowlSwingRadians = Math.sin(time * 20.8) * bowlSwingAmplitude + Math.sin(time * 12.1 + .7) * (.018 + overspeed * .02) * run;
	const bowlPitch = Math.sin(time * 17.2 + 1.15) * (.025 + overspeed * .032) * run + Math.sin(time * 8.6) * .026 * inertia;
	const bowlShakeAmplitude = (.025 + overspeed * .052) * run + inertia * .024;
	const bowlShake = Math.sin(time * 32.5 + .4) * bowlShakeAmplitude;
	const bowlHop = Math.abs(Math.sin(time * 27.8 + .6)) * (.014 + overspeed * .035) * run + Math.abs(Math.sin(time * 12.4)) * .018 * inertia;
	const machineShake = ((.018 + overspeed * .034) * run + inertia * .016) * powered;
	root.position.x += Math.sin(time * 20.8 + .12) * machineShake;
	root.position.z += Math.sin(time * 14.6 + 1.1) * machineShake * .38;
	root.rotation.z += Math.sin(time * 20.8 + .38) * machineShake * .52;
	root.rotation.x += Math.sin(time * 14.6 + .72) * machineShake * .24;
	const bowl = node("stand-mixer-bowl-pivot");
	if (bowl) {
		bowl.rotation.z += bowlSwingRadians;
		bowl.rotation.x += bowlPitch;
		bowl.position.x += bowlShake;
		bowl.position.z += Math.sin(time * 29.3) * bowlShakeAmplitude * .42;
		bowl.position.y += bowlHop;
	}
	const base = node("stand-mixer-base-pivot");
	if (base) {
		base.position.x -= Math.sin(time * 20.8) * (.014 + overspeed * .012) * run;
		base.rotation.z -= Math.sin(time * 20.8) * (.008 + overspeed * .008) * run;
	}
	const head = node("stand-mixer-motor-head-pivot");
	if (head) {
		head.rotation.z -= Math.sin(time * 20.8 + .25) * (.012 + overspeed * .012) * run;
		head.rotation.x += Math.sin(time * 14.5) * (.007 + overspeed * .008) * run;
	}
	const mixturePivot = node("stand-mixer-mixture-pivot");
	const mixtureSurface = node("stand-mixer-visible-mixture-surface");
	const vortexStrength = MathUtils.smoothstep(time, .58, 1.52) * (1 - MathUtils.smoothstep(time, 4.28, 5.02)) * powered;
	const liquidInertia = Math.max(vortexStrength, inertia * .78);
	if (mixturePivot) {
		mixturePivot.rotation.y -= rotationPhase * .21;
		mixturePivot.rotation.x += Math.sin(time * 10.8) * .026 * liquidInertia;
		mixturePivot.rotation.z += Math.sin(time * 13.2 + .6) * .032 * liquidInertia;
	}
	if (mixtureSurface) {
		mixtureSurface.scale.x *= 1 + Math.sin(time * 9.6) * .035 * liquidInertia;
		mixtureSurface.scale.z *= 1 - Math.sin(time * 9.6) * .035 * liquidInertia;
		mixtureSurface.scale.y *= 1 + (.16 + overspeed * .17) * liquidInertia + Math.sin(time * 15.4) * .045 * liquidInertia;
	}
	const peakStrength = MathUtils.smoothstep(time, 4.42, 5.04) * powered;
	waveRidges.forEach((ridge, index) => {
		const wave = liquidInertia * (.72 + index * .11);
		ridge.visible = wave > .07 && peakStrength < .94;
		ridge.rotation.y += rotationPhase * (.12 + index * .025) * (index % 2 === 0 ? 1 : -1);
		ridge.position.y += Math.sin(time * (10.5 + index * 1.8) + index) * .035 * wave;
		ridge.scale.set(.88 + wave * .15, .62 + wave * (.58 + index * .08), .88 + wave * .15);
	});
	const peak = node("stand-mixer-whipped-cream-settle-peak");
	if (peak) {
		peak.visible = peakStrength > .025;
		const peakScale = .34 + peakStrength * .9;
		peak.scale.set(peakScale, .18 + peakStrength * 1.12, peakScale);
		peak.position.y -= (1 - peakStrength) * .3;
		peak.rotation.y += rotationPhaseAt(Math.min(time, SPIN_END)) * .08;
		peak.rotation.z += Math.sin(time * 7.6) * .055 * inertia;
	}
	const splashGate = MathUtils.smoothstep(time, 1.18, 1.62) * (1 - MathUtils.smoothstep(time, 4.02, 4.48)) * powered;
	let visiblePullArcs = 0;
	pullArcs.forEach((arc, index) => {
		const progress = wrap(time - 1.26 - index * .105, .82) / .82;
		const life = Math.sin(progress * Math.PI) * splashGate;
		arc.visible = life > .075;
		if (!arc.visible) return;
		visiblePullArcs += 1;
		arc.scale.set(.72 + life * .48, .48 + life * .78, .72 + life * .34);
		arc.rotation.z += Math.sin(time * 8.2 + index) * .12 * life;
		arc.rotation.y += Math.sin(time * 4.1 + index * .7) * .1;
	});
	let visibleLargeDollops = 0;
	let returnedLiquidBodies = 0;
	dollops.forEach((dollop, index) => {
		const cycle = 1.18 + index % 3 * .08;
		const offset = time - 1.34 - index * .12;
		const progress = offset >= 0 ? wrap(offset, cycle) / cycle : 0;
		const life = Math.sin(progress * Math.PI) * splashGate;
		dollop.visible = offset >= 0 && life > .045;
		if (!dollop.visible) return;
		visibleLargeDollops += 1;
		const angle = Number(dollop.userData.launchAngle ?? index / dollops.length * Math.PI * 2);
		const startRadius = .42 + index % 2 * .08;
		const landingRadius = index % 3 === 0 ? 1.78 : index % 3 === 1 ? 1.34 : .82;
		const radius = MathUtils.lerp(startRadius, landingRadius, progress) + Math.sin(progress * Math.PI) * (.42 + index % 3 * .1);
		const landingY = index % 3 === 0 ? -1.68 : index % 3 === 1 ? -.2 : .02;
		dollop.position.set(Math.cos(angle) * radius, MathUtils.lerp(.02, landingY, progress) + Math.sin(progress * Math.PI) * (.66 + index % 4 * .11), Math.sin(angle) * radius);
		dollop.rotation.set(time * (2.2 + index * .12), angle, time * (1.5 + index * .08));
		dollop.scale.multiplyScalar(.72 + life * .68);
		if (progress > .68) returnedLiquidBodies += 1;
	});
	let visibleDroplets = 0;
	droplets.forEach((drop, index) => {
		const cycle = .72 + index % 4 * .055;
		const offset = time - 1.18 - index * .055;
		const progress = offset >= 0 ? wrap(offset, cycle) / cycle : 0;
		const life = Math.sin(progress * Math.PI) * splashGate;
		drop.visible = offset >= 0 && life > .035;
		if (!drop.visible) return;
		visibleDroplets += 1;
		const angle = Number(drop.userData.launchAngle ?? index / droplets.length * Math.PI * 2);
		const landingRadius = index % 4 === 0 ? 1.96 : .72 + index % 3 * .34;
		const radius = MathUtils.lerp(.48, landingRadius, progress) + Math.sin(progress * Math.PI) * (.24 + index % 5 * .055);
		const landingY = index % 4 === 0 ? -1.78 : -.24;
		drop.position.set(Math.cos(angle) * radius, MathUtils.lerp(.03, landingY, progress) + Math.sin(progress * Math.PI) * (.52 + index % 4 * .12), Math.sin(angle) * radius);
		drop.rotation.z = -angle + Math.sin(time * 6 + index) * .25;
		drop.scale.set(.68 + life * .58, .78 + life * .92, .68 + life * .58);
		if (progress > .7) returnedLiquidBodies += 1;
	});
	const diagnostics = {
		time,
		phase: phaseAt$12(time, p),
		dialRotation,
		beaterAngularVelocity,
		planetaryAngularVelocity,
		bowlSwingRadians,
		bowlSwingAmplitude,
		bowlShake,
		bowlHop,
		machineShake,
		vortexStrength,
		peakStrength,
		visiblePullArcs,
		visibleLargeDollops,
		visibleDroplets,
		returnedLiquidBodies,
		run,
		overspeed,
		activeDrops: visibleLargeDollops + visibleDroplets,
		activeSplats: visiblePullArcs,
		shake: bowlSwingAmplitude + bowlShakeAmplitude + machineShake,
		timelineOwner: "AppliancePerformanceSystem",
		effectOwner: "stand-mixer-model-rig",
		sharedSpectacleEffects: "disabled",
		forbiddenPrimitives: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
	root.userData.standMixerPerformanceDiagnostics = diagnostics;
	root.userData.standMixerAnimation = diagnostics;
}
function resetStandMixerPerformance(root) {
	resetDiagnostics(root);
}
//#endregion
//#region src/appliances/performance/GumballMachinePerformance.ts
var TWO_PI = Math.PI * 2;
var SELECTED_CAPSULE_INDEX = 9;
function pulse$7(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function phaseAt$11(time) {
	if (time < .24) return "crank-turn";
	if (time < 1.6) return "capsule-frenzy";
	if (time < 1.86) return "selection-pause";
	if (time < 3) return "capsule-launch";
	if (time < 3.42) return "first-bounce";
	if (time < 3.73) return "second-bounce";
	if (time < 4.05) return "rolling";
	if (time < 4.42) return "opening";
	if (time < 4.72) return "prize-drop";
	if (time < 4.98) return "prize-first-bounce";
	if (time < 5.17) return "prize-second-bounce";
	return "settled";
}
function easedBackOut(progress) {
	const p = MathUtils.clamp(progress, 0, 1) - 1;
	return 1 + 2.2199999999999998 * p ** 3 + 1.22 * p ** 2;
}
/**
* The model owns every visible prop in this performance. This keeps the live
* game and gallery on the same named rig and prevents the old spectacle pool
* from substituting an unrelated generic capsule.
*/
function createGumballMachinePerformance(root) {
	const node = (name) => root.getObjectByName(name) ?? null;
	const motion = node("gumball-machine-motion-pivot");
	const sideCrank = node("gumball-machine-side-crank-pivot");
	const frontCrank = node("gumball-machine-front-crank-pivot");
	const releaseButton = node("gumball-machine-front-round-release-button");
	const output = node("gumball-machine-output-capsule-motion-pivot");
	const outputLeft = node("gumball-machine-output-capsule-left-shell-pivot");
	const outputRight = node("gumball-machine-output-capsule-right-shell-pivot");
	const outputToy = node("gumball-machine-output-prize-pivot");
	const prizeKinds = [
		"star",
		"flower",
		"key",
		"bear"
	];
	const outputPrizes = new Map(prizeKinds.flatMap((kind) => {
		const prize = node(`gumball-machine-output-${kind}-prize`);
		return prize ? [[kind, prize]] : [];
	}));
	const successBursts = Array.from({ length: 3 }, (_, index) => node(`gumball-machine-success-burst-${index + 1}-pivot`)).filter((entry) => Boolean(entry));
	const capsules = [];
	root.traverse((object) => {
		if (!(object instanceof Group)) return;
		if (!/^gumball-machine-capsule-\d+-pivot$/.test(object.name)) return;
		capsules.push({
			pivot: object,
			position: object.position.clone()
		});
	});
	capsules.sort((a, b) => a.pivot.name.localeCompare(b.pivot.name, void 0, { numeric: true }));
	const selected = capsules[8] ?? capsules[0] ?? null;
	const outputLanding = new Vector3(-.28, .46, 6.8);
	const toyRelease = new Vector3(-.22, 1.18, 6.9);
	const toyLanding = new Vector3(-.06, .2, 7.12);
	let prizeCycleIndex = -1;
	let prizeCycleActive = false;
	let activePrizeKind = prizeKinds[0];
	const beginPrizeCycle = () => {
		prizeCycleIndex = (prizeCycleIndex + 1) % prizeKinds.length;
		activePrizeKind = prizeKinds[prizeCycleIndex];
		prizeCycleActive = true;
	};
	const writeDiagnostics = (diagnostics) => {
		root.userData.gumballMachinePerformanceDiagnostics = diagnostics;
	};
	const reset = () => {
		writeDiagnostics({
			time: 0,
			phase: "settled",
			crankRotationRadians: 0,
			crankCompletedFullTurn: false,
			crankReboundRadians: 0,
			agitatedCapsules: 0,
			topImpactCapsules: 0,
			selectionPaused: false,
			selectedCapsuleIndex: SELECTED_CAPSULE_INDEX,
			outputCapsuleVisible: false,
			bounceIndex: 0,
			shellSeparation: 0,
			prizeKind: activePrizeKind,
			toyVisible: false,
			toyBounceIndex: 0,
			toyGrounded: false,
			toyWorldY: toyLanding.y,
			visibleSuccessBursts: 0,
			timelineOwner: "AppliancePerformanceSystem",
			effectOwner: "gumball-machine-model-rig",
			forbiddenPrimitives: [
				"PlaneGeometry",
				"Sprite",
				"Line"
			]
		});
		prizeCycleActive = false;
	};
	reset();
	return {
		apply: (time, power) => {
			if (!prizeCycleActive) beginPrizeCycle();
			const p = MathUtils.clamp(power, 0, 1);
			const crankProgress = MathUtils.clamp((time - .04) / .58, 0, 1);
			const crankTurn = easedBackOut(crankProgress) * TWO_PI;
			const crankRebound = pulse$7(time, .58, .68, .84) * -.24 + pulse$7(time, .69, .77, .91) * .095;
			const crankRotation = (crankTurn + crankRebound) * p;
			if (sideCrank) sideCrank.rotation.x += crankRotation;
			if (frontCrank) frontCrank.rotation.z -= crankTurn * .18 * p;
			const crankShake = pulse$7(time, .04, .34, .92) * p;
			const frenzyGate = MathUtils.smoothstep(time, .19, .32) * (1 - MathUtils.smoothstep(time, 1.52, 1.66)) * p;
			if (motion) {
				motion.position.x += Math.sin(time * 42) * (.026 * crankShake + .035 * frenzyGate);
				motion.rotation.z += Math.sin(time * 34 + .45) * (.018 * crankShake + .025 * frenzyGate);
			}
			let agitatedCapsules = 0;
			let topImpactCapsules = 0;
			capsules.forEach(({ pivot, position }, index) => {
				if (frenzyGate <= .001) return;
				agitatedCapsules += 1;
				const phase = index * 1.713;
				const topRunner = index === 2 || index === 8 || index === 10;
				const lift = topRunner ? Math.max(0, Math.sin(time * 8.4 + .2)) * (.76 - position.y) : Math.sin(time * (10.1 + index * .17) + phase) * .31;
				if (topRunner && position.y + lift > .68) topImpactCapsules += 1;
				pivot.position.x += (Math.sin(time * (11.4 + index * .13) + phase) * .2 + Math.sin(time * 6.1 - phase) * .09) * frenzyGate;
				pivot.position.y += lift * frenzyGate;
				pivot.position.z += Math.cos(time * (9.2 + index * .11) - phase) * .19 * frenzyGate;
				pivot.rotation.x += Math.sin(time * 17 + phase) * .6 * frenzyGate;
				pivot.rotation.z += Math.cos(time * 15 - phase) * .52 * frenzyGate;
			});
			const selectionPaused = time >= 1.62 && time < 1.86;
			if (selected) {
				const selectedPulse = pulse$7(time, 1.62, 1.72, 1.84) * p;
				selected.pivot.scale.multiplyScalar(1 + selectedPulse * .12);
				if (time >= 1.82) {
					const entryProgress = MathUtils.smoothstep(time, 1.82, 2.16);
					selected.pivot.position.lerpVectors(selected.position, new Vector3(.12, -.93, .27), entryProgress);
					selected.pivot.rotation.z += entryProgress * 1.45;
				}
				selected.pivot.visible = time < 2.16;
			}
			if (releaseButton) {
				const press = pulse$7(time, 1.86, 1.97, 2.12) * p;
				releaseButton.position.z -= press * .075;
			}
			let bounceIndex = 0;
			if (output) {
				output.visible = time >= 2.13;
				output.scale.setScalar(output.visible ? 2 : 1);
				output.position.set(0, .82, 1.04);
				output.rotation.set(0, 0, 0);
				if (time >= 2.13 && time < 3) {
					const travel = MathUtils.clamp((time - 2.13) / .87, 0, 1);
					output.position.set(-.38 * travel, .82 - travel * .36 + Math.sin(travel * Math.PI) * 1.35, 1.04 + travel * 3.8);
					output.rotation.set(travel * 3.4, travel * 1.25, -travel * 4.6);
				} else if (time < 3.42) {
					bounceIndex = 1;
					const bounce = MathUtils.clamp((time - 3) / .42, 0, 1);
					output.position.set(-.38 + bounce * .08, .46 + Math.sin(bounce * Math.PI) * .82, 4.84 + bounce * .91);
					output.rotation.set(3.4 + bounce * 1.9, 1.25 + bounce * .5, -4.6 - bounce * 2.4);
				} else if (time < 3.73) {
					bounceIndex = 2;
					const bounce = MathUtils.clamp((time - 3.42) / .31, 0, 1);
					output.position.set(-.3 + bounce * .02, .46 + Math.sin(bounce * Math.PI) * .38, 5.75 + bounce * .55);
					output.rotation.set(5.3 + bounce * 1.15, 1.75 + bounce * .35, -7 - bounce * 1.38);
				} else if (time < 4.05) {
					const roll = MathUtils.smoothstep(time, 3.73, 4.05);
					output.position.lerpVectors(new Vector3(-.28, .46, 6.3), outputLanding, roll);
					output.rotation.set(6.45, 2.1, -8.38 - roll * 2.1);
				} else {
					output.position.copy(outputLanding);
					output.rotation.set(0, .18, -10.48);
					const shellShake = pulse$7(time, 4.05, 4.1, 4.18);
					output.rotation.z += Math.sin(time * 72) * shellShake * .085;
				}
			}
			const openingOvershoot = easedBackOut(MathUtils.clamp((time - 4.14) / .28, 0, 1));
			if (outputLeft) {
				outputLeft.position.y += openingOvershoot * .42;
				outputLeft.rotation.z += openingOvershoot * .22;
			}
			if (outputRight) {
				outputRight.position.y -= openingOvershoot * .34;
				outputRight.rotation.z -= openingOvershoot * .16;
			}
			let toyVisible = false;
			let toyBounceIndex = 0;
			let toyGrounded = false;
			if (outputToy) {
				toyVisible = time >= 4.2;
				outputToy.visible = toyVisible;
				outputToy.userData.prizeKind = activePrizeKind;
				outputPrizes.forEach((prize, kind) => {
					prize.visible = kind === activePrizeKind;
				});
				if (toyVisible) if (time < 4.42) {
					const reveal = easedBackOut(MathUtils.clamp((time - 4.2) / .22, 0, 1));
					outputToy.position.lerpVectors(new Vector3(outputLanding.x, outputLanding.y + .08, outputLanding.z + .02), toyRelease, reveal);
					outputToy.rotation.set(-.08 + reveal * .12, -.16 + reveal * .42, .05 - reveal * .18);
				} else if (time < 4.72) {
					const drop = MathUtils.clamp((time - 4.42) / .3, 0, 1);
					const gravity = drop * drop;
					outputToy.position.set(MathUtils.lerp(toyRelease.x, toyLanding.x, drop), MathUtils.lerp(toyRelease.y, toyLanding.y, gravity), MathUtils.lerp(toyRelease.z, toyLanding.z, drop));
					outputToy.rotation.set(.04 + drop * .34, .26 + drop * .9, -.13 + drop * .31);
				} else if (time < 4.98) {
					toyBounceIndex = 1;
					const bounce = MathUtils.clamp((time - 4.72) / .26, 0, 1);
					outputToy.position.copy(toyLanding);
					outputToy.position.y += Math.sin(bounce * Math.PI) * .34;
					outputToy.rotation.set(.38 - bounce * .16, 1.16 + bounce * .34, .18 - bounce * .1);
				} else if (time < 5.17) {
					toyBounceIndex = 2;
					const bounce = MathUtils.clamp((time - 4.98) / .19, 0, 1);
					outputToy.position.copy(toyLanding);
					outputToy.position.y += Math.sin(bounce * Math.PI) * .13;
					outputToy.rotation.set(.22 - bounce * .08, 1.5 + bounce * .18, .08 - bounce * .05);
				} else {
					toyGrounded = true;
					outputToy.position.copy(toyLanding);
					outputToy.rotation.set(.14, 1.68, .03);
				}
			}
			let visibleSuccessBursts = 0;
			successBursts.forEach((burst, index) => {
				const start = 4.18 + index * .07;
				const age = MathUtils.clamp((time - start) / .72, 0, 1);
				const life = Math.sin(age * Math.PI);
				burst.visible = time >= start && time <= start + .72 && life > .04;
				if (!burst.visible) return;
				visibleSuccessBursts += 1;
				const side = index === 0 ? -1 : index === 1 ? 1 : 0;
				burst.position.set(outputLanding.x + side * (.42 + age * .28), outputLanding.y + .42 + age * (.5 + index * .09), outputLanding.z + .05 + (index === 2 ? .25 : -.02));
				burst.rotation.set(age * 1.4, time * (2.2 + index * .3), side * age * .8);
				burst.scale.setScalar(.52 + life * .68);
			});
			writeDiagnostics({
				time,
				phase: phaseAt$11(time),
				crankRotationRadians: crankRotation,
				crankCompletedFullTurn: crankProgress >= 1,
				crankReboundRadians: crankRebound,
				agitatedCapsules,
				topImpactCapsules,
				selectionPaused,
				selectedCapsuleIndex: SELECTED_CAPSULE_INDEX,
				outputCapsuleVisible: Boolean(output?.visible),
				bounceIndex,
				shellSeparation: openingOvershoot * .84,
				prizeKind: activePrizeKind,
				toyVisible,
				toyBounceIndex,
				toyGrounded,
				toyWorldY: outputToy?.position.y ?? toyLanding.y,
				visibleSuccessBursts,
				timelineOwner: "AppliancePerformanceSystem",
				effectOwner: "gumball-machine-model-rig",
				forbiddenPrimitives: [
					"PlaneGeometry",
					"Sprite",
					"Line"
				]
			});
		},
		reset
	};
}
//#endregion
//#region src/appliances/performance/MicrowavePerformance.ts
var MICROWAVE_TIMELINE_OWNER = "AppliancePerformanceSystem";
var STEAM_STARTS = [
	1.24,
	1.58,
	1.91,
	2.2,
	2.48,
	2.74,
	3.02,
	3.28
];
var HEAT_WAVE_STARTS = [
	3.12,
	3.42,
	3.72,
	4.02
];
function pulse$6(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function phaseAt$10(time) {
	if (time < .3) return "dial-start";
	if (time < .68) return "indicator-sequence";
	if (time < 1.28) return "heating";
	if (time < 3.12) return "steam-build";
	if (time < 4.45) return "energy-climax";
	if (time < 4.92) return "inertial-wind-down";
	return "final-settle";
}
function meshMaterial(mesh) {
	if (!mesh || Array.isArray(mesh.material)) return null;
	return mesh.material;
}
function setGlow(mesh, strength, color) {
	const material = meshMaterial(mesh);
	if (!material) return;
	material.emissive?.setHex(strength > .001 ? color : 0);
	material.emissiveIntensity = strength;
}
function trayMotion(time) {
	const rampStart = .64;
	const rampEnd = .94;
	const decelStart = 4.34;
	const maximumSpeed = 6.2;
	if (time <= rampStart) return {
		angle: 0,
		speed: 0
	};
	if (time < rampEnd) {
		const elapsed = time - rampStart;
		const progress = elapsed / .29999999999999993;
		return {
			angle: maximumSpeed * elapsed * progress * .5,
			speed: maximumSpeed * progress
		};
	}
	const rampAngle = maximumSpeed * .29999999999999993 * .5;
	if (time < decelStart) return {
		angle: rampAngle + maximumSpeed * (time - rampEnd),
		speed: maximumSpeed
	};
	const fullSpeedAngle = 22.009999999999998;
	const duration = .7400000000000002;
	const elapsed = Math.min(duration, time - decelStart);
	return {
		angle: fullSpeedAngle + maximumSpeed * (elapsed - elapsed * elapsed / (2 * duration)),
		speed: maximumSpeed * Math.max(0, 1 - elapsed / duration)
	};
}
/**
* Model-owned microwave performance. ApplianceMechanics restores the exact
* authored pose before every sample, so game, gallery and review use the same
* deterministic 5.2 second timeline without stacking a second effect owner.
*/
function applyMicrowavePerformance(root, time, power) {
	const p = MathUtils.clamp(power, 0, 1);
	const dial = root.getObjectByName("microwave-control-dial-pivot");
	const tray = root.getObjectByName("microwave-tray-rotor-pivot");
	const food = root.getObjectByName("microwave-food-pivot");
	const interiorLight = root.getObjectByName("microwave-interior-work-light");
	const interior = root.getObjectByName("microwave-interior-back-wall");
	const foodMesh = root.getObjectByName("microwave-food-main-volume");
	const display = root.getObjectByName("microwave-control-display");
	const turnOn = MathUtils.smoothstep(time, .04, .27);
	const returnToStop = MathUtils.smoothstep(time, 4.48, 4.9);
	const dialTurn = -Math.PI * .72 * turnOn * (1 - returnToStop);
	if (dial) dial.rotation.z += dialTurn;
	let litIndicatorCount = 0;
	for (let index = 0; index < 3; index += 1) {
		const indicator = root.getObjectByName(`microwave-sequence-indicator-${index + 1}`);
		const on = time >= .28 + index * .11 && time < 4.56;
		const completion = time >= 4.56 && index === 2;
		const strength = (on ? 1 : completion ? .42 : 0) * p;
		if (strength > .02) litIndicatorCount += 1;
		const material = meshMaterial(indicator);
		if (material) {
			material.color.setHex(strength > .02 ? completion ? 11989181 : 16756900 : 7235191);
			material.emissive?.setHex(strength > .02 ? completion ? 6809475 : 16741215 : 0);
			material.emissiveIntensity = strength * 1.8;
		}
	}
	const lightStrength = (time >= .57 ? 1 : 0) * (1 - MathUtils.smoothstep(time, 4.46, 5.08) * .57) * p;
	if (interiorLight) interiorLight.intensity = lightStrength * 2.15;
	setGlow(interior, lightStrength * 1.25, 16757858);
	setGlow(foodMesh, lightStrength * .48, 16751970);
	setGlow(display, (turnOn * (1 - returnToStop) * .38 + returnToStop * .12) * p, 16751231);
	for (let index = 1; index <= 4; index += 1) setGlow(root.getObjectByName(`microwave-display-digit-${index}`), (time >= .34 + index * .045 ? 1 : 0) * (1 - returnToStop * .68) * p * 1.2, 16757373);
	const traySample = trayMotion(time);
	if (tray) tray.rotation.y += traySample.angle;
	const heatingEnvelope = MathUtils.smoothstep(time, .72, 1.16) * (1 - MathUtils.smoothstep(time, 4.46, 5.08)) * p;
	const climaxEnvelope = MathUtils.smoothstep(time, 3.08, 3.42) * (1 - MathUtils.smoothstep(time, 4.28, 4.62)) * p;
	const finalFoodWobble = pulse$6(time, 4.62, 4.78, 5.04) * p;
	const foodScale = 1 + MathUtils.smoothstep(time, .88, 3.35) * (1 - returnToStop * .66) * .19 * p + Math.abs(Math.sin(time * 10.8)) * .035 * heatingEnvelope + Math.abs(Math.sin(time * 18.5)) * .075 * climaxEnvelope;
	if (food) {
		food.scale.set(foodScale + Math.sin(time * 14.2) * .018 * climaxEnvelope, foodScale + Math.abs(Math.sin(time * 12.4)) * .055 * climaxEnvelope, foodScale - Math.sin(time * 14.2) * .014 * climaxEnvelope);
		food.position.y += Math.abs(Math.sin(time * 9.3)) * .026 * heatingEnvelope + Math.abs(Math.sin(time * 20.4)) * .055 * climaxEnvelope + finalFoodWobble * .035;
		food.rotation.x += Math.sin(time * 13.7) * .026 * heatingEnvelope + Math.sin(time * 22.5) * .055 * climaxEnvelope + finalFoodWobble * .045;
		food.rotation.z += Math.sin(time * 11.1 + .4) * .022 * heatingEnvelope + Math.sin(time * 19.2) * .048 * climaxEnvelope;
	}
	const workCompression = (pulse$6(time, .54, .61, .74) * .62 + pulse$6(time, 1.25, 1.34, 1.5) * .42 + pulse$6(time, 2, 2.1, 2.28) * .52 + pulse$6(time, 2.72, 2.82, 3) * .62 + pulse$6(time, 3.28, 3.37, 3.54) * .88 + pulse$6(time, 3.7, 3.79, 3.96) * 1 + pulse$6(time, 4.08, 4.17, 4.35) * 1.12) * p;
	const workRebound = (pulse$6(time, .66, .76, .91) * .42 + pulse$6(time, 1.4, 1.51, 1.67) * .26 + pulse$6(time, 2.16, 2.28, 2.46) * .33 + pulse$6(time, 2.9, 3.02, 3.18) * .38 + pulse$6(time, 3.43, 3.55, 3.7) * .58 + pulse$6(time, 3.85, 3.98, 4.12) * .68 + pulse$6(time, 4.24, 4.37, 4.5) * .74) * p;
	const rhythmShake = Math.sin(time * 38) * (.014 * heatingEnvelope + .036 * climaxEnvelope);
	const finalSettleAge = time - 4.82;
	const finalSettle = finalSettleAge >= 0 ? Math.sin(finalSettleAge * 39) * Math.exp(-finalSettleAge * 12.5) * p : 0;
	const wholeMachineShake = rhythmShake + finalSettle * .07;
	root.scale.set(root.scale.x * (1 + workCompression * .035 + workRebound * .016), root.scale.y * (1 - workCompression * .052 + workRebound * .042), root.scale.z * (1 + workCompression * .03 + workRebound * .018));
	root.position.x += wholeMachineShake;
	root.position.y += workRebound * .018 + Math.abs(finalSettle) * .012;
	root.rotation.z += wholeMachineShake * .12 + finalSettle * .025;
	let visibleSteamPuffs = 0;
	let maximumSteamOpacity = 0;
	const steamIntensity = MathUtils.smoothstep(time, 1.18, 3.48) * (1 + climaxEnvelope * .75) * (1 - MathUtils.smoothstep(time, 4.68, 5.2) * .38) * p;
	STEAM_STARTS.forEach((start, index) => {
		const puff = root.getObjectByName(`microwave-steam-puff-${index + 1}`);
		if (!puff) return;
		const age = time - start;
		const visible = age >= 0 && p > .01;
		puff.visible = visible;
		if (!visible) return;
		visibleSteamPuffs += 1;
		const rise = Math.min(.63, age * (time >= 4.45 ? .12 : .17));
		const spread = MathUtils.smoothstep(age, 0, 2.4);
		puff.position.y += rise;
		puff.position.x += Math.sin(age * 2.2 + index * 1.41) * (.035 + spread * .045);
		puff.position.z += Math.cos(age * 1.8 + index * .77) * .025;
		puff.rotation.y += age * (index % 2 === 0 ? .42 : -.36);
		puff.rotation.z += Math.sin(age * 1.7 + index) * .13;
		const growth = .54 + MathUtils.smoothstep(age, 0, 1.5) * (.48 + climaxEnvelope * .16);
		puff.scale.set(growth * (1 + Math.sin(age * 2.4) * .08), growth * 1.08, growth * .9);
		const material = meshMaterial(puff.getObjectByName(`microwave-steam-puff-${index + 1}-lobe-1`));
		if (material) {
			const opacity = Math.min(.72, steamIntensity * (.22 + index * .025));
			material.opacity = opacity;
			material.emissiveIntensity = lightStrength * .2 + climaxEnvelope * .18;
			maximumSteamOpacity = Math.max(maximumSteamOpacity, opacity);
		}
	});
	let activeHeatWaveCount = 0;
	HEAT_WAVE_STARTS.forEach((start, index) => {
		const wave = root.getObjectByName(`microwave-heat-energy-wave-${index + 1}`);
		if (!wave) return;
		const age = time - start;
		const life = .84;
		const progress = MathUtils.clamp(age / life, 0, 1);
		const visible = age >= 0 && age < life && p > .01;
		wave.visible = visible;
		if (!visible) return;
		activeHeatWaveCount += 1;
		const growth = .42 + MathUtils.smoothstep(progress, 0, .92) * 2.72;
		const wobble = Math.sin(progress * Math.PI * 4 + index) * (1 - progress) * .08;
		wave.scale.set(growth * (1 + wobble), growth * (.9 - wobble * .55), .8 + progress * .45);
		wave.rotation.z += (index % 2 === 0 ? 1 : -1) * progress * .22;
		const material = meshMaterial(wave);
		if (material) {
			const appear = MathUtils.smoothstep(progress, 0, .08);
			const fade = 1 - MathUtils.smoothstep(progress, .48, 1);
			material.opacity = appear * fade * .68 * p;
			material.emissiveIntensity = fade * (.78 + index * .1) * p;
		}
	});
	root.userData.microwavePerformanceDiagnostics = {
		timelineOwner: MICROWAVE_TIMELINE_OWNER,
		effectOwner: "microwave-model-rig",
		phase: phaseAt$10(time),
		timeline: time,
		dialTurn,
		litIndicatorCount,
		interiorLightStrength: lightStrength,
		trayAngle: traySample.angle,
		trayAngularSpeed: traySample.speed,
		foodScale,
		wholeMachineCompression: workCompression,
		wholeMachineRebound: workRebound,
		wholeMachineShake,
		visibleSteamPuffs,
		maximumSteamOpacity,
		activeHeatWaveCount,
		finalSettle,
		steamGeometry: "clustered-irregular-icosahedra",
		heatWaveGeometry: "thick-irregular-torus",
		forbiddenFlatEffects: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
}
function resetMicrowavePerformance(root) {
	const interiorLight = root.getObjectByName("microwave-interior-work-light");
	if (interiorLight) interiorLight.intensity = 0;
	delete root.userData.microwavePerformanceDiagnostics;
}
//#endregion
//#region src/appliances/animation.ts
/**
* One deliberate powered knob gesture: turn, hold while the appliance runs,
* then return before the shared 5.2 second activation window ends.
*/
function poweredControlTurn(time, power, angle = Math.PI * 2 / 3) {
	const p = MathUtils.clamp(power, 0, 1);
	const turnIn = MathUtils.smoothstep(time, .08, .68);
	const returnHome = MathUtils.smoothstep(time, 4.08, 4.92);
	const settleTime = Math.max(0, time - .68);
	const settle = Math.sin(settleTime * 10.5) * Math.exp(-settleTime * 4.8) * .055;
	return (angle * turnIn + settle) * (1 - returnHome) * p;
}
//#endregion
//#region src/appliances/performance/FanPerformance.ts
var TAU$6 = Math.PI * 2;
var FAN_TIMELINE = Object.freeze({
	startupDelay: .08,
	startupEnd: .88,
	cruiseEnd: 4.35,
	stopEnd: 5.2,
	completedRevolutions: 12
});
var startupDuration = FAN_TIMELINE.startupEnd - FAN_TIMELINE.startupDelay;
var cruiseDuration = FAN_TIMELINE.cruiseEnd - FAN_TIMELINE.startupEnd;
var decelerationDuration = FAN_TIMELINE.stopEnd - FAN_TIMELINE.cruiseEnd;
var integratedFullSpeedSeconds = startupDuration * .5 + cruiseDuration + decelerationDuration * .5;
/**
* The maximum speed is derived from an integer final revolution count. This
* makes the 5.2 s stopped pose exactly equivalent to the authored rest pose,
* so the gallery's reset/loop seam cannot visibly flip the blades.
*/
var FAN_MAX_ANGULAR_SPEED = FAN_TIMELINE.completedRevolutions * TAU$6 / integratedFullSpeedSeconds;
function clamp01$4(value) {
	return MathUtils.clamp(value, 0, 1);
}
function smoothstep01(value) {
	const t = clamp01$4(value);
	return t * t * (3 - 2 * t);
}
/** Integral of smoothstep01 from 0 to u. */
function integratedSmoothstep01(value) {
	const t = clamp01$4(value);
	return t * t * t - .5 * t * t * t * t;
}
/** Integral of (1 - smoothstep01) from 0 to u. */
function integratedReverseSmoothstep01(value) {
	const t = clamp01$4(value);
	return t - t * t * t + .5 * t * t * t * t;
}
/**
* Analytic angle sampling keeps the result independent of frame rate and of
* preview seeks. Angle is never computed as `time * variableSpeed`.
*/
function sampleFanRotorMotion(rawTime) {
	const time = Math.max(0, rawTime);
	let phase = "idle";
	let normalizedSpeed = 0;
	let integratedSeconds = 0;
	if (time >= FAN_TIMELINE.stopEnd) {
		phase = "stopped";
		integratedSeconds = integratedFullSpeedSeconds;
	} else if (time >= FAN_TIMELINE.cruiseEnd) {
		phase = "decelerating";
		const u = (time - FAN_TIMELINE.cruiseEnd) / decelerationDuration;
		normalizedSpeed = 1 - smoothstep01(u);
		integratedSeconds = startupDuration * .5 + cruiseDuration + decelerationDuration * integratedReverseSmoothstep01(u);
	} else if (time >= FAN_TIMELINE.startupEnd) {
		phase = "steady";
		normalizedSpeed = 1;
		integratedSeconds = startupDuration * .5 + time - FAN_TIMELINE.startupEnd;
	} else if (time >= FAN_TIMELINE.startupDelay) {
		phase = "accelerating";
		const u = (time - FAN_TIMELINE.startupDelay) / startupDuration;
		normalizedSpeed = smoothstep01(u);
		integratedSeconds = startupDuration * integratedSmoothstep01(u);
	}
	return {
		time,
		phase,
		angle: -integratedSeconds * FAN_MAX_ANGULAR_SPEED,
		angularSpeed: normalizedSpeed * FAN_MAX_ANGULAR_SPEED,
		normalizedSpeed
	};
}
function createFanPerformance(root) {
	const rotor = root.getObjectByName("fan-rotor-pivot");
	const yaw = root.getObjectByName("fan-oscillation-pivot");
	const hinge = root.getObjectByName("fan-head-hinge");
	const dial = root.getObjectByName("fan-speed-dial-pivot");
	const rotorRest = rotor?.rotation.z ?? 0;
	const yawRest = yaw?.rotation.y ?? 0;
	const hingeRest = hinge?.rotation.x ?? 0;
	const dialRest = dial?.rotation.z ?? 0;
	let signalValue = 0;
	const diagnostics = {
		...sampleFanRotorMotion(0),
		finalOrientationError: 0,
		timelineOwner: "ApplianceMechanics/FanPerformance"
	};
	root.userData.fanPerformanceDiagnostics = diagnostics;
	const apply = (time, power) => {
		const sample = sampleFanRotorMotion(time);
		const activity = sample.normalizedSpeed;
		if (rotor) {
			rotor.rotation.z = rotorRest + sample.angle;
			rotor.userData.performancePhase = sample.phase;
			rotor.userData.angularSpeed = sample.angularSpeed;
		}
		if (yaw) yaw.rotation.y = yawRest + Math.sin(time * 1.12) * .28 * activity;
		if (hinge) hinge.rotation.x = hingeRest + Math.sin(time * .9) * .025 * activity;
		if (dial) dial.rotation.z = dialRest + poweredControlTurn(time, power, -Math.PI * .7);
		signalValue = activity;
		Object.assign(diagnostics, sample, { finalOrientationError: Math.abs(Math.sin(sample.angle * .5)) });
	};
	const reset = () => {
		if (rotor) rotor.rotation.z = rotorRest;
		if (yaw) yaw.rotation.y = yawRest;
		if (hinge) hinge.rotation.x = hingeRest;
		if (dial) dial.rotation.z = dialRest;
		signalValue = 0;
		Object.assign(diagnostics, sampleFanRotorMotion(0), { finalOrientationError: 0 });
	};
	return {
		apply,
		reset,
		signal: () => signalValue,
		diagnostics
	};
}
//#endregion
//#region src/appliances/performance/TelevisionPerformance.ts
var TELEVISION_TIMELINE_OWNER = "AppliancePerformanceSystem";
var CHANNEL_ANGLES = [
	-.82,
	0,
	.82
];
var TELEVISION_INITIAL_SWITCHES = [.94, 1.84];
var TELEVISION_RAPID_SWITCH_TIMES = [
	2.72,
	3,
	3.28,
	3.56,
	3.84,
	4.12
];
var TELEVISION_RECONSTRUCTION_FINAL_LOCK_TIME = 4.48;
var TELEVISION_RECONSTRUCTION_COMMIT_TIME = 5.12;
var INITIAL_SWITCHES = TELEVISION_INITIAL_SWITCHES;
var RAPID_SWITCH_TIMES = TELEVISION_RAPID_SWITCH_TIMES;
function pulse$5(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function channelAt(time) {
	if (time < INITIAL_SWITCHES[0]) return {
		channel: 1,
		transitionCenter: null
	};
	if (time < INITIAL_SWITCHES[1]) return {
		channel: 2,
		transitionCenter: INITIAL_SWITCHES[0]
	};
	if (time < RAPID_SWITCH_TIMES[0]) return {
		channel: 3,
		transitionCenter: INITIAL_SWITCHES[1]
	};
	let channel = 1;
	let transitionCenter = RAPID_SWITCH_TIMES[0];
	RAPID_SWITCH_TIMES.forEach((switchTime, index) => {
		if (time >= switchTime) {
			channel = index % 3 + 1;
			transitionCenter = switchTime;
		}
	});
	return {
		channel,
		transitionCenter
	};
}
function phaseAt$9(time) {
	if (time < .32) return "power-on-collapse-reverse";
	if (time < INITIAL_SWITCHES[0]) return "channel-one";
	if (time < INITIAL_SWITCHES[1]) return "channel-two";
	if (time < RAPID_SWITCH_TIMES[0]) return "channel-three";
	if (time < 4.48) return "rapid-channel-surf";
	if (time < 5.12) return "power-off-line-collapse";
	return "dark";
}
function getNode(root, name) {
	return root.getObjectByName(name) ?? null;
}
function setMeshGlow(mesh, strength, color) {
	if (!mesh) return;
	(Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => {
		const toon = material;
		toon.emissive?.setHex(strength > .001 ? color : 0);
		toon.emissiveIntensity = strength;
	});
}
/**
* Television-only authored performance. ApplianceMechanics restores the model
* baseline before every sample; this function then writes one deterministic
* pose used by both the game and the gallery.
*/
function applyTelevisionPerformance(root, time, power) {
	const p = MathUtils.clamp(power, 0, 1);
	const picture = getNode(root, "television-picture-pivot");
	const staticGroup = getNode(root, "television-static-snow-group");
	const shutdownLine = getNode(root, "television-shutdown-phosphor-line");
	const selector = getNode(root, "television-channel-selector-pivot");
	const powerButton = getNode(root, "television-power-button-pivot");
	const screen = getNode(root, "television-crt-bulged-screen");
	const bootPoint = MathUtils.smoothstep(time, .035, .095);
	const bootLine = MathUtils.smoothstep(time, .095, .19);
	const bootFull = MathUtils.smoothstep(time, .19, .34);
	const shutdownVertical = MathUtils.smoothstep(time, 4.54, 4.76);
	const shutdownHorizontal = MathUtils.smoothstep(time, 4.78, 5.02);
	const shutdownFade = 1 - MathUtils.smoothstep(time, 4.98, 5.14);
	const poweredEnvelope = p * (1 - MathUtils.smoothstep(time, 5.02, 5.18));
	let pictureScaleX = Math.max(.018, bootLine) * (1 - shutdownHorizontal * .982);
	let pictureScaleY = Math.max(.015, bootFull) * (1 - shutdownVertical * .985);
	if (picture) {
		picture.visible = bootPoint * poweredEnvelope > .001;
		picture.scale.set(pictureScaleX, pictureScaleY, 1);
	}
	const channelSample = channelAt(time);
	const shutdownActive = time >= 4.48;
	const transitionPulse = channelSample.transitionCenter === null ? pulse$5(time, .22, .29, .38) : pulse$5(time, channelSample.transitionCenter - .075, channelSample.transitionCenter, channelSample.transitionCenter + .13);
	const weakSignalFlicker = pulse$5(time, 2.34, 2.44, 2.58);
	const rapidSignal = time >= 2.72 && time < 4.32 ? Math.max(0, Math.sin(time * 48 + .4)) * .42 : 0;
	const signalInterference = shutdownActive ? 0 : MathUtils.clamp(transitionPulse + weakSignalFlicker + rapidSignal, 0, 1);
	const staticVisible = signalInterference > .18 && pictureScaleX > .05 && pictureScaleY > .05;
	let visibleProgrammeCount = 0;
	for (let index = 0; index < 3; index += 1) {
		const channel = getNode(root, `television-channel-${index + 1}-${index === 0 ? "sakura" : index === 1 ? "test-card" : "night-city"}`);
		if (!channel) continue;
		channel.visible = !shutdownActive && !staticVisible && channelSample.channel === index + 1 && poweredEnvelope > .01;
		if (channel.visible) visibleProgrammeCount += 1;
		channel.position.x = (staticVisible ? .025 : 0) * Math.sin(time * 71 + index);
	}
	if (staticGroup) {
		staticGroup.visible = staticVisible;
		staticGroup.position.x = Math.sin(time * 83) * .035 * signalInterference;
		staticGroup.position.y = Math.cos(time * 67) * .024 * signalInterference;
	}
	for (let index = 0; index < 48; index += 1) {
		const snow = getNode(root, `television-static-snow-bit-${index + 1}`);
		if (!snow) continue;
		const seed = Number(snow.userData.snowSeed ?? index);
		snow.position.x += Math.sin(time * (49 + seed % 11) + seed) * .026 * signalInterference;
		snow.position.y += Math.cos(time * (58 + seed % 7) + seed * .7) * .021 * signalInterference;
		snow.scale.x *= .55 + Math.floor(time * 40 + seed) % 5 / 4 * .75;
	}
	for (let index = 0; index < 2; index += 1) {
		const band = getNode(root, `television-static-signal-band-${index + 1}`);
		if (band) band.position.y += (time * (1.8 + index * .7) + index * .39) % 1.12 - .56;
	}
	const switchImpact = channelSample.transitionCenter === null ? pulse$5(time, .16, .23, .32) : pulse$5(time, channelSample.transitionCenter - .075, channelSample.transitionCenter, channelSample.transitionCenter + .095);
	const selectorAngle = CHANNEL_ANGLES[channelSample.channel - 1];
	if (selector) selector.rotation.z += selectorAngle + Math.sin(time * 52) * .055 * switchImpact;
	let pressedChannelButton = null;
	for (let index = 0; index < 3; index += 1) {
		const button = getNode(root, `television-channel-button-${index + 1}-pivot`);
		const pressed = channelSample.channel === index + 1 ? switchImpact : 0;
		if (button) button.position.z -= pressed * .075;
		if (pressed > .08) pressedChannelButton = index + 1;
	}
	const powerOnPress = pulse$5(time, .015, .075, .17);
	const powerOffPress = pulse$5(time, 4.42, 4.5, 4.63);
	const powerButtonPress = Math.max(powerOnPress, powerOffPress) * p;
	if (powerButton) powerButton.position.z -= powerButtonPress * .08;
	const shutdownLineVisible = shutdownVertical > .1 && shutdownFade > .01;
	const shutdownLineScaleX = Math.max(.015, 1 - shutdownHorizontal * .985);
	const shutdownLineScaleY = .45 + shutdownVertical * .9;
	if (shutdownLine) {
		shutdownLine.visible = shutdownLineVisible;
		shutdownLine.scale.set(shutdownLineScaleX, shutdownLineScaleY, 1);
	}
	const scanline = getNode(root, "television-scanline-pivot");
	if (scanline) {
		scanline.visible = pictureScaleY > .12 && poweredEnvelope > .01;
		scanline.position.y += time * 1.05 % 1.16 - .58;
	}
	setMeshGlow(screen, (.58 + Math.sin(time * 41) * .05 + signalInterference * .48) * poweredEnvelope, staticVisible ? 14674687 : 7919583);
	root.userData.televisionPerformanceDiagnostics = {
		timelineOwner: TELEVISION_TIMELINE_OWNER,
		effectOwner: "television-model-rig",
		phase: phaseAt$9(time),
		timeline: time,
		selectedChannel: shutdownActive ? null : channelSample.channel,
		selectorAngle,
		pressedChannelButton,
		powerButtonPress,
		signalInterference,
		staticVisible,
		visibleProgrammeCount,
		pictureScale: [pictureScaleX, pictureScaleY],
		shutdownLineVisible,
		shutdownLineScale: [shutdownLineScaleX, shutdownLineScaleY],
		forbiddenGenericEffects: [
			"debris-particles",
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
}
function resetTelevisionPerformance(root) {
	delete root.userData.televisionPerformanceDiagnostics;
}
//#endregion
//#region src/appliances/performance/HumidifierPerformance.ts
var HUMIDIFIER_TIMELINE_OWNER = "AppliancePerformanceSystem";
function pulse$4(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function fract$1(value) {
	return (value % 1 + 1) % 1;
}
function phaseAt$8(time) {
	if (time < .38) return "startup";
	if (time < 1.42) return "high-mist";
	if (time < 2.74) return "cloud-forming";
	if (time < 4.7) return "rainstorm";
	return "wind-down";
}
function prefixedNodes(root, prefix) {
	const result = [];
	root.traverse((object) => {
		if (object.name.startsWith(prefix)) result.push(object);
	});
	return result;
}
function setEffectMaterialResponse(root, kind, opacity, emissiveIntensity) {
	const seen = /* @__PURE__ */ new Set();
	root.traverse((object) => {
		if (!(object instanceof Mesh)) return;
		(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
			if (seen.has(material) || material.userData.humidifierEffectMaterial !== kind) return;
			seen.add(material);
			material.opacity = opacity;
			if (emissiveIntensity !== void 0) {
				const toon = material;
				toon.emissiveIntensity = emissiveIntensity;
			}
		});
	});
}
/**
* The authored humidifier performance used by both gameplay and gallery.
* ApplianceMechanics owns the clock and restores the model baseline before
* each sample; this function only poses the named model-owned rig.
*/
function applyHumidifierPerformance(root, time, power) {
	const p = MathUtils.clamp(power, 0, 1);
	const startup = MathUtils.smoothstep(time, .04, .38) * p;
	const mistStrength = MathUtils.smoothstep(time, .22, .62) * (1 - MathUtils.smoothstep(time, 4.66, 5.18)) * p;
	const cloudStrength = MathUtils.smoothstep(time, 1.28, 2.34) * (1 - MathUtils.smoothstep(time, 4.78, 5.18)) * p;
	const rainStrength = MathUtils.smoothstep(time, 2.68, 3.08) * (1 - MathUtils.smoothstep(time, 4.68, 5.18)) * p;
	const lightningFlash = Math.min(1, pulse$4(time, 2.42, 2.5, 2.64) + pulse$4(time, 2.86, 2.94, 3.08) + pulse$4(time, 3.52, 3.6, 3.75)) * cloudStrength;
	const dial = root.getObjectByName("humidifier-control-dial-pivot");
	if (dial) dial.rotation.z = -Math.PI * .72 * startup;
	const outlet = root.getObjectByName("humidifier-outlet-cap-pivot");
	if (outlet) outlet.rotation.y = Math.sin(time * 2.5) * .12 * mistStrength;
	const water = root.getObjectByName("humidifier-inner-water-volume");
	if (water) {
		water.position.y = Math.sin(time * 1.8) * .012 * mistStrength;
		water.scale.y = 1 + Math.sin(time * 1.35 + .4) * .009 * mistStrength;
	}
	prefixedNodes(root, "humidifier-water-glint-").forEach((glint, index) => {
		glint.position.y = 1.66 + index * .25 + Math.sin(time * 2 + index * 1.7) * .038 * mistStrength;
		const ripple = 1 + Math.sin(time * 1.6 + index) * .028 * mistStrength;
		glint.scale.setScalar(ripple);
	});
	let visibleMistVolumes = 0;
	const mistVolumes = prefixedNodes(root, "humidifier-mist-volume-pivot-");
	mistVolumes.forEach((volume, index) => {
		const phaseOffset = Number(volume.userData.phaseOffset ?? index / Math.max(1, mistVolumes.length));
		const phase = fract$1(time * .54 + phaseOffset);
		const lane = Number(volume.userData.lane ?? 0);
		const depthLane = Number(volume.userData.depthLane ?? 0);
		const baseScale = Number(volume.userData.baseScale ?? 1);
		const cycleEnvelope = MathUtils.smoothstep(phase, 0, .12) * (1 - MathUtils.smoothstep(phase, .82, 1));
		const active = mistStrength * cycleEnvelope;
		volume.visible = active > .025;
		if (!volume.visible) return;
		visibleMistVolumes += 1;
		const spread = .035 + phase * .072;
		volume.position.set(lane * spread + Math.sin(time * 2.2 + index * .91) * .075 * phase, phase * 2.45, depthLane * (.018 + phase * .024) + Math.sin(time * 1.7 + index) * .055);
		const size = baseScale * active * (.72 + phase * 1.12);
		volume.scale.set(size * (.96 + phase * .28), size * (1.08 + phase * .42), size);
		volume.rotation.y = time * (index % 2 === 0 ? .34 : -.29) + phase * .8;
		volume.rotation.z = Math.sin(time * 1.45 + index * .57) * .1 * phase;
	});
	setEffectMaterialResponse(root, "mist-shell", .18 + mistStrength * .34, .04 + mistStrength * .08);
	setEffectMaterialResponse(root, "mist-shade", .12 + mistStrength * .25, .02 + mistStrength * .045);
	const cloud = root.getObjectByName("humidifier-volumetric-weather-cloud-rig");
	if (cloud) {
		cloud.visible = cloudStrength > .015;
		cloud.position.set(Math.sin(time * .88) * .08 * cloudStrength, 5.2 + Math.sin(time * 1.15) * .065 * cloudStrength, Math.cos(time * .72) * .05 * cloudStrength);
		const grown = Math.max(.001, cloudStrength ** .72);
		cloud.scale.set(grown, grown * .98, grown);
	}
	prefixedNodes(root, "humidifier-volumetric-weather-cloud-lobe-").forEach((lobe, index) => {
		const base = lobe.userData.basePosition;
		if (!Array.isArray(base) || base.length < 3) return;
		lobe.position.set(Number(base[0]) + Math.sin(time * .72 + index) * .035 * cloudStrength, Number(base[1]) + Math.sin(time * 1.08 + index * .83) * .055 * cloudStrength, Number(base[2]) + Math.cos(time * .64 + index * .51) * .03 * cloudStrength);
	});
	const internalLight = root.getObjectByName("humidifier-cloud-internal-light-pivot");
	if (internalLight) {
		internalLight.visible = lightningFlash > .02;
		const flashScale = .72 + lightningFlash * .48;
		internalLight.scale.setScalar(flashScale);
	}
	const lightning = root.getObjectByName("humidifier-cloud-volumetric-lightning-bolt");
	if (lightning) {
		lightning.visible = lightningFlash > .025;
		lightning.scale.setScalar(.82 + lightningFlash * .36);
		lightning.rotation.y = Math.sin(time * 13.7) * .09;
	}
	setEffectMaterialResponse(root, "internal-lightning", lightningFlash * .96, lightningFlash * 3.4);
	const rainRig = root.getObjectByName("humidifier-volumetric-rain-rig");
	if (rainRig) rainRig.visible = rainStrength > .015;
	let visibleRainDrops = 0;
	let rainDropsTargetingMachine = 0;
	let rainDropsNearMachine = 0;
	const rainDrops = prefixedNodes(root, "humidifier-rain-drop-pivot-");
	rainDrops.forEach((drop, index) => {
		const phaseOffset = Number(drop.userData.phaseOffset ?? index / Math.max(1, rainDrops.length));
		const progress = fract$1((time - 2.65) * 1.16 + phaseOffset);
		const lane = Number(drop.userData.lane ?? 0);
		const depthLane = Number(drop.userData.depthLane ?? 0);
		const x = lane * 3.82 + Math.sin(index * 2.31) * .06;
		const z = depthLane * 1.86 + Math.cos(index * 1.79) * .055;
		const targetsMachine = Math.abs(x) < .92 && Math.abs(z) < .72;
		const endY = targetsMachine ? 2.82 : .13 + Math.abs(x) * .055;
		const startY = 4.55 + Math.sin(index * 1.37) * .12;
		const active = rainStrength > .025;
		drop.visible = active;
		if (!active) return;
		visibleRainDrops += 1;
		if (targetsMachine) rainDropsTargetingMachine += 1;
		else rainDropsNearMachine += 1;
		const fall = progress * progress * (3 - 2 * progress);
		drop.position.set(x, MathUtils.lerp(startY, endY, fall), z);
		const baseScale = Number(drop.userData.baseScale ?? .8);
		const appear = MathUtils.smoothstep(progress, 0, .08) * (1 - MathUtils.smoothstep(progress, .91, 1));
		const size = Math.max(.001, baseScale * rainStrength * appear);
		drop.scale.set(size * .72, size * (1.16 + progress * .32), size * .72);
		drop.rotation.z = Math.sin(index * 1.17 + time * 2.2) * .08;
	});
	setEffectMaterialResponse(root, "rain-drop", .42 + rainStrength * .5, .08 + rainStrength * .18);
	root.userData.humidifierPerformance = {
		timelineOwner: HUMIDIFIER_TIMELINE_OWNER,
		modelOwner: "humidifier-model-rig",
		sharedSpectacleEffects: "disabled",
		phase: phaseAt$8(time),
		time,
		mistStrength,
		cloudStrength,
		cloudVisualAreaRatio: 1.5 * cloudStrength * cloudStrength,
		lightningFlash,
		rainStrength,
		visibleMistVolumes,
		visibleRainDrops,
		rainDropsTargetingMachine,
		rainDropsNearMachine
	};
}
function resetHumidifierPerformance(root) {
	const dial = root.getObjectByName("humidifier-control-dial-pivot");
	if (dial) dial.rotation.z = 0;
	const outlet = root.getObjectByName("humidifier-outlet-cap-pivot");
	if (outlet) outlet.rotation.y = 0;
	const water = root.getObjectByName("humidifier-inner-water-volume");
	if (water) {
		water.position.y = 0;
		water.scale.setScalar(1);
	}
	prefixedNodes(root, "humidifier-water-glint-").forEach((glint, index) => {
		glint.position.y = 1.66 + index * .25;
		glint.scale.setScalar(1);
	});
	prefixedNodes(root, "humidifier-mist-volume-pivot-").forEach((volume) => {
		volume.visible = false;
		volume.position.set(0, 0, 0);
		volume.rotation.set(0, 0, 0);
		volume.scale.setScalar(1);
	});
	const cloud = root.getObjectByName("humidifier-volumetric-weather-cloud-rig");
	if (cloud) {
		cloud.visible = false;
		cloud.position.set(0, 0, 0);
		cloud.scale.setScalar(.001);
	}
	prefixedNodes(root, "humidifier-volumetric-weather-cloud-lobe-").forEach((lobe) => {
		const base = lobe.userData.basePosition;
		if (Array.isArray(base) && base.length >= 3) lobe.position.set(Number(base[0]), Number(base[1]), Number(base[2]));
	});
	const internalLight = root.getObjectByName("humidifier-cloud-internal-light-pivot");
	if (internalLight) {
		internalLight.visible = false;
		internalLight.scale.setScalar(1);
	}
	const lightning = root.getObjectByName("humidifier-cloud-volumetric-lightning-bolt");
	if (lightning) {
		lightning.visible = false;
		lightning.rotation.set(0, 0, 0);
		lightning.scale.set(1.05, 1.18, 1.05);
	}
	const rainRig = root.getObjectByName("humidifier-volumetric-rain-rig");
	if (rainRig) rainRig.visible = false;
	prefixedNodes(root, "humidifier-rain-drop-pivot-").forEach((drop) => {
		drop.visible = false;
		drop.position.set(0, 0, 0);
		drop.rotation.set(0, 0, 0);
		drop.scale.setScalar(1);
	});
	setEffectMaterialResponse(root, "internal-lightning", 0, 0);
	setEffectMaterialResponse(root, "mist-shell", .48, .08);
	setEffectMaterialResponse(root, "mist-shade", .34, .035);
	setEffectMaterialResponse(root, "rain-drop", .84, .12);
	delete root.userData.humidifierPerformance;
}
//#endregion
//#region src/appliances/performance/CoffeeMakerPerformance.ts
function fract(value) {
	return (value % 1 + 1) % 1;
}
function pulse$3(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function phaseAt$7(time) {
	if (time < .46) return "startup";
	if (time < 1.38) return "pre-infusion";
	if (time < 3.18) return "main-extraction";
	if (time < 4.24) return "pressure-peak";
	if (time < 5.05) return "drip-tail";
	return "satisfied-settle";
}
function prefixed$2(root, prefix) {
	const result = [];
	root.traverse((object) => {
		if (object.name.startsWith(prefix)) result.push(object);
	});
	return result;
}
function setEffectMaterial(root, kind, opacity, emission) {
	const seen = /* @__PURE__ */ new Set();
	root.traverse((object) => {
		if (!(object instanceof Mesh)) return;
		(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
			if (seen.has(material) || material.userData.coffeeMakerEffectMaterial !== kind) return;
			seen.add(material);
			material.opacity = opacity;
			const toon = material;
			toon.emissiveIntensity = emission;
		});
	});
}
/** Model-owned coffee performance; ApplianceMechanics restores the baseline first. */
function applyCoffeeMakerPerformance(root, time, power) {
	const p = MathUtils.clamp(power, 0, 1);
	const startup = MathUtils.smootherstep(time, .03, .34) * p;
	const active = MathUtils.smoothstep(time, .3, .72) * (1 - MathUtils.smoothstep(time, 4.7, 5.28)) * p;
	const pressureStrength = MathUtils.smoothstep(time, .48, 3.42) * (1 - MathUtils.smoothstep(time, 4.12, 4.88)) * p;
	const peak = MathUtils.smoothstep(time, 3.02, 3.38) * (1 - MathUtils.smoothstep(time, 4.12, 4.46)) * p;
	const satisfaction = pulse$3(time, 5, 5.18, 5.52) * p;
	const dialRotation = -Math.PI * .76 * startup;
	const dial = root.getObjectByName("coffee-maker-control-dial-pivot");
	if (dial) dial.rotation.z += dialRotation;
	const indicator = root.getObjectByName("coffee-maker-narrow-status-light");
	if (indicator) {
		const material = indicator.material;
		material.color.setHex(time >= 4.72 ? 16765603 : 16748408);
		material.emissive.setHex(time >= 4.72 ? 16753741 : 16735331);
		material.emissiveIntensity = (.42 + active * 1.9 + satisfaction * .8) * startup;
	}
	const preheatPress = pulse$3(time, .34, .57, .88);
	const pressureBeat = Math.max(0, Math.sin(time * (15 + pressureStrength * 9))) * pressureStrength;
	const bodyCompression = (preheatPress * .035 + pressureStrength * .004 + pressureBeat * (.008 + peak * .022)) * p;
	root.scale.y *= 1 - bodyCompression;
	root.position.y += Math.sin(time * 26) * (.003 + peak * .012) * active + satisfaction * .035;
	root.position.x += Math.sin(time * 31.2) * (.003 + peak * .014) * active;
	root.rotation.z += Math.sin(time * 23.4) * (.002 + peak * .009) * active;
	const head = root.getObjectByName("coffee-maker-brew-head-pivot");
	if (head) {
		head.position.y -= bodyCompression * .8;
		head.rotation.z += Math.sin(time * 29) * (.004 + peak * .012) * active;
	}
	let jumpingBeans = 0;
	const beans = prefixed$2(root, "coffee-maker-hopper-bean-pivot-");
	beans.forEach((bean, index) => {
		const hop = Math.abs(Math.sin(time * (11.5 + peak * 8.5) + index * 1.73)) * (.012 + pressureStrength * .025 + peak * .026) * active;
		bean.position.y += hop;
		bean.rotation.x += Math.sin(time * 7.2 + index) * .05 * active;
		bean.rotation.z += Math.cos(time * 6.3 + index * .7) * .04 * active;
		if (hop > .012) jumpingBeans += 1;
	});
	const dropPivots = prefixed$2(root, "coffee-maker-extraction-drop-pivot-");
	let visiblePreInfusionDrops = 0;
	dropPivots.forEach((drop, index) => {
		const preStart = .64 + index * .25;
		const tailStart = 4.24 + index * .27;
		const start = time < 2 ? preStart : tailStart;
		const duration = time < 2 ? .3 : .42;
		const progress = MathUtils.clamp((time - start) / duration, 0, 1);
		const live = time >= start && time <= start + duration && p > .01;
		drop.visible = live;
		if (!live) return;
		visiblePreInfusionDrops += time < 2 ? 1 : 0;
		drop.position.set((index - 1) * .045, -.04 - progress * .42, 0);
		drop.scale.setScalar((.72 + Math.sin(progress * Math.PI) * .58) * p);
	});
	const flowStrength = MathUtils.smoothstep(time, 1.25, 1.48) * (1 - MathUtils.smoothstep(time, 4.02, 4.38)) * p * (.78 + pressureStrength * .28 + peak * .34);
	const flows = prefixed$2(root, "coffee-maker-primary-extraction-flow-");
	let visibleExtractionColumns = 0;
	flows.forEach((flow, index) => {
		flow.visible = flowStrength > .035;
		if (!flow.visible) return;
		visibleExtractionColumns += 1;
		const thickness = .74 + flowStrength * .62 + Math.sin(time * 19 + index) * .08;
		flow.scale.set(thickness, .82 + flowStrength * .24, thickness);
	});
	const cupFill = MathUtils.smootherstep(time, 1.28, 4.38) * p;
	const liquidWobble = (1 - MathUtils.smoothstep(time, 4.48, 5.45)) * (.04 + pressureStrength * .11) * cupFill;
	const surface = root.getObjectByName("coffee-maker-cup-liquid-surface");
	if (surface) {
		surface.visible = cupFill > .015;
		surface.position.y = MathUtils.lerp(.16, .445, cupFill);
		surface.scale.set(.84 + cupFill * .16, .7 + cupFill * .3, .84 + cupFill * .16);
		surface.rotation.x += Math.sin(time * 13) * liquidWobble;
		surface.rotation.z += Math.cos(time * 11.3) * liquidWobble;
	}
	prefixed$2(root, "coffee-maker-cup-liquid-ripple-").forEach((ripple, index) => {
		ripple.visible = flowStrength > .08;
		ripple.position.y = MathUtils.lerp(.177, .462, cupFill) + index * .004;
		const rippleScale = .78 + fract(time * 2.8 + index * .46) * .68;
		ripple.scale.setScalar(rippleScale);
	});
	const steamStrength = MathUtils.smoothstep(time, 1.42, 2.05) * (1 - MathUtils.smoothstep(time, 5.2, 5.95)) * p;
	let visibleSteamVolumes = 0;
	prefixed$2(root, "coffee-maker-steam-volume-pivot-").forEach((volume, index) => {
		const phase = fract(time * (.43 + pressureStrength * .13) + Number(volume.userData.phaseOffset ?? 0));
		const life = Math.sin(phase * Math.PI) * steamStrength;
		volume.visible = life > .08;
		if (!volume.visible) return;
		visibleSteamVolumes += 1;
		const lane = Number(volume.userData.lane ?? 0);
		const forwardDrift = MathUtils.smoothstep(phase, .02, .16) * .4 + MathUtils.smoothstep(phase, .16, 1) * (.1 + peak * .08);
		volume.position.set(lane * .055 + Math.sin(time * 2 + index) * .05 * phase, phase * (.8 + peak * .52), forwardDrift + Math.cos(time * 1.6 + index) * .025 * phase);
		volume.userData.risePhase = phase;
		volume.scale.set(.55 + life * .72, .7 + life * (.8 + peak * .28), .55 + life * .72);
	});
	setEffectMaterial(root, "steam", steamStrength * .48, steamStrength * .1);
	const aromaStrength = MathUtils.smoothstep(time, 1.7, 2.35) * (1 - MathUtils.smoothstep(time, 5, 5.72)) * p;
	let visibleAromaCurls = 0;
	prefixed$2(root, "coffee-maker-volumetric-aroma-curl-").forEach((curl, index) => {
		const wave = .78 + Math.sin(time * 2.1 + index) * .16;
		curl.visible = aromaStrength > .08;
		if (!curl.visible) return;
		visibleAromaCurls += 1;
		curl.scale.set(wave, .65 + aromaStrength * (.65 + peak * .2), wave);
		curl.rotation.y += Math.sin(time * 1.4 + index) * .18;
	});
	setEffectMaterial(root, "aroma", aromaStrength * .44, aromaStrength * (.18 + peak * .28));
	let visibleWarmLightPoints = 0;
	prefixed$2(root, "coffee-maker-warm-aroma-light-point-").forEach((point, index) => {
		const phase = fract(time * .36 + Number(point.userData.phaseOffset ?? 0));
		const life = Math.sin(phase * Math.PI) * aromaStrength;
		point.visible = life > .14;
		if (!point.visible) return;
		visibleWarmLightPoints += 1;
		const forwardDrift = MathUtils.smoothstep(phase, .04, .25) * (.4 + peak * .08) + MathUtils.smoothstep(phase, .25, 1) * .08;
		point.position.set(Number(point.userData.lane ?? 0) * .075 * phase, .04 + phase * (.86 + peak * .35), forwardDrift + Math.sin(index * 1.9) * .035 * phase);
		point.scale.setScalar(.65 + life * .9);
	});
	setEffectMaterial(root, "warm-light", aromaStrength * .86, aromaStrength * (.9 + peak * 1.5));
	setEffectMaterial(root, "coffee-liquid", Math.max(cupFill * .92, flowStrength * .88, visiblePreInfusionDrops > 0 ? .9 : 0), .06 + flowStrength * .15);
	root.userData.coffeeMakerPerformanceDiagnostics = {
		time,
		phase: phaseAt$7(time),
		dialRotation,
		pressureStrength,
		bodyCompression,
		visibleBeans: beans.length,
		jumpingBeans,
		visiblePreInfusionDrops,
		visibleExtractionColumns,
		flowStrength,
		cupFill,
		liquidWobble,
		visibleSteamVolumes,
		visibleAromaCurls,
		visibleWarmLightPoints,
		timelineOwner: "AppliancePerformanceSystem",
		effectOwner: "coffee-maker-model-rig",
		sharedSpectacleEffects: "disabled",
		forbiddenPrimitives: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
}
function resetCoffeeMakerPerformance(root) {
	[
		"coffee-maker-extraction-drop-pivot-",
		"coffee-maker-primary-extraction-flow-",
		"coffee-maker-cup-liquid-ripple-",
		"coffee-maker-steam-volume-pivot-",
		"coffee-maker-volumetric-aroma-curl-",
		"coffee-maker-warm-aroma-light-point-"
	].forEach((prefix) => prefixed$2(root, prefix).forEach((object) => {
		object.visible = false;
	}));
	const surface = root.getObjectByName("coffee-maker-cup-liquid-surface");
	if (surface) surface.visible = false;
	setEffectMaterial(root, "steam", 0, 0);
	setEffectMaterial(root, "aroma", 0, 0);
	setEffectMaterial(root, "warm-light", 0, 0);
	setEffectMaterial(root, "coffee-liquid", 0, 0);
	delete root.userData.coffeeMakerPerformanceDiagnostics;
}
var WASHER_SETTLE_TIME = 5.18;
function phaseAt$6(time, power) {
	if (power <= .001 || time < .08) return "idle";
	if (time < .35) return "controls";
	if (time < 2.25) return "tumble";
	if (time < 2.72) return "spin-up";
	if (time < 4.18) return "high-spin";
	if (time < 5.18) return "braking";
	return "settled";
}
function ease(time, start, end) {
	return MathUtils.smoothstep(time, start, end);
}
function collect$1(root, prefix) {
	const result = [];
	root.traverse((object) => {
		if (object.name.startsWith(prefix)) result.push(object);
	});
	return result;
}
/** Washer-only closed performance: one rigid cabinet, one drum and model-owned wet effects. */
function createWasherPerformance(root) {
	const poses = [];
	root.traverse((object) => poses.push({
		object,
		position: object.position.clone(),
		quaternion: object.quaternion.clone(),
		scale: object.scale.clone(),
		visible: object.visible
	}));
	const byName = (name) => root.getObjectByName(name) ?? null;
	const drum = byName("washer-drum-rotor");
	const dial = byName("washer-program-dial-pivot");
	const display = byName("washer-display");
	const indicator = byName("status-indicator");
	const laundry = collect$1(root, "washer-laundry-volume-");
	const suds = collect$1(root, "washer-volumetric-suds-bubble-");
	const droplets = collect$1(root, "washer-volumetric-glass-droplet-");
	const feet = collect$1(root, "washer-foot-");
	const lightBaselines = [display?.material, indicator?.material].filter((material) => Boolean(material)).map((material) => ({
		material,
		color: material.color.clone(),
		emissive: material.emissive.clone(),
		emissiveIntensity: material.emissiveIntensity
	}));
	let signal = 0;
	const restore = () => {
		poses.forEach((pose) => {
			pose.object.position.copy(pose.position);
			pose.object.quaternion.copy(pose.quaternion);
			pose.object.scale.copy(pose.scale);
			pose.object.visible = pose.visible;
		});
		lightBaselines.forEach((baseline) => {
			baseline.material.color.copy(baseline.color);
			baseline.material.emissive.copy(baseline.emissive);
			baseline.material.emissiveIntensity = baseline.emissiveIntensity;
		});
	};
	return {
		update(time, power) {
			restore();
			const p = MathUtils.clamp(power, 0, 1);
			const phase = phaseAt$6(time, p);
			const controls = ease(time, .08, .34) * p;
			const tumble = ease(time, .35, .52) * (1 - ease(time, 2.16, 2.34)) * p;
			const slowProgress = MathUtils.clamp((time - .35) / 1.9, 0, 1);
			const highSpin = ease(time, 2.2, 2.74) * p * (1 - ease(time, 4.18, WASHER_SETTLE_TIME));
			const drumAngle = -Math.PI * 2 * 2 * slowProgress - Math.max(0, time - 2.2) * (8 + highSpin * 22);
			const drumSpeed = tumble * (Math.PI * 4 / 1.9) + highSpin * 30;
			if (drum) drum.rotation.z = drumAngle;
			if (dial) dial.rotation.z = -Math.PI * .82 * controls;
			if (display) {
				display.material.emissive.setHex(16747946);
				display.material.emissiveIntensity = controls * (.72 + Math.sin(time * 8) * .12);
			}
			if (indicator) {
				indicator.material.emissive.setHex(16740751);
				indicator.material.emissiveIntensity = controls * 1.25;
			}
			let laundryMode = "bottom";
			laundry.forEach((cloth, index) => {
				const baseAngle = -2.25 + index * .56;
				if (tumble > .01) {
					laundryMode = "lift-and-drop";
					const cycle = ((slowProgress * 2 + index * .13) % 1 + 1) % 1;
					const carried = Math.min(cycle / .68, 1);
					const fall = MathUtils.smoothstep(cycle, .68, 1);
					const angle = baseAngle + carried * Math.PI * 1.36;
					const radius = MathUtils.lerp(.43, .2, fall);
					cloth.position.x = Math.cos(angle) * radius;
					cloth.position.y = Math.sin(angle) * radius - fall * .32;
					cloth.position.z = .02 - index * .035;
					cloth.rotation.z = angle + fall * 1.5;
				} else if (time >= 4.18) {
					laundryMode = "falling";
					const fall = ease(time, 4.18 + index * .035, 4.72 + index * .035);
					cloth.position.x = MathUtils.lerp(Math.cos(baseAngle) * .42, (index - 2) * .13, fall);
					cloth.position.y = MathUtils.lerp(Math.sin(baseAngle) * .42, -.46 + index % 2 * .04, fall);
					cloth.position.z = -.05 - index * .035;
					cloth.rotation.z += fall * (index % 2 ? .9 : -.7);
				} else if (highSpin > .08) {
					laundryMode = "centrifuged";
					const angle = baseAngle + drumAngle * .98;
					cloth.position.x = Math.cos(angle) * .49;
					cloth.position.y = Math.sin(angle) * .49;
					cloth.position.z = -.08 - index * .045;
					cloth.rotation.z = angle;
				}
			});
			const imbalance = ease(time, 2.78, 3.05) * (1 - ease(time, 4.05, 4.48)) * p;
			const thud = Math.sin(Math.PI * MathUtils.clamp((time - 4.48) / .18, 0, 1)) * p;
			const sway = Math.sin(time * 34) * .075 * imbalance;
			const liftWave = Math.max(0, Math.sin(time * 22 + .8)) * .075 * imbalance;
			const tilt = Math.sin(time * 19) * .028 * imbalance + thud * .012;
			root.position.x += sway;
			root.position.y += liftWave + thud * .025;
			root.rotation.z += tilt;
			const footLoads = [
				0,
				0,
				0,
				0
			];
			feet.forEach((foot, index) => {
				const side = index % 2 === 0 ? -1 : 1;
				const load = MathUtils.clamp(1 - side * tilt * 8 - liftWave * 2.2, .68, 1.18);
				foot.scale.y *= load;
				foot.position.y -= (1 - load) * .045;
				footLoads[index] = load;
			});
			suds.forEach((bubble, index) => {
				bubble.visible = time >= .75 && time < 4.45 && index < 3 + Math.round(tumble * 3);
				bubble.position.y += Math.sin(time * 3.4 + index) * .025;
			});
			droplets.forEach((drop, index) => {
				drop.visible = time >= 1.05 && time < 5.05 && index < 2 + Math.round(highSpin * 3);
				drop.position.y -= time * (.025 + index * .004) % .12;
			});
			signal = Math.max(controls, tumble, highSpin, thud);
			root.userData.washerPerformanceDiagnostics = {
				time,
				phase,
				drumAngle,
				drumSpeed,
				slowTumbleRotations: 2,
				laundryMode,
				cabinetRigidScale: [
					root.scale.x,
					root.scale.y,
					root.scale.z
				],
				cabinetLift: liftWave + thud * .025,
				cabinetSway: sway,
				raisedSide: Math.abs(tilt) < .001 ? "none" : tilt > 0 ? "left" : "right",
				footLoads,
				visibleSuds: suds.filter((part) => part.visible).length,
				visibleDroplets: droplets.filter((part) => part.visible).length,
				finalThud: thud,
				timelineOwner: "AppliancePerformanceSystem",
				modelOwner: "washer-model-rig"
			};
		},
		stop() {
			restore();
			signal = 0;
			delete root.userData.washerPerformanceDiagnostics;
		},
		signal: () => signal
	};
}
//#endregion
//#region src/appliances/performance/KettlePerformance.ts
var TAU$5 = Math.PI * 2;
var KETTLE_TIMELINE = Object.freeze({
	engageEnd: .28,
	warmupEnd: .72,
	sustainedBoilEnd: 4.72,
	stopEnd: 5.2,
	bodyFrequencyHz: 3.6,
	lidFrequencyHz: 7.2,
	steamCycleSeconds: 1.9,
	steamRiseHeight: 4.9
});
function clamp01$3(value) {
	return MathUtils.clamp(value, 0, 1);
}
function createKettlePerformance(root) {
	const body = root.getObjectByName("kettle-body-pivot");
	const lid = root.getObjectByName("kettle-lid-hinge-pivot");
	const powerSwitch = root.getObjectByName("kettle-power-switch-pivot");
	const waterVolume = root.getObjectByName("kettle-gauge-water-volume");
	const indicator = root.getObjectByName("status-indicator");
	const bodyRest = body ? {
		position: body.position.clone(),
		quaternion: body.quaternion.clone()
	} : null;
	const lidRest = lid ? {
		position: lid.position.clone(),
		quaternion: lid.quaternion.clone()
	} : null;
	const switchRest = powerSwitch?.quaternion.clone();
	const waterScaleRest = waterVolume?.scale.clone();
	const waterEmissiveRest = (waterVolume?.material)?.emissiveIntensity ?? 0;
	const indicatorMaterial = indicator?.material;
	const indicatorRest = indicatorMaterial ? {
		color: indicatorMaterial.color.clone(),
		emissive: indicatorMaterial.emissive.clone(),
		emissiveIntensity: indicatorMaterial.emissiveIntensity
	} : null;
	const puffs = [];
	root.traverse((object) => {
		if (!object.name.startsWith("kettle-volumetric-steam-puff-") || !object.name.endsWith("-pivot")) return;
		const materials = /* @__PURE__ */ new Set();
		object.traverse((child) => {
			if (!(child instanceof Mesh)) return;
			(Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => materials.add(material));
		});
		puffs.push({
			pivot: object,
			index: Number(object.userData.steamPuffIndex ?? puffs.length),
			materials: [...materials]
		});
	});
	puffs.sort((a, b) => a.index - b.index);
	let signalValue = 0;
	const diagnostics = {
		time: 0,
		phase: "idle",
		motionEnvelope: 0,
		oscillationFrequencyHz: KETTLE_TIMELINE.bodyFrequencyHz,
		lidJumpFrequencyHz: KETTLE_TIMELINE.lidFrequencyHz,
		bodyBounce: 0,
		bodySway: 0,
		bodyRoll: 0,
		lidLift: 0,
		visibleSteamPuffs: 0,
		maxSteamOpacity: 0,
		maxSteamHeight: 0,
		plumeTopWorldY: 0,
		steamOwner: "kettle-model-rig",
		timelineOwner: "ApplianceMechanics/KettlePerformance"
	};
	root.userData.kettlePerformance = diagnostics;
	const reset = () => {
		if (body && bodyRest) {
			body.position.copy(bodyRest.position);
			body.quaternion.copy(bodyRest.quaternion);
		}
		if (lid && lidRest) {
			lid.position.copy(lidRest.position);
			lid.quaternion.copy(lidRest.quaternion);
		}
		if (powerSwitch && switchRest) powerSwitch.quaternion.copy(switchRest);
		if (waterVolume && waterScaleRest) {
			waterVolume.scale.copy(waterScaleRest);
			waterVolume.material.emissiveIntensity = waterEmissiveRest;
		}
		if (indicatorMaterial && indicatorRest) {
			indicatorMaterial.color.copy(indicatorRest.color);
			indicatorMaterial.emissive.copy(indicatorRest.emissive);
			indicatorMaterial.emissiveIntensity = indicatorRest.emissiveIntensity;
		}
		puffs.forEach(({ pivot, materials }) => {
			pivot.visible = false;
			pivot.position.set(0, 0, 0);
			pivot.rotation.set(0, 0, 0);
			pivot.scale.set(1, 1, 1);
			materials.forEach((material) => {
				material.opacity = 0;
			});
		});
		signalValue = 0;
		Object.assign(diagnostics, {
			time: 0,
			phase: "idle",
			motionEnvelope: 0,
			bodyBounce: 0,
			bodySway: 0,
			bodyRoll: 0,
			lidLift: 0,
			visibleSteamPuffs: 0,
			maxSteamOpacity: 0,
			maxSteamHeight: 0,
			plumeTopWorldY: 0
		});
	};
	const apply = (rawTime, rawPower) => {
		const time = Math.max(0, rawTime);
		const power = clamp01$3(rawPower);
		const boil = MathUtils.smoothstep(time, KETTLE_TIMELINE.engageEnd, KETTLE_TIMELINE.warmupEnd) * (1 - MathUtils.smoothstep(time, KETTLE_TIMELINE.sustainedBoilEnd, KETTLE_TIMELINE.stopEnd)) * power;
		const bodyPhase = time * TAU$5 * KETTLE_TIMELINE.bodyFrequencyHz;
		const lidPhase = time * TAU$5 * KETTLE_TIMELINE.lidFrequencyHz;
		const bounce = (.5 + Math.sin(bodyPhase) * .5) * .076 * boil;
		const sway = Math.sin(bodyPhase + .42) * .068 * boil;
		const roll = Math.sin(bodyPhase + .86) * .057 * boil;
		const lidLift = Math.pow(.5 + Math.sin(lidPhase - .62) * .5, 2.2) * .112 * boil;
		if (body && bodyRest) {
			body.position.copy(bodyRest.position).add(new Vector3(sway, bounce, 0));
			body.quaternion.copy(bodyRest.quaternion);
			body.rotateZ(roll);
			body.rotateX(Math.sin(bodyPhase - .28) * .01 * boil);
		}
		if (lid && lidRest) {
			lid.position.copy(lidRest.position);
			lid.quaternion.copy(lidRest.quaternion);
			lid.rotateX(-lidLift);
			lid.rotateZ(Math.sin(lidPhase - .44) * .018 * boil);
		}
		if (powerSwitch && switchRest) {
			powerSwitch.quaternion.copy(switchRest);
			powerSwitch.rotateX(-.2 * MathUtils.smoothstep(time, .02, KETTLE_TIMELINE.engageEnd) * power);
			powerSwitch.rotateZ(-Math.PI * .56 * MathUtils.smoothstep(time, .02, KETTLE_TIMELINE.engageEnd) * power);
		}
		if (waterVolume && waterScaleRest) {
			waterVolume.scale.copy(waterScaleRest);
			waterVolume.scale.y *= 1 + Math.sin(time * 3.1) * .016 * boil;
			waterVolume.material.emissiveIntensity = waterEmissiveRest + .075 * boil;
		}
		let visibleSteamPuffs = 0;
		let maxSteamOpacity = 0;
		let maxSteamHeight = 0;
		puffs.forEach(({ pivot, index, materials }) => {
			const localTime = time - .34 - index * .12;
			if (localTime < 0 || boil <= .004) {
				pivot.visible = false;
				materials.forEach((material) => {
					material.opacity = 0;
				});
				return;
			}
			const cycle = KETTLE_TIMELINE.steamCycleSeconds;
			const variant = (Math.floor(localTime / cycle) % 3 + 3) % 3;
			const progress = (localTime % cycle + cycle) % cycle / cycle;
			const visibility = MathUtils.smoothstep(progress, .01, .1) * (1 - MathUtils.smoothstep(progress, .88, 1)) * boil;
			if (visibility <= .006) {
				pivot.visible = false;
				materials.forEach((material) => {
					material.opacity = 0;
				});
				return;
			}
			const lateralBias = Number(pivot.userData.lateralBias ?? 0);
			const baseScale = Number(pivot.userData.baseScale ?? 1);
			const twistRate = Number(pivot.userData.twistRate ?? .4);
			const driftPhase = time * (1.18 + index % 4 * .09) + index * 1.37;
			const expansion = baseScale * (.88 + progress * 1.58);
			const variantOffset = variant === 0 ? -.025 : variant === 1 ? .12 : -.14;
			pivot.visible = true;
			pivot.position.set(lateralBias + variantOffset + Math.sin(driftPhase) * (.035 + progress * .15), progress * (KETTLE_TIMELINE.steamRiseHeight + index % 3 * .16), Math.cos(driftPhase * .83) * (.025 + progress * .09));
			const variantScale = variant === 0 ? new Vector3(.92, 1, .94) : variant === 1 ? new Vector3(.7, 1.2, .82) : new Vector3(1.2, .88, 1.08);
			pivot.scale.set(expansion * variantScale.x * (1 + Math.sin(driftPhase) * .05), expansion * variantScale.y, expansion * variantScale.z);
			pivot.rotation.y = time * twistRate + index * .51;
			pivot.rotation.z = Math.sin(driftPhase * .72) * .2 + (variant - 1) * .16;
			const top = pivot.position.y + expansion * .46;
			maxSteamHeight = Math.max(maxSteamHeight, top);
			materials.forEach((material, materialIndex) => {
				const opacity = visibility * (materialIndex === materials.length - 1 ? .34 : .66);
				material.opacity = opacity;
				maxSteamOpacity = Math.max(maxSteamOpacity, opacity);
			});
			visibleSteamPuffs += 1;
		});
		if (indicatorMaterial && indicatorRest) {
			indicatorMaterial.color.setHex(boil > .02 ? 16767461 : indicatorRest.color.getHex());
			indicatorMaterial.emissive.setHex(boil > .02 ? 16731496 : indicatorRest.emissive.getHex());
			indicatorMaterial.emissiveIntensity = indicatorRest.emissiveIntensity + boil * 1.8;
		}
		root.updateMatrixWorld(true);
		const outletWorldY = root.getObjectByName("kettle-spout-steam-socket")?.getWorldPosition(new Vector3()).y ?? 0;
		signalValue = boil;
		Object.assign(diagnostics, {
			time,
			phase: time < KETTLE_TIMELINE.engageEnd ? "engage" : time < KETTLE_TIMELINE.warmupEnd ? "warmup" : time < KETTLE_TIMELINE.sustainedBoilEnd ? "steady-boil" : "smooth-settle",
			motionEnvelope: boil,
			bodyBounce: bounce,
			bodySway: sway,
			bodyRoll: roll,
			lidLift,
			visibleSteamPuffs,
			maxSteamOpacity,
			maxSteamHeight,
			plumeTopWorldY: outletWorldY + maxSteamHeight
		});
	};
	return {
		apply,
		reset,
		signal: () => signalValue,
		diagnostics
	};
}
//#endregion
//#region src/appliances/performance/RiceCookerPerformance.ts
var TAU$4 = Math.PI * 2;
var RICE_COOKER_TIMELINE = Object.freeze({
	engageEnd: .32,
	warmupEnd: 1.22,
	alternatingStart: 1.22,
	alternatingEnd: 4.48,
	settleEnd: 5.2,
	lidBeatSeconds: .38,
	highLidAngle: .44,
	lowLidAngle: .22,
	steamCycleSeconds: 2.45,
	steamRiseHeight: 2.85
});
function clamp01$2(value) {
	return MathUtils.clamp(value, 0, 1);
}
function collect(root, prefix, suffix = "") {
	const result = [];
	root.traverse((object) => {
		if (object.name.startsWith(prefix) && object.name.endsWith(suffix)) result.push(object);
	});
	return result;
}
function phaseAt$5(time, power) {
	if (power <= .001 || time <= 0) return "idle";
	if (time < RICE_COOKER_TIMELINE.engageEnd) return "engage";
	if (time < RICE_COOKER_TIMELINE.alternatingStart) return "warm-up";
	if (time < RICE_COOKER_TIMELINE.alternatingEnd) return "high-low-boil";
	return "natural-settle";
}
/** Rice-cooker-only closed performance rig. The model owns every grain and
* steam volume; this controller only samples their deterministic poses. */
function createRiceCookerPerformance(root) {
	const body = root.getObjectByName("rice-cooker-body-pivot");
	const lid = root.getObjectByName("rice-cooker-lid-hinge-pivot");
	const lidShell = root.getObjectByName("rice-cooker-domed-lid-shell");
	const cookSwitchPivot = root.getObjectByName("rice-cooker-cook-switch-pivot");
	const cookSwitch = root.getObjectByName("rice-cooker-cook-switch");
	const latch = root.getObjectByName("rice-cooker-rear-latch-pivot");
	const steamSocket = root.getObjectByName("rice-cooker-steam-socket");
	const bedKernels = collect(root, "rice-cooker-bed-kernel-", "-pivot");
	const airborneKernels = collect(root, "rice-cooker-airborne-kernel-", "-pivot").sort((a, b) => Number(a.userData.flightIndex) - Number(b.userData.flightIndex));
	const steamVolumes = collect(root, "rice-cooker-volumetric-steam-puff-", "-pivot").map((pivot) => {
		const materials = /* @__PURE__ */ new Set();
		pivot.traverse((object) => {
			if (!(object instanceof Mesh)) return;
			(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
		});
		return {
			pivot,
			index: Number(pivot.userData.steamPuffIndex),
			materials: [...materials]
		};
	}).sort((a, b) => a.index - b.index);
	const poses = [
		body,
		lid,
		cookSwitchPivot,
		cookSwitch,
		latch,
		...bedKernels,
		...airborneKernels,
		...steamVolumes.map(({ pivot }) => pivot)
	].filter((object) => Boolean(object)).map((object) => ({
		object,
		position: object.position.clone(),
		quaternion: object.quaternion.clone(),
		scale: object.scale.clone(),
		visible: object.visible
	}));
	const lightMaterials = /* @__PURE__ */ new Set();
	["rice-cooker-status-lamp-left", "rice-cooker-status-lamp-right"].forEach((name) => {
		const mesh = root.getObjectByName(name);
		if (!mesh) return;
		(Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => lightMaterials.add(material));
	});
	steamVolumes.forEach(({ materials }) => materials.forEach((material) => lightMaterials.add(material)));
	const materials = [...lightMaterials].map((material) => ({
		material,
		color: material.color.clone(),
		emissive: material.emissive.clone(),
		emissiveIntensity: material.emissiveIntensity,
		opacity: material.opacity
	}));
	const lidRestParent = lidShell?.parent ?? null;
	let signalValue = 0;
	const diagnostics = {
		time: 0,
		phase: "idle",
		steamEnvelope: 0,
		lidBeat: "none",
		lidBeatIndex: -1,
		lidLiftAngle: 0,
		bodyBounce: 0,
		visibleSteamVolumes: 0,
		maxSteamOpacity: 0,
		maxSteamHeight: 0,
		plumeTopWorldY: 0,
		visibleAirborneRice: 0,
		landedRice: 0,
		sharedRiceGeometry: true,
		lidAttachedToHinge: lidRestParent === lid,
		timelineOwner: "RiceCookerPerformance",
		modelOwner: "rice-cooker-model-rig"
	};
	root.userData.riceCookerPerformance = diagnostics;
	const restore = () => {
		poses.forEach((pose) => {
			pose.object.position.copy(pose.position);
			pose.object.quaternion.copy(pose.quaternion);
			pose.object.scale.copy(pose.scale);
			pose.object.visible = pose.visible;
		});
		materials.forEach((state) => {
			state.material.color.copy(state.color);
			state.material.emissive.copy(state.emissive);
			state.material.emissiveIntensity = state.emissiveIntensity;
			state.material.opacity = state.opacity;
		});
	};
	const reset = () => {
		restore();
		airborneKernels.forEach((kernel) => {
			kernel.visible = false;
		});
		steamVolumes.forEach(({ pivot, materials: puffMaterials }) => {
			pivot.visible = false;
			puffMaterials.forEach((material) => {
				material.opacity = 0;
			});
		});
		signalValue = 0;
		Object.assign(diagnostics, {
			time: 0,
			phase: "idle",
			steamEnvelope: 0,
			lidBeat: "none",
			lidBeatIndex: -1,
			lidLiftAngle: 0,
			bodyBounce: 0,
			visibleSteamVolumes: 0,
			maxSteamOpacity: 0,
			maxSteamHeight: 0,
			plumeTopWorldY: 0,
			visibleAirborneRice: 0,
			landedRice: 0,
			lidAttachedToHinge: lidShell?.parent === lid
		});
	};
	const apply = (rawTime, rawPower) => {
		restore();
		const time = Math.max(0, rawTime);
		const power = clamp01$2(rawPower);
		const steamEnvelope = MathUtils.smoothstep(time, RICE_COOKER_TIMELINE.engageEnd, RICE_COOKER_TIMELINE.warmupEnd) * (1 - MathUtils.smoothstep(time, RICE_COOKER_TIMELINE.alternatingEnd - .08, RICE_COOKER_TIMELINE.settleEnd)) * power;
		const engaged = MathUtils.smoothstep(time, .04, RICE_COOKER_TIMELINE.engageEnd) * power;
		if (cookSwitchPivot) cookSwitchPivot.rotateX(-.2 * engaged);
		if (cookSwitch) cookSwitch.position.z -= .018 * engaged;
		let lidBeat = "none";
		let lidBeatIndex = -1;
		let lidLiftAngle = .025 * steamEnvelope;
		if (time >= RICE_COOKER_TIMELINE.alternatingStart && time < RICE_COOKER_TIMELINE.alternatingEnd) {
			const beatTime = time - RICE_COOKER_TIMELINE.alternatingStart;
			lidBeatIndex = Math.floor(beatTime / RICE_COOKER_TIMELINE.lidBeatSeconds);
			const beatProgress = beatTime % RICE_COOKER_TIMELINE.lidBeatSeconds / RICE_COOKER_TIMELINE.lidBeatSeconds;
			const beatPulse = Math.sin(beatProgress * Math.PI) ** 2;
			const isHigh = lidBeatIndex % 2 === 0;
			lidBeat = isHigh ? "high" : "low";
			const amplitude = isHigh ? RICE_COOKER_TIMELINE.highLidAngle : RICE_COOKER_TIMELINE.lowLidAngle;
			lidLiftAngle += amplitude * beatPulse * steamEnvelope;
		} else if (time >= RICE_COOKER_TIMELINE.alternatingEnd) lidBeat = "settle";
		if (lid) {
			lid.rotateX(-lidLiftAngle);
			lid.rotateZ(Math.sin(time * TAU$4 * 1.35) * .012 * steamEnvelope);
		}
		if (latch) latch.rotateZ(Math.sin(time * TAU$4 * 2.1) * .035 * steamEnvelope);
		const bodyBounce = Math.abs(Math.sin(time * TAU$4 * 2.35)) * .022 * steamEnvelope;
		if (body) {
			body.position.y += bodyBounce;
			body.rotateZ(Math.sin(time * TAU$4 * 1.7) * .008 * steamEnvelope);
		}
		bedKernels.forEach((kernel, index) => {
			kernel.position.y += Math.abs(Math.sin(time * (4.8 + index % 3 * .25) + index * .73)) * .01 * steamEnvelope;
			kernel.rotateZ(Math.sin(time * 3.2 + index) * .025 * steamEnvelope);
		});
		let visibleAirborneRice = 0;
		let landedRice = 0;
		airborneKernels.forEach((kernel, index) => {
			const launchTime = Number(kernel.userData.launchTime);
			const duration = Number(kernel.userData.flightDuration);
			const progress = (time - launchTime) / duration;
			const start = new Vector3().fromArray(kernel.userData.startPosition);
			if (progress < 0 || power <= .001) {
				kernel.visible = false;
				return;
			}
			if (progress >= 1) {
				kernel.position.copy(start);
				kernel.visible = false;
				landedRice += 1;
				return;
			}
			const arc = Math.sin(progress * Math.PI);
			const driftX = Number(kernel.userData.driftX);
			const driftZ = Number(kernel.userData.driftZ);
			kernel.visible = true;
			kernel.position.set(start.x + driftX * progress + Math.sin(progress * Math.PI * 2 + index) * .045 * arc, start.y + Number(kernel.userData.apexHeight) * arc - .28 * progress * progress, start.z + driftZ * progress + Math.cos(progress * Math.PI * 2 + index) * .04 * arc);
			kernel.rotateX(progress * TAU$4 * (1.1 + index % 3 * .25));
			kernel.rotateZ(progress * TAU$4 * (.7 + index % 2 * .3));
			visibleAirborneRice += 1;
		});
		let visibleSteamVolumes = 0;
		let maxSteamOpacity = 0;
		let maxSteamHeight = 0;
		steamVolumes.forEach(({ pivot, index, materials: puffMaterials }) => {
			const localTime = time - .46 - index * .14;
			if (localTime < 0 || steamEnvelope <= .004) {
				pivot.visible = false;
				puffMaterials.forEach((material) => {
					material.opacity = 0;
				});
				return;
			}
			const cycle = RICE_COOKER_TIMELINE.steamCycleSeconds;
			const progress = (localTime % cycle + cycle) % cycle / cycle;
			const visibility = MathUtils.smoothstep(progress, .01, .12) * (1 - MathUtils.smoothstep(progress, .84, 1)) * steamEnvelope;
			if (visibility <= .006) {
				pivot.visible = false;
				puffMaterials.forEach((material) => {
					material.opacity = 0;
				});
				return;
			}
			const driftPhase = time * (1.55 + index * .04) + index * .91;
			const expansion = Number(pivot.userData.baseScale) * (.78 + progress * 1.5);
			pivot.visible = true;
			pivot.position.set(Number(pivot.userData.lateralBias) + Math.sin(driftPhase) * (.025 + progress * .12), progress * (RICE_COOKER_TIMELINE.steamRiseHeight + index % 3 * .12), Math.cos(driftPhase * .84) * (.02 + progress * .08));
			pivot.scale.set(expansion * .94, expansion, expansion * .9);
			pivot.rotation.y = driftPhase * .38;
			pivot.rotation.z = Math.sin(driftPhase * .65) * .16;
			const opacity = visibility * .62;
			puffMaterials.forEach((material) => {
				material.opacity = opacity;
				material.emissiveIntensity = .025 * steamEnvelope;
			});
			maxSteamOpacity = Math.max(maxSteamOpacity, opacity);
			maxSteamHeight = Math.max(maxSteamHeight, pivot.position.y + expansion * .36);
			visibleSteamVolumes += 1;
		});
		materials.slice(0, 2).forEach((state, index) => {
			state.material.color.setHex(index === 0 ? 16766943 : 16766909);
			state.material.emissive.setHex(index === 0 ? 16733557 : 16751960);
			state.material.emissiveIntensity = engaged * (index === 0 ? 1.25 : .82);
		});
		root.updateMatrixWorld(true);
		const outletWorldY = steamSocket?.getWorldPosition(new Vector3()).y ?? 0;
		signalValue = Math.max(engaged, steamEnvelope, lidLiftAngle);
		Object.assign(diagnostics, {
			time,
			phase: phaseAt$5(time, power),
			steamEnvelope,
			lidBeat,
			lidBeatIndex,
			lidLiftAngle,
			bodyBounce,
			visibleSteamVolumes,
			maxSteamOpacity,
			maxSteamHeight,
			plumeTopWorldY: outletWorldY + maxSteamHeight,
			visibleAirborneRice,
			landedRice,
			lidAttachedToHinge: lidShell?.parent === lid
		});
	};
	return {
		update: apply,
		stop: reset,
		signal: () => signalValue,
		apply,
		reset,
		diagnostics
	};
}
//#endregion
//#region src/appliances/performance/PhonePerformance.ts
var PHONE_TIMELINE_OWNER = "AppliancePerformanceSystem";
function pulse$2(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function phaseAt$4(time) {
	if (time < .32) return "screen-wake";
	if (time < 1.35) return "incoming-call";
	if (time < 4.72) return "urgent-reminder";
	return "settling";
}
function glow(target, strength, color) {
	target?.traverse((object) => {
		if (!(object instanceof Mesh)) return;
		(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
			const toon = material;
			if (!toon.emissive) return;
			toon.emissive.setHex(strength > .01 ? color : 0);
			toon.emissiveIntensity = strength;
		});
	});
}
function named$1(root, name) {
	return root.getObjectByName(name) ?? null;
}
function prefixed$1(root, prefix) {
	const result = [];
	root.traverse((object) => {
		if (object.name.startsWith(prefix)) result.push(object);
	});
	return result;
}
/**
* One deterministic incoming-call performance for game and gallery. The body
* lift/shake/roll values intentionally match the previous phone branch in
* ApplianceMechanics; only the screen language and volumetric feedback change.
* The shared caller restores the authored baseline before each sample.
*/
function applyPhonePerformance(root, time, power) {
	const p = MathUtils.clamp(power, 0, 1);
	const run = MathUtils.smoothstep(time, .02, .42) * p;
	const anticipation = pulse$2(time, 2.8, 3.42, 3.72) * p;
	const bodyLift = pulse$2(time, .35, 3.65, 5.15) * p * (.72 + anticipation * .22);
	const bodyShakeX = Math.sin(time * 39) * .055 * run;
	const bodyRoll = Math.sin(time * 35) * .045 * run;
	const handset = named$1(root, "phone-handset-pivot");
	if (handset) {
		handset.position.y += bodyLift;
		handset.position.x += bodyShakeX;
		handset.rotation.z += bodyRoll;
	}
	const wake = MathUtils.smoothstep(time, .035, .15) * p;
	const settle = 1 - MathUtils.smoothstep(time, 4.64, 5.15);
	const reminderGate = MathUtils.smoothstep(time, .42, .72) * settle * p;
	const screenLit = wake > .05;
	const ui = named$1(root, "phone-incoming-call-ui-pivot");
	if (ui) ui.visible = screenLit;
	glow(named$1(root, "phone-layered-rounded-display-glass"), wake * (.24 + reminderGate * .2), 9400212);
	glow(ui, wake * (.4 + reminderGate * .52), 16748206);
	const promptFlash = .5 + .5 * Math.sin(time * 8.6);
	const promptVisible = screenLit && (time < .58 || promptFlash > .3);
	const prompt = named$1(root, "phone-incoming-label-CALLING");
	if (prompt) prompt.visible = promptVisible;
	const avatarPulse = 1 + reminderGate * (.035 + (.5 + .5 * Math.sin(time * 6.6)) * .075);
	const avatar = named$1(root, "phone-incoming-avatar-pivot");
	if (avatar) avatar.scale.setScalar(avatarPulse);
	const answerPulse = 1 + reminderGate * (.055 + (.5 + .5 * Math.sin(time * 7.8 + .4)) * .095);
	const answer = named$1(root, "phone-call-answer-button-pivot");
	if (answer) answer.scale.setScalar(answerPulse);
	const hangup = named$1(root, "phone-call-hangup-button-pivot");
	if (hangup) hangup.scale.setScalar(1 + reminderGate * .025);
	glow(named$1(root, "phone-call-answer-button"), wake * (.65 + reminderGate * .9), 5625501);
	glow(named$1(root, "phone-call-hangup-button"), wake * (.52 + reminderGate * .36), 15944562);
	let visibleStereoWaveRings = 0;
	for (let index = 0; index < 3; index += 1) {
		const wave = named$1(root, `phone-stereo-wave-ring-${index + 1}`);
		if (!wave) continue;
		const age = time - .24 - index * .2;
		const cycle = 1.02;
		const progress = (age % cycle + cycle) % cycle / cycle;
		wave.visible = age >= 0 && progress < .82 && reminderGate > .02;
		if (!wave.visible) continue;
		visibleStereoWaveRings += 1;
		const growth = .82 + progress * 1.35;
		wave.scale.set((.72 + index * .08) * growth, (1.22 + index * .1) * growth, .8 + progress * .45);
		wave.position.z = .05 + progress * .42;
		wave.rotation.z = (index % 2 === 0 ? -1 : 1) * progress * .09;
	}
	let visibleVibrationPulses = 0;
	prefixed$1(root, "phone-vibration-pulse-").forEach((arc, index) => {
		const beat = .5 + .5 * Math.sin(time * 31 + index * 1.43);
		arc.visible = reminderGate > .05 && beat > .32;
		if (!arc.visible) return;
		visibleVibrationPulses += 1;
		const scale = .88 + beat * .26;
		arc.scale.set(scale, scale, .88 + beat * .18);
	});
	let visibleCallSignalArcs = 0;
	prefixed$1(root, "phone-call-signal-arc-").forEach((arc, index) => {
		const progress = ((time - .34 - index % 3 * .11) % .76 + .76) % .76 / .76;
		arc.visible = reminderGate > .04 && progress < .72;
		if (!arc.visible) return;
		visibleCallSignalArcs += 1;
		arc.scale.setScalar(.78 + progress * .48);
		arc.position.z = .052 + progress * .18;
	});
	let visibleSoftLightPoints = 0;
	prefixed$1(root, "phone-soft-notification-light-").forEach((point, index) => {
		const angle = time * (1.5 + index % 3 * .12) + Number(point.userData.baseAngle ?? index);
		const pulseValue = .5 + .5 * Math.sin(time * 6.8 + index * .8);
		point.visible = reminderGate > .08 && pulseValue > .22;
		if (!point.visible) return;
		visibleSoftLightPoints += 1;
		point.position.set(Math.cos(angle) * (.7 + index % 2 * .08), Math.sin(angle) * (.91 + index % 3 * .05), .09 + Math.sin(time * 3.2 + index) * .07);
		point.scale.setScalar(.74 + pulseValue * .58);
	});
	let visibleInformationParticles = 0;
	for (let index = 0; index < 6; index += 1) {
		const particle = named$1(root, `phone-information-particle-${index + 1}`);
		if (!particle) continue;
		const age = time - .68 - index * .14;
		const cycle = 1.46;
		const progress = (age % cycle + cycle) % cycle / cycle;
		particle.visible = age >= 0 && progress < .82 && reminderGate > .04;
		if (!particle.visible) continue;
		visibleInformationParticles += 1;
		const side = index % 2 === 0 ? -1 : 1;
		particle.position.set(side * (.58 + index % 3 * .07 + Math.sin(time * 3.8 + index) * .055), -.5 + progress * 1.38, .1 + progress * .28);
		particle.rotation.z = side * (.14 + Math.sin(time * 4.2 + index) * .18);
		particle.scale.setScalar(.68 + Math.sin(progress * Math.PI) * .48);
	}
	glow(named$1(root, "phone-call-feedback-rig"), reminderGate * (.78 + promptFlash * .42), 16752312);
	root.userData.phonePerformance = {
		timelineOwner: PHONE_TIMELINE_OWNER,
		modelOwner: "phone-model-rig",
		sharedSpectacleEffects: "disabled",
		phase: phaseAt$4(time),
		timeline: time,
		screenLit,
		promptVisible,
		avatarPulse,
		answerPulse,
		bodyLift,
		bodyShakeX,
		bodyRoll,
		visibleStereoWaveRings,
		visibleVibrationPulses,
		visibleCallSignalArcs,
		visibleSoftLightPoints,
		visibleInformationParticles,
		forbiddenFlatEffects: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		],
		forbiddenThemes: [
			"combat-star",
			"electric-bolt",
			"ultimate-attack"
		]
	};
}
function resetPhonePerformance(root) {
	const ui = named$1(root, "phone-incoming-call-ui-pivot");
	if (ui) ui.visible = false;
	const feedback = named$1(root, "phone-call-feedback-rig");
	feedback?.traverse((object) => {
		if (object.userData.performanceEffect) object.visible = false;
	});
	if (feedback) feedback.visible = true;
	glow(named$1(root, "phone-layered-rounded-display-glass"), 0, 0);
	delete root.userData.phonePerformance;
}
//#endregion
//#region src/appliances/performance/PopcornMachinePerformance.ts
var TAU$3 = Math.PI * 2;
var POPCORN_MACHINE_TIMELINE = Object.freeze({
	warmupEnd: .46,
	rapidPopStart: .46,
	burstStart: .92,
	climaxStart: 3.2,
	settleStart: 4.6,
	stopEnd: 5.2,
	internalPieceCount: 80,
	staticPieceCount: 56,
	poweredPieceCount: 24,
	externalPieceCount: 48,
	minimumInternalFrequencyHz: 7.4
});
function suffixIndex$2(name) {
	return Number(name.match(/(\d+)$/)?.[1] ?? 0);
}
function asVector(value, fallback = new Vector3()) {
	return Array.isArray(value) && value.length >= 3 ? new Vector3(Number(value[0]), Number(value[1]), Number(value[2])) : fallback.clone();
}
function cubicPoint(target, path, t) {
	const inverse = 1 - t;
	const inverse2 = inverse * inverse;
	const t2 = t * t;
	return target.set(inverse2 * inverse * path[0].x + 3 * inverse2 * t * path[1].x + 3 * inverse * t2 * path[2].x + t2 * t * path[3].x, inverse2 * inverse * path[0].y + 3 * inverse2 * t * path[1].y + 3 * inverse * t2 * path[2].y + t2 * t * path[3].y, inverse2 * inverse * path[0].z + 3 * inverse2 * t * path[1].z + 3 * inverse * t2 * path[2].z + t2 * t * path[3].z);
}
function createPopcornMachinePerformance(root) {
	const rotor = root.getObjectByName("popcorn-machine-popper-pivot");
	const rotorRest = rotor?.quaternion.clone();
	const internalMeshes = [];
	const externalMeshes = [];
	const staticPieces = [];
	root.traverse((object) => {
		if (object instanceof InstancedMesh && object.name.includes("popped-kernel")) (Array.isArray(object.userData.performanceInstances) ? object.userData.performanceInstances : []).forEach((entry) => {
			const rotation = asVector(entry.idleRotation);
			staticPieces.push({
				batch: object,
				instanceIndex: Number(entry.instanceIndex),
				idlePosition: asVector(entry.idlePosition),
				idleRotation: new Euler(rotation.x, rotation.y, rotation.z),
				idleScale: asVector(entry.idleScale, new Vector3(1, 1, 1)),
				phase: Number(entry.phase ?? 0),
				frequency: Number(entry.frequency ?? 7.55),
				jumpHeight: Number(entry.jumpHeight ?? .09)
			});
		});
		if (object instanceof Mesh) {
			if (object.name.startsWith("popcorn-machine-powered-pop-")) internalMeshes.push(object);
			if (object.name.startsWith("popcorn-machine-outward-pop-")) externalMeshes.push(object);
		}
	});
	internalMeshes.sort((a, b) => suffixIndex$2(a.name) - suffixIndex$2(b.name));
	externalMeshes.sort((a, b) => suffixIndex$2(a.name) - suffixIndex$2(b.name));
	const internal = internalMeshes.map((piece, arrayIndex) => {
		const index = suffixIndex$2(piece.name) || arrayIndex + 1;
		return {
			index,
			seed: root.getObjectByName(`popcorn-machine-unpopped-seed-${index}`) ?? null,
			piece,
			source: piece.position.clone(),
			target: asVector(piece.userData.performanceTarget, piece.position),
			baseScale: Number(piece.userData.performanceScale ?? .86),
			phase: Number(piece.userData.performancePhase ?? .46 + arrayIndex * .075),
			frequency: Number(piece.userData.performanceJumpFrequencyHz ?? 7.4 + arrayIndex % 6 * .38),
			jumpHeight: Number(piece.userData.performanceJumpHeight ?? .46 + arrayIndex % 4 * .055),
			spin: asVector(piece.userData.performanceRotation, new Vector3(1, 2, 1))
		};
	});
	const external = externalMeshes.map((piece, arrayIndex) => {
		const rawPath = Array.isArray(piece.userData.performancePath) ? piece.userData.performancePath : [];
		const source = piece.position.clone();
		return {
			index: suffixIndex$2(piece.name) || arrayIndex + 1,
			piece,
			path: [
				asVector(rawPath[0], source),
				asVector(rawPath[1], source),
				asVector(rawPath[2], source),
				asVector(rawPath[3], source)
			],
			launchTime: Number(piece.userData.performanceLaunchTime ?? .92 + arrayIndex * .115),
			flightDuration: Number(piece.userData.performanceFlightDuration ?? 1.08),
			baseScale: Number(piece.userData.performanceScale ?? .9),
			spinRate: asVector(piece.userData.performanceRotationRate, new Vector3(6, 8, 5))
		};
	});
	const interiorGeometries = new Set(internal.map(({ piece }) => piece.geometry));
	const interiorMaterials = new Set(internal.map(({ piece }) => piece.material));
	const externalGeometryMatchesInterior = external.every(({ piece }) => interiorGeometries.has(piece.geometry));
	const externalMaterialMatchesInterior = external.every(({ piece }) => interiorMaterials.has(piece.material));
	const outwardMinimumDistance = external.length > 0 ? Math.min(...external.map(({ path }) => path[3].z - path[0].z)) : 0;
	const crestHeights = external.map(({ path }) => path[2].y);
	const peakHeightSpread = crestHeights.length > 0 ? Math.max(...crestHeights) - Math.min(...crestHeights) : 0;
	const internalFrequencies = [...staticPieces.map(({ frequency }) => frequency), ...internal.map(({ frequency }) => frequency)];
	const minimumInternalFrequencyHz = internalFrequencies.length > 0 ? Math.min(...internalFrequencies) : 0;
	const maximumInternalFrequencyHz = internalFrequencies.length > 0 ? Math.max(...internalFrequencies) : 0;
	const samplePosition = new Vector3();
	const staticTransform = new Object3D();
	let signalValue = 0;
	const diagnostics = {
		time: 0,
		phase: "idle",
		motionEnvelope: 0,
		internalPieceCount: staticPieces.length + internal.length,
		staticPieceCount: staticPieces.length,
		animatedStaticPieces: 0,
		internalVisible: 0,
		internalJumping: 0,
		minimumInternalFrequencyHz,
		maximumInternalFrequencyHz,
		maximumInternalJumpHeight: 0,
		externalPieceCount: external.length,
		visibleExternal: 0,
		externalFrontmostZ: 0,
		outwardMinimumDistance,
		peakHeightSpread,
		externalGeometryMatchesInterior,
		externalMaterialMatchesInterior,
		direction: "inside-to-outside-positive-z",
		effectOwner: "PopcornMachinePerformance",
		timelineOwner: "ApplianceMechanics/PopcornMachinePerformance"
	};
	root.userData.popcornMachinePerformance = diagnostics;
	const reset = () => {
		if (rotor && rotorRest) rotor.quaternion.copy(rotorRest);
		staticPieces.forEach((rig) => {
			staticTransform.position.copy(rig.idlePosition);
			staticTransform.rotation.copy(rig.idleRotation);
			staticTransform.scale.copy(rig.idleScale);
			staticTransform.updateMatrix();
			rig.batch.setMatrixAt(rig.instanceIndex, staticTransform.matrix);
		});
		new Set(staticPieces.map(({ batch }) => batch)).forEach((batch) => {
			batch.instanceMatrix.needsUpdate = true;
		});
		internal.forEach(({ seed, piece, source }) => {
			if (seed) seed.visible = true;
			piece.visible = false;
			piece.position.copy(source);
			piece.rotation.set(0, 0, 0);
			piece.scale.setScalar(.001);
		});
		external.forEach(({ piece, path }) => {
			piece.visible = false;
			piece.position.copy(path[0]);
			piece.rotation.set(0, 0, 0);
			piece.scale.set(1, 1, 1);
		});
		signalValue = 0;
		Object.assign(diagnostics, {
			time: 0,
			phase: "idle",
			motionEnvelope: 0,
			internalVisible: 0,
			internalJumping: 0,
			animatedStaticPieces: 0,
			maximumInternalJumpHeight: 0,
			visibleExternal: 0,
			externalFrontmostZ: 0
		});
	};
	const apply = (rawTime, rawPower) => {
		const time = Math.max(0, rawTime);
		const power = MathUtils.clamp(rawPower, 0, 1);
		const envelope = MathUtils.smoothstep(time, .08, POPCORN_MACHINE_TIMELINE.warmupEnd) * (1 - MathUtils.smoothstep(time, POPCORN_MACHINE_TIMELINE.settleStart, POPCORN_MACHINE_TIMELINE.stopEnd)) * power;
		const climax = MathUtils.smoothstep(time, POPCORN_MACHINE_TIMELINE.climaxStart, 3.72) * (1 - MathUtils.smoothstep(time, 4.35, POPCORN_MACHINE_TIMELINE.stopEnd));
		signalValue = envelope;
		if (rotor && rotorRest) {
			rotor.quaternion.copy(rotorRest);
			rotor.rotateY(time * (12.5 + climax * 6.5) * envelope);
		}
		let internalVisible = 0;
		let internalJumping = 0;
		let maximumInternalJumpHeight = 0;
		const packedJumpWave = Math.pow(Math.abs(Math.sin(time * TAU$3 * 7.6)), 1.55);
		staticPieces.forEach((rig) => {
			const jump = .095 * packedJumpWave * envelope;
			staticTransform.position.copy(rig.idlePosition);
			staticTransform.position.y += jump;
			staticTransform.rotation.copy(rig.idleRotation);
			staticTransform.rotation.x += Math.sin(time * 6.2 + rig.phase) * .18 * envelope;
			staticTransform.rotation.y += time * (1.3 + rig.instanceIndex % 5 * .18) * envelope;
			staticTransform.rotation.z += Math.cos(time * 5.4 + rig.phase) * .14 * envelope;
			staticTransform.scale.copy(rig.idleScale);
			staticTransform.updateMatrix();
			rig.batch.setMatrixAt(rig.instanceIndex, staticTransform.matrix);
			if (packedJumpWave > .18) internalJumping += 1;
			maximumInternalJumpHeight = Math.max(maximumInternalJumpHeight, jump);
		});
		new Set(staticPieces.map(({ batch }) => batch)).forEach((batch) => {
			batch.instanceMatrix.needsUpdate = true;
		});
		internalVisible += staticPieces.length;
		internal.forEach((rig) => {
			const age = time - rig.phase;
			const active = age >= 0 && envelope > .003;
			if (rig.seed) rig.seed.visible = age < 0;
			rig.piece.visible = active;
			if (!active) return;
			const cycle = ((age * rig.frequency + rig.index * .173) % 1 + 1) % 1;
			const jumpWave = Math.pow(Math.max(0, Math.sin(cycle * Math.PI)), 1.45);
			const jump = rig.jumpHeight * (1 + climax * .58) * jumpWave * envelope;
			rig.piece.position.copy(rig.target);
			rig.piece.position.x += Math.sin(time * TAU$3 * (2.6 + rig.index % 4 * .18) + rig.index) * .012 * envelope;
			rig.piece.position.y = Math.min(CHAMBER_CEILING, rig.piece.position.y + jump);
			rig.piece.position.z += Math.cos(time * TAU$3 * (2.3 + rig.index % 5 * .16) + rig.index) * .008 * envelope;
			rig.piece.position.x = MathUtils.clamp(rig.piece.position.x, -.8, .8);
			rig.piece.position.z = MathUtils.clamp(rig.piece.position.z, -.47, .47);
			rig.piece.rotation.set((rig.spin.x + 4.2) * age, (rig.spin.y + 5.4) * age, (rig.spin.z + 3.7) * age);
			const expansion = MathUtils.smoothstep(age, 0, .13);
			rig.piece.scale.setScalar(rig.baseScale * expansion * (.94 + jumpWave * .1));
			internalVisible += 1;
			if (jumpWave > .18) internalJumping += 1;
			maximumInternalJumpHeight = Math.max(maximumInternalJumpHeight, jump);
		});
		let visibleExternal = 0;
		let externalFrontmostZ = 0;
		external.forEach((rig) => {
			const age = time - rig.launchTime;
			const progress = age / rig.flightDuration;
			const active = progress >= 0 && progress <= 1 && envelope > .003;
			rig.piece.visible = active;
			if (!active) return;
			cubicPoint(samplePosition, rig.path, MathUtils.clamp(progress, 0, 1));
			rig.piece.position.copy(samplePosition);
			rig.piece.rotation.set(rig.spinRate.x * age + rig.index * .19, rig.spinRate.y * age + rig.index * .31, rig.spinRate.z * age + rig.index * .13);
			const appear = MathUtils.smoothstep(progress, 0, .08);
			const depart = 1 - MathUtils.smoothstep(progress, .9, 1);
			rig.piece.scale.setScalar(rig.baseScale * Math.max(.001, appear * depart) * envelope);
			visibleExternal += 1;
			externalFrontmostZ = Math.max(externalFrontmostZ, rig.piece.position.z);
		});
		Object.assign(diagnostics, {
			time,
			phase: time < POPCORN_MACHINE_TIMELINE.warmupEnd ? "warmup" : time < POPCORN_MACHINE_TIMELINE.burstStart ? "rapid-pop" : time < POPCORN_MACHINE_TIMELINE.settleStart ? "outward-burst" : "settle",
			motionEnvelope: envelope,
			internalVisible,
			internalJumping,
			animatedStaticPieces: envelope > .003 ? staticPieces.length : 0,
			maximumInternalJumpHeight,
			visibleExternal,
			externalFrontmostZ
		});
	};
	reset();
	return {
		apply,
		reset,
		signal: () => signalValue,
		diagnostics
	};
}
var CHAMBER_CEILING = 2.68;
//#endregion
//#region src/appliances/performance/BubbleMachinePerformance.ts
var TAU$2 = Math.PI * 2;
var BUBBLE_MACHINE_TIMELINE = Object.freeze({
	startupEnd: .42,
	streamStart: .22,
	giantLaunch: 3.18,
	giantBurst: 4.62,
	settleStart: 4.84,
	stopEnd: 5.2,
	ordinaryBubbleCount: 48,
	burstFragmentCount: 8,
	previousGenericPoolCapacity: 30
});
function suffixIndex$1(name) {
	return Number(name.match(/(\d+)$/)?.[1] ?? 0);
}
function numberData$1(object, key, fallback = 0) {
	const value = Number(object.userData[key]);
	return Number.isFinite(value) ? value : fallback;
}
function vectorData(object, key) {
	const value = object.userData[key];
	return Array.isArray(value) && value.length >= 3 ? new Vector3(Number(value[0]), Number(value[1]), Number(value[2])) : new Vector3();
}
/** Integral of a continuous accelerate / cruise / decelerate velocity curve. */
function integratedSpin(time, start, accelerationEnd, decelerationStart, end, angularVelocity) {
	const localTime = Math.max(0, time - start);
	const accelerationDuration = Math.max(1e-4, accelerationEnd - start);
	const cruiseDuration = Math.max(0, decelerationStart - accelerationEnd);
	const decelerationDuration = Math.max(1e-4, end - decelerationStart);
	if (localTime <= accelerationDuration) return angularVelocity * localTime * localTime / (2 * accelerationDuration);
	const accelerationArea = angularVelocity * accelerationDuration * .5;
	if (time <= decelerationStart) return accelerationArea + angularVelocity * (time - accelerationEnd);
	const cruiseArea = angularVelocity * cruiseDuration;
	const decelerationTime = Math.min(decelerationDuration, Math.max(0, time - decelerationStart));
	return accelerationArea + cruiseArea + angularVelocity * (decelerationTime - decelerationTime * decelerationTime / (2 * decelerationDuration));
}
function createBubbleMachinePerformance(root) {
	const outputSocket = root.getObjectByName("bubble-machine-output-socket");
	const control = root.getObjectByName("bubble-machine-control-knob-pivot");
	const wheel = root.getObjectByName("bubble-machine-bubble-wheel-pivot");
	const fan = root.getObjectByName("bubble-machine-rear-fan-rotor-pivot");
	const controlRest = control?.quaternion.clone();
	const wheelRest = wheel?.quaternion.clone();
	const fanRest = fan?.quaternion.clone();
	const giant = root.getObjectByName("bubble-machine-giant-bubble");
	const burstRig = root.getObjectByName("bubble-machine-giant-bubble-burst-rig");
	const ordinary = [];
	const ordinaryBatches = [];
	const burstFragments = [];
	root.traverse((object) => {
		if (object instanceof Group && /^bubble-machine-performance-bubble-\d+$/.test(object.name)) ordinary.push({
			index: suffixIndex$1(object.name),
			pivot: object,
			baseRadius: numberData$1(object, "baseRadius", .16),
			launchTime: numberData$1(object, "launchTime", .22),
			flightDuration: numberData$1(object, "flightDuration", 3.6),
			lateralTravel: numberData$1(object, "lateralTravel", 9.5),
			riseTravel: numberData$1(object, "riseTravel", 5.5),
			forwardTravel: numberData$1(object, "forwardTravel", 6.4),
			configuredTravelDistance: numberData$1(object, "configuredTravelDistance", 12),
			driftAmplitude: numberData$1(object, "driftAmplitude", .4),
			driftRate: numberData$1(object, "driftRate", 1),
			driftPhase: numberData$1(object, "driftPhase", 0),
			sizeClass: String(object.userData.sizeClass ?? "unknown")
		});
		if (object instanceof Mesh && /^bubble-machine-burst-(?:mini-bubble|light-point)-\d+$/.test(object.name)) burstFragments.push({
			mesh: object,
			index: numberData$1(object, "fragmentIndex", suffixIndex$1(object.name) - 1),
			direction: vectorData(object, "fragmentDirection"),
			miniBubble: object.name.includes("mini-bubble")
		});
		if (object instanceof InstancedMesh && Array.isArray(object.userData.bubbleBatchBindings)) {
			const bindings = object.userData.bubbleBatchBindings.flatMap((binding) => {
				if (!binding || typeof binding !== "object") return [];
				const bubbleName = Reflect.get(binding, "bubbleName");
				const sourceMeshName = Reflect.get(binding, "sourceMeshName");
				if (typeof bubbleName !== "string" || typeof sourceMeshName !== "string") return [];
				const pivot = root.getObjectByName(bubbleName);
				const source = root.getObjectByName(sourceMeshName);
				return pivot instanceof Group && source instanceof Mesh ? [{
					pivot,
					source
				}] : [];
			});
			ordinaryBatches.push({
				mesh: object,
				bindings
			});
		}
	});
	ordinary.sort((first, second) => first.index - second.index);
	burstFragments.sort((first, second) => first.index - second.index);
	const minimumConfiguredTravelDistance = ordinary.length > 0 ? Math.min(...ordinary.map((bubble) => bubble.configuredTravelDistance)) : 0;
	const flightDurations = ordinary.map((bubble) => bubble.flightDuration);
	const driftRates = ordinary.map((bubble) => bubble.driftRate);
	const sizeClasses = [...new Set(ordinary.map((bubble) => bubble.sizeClass))];
	const emitterLocal = new Vector3(-.76, 1.53, 1.015);
	const sample = new Vector3();
	const giantBurstOrigin = new Vector3();
	const instanceMatrix = new Matrix4();
	const hiddenInstanceMatrix = new Matrix4().makeScale(0, 0, 0);
	let signalValue = 0;
	const syncOrdinaryBatches = () => {
		ordinaryBatches.forEach(({ mesh, bindings }) => {
			let visibleInstances = 0;
			bindings.forEach(({ pivot, source }, index) => {
				if (pivot.visible) {
					pivot.updateMatrix();
					source.updateMatrix();
					instanceMatrix.multiplyMatrices(pivot.matrix, source.matrix);
					mesh.setMatrixAt(index, instanceMatrix);
					visibleInstances += 1;
				} else mesh.setMatrixAt(index, hiddenInstanceMatrix);
			});
			mesh.visible = visibleInstances > 0;
			mesh.instanceMatrix.needsUpdate = true;
		});
	};
	const diagnostics = {
		time: 0,
		phase: "idle",
		motionEnvelope: 0,
		ordinaryBubbleCount: ordinary.length,
		visibleOrdinaryBubbles: 0,
		sizeClasses,
		minimumConfiguredTravelDistance,
		currentMaximumTravelDistance: 0,
		currentLateralSpread: 0,
		currentHeightSpread: 0,
		minimumFlightDuration: flightDurations.length > 0 ? Math.min(...flightDurations) : 0,
		maximumFlightDuration: flightDurations.length > 0 ? Math.max(...flightDurations) : 0,
		minimumDriftRate: driftRates.length > 0 ? Math.min(...driftRates) : 0,
		maximumDriftRate: driftRates.length > 0 ? Math.max(...driftRates) : 0,
		giantBubbleVisible: false,
		giantBubbleRadius: giant ? numberData$1(giant, "baseRadius", 0) : 0,
		giantBubbleTopY: 0,
		giantBurstTime: giant ? numberData$1(giant, "burstTime", BUBBLE_MACHINE_TIMELINE.giantBurst) : 0,
		visibleBurstFragments: 0,
		burstFragmentCount: burstFragments.length,
		allEffectsVolumetric: true,
		effectOwner: "BubbleMachinePerformance",
		timelineOwner: "ApplianceMechanics/BubbleMachinePerformance",
		sharedSpectacleEffects: "disabled"
	};
	root.userData.bubbleMachinePerformanceDiagnostics = diagnostics;
	const readEmitterLocal = () => {
		if (!outputSocket) return emitterLocal;
		root.updateWorldMatrix(true, true);
		outputSocket.getWorldPosition(emitterLocal);
		root.worldToLocal(emitterLocal);
		return emitterLocal;
	};
	const reset = () => {
		readEmitterLocal();
		if (control && controlRest) control.quaternion.copy(controlRest);
		if (wheel && wheelRest) wheel.quaternion.copy(wheelRest);
		if (fan && fanRest) fan.quaternion.copy(fanRest);
		ordinary.forEach(({ pivot }) => {
			pivot.visible = false;
			pivot.position.copy(emitterLocal);
			pivot.rotation.set(0, 0, 0);
			pivot.scale.set(1, 1, 1);
		});
		if (giant) {
			giant.visible = false;
			giant.position.copy(emitterLocal);
			giant.rotation.set(0, 0, 0);
			giant.scale.set(1, 1, 1);
		}
		if (burstRig) {
			burstRig.visible = false;
			burstRig.position.copy(emitterLocal);
			burstRig.rotation.set(0, 0, 0);
			burstRig.scale.set(1, 1, 1);
		}
		burstFragments.forEach(({ mesh }) => {
			mesh.visible = false;
			mesh.position.set(0, 0, 0);
			mesh.rotation.set(0, 0, 0);
			mesh.scale.set(1, 1, 1);
		});
		syncOrdinaryBatches();
		signalValue = 0;
		Object.assign(diagnostics, {
			time: 0,
			phase: "idle",
			motionEnvelope: 0,
			visibleOrdinaryBubbles: 0,
			currentMaximumTravelDistance: 0,
			currentLateralSpread: 0,
			currentHeightSpread: 0,
			giantBubbleVisible: false,
			giantBubbleTopY: 0,
			visibleBurstFragments: 0
		});
	};
	const apply = (rawTime, rawPower) => {
		const time = Math.max(0, rawTime);
		const power = MathUtils.clamp(rawPower, 0, 1);
		const envelope = MathUtils.smoothstep(time, .04, BUBBLE_MACHINE_TIMELINE.startupEnd) * (1 - MathUtils.smoothstep(time, BUBBLE_MACHINE_TIMELINE.settleStart, BUBBLE_MACHINE_TIMELINE.stopEnd)) * power;
		signalValue = envelope;
		readEmitterLocal();
		const controlTurn = MathUtils.smoothstep(time, .04, .34) * (1 - MathUtils.smoothstep(time, 4.96, BUBBLE_MACHINE_TIMELINE.stopEnd)) * power;
		if (control && controlRest) {
			control.quaternion.copy(controlRest);
			control.rotateY(Math.PI * 1.45 * controlTurn);
		}
		if (wheel && wheelRest) {
			wheel.quaternion.copy(wheelRest);
			wheel.rotateZ(-integratedSpin(time, .12, .54, 4.68, 5.18, 8.6) * power);
		}
		if (fan && fanRest) {
			fan.quaternion.copy(fanRest);
			fan.rotateZ(integratedSpin(time, .08, .46, 4.72, 5.18, 18.4) * power);
		}
		let visibleOrdinaryBubbles = 0;
		let currentMaximumTravelDistance = 0;
		let minimumX = Number.POSITIVE_INFINITY;
		let maximumX = Number.NEGATIVE_INFINITY;
		let minimumY = Number.POSITIVE_INFINITY;
		let maximumY = Number.NEGATIVE_INFINITY;
		ordinary.forEach((bubble) => {
			const age = time - bubble.launchTime;
			const progress = age / bubble.flightDuration;
			const active = age >= 0 && progress < 1 && envelope > .003;
			bubble.pivot.visible = active;
			if (!active) return;
			const clamped = MathUtils.clamp(progress, 0, 1);
			const travelProgress = MathUtils.smootherstep(clamped, 0, 1);
			const driftGate = .18 + travelProgress * .82;
			const drift = Math.sin(time * TAU$2 * bubble.driftRate + bubble.driftPhase) * bubble.driftAmplitude * driftGate;
			const bob = Math.sin(time * TAU$2 * (.42 + bubble.index % 5 * .055) + bubble.driftPhase * .72) * (.08 + travelProgress * .18);
			bubble.pivot.position.set(emitterLocal.x + bubble.lateralTravel * travelProgress + drift, emitterLocal.y + bubble.riseTravel * travelProgress + bob, emitterLocal.z + bubble.forwardTravel * travelProgress + Math.cos(time * bubble.driftRate + bubble.driftPhase) * .16 * driftGate);
			bubble.pivot.rotation.set(Math.sin(time * .72 + bubble.driftPhase) * .24, time * (.18 + bubble.index % 7 * .035), Math.cos(time * .61 + bubble.driftPhase) * .18);
			const appear = MathUtils.smoothstep(clamped, 0, .055);
			const depart = 1 - MathUtils.smoothstep(clamped, .91, 1);
			const radius = bubble.baseRadius * Math.max(.001, appear * depart) * power;
			bubble.pivot.scale.setScalar(radius);
			sample.copy(bubble.pivot.position).sub(emitterLocal);
			currentMaximumTravelDistance = Math.max(currentMaximumTravelDistance, sample.length());
			minimumX = Math.min(minimumX, bubble.pivot.position.x);
			maximumX = Math.max(maximumX, bubble.pivot.position.x);
			minimumY = Math.min(minimumY, bubble.pivot.position.y);
			maximumY = Math.max(maximumY, bubble.pivot.position.y);
			visibleOrdinaryBubbles += 1;
		});
		syncOrdinaryBatches();
		let giantBubbleTopY = 0;
		const giantLaunch = giant ? numberData$1(giant, "launchTime", BUBBLE_MACHINE_TIMELINE.giantLaunch) : 0;
		const giantBurst = giant ? numberData$1(giant, "burstTime", BUBBLE_MACHINE_TIMELINE.giantBurst) : 0;
		const giantAge = time - giantLaunch;
		const giantDuration = Math.max(.001, giantBurst - giantLaunch);
		const giantProgress = MathUtils.clamp(giantAge / giantDuration, 0, 1);
		const giantActive = Boolean(giant && giantAge >= 0 && time < giantBurst && envelope > .003);
		if (giant) {
			giant.visible = giantActive;
			if (giantActive) {
				const rise = MathUtils.smootherstep(giantProgress, 0, 1);
				const radius = numberData$1(giant, "baseRadius", .94) * (.16 + MathUtils.smoothstep(giantProgress, 0, .34) * .84) * power;
				giant.position.set(emitterLocal.x + numberData$1(giant, "lateralTravel", .95) * rise + Math.sin(time * 1.36) * .26 * rise, emitterLocal.y + numberData$1(giant, "riseTravel", 6.2) * rise, emitterLocal.z + numberData$1(giant, "forwardTravel", 2.15) * rise);
				giant.rotation.set(Math.sin(time * .7) * .13, time * .18, Math.cos(time * .56) * .11);
				giant.scale.setScalar(radius);
				giantBubbleTopY = giant.position.y + radius;
			}
		}
		giantBurstOrigin.set(emitterLocal.x + (giant ? numberData$1(giant, "lateralTravel", .95) : .95), emitterLocal.y + (giant ? numberData$1(giant, "riseTravel", 6.2) : 6.2), emitterLocal.z + (giant ? numberData$1(giant, "forwardTravel", 2.15) : 2.15));
		const burstAge = time - giantBurst;
		const burstProgress = MathUtils.clamp(burstAge / .72, 0, 1);
		const burstActive = burstAge >= 0 && burstAge < .72 && envelope > .003;
		if (burstRig) {
			burstRig.visible = burstActive;
			burstRig.position.copy(giantBurstOrigin);
		}
		let visibleBurstFragments = 0;
		burstFragments.forEach(({ mesh, index, direction, miniBubble }) => {
			mesh.visible = burstActive;
			if (!burstActive) return;
			const distance = .2 + burstProgress * (1.25 + index % 3 * .18);
			mesh.position.copy(direction).multiplyScalar(distance);
			mesh.position.y -= burstProgress * burstProgress * .46;
			mesh.rotation.set(burstProgress * (2.2 + index * .18), burstProgress * (1.7 + index * .23), burstProgress * (2.8 + index * .12));
			const fade = 1 - MathUtils.smoothstep(burstProgress, .58, 1);
			mesh.scale.setScalar((miniBubble ? .18 : .62) * Math.max(.001, fade) * power);
			visibleBurstFragments += 1;
		});
		const phase = power <= .003 ? "idle" : time < BUBBLE_MACHINE_TIMELINE.startupEnd ? "spin-up" : time < BUBBLE_MACHINE_TIMELINE.giantLaunch ? "bubble-stream" : time < BUBBLE_MACHINE_TIMELINE.giantBurst ? "giant-rise" : time < BUBBLE_MACHINE_TIMELINE.settleStart ? "giant-burst" : "settle";
		Object.assign(diagnostics, {
			time,
			phase,
			motionEnvelope: envelope,
			visibleOrdinaryBubbles,
			currentMaximumTravelDistance,
			currentLateralSpread: visibleOrdinaryBubbles > 1 ? maximumX - minimumX : 0,
			currentHeightSpread: visibleOrdinaryBubbles > 1 ? maximumY - minimumY : 0,
			giantBubbleVisible: giantActive,
			giantBubbleTopY,
			visibleBurstFragments
		});
	};
	reset();
	return {
		apply,
		reset,
		signal: () => signalValue,
		diagnostics
	};
}
//#endregion
//#region src/appliances/performance/SmartBinPerformance.ts
var TAU$1 = Math.PI * 2;
var SMART_BIN_TIMELINE = Object.freeze({
	sensorStart: .08,
	lidOpenStart: .18,
	lidOpenEnd: .58,
	firstLaunch: .72,
	lastLaunch: 3.24,
	lidCloseStart: 4.46,
	lidCloseEnd: 4.88,
	settleEnd: 5.2,
	lidAngle: 1.2,
	cavityDepth: .82,
	trashCount: 8
});
var SMART_BIN_TRASH_TYPES = [
	"paper-ball",
	"banana-peel",
	"aluminum-can",
	"plastic-bottle",
	"apple-core",
	"coffee-cup",
	"chip-bag",
	"takeout-box"
];
var PATHS = [
	{
		type: "paper-ball",
		launch: .72,
		duration: 1.62,
		start: new Vector3(-10.8, 2.1, 1.8),
		controlA: new Vector3(-7.6, 7.8, 1.15),
		controlB: new Vector3(-2.4, 6.2, .34),
		mouth: new Vector3(-.18, 1.23, .04),
		landing: new Vector3(-.12, .42, .02),
		spin: new Vector3(5.2, 3.4, 7.1)
	},
	{
		type: "banana-peel",
		launch: 1.08,
		duration: 1.7,
		start: new Vector3(9.8, 3, .9),
		controlA: new Vector3(6.8, 8.1, .58),
		controlB: new Vector3(2.2, 6.4, -.08),
		mouth: new Vector3(.22, 1.22, -.04),
		landing: new Vector3(.18, .38, -.05),
		spin: new Vector3(1.5, 2.2, 2.8)
	},
	{
		type: "aluminum-can",
		launch: 1.44,
		duration: 1.58,
		start: new Vector3(-8.8, 1.7, -2.4),
		controlA: new Vector3(-6.2, 7.4, -1.42),
		controlB: new Vector3(-2, 6, -.38),
		mouth: new Vector3(-.24, 1.23, -.08),
		landing: new Vector3(-.2, .38, -.1),
		spin: new Vector3(.5, 1.1, 12.8)
	},
	{
		type: "plastic-bottle",
		launch: 1.8,
		duration: 1.65,
		start: new Vector3(11.2, 2.2, -1.6),
		controlA: new Vector3(7.9, 8.3, -1.02),
		controlB: new Vector3(2.6, 6.5, -.26),
		mouth: new Vector3(.26, 1.24, 0),
		landing: new Vector3(.22, .4, .05),
		spin: new Vector3(3.1, 1.6, 4.2)
	},
	{
		type: "apple-core",
		launch: 2.16,
		duration: 1.54,
		start: new Vector3(-9.5, 4, 2.8),
		controlA: new Vector3(-6.8, 8.8, 1.72),
		controlB: new Vector3(-2.1, 6.7, .46),
		mouth: new Vector3(-.08, 1.25, .1),
		landing: new Vector3(-.05, .39, .08),
		spin: new Vector3(4.6, 5.3, 2.1)
	},
	{
		type: "coffee-cup",
		launch: 2.52,
		duration: 1.6,
		start: new Vector3(8.9, 3.8, 2.5),
		controlA: new Vector3(6.3, 8.4, 1.58),
		controlB: new Vector3(2, 6.3, .44),
		mouth: new Vector3(.12, 1.24, .1),
		landing: new Vector3(.1, .38, .08),
		spin: new Vector3(5.4, 1.2, 3.6)
	},
	{
		type: "chip-bag",
		launch: 2.88,
		duration: 1.68,
		start: new Vector3(-11.4, 2.9, .2),
		controlA: new Vector3(-8, 8.5, .14),
		controlB: new Vector3(-2.7, 6.5, .03),
		mouth: new Vector3(-.18, 1.25, 0),
		landing: new Vector3(-.15, .39, 0),
		spin: new Vector3(2.2, 4.5, 3.2)
	},
	{
		type: "takeout-box",
		launch: 3.24,
		duration: 1.6,
		start: new Vector3(10.4, 3.2, -.5),
		controlA: new Vector3(7.3, 8, -.31),
		controlB: new Vector3(2.4, 6.1, -.06),
		mouth: new Vector3(.16, 1.25, 0),
		landing: new Vector3(.14, .37, 0),
		spin: new Vector3(3.8, 5.1, 6.4)
	}
];
function clamp01$1(value) {
	return MathUtils.clamp(value, 0, 1);
}
function cubic(target, a, b, c, d, t) {
	const inverse = 1 - t;
	target.copy(a).multiplyScalar(inverse ** 3).addScaledVector(b, 3 * inverse * inverse * t).addScaledVector(c, 3 * inverse * t * t).addScaledVector(d, t ** 3);
}
function pulse$1(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function phaseAt$3(time, power, received) {
	if (power <= .001 || time <= 0) return "idle";
	if (time < SMART_BIN_TIMELINE.firstLaunch) return "detecting";
	if (time < 3.88) return "catching";
	if (received < SMART_BIN_TIMELINE.trashCount) return "impacting";
	if (time < SMART_BIN_TIMELINE.lidCloseEnd) return "closing";
	return "complete";
}
function createSmartBinPerformance(root) {
	const body = root.getObjectByName("smart-bin-body-pivot");
	const lid = root.getObjectByName("smart-bin-lid-hinge-pivot");
	const sensorGlow = root.getObjectByName("smart-bin-sensor-glow-strip");
	const sensorWindow = root.getObjectByName("smart-bin-infrared-sensor-window");
	const flights = PATHS.map((path) => {
		const pivot = root.getObjectByName(`smart-bin-trash-${path.type}-pivot`);
		if (!(pivot instanceof Group)) throw new Error(`Missing smart-bin trash rig: ${path.type}`);
		return {
			...path,
			pivot
		};
	});
	const animatedSet = /* @__PURE__ */ new Set();
	[
		body,
		lid,
		sensorGlow,
		sensorWindow
	].forEach((object) => {
		if (object) animatedSet.add(object);
	});
	flights.forEach(({ pivot }) => pivot.traverse((object) => animatedSet.add(object)));
	const poses = [...animatedSet].map((object) => ({
		object,
		position: object.position.clone(),
		quaternion: object.quaternion.clone(),
		scale: object.scale.clone(),
		visible: object.visible
	}));
	const sensorMaterials = [sensorGlow, sensorWindow].flatMap((mesh) => mesh ? Array.isArray(mesh.material) ? mesh.material : [mesh.material] : []).map((material) => {
		const toon = material;
		return {
			material: toon,
			emissive: toon.emissive.clone(),
			intensity: toon.emissiveIntensity
		};
	});
	const sample = new Vector3();
	let signalValue = 0;
	const diagnostics = {
		time: 0,
		phase: "idle",
		lidAngle: 0,
		sensorStrength: 0,
		visibleTrash: 0,
		receivedTrash: 0,
		maximumBodySink: 0,
		cavityDepth: SMART_BIN_TIMELINE.cavityDepth,
		directions: 8,
		trashTypes: SMART_BIN_TRASH_TYPES,
		volumetricOnly: true,
		effectOwner: "smart-bin-model-rig",
		timelineOwner: "SmartBinPerformance",
		sharedSpectacleEffects: "must-be-disabled-during-integration"
	};
	root.userData.smartBinPerformance = diagnostics;
	const restore = () => {
		poses.forEach((pose) => {
			pose.object.position.copy(pose.position);
			pose.object.quaternion.copy(pose.quaternion);
			pose.object.scale.copy(pose.scale);
			pose.object.visible = pose.visible;
		});
		sensorMaterials.forEach(({ material, emissive, intensity }) => {
			material.emissive.copy(emissive);
			material.emissiveIntensity = intensity;
		});
	};
	const reset = () => {
		restore();
		flights.forEach(({ pivot }) => {
			pivot.visible = false;
		});
		if (sensorGlow) sensorGlow.visible = false;
		signalValue = 0;
		Object.assign(diagnostics, {
			time: 0,
			phase: "idle",
			lidAngle: 0,
			sensorStrength: 0,
			visibleTrash: 0,
			receivedTrash: 0,
			maximumBodySink: 0
		});
	};
	const apply = (rawTime, rawPower) => {
		restore();
		const time = Math.max(0, rawTime);
		const power = clamp01$1(rawPower);
		const open = MathUtils.smoothstep(time, SMART_BIN_TIMELINE.lidOpenStart, SMART_BIN_TIMELINE.lidOpenEnd);
		const close = MathUtils.smoothstep(time, SMART_BIN_TIMELINE.lidCloseStart, SMART_BIN_TIMELINE.lidCloseEnd);
		const lidAngle = SMART_BIN_TIMELINE.lidAngle * open * (1 - close) * power;
		const sensorStrength = MathUtils.smoothstep(time, SMART_BIN_TIMELINE.sensorStart, .32) * (1 - MathUtils.smoothstep(time, 4.42, 4.92)) * power;
		if (lid) lid.rotation.x -= lidAngle;
		if (sensorGlow) sensorGlow.visible = sensorStrength > .01;
		sensorMaterials.forEach(({ material }) => {
			material.emissive.setHex(16732792);
			material.emissiveIntensity = sensorStrength * 2.2;
		});
		let visibleTrash = 0;
		let receivedTrash = 0;
		let maximumBodySink = 0;
		flights.forEach((flight, index) => {
			const progress = (time - flight.launch) / flight.duration;
			const impactTime = flight.launch + flight.duration * .78;
			const sink = pulse$1(time, impactTime - .045, impactTime + .035, impactTime + .14) * (.035 + index % 3 * .006) * power;
			const rebound = pulse$1(time, impactTime + .1, impactTime + .16, impactTime + .24) * .015 * power;
			maximumBodySink = Math.max(maximumBodySink, sink);
			if (body) body.position.y += rebound - sink;
			if (progress < 0 || progress >= 1 || power <= .001) {
				flight.pivot.visible = false;
				if (progress >= 1) receivedTrash += 1;
				return;
			}
			flight.pivot.visible = true;
			visibleTrash += 1;
			if (progress < .72) cubic(sample, flight.start, flight.controlA, flight.controlB, flight.mouth, progress / .72);
			else {
				const drop = clamp01$1((progress - .72) / .28);
				sample.copy(flight.mouth).lerp(flight.landing, drop * drop);
				if (flight.type === "paper-ball") sample.y += Math.sin(drop * Math.PI * 2) * .13 * (1 - drop);
				if (flight.type === "banana-peel") sample.x += Math.sin(drop * Math.PI) * .08;
			}
			flight.pivot.position.copy(sample);
			flight.pivot.rotation.set(flight.spin.x * progress, flight.spin.y * progress, flight.spin.z * progress);
			if (flight.type === "aluminum-can") flight.pivot.rotation.z += progress * TAU$1 * 2;
			if (flight.type === "plastic-bottle") flight.pivot.rotation.y += Math.sin(progress * TAU$1) * .55;
			if (flight.type === "banana-peel") flight.pivot.children.forEach((child, childIndex) => {
				if (child.name.includes("curved-lobe")) child.rotation.z += Math.sin(progress * Math.PI + childIndex) * .34;
			});
			if (flight.type === "chip-bag") flight.pivot.scale.set(1 + Math.sin(progress * TAU$1 * 3) * .08, 1 - Math.sin(progress * TAU$1 * 3) * .12, 1.05);
			if (flight.type === "takeout-box") flight.pivot.rotation.x += Math.sin(progress * Math.PI) * 1.2;
		});
		const finalBounce = pulse$1(time, 4.36, 4.46, 4.62) * power;
		if (body) body.position.y += finalBounce * .025;
		if (lid) lid.rotation.z += Math.sin(time * 24) * .012 * finalBounce;
		signalValue = Math.max(sensorStrength, lidAngle / SMART_BIN_TIMELINE.lidAngle, maximumBodySink * 18);
		Object.assign(diagnostics, {
			time,
			phase: phaseAt$3(time, power, receivedTrash),
			lidAngle,
			sensorStrength,
			visibleTrash,
			receivedTrash,
			maximumBodySink
		});
	};
	reset();
	return {
		update: apply,
		stop: reset,
		signal: () => signalValue,
		apply,
		reset,
		diagnostics
	};
}
//#endregion
//#region src/appliances/performance/AlarmClockPerformance.ts
var ALARM_CLOCK_TIMELINE = {
	engageEnd: .28,
	franticStart: .72,
	climaxStart: 3.18,
	climaxEnd: 4.42,
	settleStart: 4.62,
	settleEnd: 5.2
};
function phaseAt$2(time, motion) {
	if (motion <= .001) return "idle";
	if (time < ALARM_CLOCK_TIMELINE.franticStart) return "engage";
	if (time < ALARM_CLOCK_TIMELINE.climaxStart) return "frantic-ring";
	if (time < ALARM_CLOCK_TIMELINE.climaxEnd) return "climax";
	return "settling";
}
function named(root, name) {
	return root.getObjectByName(name) ?? null;
}
function prefixed(root, prefix) {
	const result = [];
	root.traverse((object) => {
		if (object.name.startsWith(prefix)) result.push(object);
	});
	return result;
}
function createAlarmClockPerformance(root) {
	const controlled = [
		"alarm-clock-body-pivot",
		"alarm-clock-hour-hand-pivot",
		"alarm-clock-minute-hand-pivot",
		"alarm-clock-bell-1-pivot",
		"alarm-clock-bell-2-pivot",
		"alarm-clock-bell-hammer-1-pivot",
		"alarm-clock-bell-hammer-2-pivot",
		"alarm-clock-top-alarm-lever-pivot",
		"alarm-clock-rear-winding-knob-1-pivot",
		"alarm-clock-rear-winding-knob-2-pivot"
	].map((name) => named(root, name)).filter((object) => object !== null);
	const effects = [...prefixed(root, "alarm-clock-stereo-wave-"), ...prefixed(root, "alarm-clock-vibration-arc-")];
	const baselines = [...controlled, ...effects].map((object) => ({
		object,
		position: object.position.clone(),
		quaternion: object.quaternion.clone(),
		scale: object.scale.clone(),
		visible: object.visible
	}));
	const restore = () => {
		baselines.forEach((baseline) => {
			baseline.object.position.copy(baseline.position);
			baseline.object.quaternion.copy(baseline.quaternion);
			baseline.object.scale.copy(baseline.scale);
			baseline.object.visible = baseline.visible;
		});
	};
	let signalValue = 0;
	let diagnostics = {
		timelineOwner: "AppliancePerformanceSystem",
		modelOwner: "alarm-clock-model-rig",
		sharedSpectacleEffects: "disabled",
		phase: "idle",
		time: 0,
		motionEnvelope: 0,
		bodyShakeX: 0,
		bodyLift: 0,
		bodyRoll: 0,
		leftBellOffset: 0,
		rightBellOffset: 0,
		hourHandRadians: 0,
		minuteHandRadians: 0,
		visibleStereoWaves: 0,
		visibleVibrationArcs: 0,
		structureAttached: false,
		rigidBodyScale: [
			1,
			1,
			1
		],
		forbiddenFlatEffects: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
	const apply = (time, power) => {
		restore();
		const p = MathUtils.clamp(power, 0, 1);
		const startup = MathUtils.smoothstep(time, .02, ALARM_CLOCK_TIMELINE.engageEnd);
		const settle = 1 - MathUtils.smoothstep(time, ALARM_CLOCK_TIMELINE.settleStart, ALARM_CLOCK_TIMELINE.settleEnd);
		const climax = MathUtils.smoothstep(time, ALARM_CLOCK_TIMELINE.climaxStart, 3.48) * (1 - MathUtils.smoothstep(time, 4.12, ALARM_CLOCK_TIMELINE.climaxEnd));
		const motion = startup * settle * p;
		const intensity = motion * (1 + climax * .38);
		const bodyShakeX = Math.sin(time * 33) * .13 * intensity;
		const bodyLift = Math.abs(Math.sin(time * 29)) * .18 * intensity;
		const bodyRoll = Math.sin(time * 31 + .35) * .105 * intensity;
		const body = named(root, "alarm-clock-body-pivot");
		if (body) {
			body.position.x += bodyShakeX;
			body.position.y += bodyLift;
			body.rotation.z += bodyRoll;
		}
		const bellOffsets = [-1, 1].map((side, index) => {
			const offset = Math.sin(time * 55 + index * Math.PI) * .25 * intensity;
			const bell = named(root, `alarm-clock-bell-${index + 1}-pivot`);
			if (bell) {
				bell.rotation.z += offset;
				bell.position.x += side * Math.abs(Math.sin(time * 61 + index)) * .035 * intensity;
			}
			const hammer = named(root, `alarm-clock-bell-hammer-${index + 1}-pivot`);
			if (hammer) hammer.rotation.z += Math.sin(time * 69 + index * Math.PI) * .68 * intensity;
			return offset;
		});
		const hourHandRadians = -time * 4.8 * motion;
		const minuteHandRadians = -time * 32 * motion;
		const hourHand = named(root, "alarm-clock-hour-hand-pivot");
		const minuteHand = named(root, "alarm-clock-minute-hand-pivot");
		if (hourHand) hourHand.rotation.z += hourHandRadians;
		if (minuteHand) minuteHand.rotation.z += minuteHandRadians;
		const lever = named(root, "alarm-clock-top-alarm-lever-pivot");
		if (lever) lever.rotation.x += Math.sin(time * 46) * .1 * intensity;
		[1, 2].forEach((index) => {
			const knob = named(root, `alarm-clock-rear-winding-knob-${index}-pivot`);
			if (knob) knob.rotation.z += time * (index === 1 ? 14 : -17) * motion;
		});
		let visibleStereoWaves = 0;
		prefixed(root, "alarm-clock-stereo-wave-").forEach((wave, index) => {
			const progress = ((time - .18 - index % 3 * .12) % .74 + .74) % .74 / .74;
			wave.visible = motion > .08 && progress < .76;
			if (!wave.visible) return;
			visibleStereoWaves += 1;
			const side = Number(wave.userData.side ?? 1);
			const growth = .82 + progress * .92;
			wave.scale.set(growth * .72, growth * 1.22, growth * .86);
			wave.position.x += side * progress * .38;
			wave.position.z += progress * .18;
		});
		let visibleVibrationArcs = 0;
		prefixed(root, "alarm-clock-vibration-arc-").forEach((arc, index) => {
			const beat = .5 + .5 * Math.sin(time * 48 + index * 1.57);
			arc.visible = motion > .08 && beat > .28;
			if (!arc.visible) return;
			visibleVibrationArcs += 1;
			const scale = .9 + beat * .24;
			arc.scale.set(scale, scale, .94 + beat * .16);
		});
		const structureAttached = [
			"alarm-clock-carry-handle-pivot",
			"alarm-clock-top-alarm-lever-pivot",
			"alarm-clock-bell-1-pivot",
			"alarm-clock-bell-2-pivot",
			"alarm-clock-bell-hammer-1-pivot",
			"alarm-clock-bell-hammer-2-pivot"
		].every((name) => named(root, name)?.parent === body);
		signalValue = motion;
		diagnostics = {
			timelineOwner: "AppliancePerformanceSystem",
			modelOwner: "alarm-clock-model-rig",
			sharedSpectacleEffects: "disabled",
			phase: phaseAt$2(time, motion),
			time,
			motionEnvelope: motion,
			bodyShakeX,
			bodyLift,
			bodyRoll,
			leftBellOffset: bellOffsets[0],
			rightBellOffset: bellOffsets[1],
			hourHandRadians,
			minuteHandRadians,
			visibleStereoWaves,
			visibleVibrationArcs,
			structureAttached,
			rigidBodyScale: [
				1,
				1,
				1
			],
			forbiddenFlatEffects: [
				"PlaneGeometry",
				"Sprite",
				"Line"
			]
		};
		root.userData.alarmClockPerformance = diagnostics;
	};
	const reset = () => {
		restore();
		signalValue = 0;
		diagnostics = {
			...diagnostics,
			phase: "idle",
			time: 0,
			motionEnvelope: 0,
			bodyShakeX: 0,
			bodyLift: 0,
			bodyRoll: 0,
			visibleStereoWaves: 0,
			visibleVibrationArcs: 0
		};
		delete root.userData.alarmClockPerformance;
	};
	return {
		apply,
		reset,
		signal: () => signalValue,
		get diagnostics() {
			return diagnostics;
		}
	};
}
//#endregion
//#region src/appliances/performance/PrinterPerformance.ts
var DEFAULT_PAPER_PROFILE = PRINTER_PAPER_PROFILES[0];
var PAPER_LAUNCH_INTERVALS = PRINTER_PAPER_PROFILES.slice(1).map((profile, index) => profile.launchTime - PRINTER_PAPER_PROFILES[index].launchTime);
var PRINTER_PERFORMANCE_TIMELINE = Object.freeze({
	startupEnd: .18,
	firstLaunch: DEFAULT_PAPER_PROFILE.launchTime,
	launchInterval: PAPER_LAUNCH_INTERVALS[0],
	launchIntervals: PAPER_LAUNCH_INTERVALS,
	flightDuration: DEFAULT_PAPER_PROFILE.flightDuration,
	pageCount: PRINTER_PAPER_PROFILES.length,
	feedEnd: DEFAULT_PAPER_PROFILE.feedEnd,
	glideEnd: DEFAULT_PAPER_PROFILE.glideEnd,
	stopEnd: PRINTER_PAPER_STOP_END,
	previousGenericHorizontalTravel: 4.6,
	horizontalTravel: 4.31,
	bottomExitY: -6.8,
	loopVerticalRadius: DEFAULT_PAPER_PROFILE.loopVerticalRadius,
	feedForwardDistance: DEFAULT_PAPER_PROFILE.feedForwardDistance,
	feedLaunchBias: DEFAULT_PAPER_PROFILE.feedLaunchBias,
	loopDepthRadius: DEFAULT_PAPER_PROFILE.loopDepthRadius,
	loopForwardDrift: DEFAULT_PAPER_PROFILE.loopForwardDrift,
	loopTopSlowdown: DEFAULT_PAPER_PROFILE.loopTopSlowdown,
	leafDepthAmplitude: DEFAULT_PAPER_PROFILE.leafDepthAmplitude,
	leafDepthCycles: 1.25,
	fallDropDistance: DEFAULT_PAPER_PROFILE.fallDropDistance,
	fallFirstStop: DEFAULT_PAPER_PROFILE.fallFirstStop,
	fallSecondStop: DEFAULT_PAPER_PROFILE.fallSecondStop,
	fallFirstStopDrop: DEFAULT_PAPER_PROFILE.fallFirstStopDrop,
	fallSecondStopDrop: DEFAULT_PAPER_PROFILE.fallSecondStopDrop,
	leafVelocityPitch: DEFAULT_PAPER_PROFILE.leafVelocityPitch,
	leafReactionPitch: DEFAULT_PAPER_PROFILE.leafReactionPitch
});
function numberData(object, key, fallback) {
	const value = Number(object.userData[key]);
	return Number.isFinite(value) ? value : fallback;
}
function suffixIndex(name) {
	return Number(name.match(/(\d+)$/)?.[1] ?? 0);
}
function captureRest(object) {
	if (!object) return null;
	return {
		object,
		position: object.position.clone(),
		quaternion: object.quaternion.clone(),
		scale: object.scale.clone(),
		visible: object.visible
	};
}
function restoreRest(rest) {
	if (!rest) return;
	rest.object.position.copy(rest.position);
	rest.object.quaternion.copy(rest.quaternion);
	rest.object.scale.copy(rest.scale);
	rest.object.visible = rest.visible;
}
function loopProgress(progress, profile) {
	const raw = (progress - profile.feedEnd) / (profile.glideEnd - profile.feedEnd);
	const clamped = MathUtils.clamp(raw, 0, 1);
	return clamped + profile.loopTopSlowdown * Math.sin(clamped * Math.PI * 2) / (Math.PI * 2);
}
function feedProgress(progress, profile) {
	const raw = MathUtils.clamp(progress / profile.feedEnd, 0, 1);
	return raw + profile.feedLaunchBias * raw * (1 - raw);
}
function leafMotion(progress, profile) {
	const p = MathUtils.clamp(progress, 0, 1);
	const stops = [
		{
			progress: 0,
			depth: 0,
			descent: 0
		},
		{
			progress: profile.fallFirstStop,
			depth: 1,
			descent: profile.fallFirstStopDrop
		},
		{
			progress: profile.fallSecondStop,
			depth: -1,
			descent: profile.fallSecondStopDrop
		},
		{
			progress: 1,
			depth: 1,
			descent: 1
		}
	];
	const segmentIndex = p <= stops[1].progress ? 0 : p <= stops[2].progress ? 1 : 2;
	const from = stops[segmentIndex];
	const to = stops[segmentIndex + 1];
	const duration = to.progress - from.progress;
	const local = MathUtils.clamp((p - from.progress) / duration, 0, 1);
	const firstApproach = segmentIndex === 0;
	const eased = firstApproach ? 1 - (1 - local) ** 2 : (1 - Math.cos(local * Math.PI)) * .5;
	const depthDelta = to.depth - from.depth;
	const direction = Math.sign(depthDelta);
	return {
		depth: MathUtils.lerp(from.depth, to.depth, eased),
		descent: MathUtils.lerp(from.descent, to.descent, eased),
		velocity: firstApproach ? direction * (1 - local) : direction * Math.sin(local * Math.PI),
		acceleration: firstApproach ? -direction : direction * Math.cos(local * Math.PI)
	};
}
function samplePath(progress, profile) {
	const p = MathUtils.clamp(progress, 0, 1);
	if (p < profile.feedEnd) {
		const feed = feedProgress(p, profile);
		return {
			x: profile.loopLateralOffset * MathUtils.smoothstep(feed, 0, 1),
			y: 0,
			z: profile.feedForwardDistance * feed,
			stage: "feed"
		};
	}
	if (p < profile.glideEnd) {
		const loop = loopProgress(p, profile);
		const angle = loop * Math.PI * 2;
		return {
			x: profile.loopLateralOffset + profile.loopLateralSwing * (1 - Math.cos(angle)) * .5,
			y: profile.loopVerticalRadius * (1 - Math.cos(angle)),
			z: profile.feedForwardDistance + profile.loopForwardDrift * loop + profile.loopDepthRadius * Math.sin(angle),
			stage: "glide"
		};
	}
	const fall = (p - profile.glideEnd) / (1 - profile.glideEnd);
	const motion = leafMotion(fall, profile);
	const depthEnvelope = profile.leafDepthAmplitude * (1 - motion.descent * .2);
	const firstApproachEase = 1 - (1 - MathUtils.clamp(fall / profile.fallFirstStop, 0, 1)) ** 2;
	return {
		x: fall <= profile.fallFirstStop ? MathUtils.lerp(profile.loopLateralOffset, profile.fallLateralTarget, firstApproachEase) : profile.fallLateralTarget + profile.fallLateralSway * (motion.depth - 1),
		y: -profile.fallDropDistance * motion.descent,
		z: profile.feedForwardDistance + profile.loopForwardDrift + profile.fallDepthDirection * motion.depth * depthEnvelope,
		stage: "fall"
	};
}
function sampleTangent(progress, profile) {
	const epsilon = .001;
	const before = samplePath(Math.max(0, progress - epsilon), profile);
	const after = samplePath(Math.min(1, progress + epsilon), profile);
	return new Vector3(after.x - before.x, after.y - before.y, after.z - before.z).normalize();
}
function restorePaperGeometry(rig) {
	const position = rig.mesh.geometry.getAttribute("position");
	position.array.set(rig.basePositions);
	position.needsUpdate = true;
	rig.mesh.geometry.computeVertexNormals();
}
function phaseAt$1(power, visiblePages, recycledPages, stages) {
	if (power <= .001) return "idle";
	if (visiblePages === 0 && recycledPages === 0) return "spin-up";
	if (visiblePages === 0 && recycledPages >= PRINTER_PERFORMANCE_TIMELINE.pageCount) return "all-pages-exited";
	if (stages.includes("fall")) return "flutter-fall";
	if (stages.includes("glide")) return "paper-glide";
	return "continuous-feed";
}
function createPrinterPerformance(root) {
	const papers = [];
	root.traverse((object) => {
		if (!(object instanceof Group) || !/^printer-performance-page-\d+$/.test(object.name)) return;
		const mesh = object.children.find((child) => child instanceof Mesh && child.userData.performanceProp === "clean-flat-volumetric-a4-paper");
		if (!mesh) return;
		const position = mesh.geometry.getAttribute("position");
		const index = suffixIndex(object.name);
		const profile = PRINTER_PAPER_PROFILES[index - 1] ?? DEFAULT_PAPER_PROFILE;
		papers.push({
			index,
			profile,
			pivot: object,
			mesh,
			launchTime: numberData(object, "launchTime", profile.launchTime),
			duration: numberData(object, "flightDuration", profile.flightDuration),
			basePositions: new Float32Array(position.array),
			restPosition: object.position.clone(),
			restQuaternion: object.quaternion.clone(),
			restScale: object.scale.clone()
		});
	});
	papers.sort((first, second) => first.index - second.index);
	const supportRest = captureRest(root.getObjectByName("printer-rear-paper-support-pivot"));
	const rollerRest = captureRest(root.getObjectByName("printer-feed-roller-pivot"));
	const carriageRest = captureRest(root.getObjectByName("printer-inferred-print-carriage-pivot"));
	const trayRest = captureRest(root.getObjectByName("printer-output-tray-hinge-pivot"));
	const indicator = root.getObjectByName("status-indicator");
	const indicatorColor = indicator?.material.color.clone();
	const indicatorEmissive = indicator?.material.emissive.clone();
	const indicatorIntensity = indicator?.material.emissiveIntensity ?? 0;
	const launchTimes = papers.map((paper) => paper.launchTime);
	const launchIntervals = launchTimes.slice(1).map((launch, index) => launch - launchTimes[index]);
	const firstMesh = papers[0]?.mesh;
	const a4Width = firstMesh ? numberData(firstMesh, "paperWidth", 0) : 0;
	const a4Length = firstMesh ? numberData(firstMesh, "paperLength", 0) : 0;
	const paperThickness = firstMesh ? numberData(firstMesh, "paperThickness", 0) : 0;
	let signalValue = 0;
	const diagnostics = {
		time: 0,
		phase: "idle",
		pageCount: papers.length,
		visiblePages: 0,
		recycledPages: 0,
		activeStages: [],
		launchTimes,
		launchInterval: launchIntervals[0] ?? 0,
		launchIntervals,
		profileIds: papers.map((paper) => paper.profile.id),
		a4Width,
		a4Length,
		a4AspectRatio: a4Width > 0 ? a4Length / a4Width : 0,
		paperThickness,
		minimumHorizontalTravel: PRINTER_PERFORMANCE_TIMELINE.horizontalTravel,
		previousGenericHorizontalTravel: PRINTER_PERFORMANCE_TIMELINE.previousGenericHorizontalTravel,
		horizontalTravelMultiplier: PRINTER_PERFORMANCE_TIMELINE.horizontalTravel / PRINTER_PERFORMANCE_TIMELINE.previousGenericHorizontalTravel,
		currentMaximumHorizontalTravel: 0,
		currentHighestY: 0,
		currentLowestY: 0,
		maximumBend: 0,
		maximumTwist: 0,
		bottomExitY: PRINTER_PERFORMANCE_TIMELINE.bottomExitY,
		recycledOnlyAfterBottomExit: true,
		pagesHaveDistinctProgress: false,
		allPaperGeometryVolumetric: papers.every((paper) => paper.mesh.geometry.type !== "PlaneGeometry" && numberData(paper.mesh, "paperThickness", 0) > 0),
		timelineOwner: "AppliancePerformanceSystem/PrinterPerformance",
		effectOwner: "printer-model-rig",
		sharedSpectacleEffects: "disabled",
		forbiddenPrimitives: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
	root.userData.printerPerformanceDiagnostics = diagnostics;
	const reset = () => {
		restoreRest(supportRest);
		restoreRest(rollerRest);
		restoreRest(carriageRest);
		restoreRest(trayRest);
		papers.forEach((paper) => {
			paper.pivot.visible = false;
			paper.pivot.position.copy(paper.restPosition);
			paper.pivot.quaternion.copy(paper.restQuaternion);
			paper.pivot.scale.copy(paper.restScale);
			restorePaperGeometry(paper);
		});
		if (indicator && indicatorColor && indicatorEmissive) {
			indicator.material.color.copy(indicatorColor);
			indicator.material.emissive.copy(indicatorEmissive);
			indicator.material.emissiveIntensity = indicatorIntensity;
		}
		signalValue = 0;
		Object.assign(diagnostics, {
			time: 0,
			phase: "idle",
			visiblePages: 0,
			recycledPages: 0,
			activeStages: [],
			currentMaximumHorizontalTravel: 0,
			currentHighestY: 0,
			currentLowestY: 0,
			maximumBend: 0,
			maximumTwist: 0,
			recycledOnlyAfterBottomExit: true,
			pagesHaveDistinctProgress: false
		});
	};
	const apply = (rawTime, rawPower) => {
		const time = Math.max(0, rawTime);
		const power = MathUtils.clamp(rawPower, 0, 1);
		const startup = MathUtils.smoothstep(time, .02, PRINTER_PERFORMANCE_TIMELINE.startupEnd);
		signalValue = startup * power;
		restoreRest(supportRest);
		restoreRest(rollerRest);
		restoreRest(carriageRest);
		restoreRest(trayRest);
		const feedEnvelope = startup * power;
		if (rollerRest) rollerRest.object.rotation.x += time * 18.5 * feedEnvelope;
		if (carriageRest) carriageRest.object.position.x += Math.sin(time * 23) * .94 * feedEnvelope;
		if (trayRest) trayRest.object.rotation.x += .42 * feedEnvelope;
		if (indicator && indicatorColor && indicatorEmissive) {
			indicator.material.color.setHex(feedEnvelope > .01 ? 16767461 : indicatorColor.getHex());
			indicator.material.emissive.setHex(feedEnvelope > .01 ? 16736368 : indicatorEmissive.getHex());
			indicator.material.emissiveIntensity = feedEnvelope * 1.9;
		}
		let visiblePages = 0;
		let recycledPages = 0;
		let currentMaximumHorizontalTravel = 0;
		let currentHighestY = Number.NEGATIVE_INFINITY;
		let currentLowestY = Number.POSITIVE_INFINITY;
		let maximumBend = 0;
		let maximumTwist = 0;
		let recycledOnlyAfterBottomExit = true;
		const activeStages = [];
		const activeProgresses = [];
		papers.forEach((paper) => {
			paper.pivot.position.copy(paper.restPosition);
			paper.pivot.quaternion.copy(paper.restQuaternion);
			paper.pivot.scale.copy(paper.restScale);
			const age = time - paper.launchTime;
			const progress = age / paper.duration;
			if (age < 0 || power <= .001) {
				paper.pivot.visible = false;
				restorePaperGeometry(paper);
				activeStages.push("queued");
				return;
			}
			if (age + 1e-8 >= paper.duration) {
				const exit = samplePath(1, paper.profile);
				paper.pivot.position.set(paper.restPosition.x + exit.x, paper.restPosition.y + exit.y, paper.restPosition.z + exit.z);
				paper.pivot.visible = false;
				paper.pivot.userData.lastRecycleY = paper.pivot.position.y;
				paper.pivot.userData.recycledAfterBottomExit = paper.pivot.position.y <= PRINTER_PERFORMANCE_TIMELINE.bottomExitY;
				recycledOnlyAfterBottomExit &&= Boolean(paper.pivot.userData.recycledAfterBottomExit);
				recycledPages += 1;
				activeStages.push("recycled");
				return;
			}
			const clamped = MathUtils.clamp(progress, 0, 1);
			const path = samplePath(clamped, paper.profile);
			const tangent = sampleTangent(clamped, paper.profile);
			paper.pivot.visible = true;
			paper.pivot.position.set(paper.restPosition.x + path.x, paper.restPosition.y + path.y, paper.restPosition.z + path.z);
			let lateralRoll = 0;
			if (path.stage === "glide") paper.pivot.rotation.x = -loopProgress(clamped, paper.profile) * Math.PI * 2;
			else if (path.stage === "fall") {
				const fall = (clamped - paper.profile.glideEnd) / (1 - paper.profile.glideEnd);
				const motion = leafMotion(fall, paper.profile);
				const pitchBlend = MathUtils.smoothstep(fall, 0, .05);
				paper.pivot.rotation.x = -Math.PI * 2 + (-motion.velocity * paper.profile.fallDepthDirection * paper.profile.leafVelocityPitch - motion.acceleration * paper.profile.fallDepthDirection * paper.profile.leafReactionPitch) * pitchBlend;
				lateralRoll = paper.profile.fallRoll * motion.velocity;
			} else paper.pivot.rotation.x = -Math.atan2(tangent.y, Math.max(1e-4, tangent.z));
			paper.pivot.rotation.y = 0;
			paper.pivot.rotation.z = lateralRoll;
			restorePaperGeometry(paper);
			currentMaximumHorizontalTravel = Math.max(currentMaximumHorizontalTravel, path.z);
			currentHighestY = Math.max(currentHighestY, paper.pivot.position.y);
			currentLowestY = Math.min(currentLowestY, paper.pivot.position.y);
			visiblePages += 1;
			activeStages.push(path.stage);
			activeProgresses.push(clamped);
		});
		const pagesHaveDistinctProgress = activeProgresses.length > 1 && Math.max(...activeProgresses) - Math.min(...activeProgresses) > .2;
		Object.assign(diagnostics, {
			time,
			phase: phaseAt$1(power, visiblePages, recycledPages, activeStages),
			visiblePages,
			recycledPages,
			activeStages,
			currentMaximumHorizontalTravel,
			currentHighestY: Number.isFinite(currentHighestY) ? currentHighestY : 0,
			currentLowestY: Number.isFinite(currentLowestY) ? currentLowestY : 0,
			maximumBend,
			maximumTwist,
			recycledOnlyAfterBottomExit,
			pagesHaveDistinctProgress
		});
	};
	reset();
	return {
		apply,
		reset,
		signal: () => signalValue,
		diagnostics
	};
}
//#endregion
//#region src/appliances/performance/InductionCooktopPerformance.ts
var TAU = Math.PI * 2;
var INDUCTION_COOKTOP_TIMELINE = Object.freeze({
	gentleSimmerStart: .12,
	heatBuildStart: 1.18,
	rollingBoilStart: 2.48,
	potLaunchStart: 3.28,
	potApex: 3.61,
	potLanding: 4.08,
	lastFoodLanding: 4.72,
	steamFadeStart: 4.78,
	settleEnd: 5.2,
	boilBubbleCount: 14,
	steamCloudCount: 18,
	foodPieceCount: 13
});
function clamp01(value) {
	return MathUtils.clamp(value, 0, 1);
}
function pulse(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function phaseAt(time, power, airborne) {
	if (power <= .001 || time <= 0) return "idle";
	if (time < INDUCTION_COOKTOP_TIMELINE.heatBuildStart) return "gentle-simmer";
	if (time < INDUCTION_COOKTOP_TIMELINE.rollingBoilStart) return "heating-up";
	if (time < INDUCTION_COOKTOP_TIMELINE.potLaunchStart) return "rolling-boil";
	if (time < INDUCTION_COOKTOP_TIMELINE.potLanding) return "pot-jump";
	if (airborne > 0) return "food-return";
	if (time < INDUCTION_COOKTOP_TIMELINE.settleEnd) return "settling";
	return "complete";
}
function foodCandidates(root) {
	const result = [];
	root.traverse((object) => {
		if (/^induction-cooktop-hotpot-meat-slice-\d+-pivot$/.test(object.name) || /^induction-cooktop-hotpot-tofu-cube-\d+$/.test(object.name) || /^induction-cooktop-hotpot-meatball-\d+$/.test(object.name) || /^induction-cooktop-hotpot-vegetable-\d+-pivot$/.test(object.name)) result.push(object);
	});
	return result.sort((first, second) => first.name.localeCompare(second.name));
}
function createInductionCooktopPerformance(root) {
	const cookware = root.getObjectByName("induction-cooktop-powered-cookware-pivot");
	const soup = root.getObjectByName("induction-cooktop-powered-simmer-surface");
	const knob = root.getObjectByName("induction-cooktop-rotary-knob-pivot");
	const fan = root.getObjectByName("induction-cooktop-inferred-fan-rotor-pivot");
	const heatRings = [];
	const boilBubbles = [];
	const steamClouds = [];
	const indicator = root.getObjectByName("induction-cooktop-status-indicator");
	root.traverse((object) => {
		if (/^induction-cooktop-powered-heat-ring-\d+$/.test(object.name)) heatRings.push(object);
		if (/^induction-cooktop-soup-rolling-bubble-\d+$/.test(object.name)) boilBubbles.push(object);
		if (/^induction-cooktop-steam-cloud-\d+-pivot$/.test(object.name)) steamClouds.push(object);
	});
	if (!cookware || !soup || !knob || !fan) throw new Error("Incomplete induction-cooktop performance rig");
	const food = foodCandidates(root).map((object, index) => ({
		object,
		index,
		basePosition: object.position.clone(),
		baseQuaternion: object.quaternion.clone(),
		launch: 3.32 + index * .026,
		duration: .92 + index % 5 * .065,
		lift: 2.55 + index % 4 * .32 + Math.floor(index / 4) * .08,
		driftX: (index % 5 - 2) * .09,
		driftZ: (index * 3 % 7 - 3) * .065,
		spin: new Vector3(2.4 + index * .17, 3.1 + index % 4 * .45, (index % 2 ? -1 : 1) * (2.2 + index * .12))
	}));
	if (food.length !== INDUCTION_COOKTOP_TIMELINE.foodPieceCount) throw new Error(`Expected 13 induction-cooktop food rigs, found ${food.length}`);
	const animatedSet = /* @__PURE__ */ new Set();
	[
		cookware,
		soup,
		knob,
		fan,
		indicator,
		...heatRings,
		...boilBubbles,
		...steamClouds
	].forEach((object) => {
		if (object) object.traverse((node) => animatedSet.add(node));
	});
	food.forEach(({ object }) => object.traverse((node) => animatedSet.add(node)));
	const poses = [...animatedSet].map((object) => ({
		object,
		position: object.position.clone(),
		quaternion: object.quaternion.clone(),
		scale: object.scale.clone(),
		visible: object.visible
	}));
	const seenMaterials = /* @__PURE__ */ new Set();
	const materials = [];
	animatedSet.forEach((object) => {
		if (!(object instanceof Mesh)) return;
		(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
			if (seenMaterials.has(material)) return;
			seenMaterials.add(material);
			const toon = material;
			materials.push({
				material,
				color: toon.color?.clone(),
				emissive: toon.emissive?.clone(),
				emissiveIntensity: toon.emissiveIntensity,
				opacity: material.opacity
			});
		});
	});
	let signalValue = 0;
	let running = false;
	const diagnostics = {
		time: 0,
		phase: "idle",
		heatStrength: 0,
		potLift: 0,
		potLanded: true,
		airborneFood: 0,
		returnedFood: 0,
		highestFoodLift: 0,
		foodHeightSpread: 0,
		visibleBoilBubbles: 0,
		visibleSteamClouds: 0,
		soupRoll: 0,
		returnImpact: 0,
		volumetricOnly: true,
		effectOwner: "InductionCooktopPerformance",
		timelineOwner: "ApplianceMechanics/InductionCooktopPerformance",
		sharedSpectacleEffects: "must-be-disabled-during-integration"
	};
	root.userData.inductionCooktopPerformance = diagnostics;
	const restore = () => {
		poses.forEach((pose) => {
			pose.object.position.copy(pose.position);
			pose.object.quaternion.copy(pose.quaternion);
			pose.object.scale.copy(pose.scale);
			pose.object.visible = pose.visible;
		});
		materials.forEach(({ material, color, emissive, emissiveIntensity, opacity }) => {
			const toon = material;
			if (color && toon.color) toon.color.copy(color);
			if (emissive && toon.emissive) toon.emissive.copy(emissive);
			if (emissiveIntensity !== void 0) toon.emissiveIntensity = emissiveIntensity;
			material.opacity = opacity;
		});
	};
	const reset = () => {
		restore();
		running = false;
		signalValue = 0;
		Object.assign(diagnostics, {
			time: 0,
			phase: "idle",
			heatStrength: 0,
			potLift: 0,
			potLanded: true,
			airborneFood: 0,
			returnedFood: 0,
			highestFoodLift: 0,
			foodHeightSpread: 0,
			visibleBoilBubbles: 0,
			visibleSteamClouds: 0,
			soupRoll: 0,
			returnImpact: 0
		});
	};
	const start = () => {
		reset();
		running = true;
	};
	const apply = (rawTime, rawPower) => {
		restore();
		running = true;
		const time = Math.max(0, rawTime);
		const power = clamp01(rawPower);
		const startup = MathUtils.smoothstep(time, .02, .42);
		const heatStrength = startup * (.28 + MathUtils.smoothstep(time, .72, 2.76) * .72) * power;
		const steamFade = 1 - MathUtils.smoothstep(time, INDUCTION_COOKTOP_TIMELINE.steamFadeStart, INDUCTION_COOKTOP_TIMELINE.settleEnd);
		const activeEnvelope = startup * power;
		cookware.visible = true;
		knob.rotation.y += MathUtils.smoothstep(time, .04, .42) * -1.28 * power;
		fan.rotation.y += time * (5 + heatStrength * 17);
		heatRings.forEach((ring, index) => {
			const ringGate = MathUtils.smoothstep(time, .18 + index * .15, .48 + index * .17) * steamFade * power;
			ring.visible = ringGate > .01;
			ring.scale.setScalar(.96 + Math.sin(time * (3.2 + index * .28) + index) * .045 * ringGate);
			const material = ring.material;
			material.opacity = .2 + ringGate * .64;
			material.emissiveIntensity = ringGate * 1.75;
		});
		if (indicator) {
			const material = indicator.material;
			material.emissive.setHex(16736074);
			material.emissiveIntensity = heatStrength * 2.1;
			material.color.setHex(heatStrength > .02 ? 16765069 : 8485263);
		}
		const simmer = MathUtils.smoothstep(time, INDUCTION_COOKTOP_TIMELINE.gentleSimmerStart, 1) * power;
		const rolling = MathUtils.smoothstep(time, 1.55, INDUCTION_COOKTOP_TIMELINE.rollingBoilStart) * power;
		const soupRoll = (.018 * simmer + .055 * rolling) * (.65 + .35 * Math.sin(time * (5.2 + rolling * 7.4)));
		soup.position.y += soupRoll;
		soup.scale.set(1 + Math.sin(time * 8.4) * .012 * rolling, 1 + soupRoll * .9, 1 + Math.cos(time * 7.7) * .014 * rolling);
		soup.rotation.y += Math.sin(time * 2.8) * .035 * rolling;
		let visibleBoilBubbles = 0;
		boilBubbles.forEach((bubble, index) => {
			const gate = MathUtils.smoothstep(time, 1.18 + index * .018, 1.72 + index * .022) * steamFade * power;
			const wave = .5 + .5 * Math.sin(time * (7.2 + rolling * 8.6) + index * 1.73);
			bubble.visible = gate > .04 && wave > .17;
			if (!bubble.visible) return;
			visibleBoilBubbles += 1;
			const base = bubble.userData.basePosition;
			bubble.position.set(base[0], base[1] + wave * (.035 + rolling * .095), base[2]);
			bubble.scale.setScalar((.52 + wave * (.55 + rolling * .42)) * gate);
		});
		let potLift = 0;
		if (time >= INDUCTION_COOKTOP_TIMELINE.potLaunchStart && time < INDUCTION_COOKTOP_TIMELINE.potLanding) {
			const progress = (time - INDUCTION_COOKTOP_TIMELINE.potLaunchStart) / (INDUCTION_COOKTOP_TIMELINE.potLanding - INDUCTION_COOKTOP_TIMELINE.potLaunchStart);
			potLift = Math.sin(progress * Math.PI) * .96 * power;
			cookware.position.y += potLift;
			cookware.rotation.z += Math.sin(progress * Math.PI) * Math.sin(progress * TAU) * .11 * power;
			cookware.rotation.x += Math.sin(progress * Math.PI) * -.075 * power;
		}
		const landingImpact = pulse(time, 4.04, 4.11, 4.24) * power;
		cookware.position.y -= landingImpact * .055;
		cookware.scale.set(1 + landingImpact * .045, 1 - landingImpact * .09, 1 + landingImpact * .045);
		let airborneFood = 0;
		let returnedFood = 0;
		let highestFoodLift = 0;
		const foodHeights = [];
		let returnImpact = 0;
		food.forEach((item) => {
			const gentle = Math.sin(time * (1.55 + item.index * .045) + item.index * 1.27) * (.014 + rolling * .035) * simmer;
			const drift = Math.cos(time * (.92 + item.index * .03) + item.index) * (.012 + rolling * .028) * simmer;
			item.object.position.copy(item.basePosition);
			item.object.quaternion.copy(item.baseQuaternion);
			item.object.position.y += gentle;
			item.object.position.x += drift;
			item.object.position.z += Math.sin(time * 1.15 + item.index * .77) * (.01 + rolling * .022) * simmer;
			item.object.rotation.y += Math.sin(time * (1.1 + item.index * .025) + item.index) * (.09 + rolling * .22) * simmer;
			const flightProgress = (time - item.launch) / item.duration;
			if (flightProgress >= 0 && flightProgress < 1) {
				airborneFood += 1;
				const lift = Math.sin(flightProgress * Math.PI) * item.lift * power;
				highestFoodLift = Math.max(highestFoodLift, lift);
				foodHeights.push(lift);
				item.object.position.y += lift - potLift;
				item.object.position.x += Math.sin(flightProgress * Math.PI) * item.driftX * power;
				item.object.position.z += Math.sin(flightProgress * Math.PI) * item.driftZ * power;
				item.object.rotation.x += item.spin.x * flightProgress * power;
				item.object.rotation.y += item.spin.y * flightProgress * power;
				item.object.rotation.z += item.spin.z * flightProgress * power;
			} else if (flightProgress >= 1) {
				returnedFood += 1;
				const impactAt = item.launch + item.duration;
				const pieceImpact = pulse(time, impactAt - .035, impactAt + .025, impactAt + .16) * power;
				returnImpact = Math.max(returnImpact, pieceImpact);
				item.object.position.y -= pieceImpact * .045;
				item.object.rotation.z += Math.sin((time - impactAt) * 28) * pieceImpact * .08;
			}
		});
		soup.position.y -= returnImpact * .035;
		soup.scale.x += returnImpact * .045;
		soup.scale.z += returnImpact * .045;
		let visibleSteamClouds = 0;
		steamClouds.forEach((cloud, index) => {
			const spawn = 1.82 + index * .037;
			const intensity = MathUtils.smoothstep(time, spawn, spawn + .42) * steamFade * power;
			const age = Math.max(0, time - spawn);
			const cycle = 1.08 + index % 4 * .08;
			const progress = age % cycle / cycle;
			cloud.visible = intensity > .035 && progress < .9;
			if (!cloud.visible) return;
			visibleSteamClouds += 1;
			const base = cloud.userData.basePosition;
			const climaxBoost = 1 + rolling * .28 + pulse(time, 2.86, 3.48, 4.3) * .24;
			cloud.position.set(base[0] + Math.sin(time * 2.3 + index * 1.17) * (.05 + progress * .16), base[1] + progress * (1.05 + index % 5 * .12) * climaxBoost, base[2] + Math.cos(time * 1.9 + index * .83) * (.04 + progress * .12));
			const scale = (.32 + progress * .46) * intensity * climaxBoost;
			cloud.scale.set(scale * (.88 + index % 3 * .08), scale, scale * .86);
			cloud.rotation.y = time * (.32 + index % 4 * .06) + index;
		});
		signalValue = activeEnvelope * (.32 + heatStrength * .68);
		const spread = foodHeights.length > 1 ? Math.max(...foodHeights) - Math.min(...foodHeights) : 0;
		Object.assign(diagnostics, {
			time,
			phase: phaseAt(time, power, airborneFood),
			heatStrength,
			potLift,
			potLanded: time < INDUCTION_COOKTOP_TIMELINE.potLaunchStart || time >= INDUCTION_COOKTOP_TIMELINE.potLanding,
			airborneFood,
			returnedFood,
			highestFoodLift,
			foodHeightSpread: spread,
			visibleBoilBubbles,
			visibleSteamClouds,
			soupRoll,
			returnImpact
		});
	};
	reset();
	return {
		start,
		apply,
		update: apply,
		reset,
		stop: reset,
		signal: () => running ? signalValue : 0,
		diagnostics
	};
}
//#endregion
//#region src/appliances/performance/ApplianceMechanics.ts
function smoothPulse$1(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function captureObjects(root) {
	const result = [];
	root.traverse((object) => result.push({
		object,
		position: object.position.clone(),
		quaternion: object.quaternion.clone(),
		scale: object.scale.clone(),
		visible: object.visible
	}));
	return result;
}
function captureMaterials(root) {
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	root.traverse((object) => {
		if (!(object instanceof Mesh)) return;
		(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
			if (seen.has(material)) return;
			seen.add(material);
			const toon = material;
			result.push({
				material,
				color: toon.color?.clone(),
				emissive: toon.emissive?.clone(),
				emissiveIntensity: toon.emissiveIntensity,
				opacity: material.opacity,
				transparent: material.transparent
			});
		});
	});
	return result;
}
function restore(objects, materials) {
	objects.forEach((state) => {
		state.object.position.copy(state.position);
		state.object.quaternion.copy(state.quaternion);
		state.object.scale.copy(state.scale);
		state.object.visible = state.visible;
	});
	materials.forEach((state) => {
		const toon = state.material;
		if (state.color && toon.color) toon.color.copy(state.color);
		if (state.emissive && toon.emissive) toon.emissive.copy(state.emissive);
		if (state.emissiveIntensity !== void 0) toon.emissiveIntensity = state.emissiveIntensity;
		state.material.opacity = state.opacity;
		state.material.transparent = state.transparent;
	});
}
/**
* The single mechanical definition used by both live-game performance sessions
* and gallery previews. Model factories only provide the named rig this module targets.
*/
function createApplianceMechanicalAnimation(kind, root) {
	const objects = captureObjects(root);
	const materials = captureMaterials(root);
	let signalValue = 0;
	const desktopComputerPerformance = kind === "desktop-computer" ? createDesktopComputerPerformance(root) : null;
	const gumballMachinePerformance = kind === "gumball-machine" ? createGumballMachinePerformance(root) : null;
	const fanPerformance = kind === "fan" ? createFanPerformance(root) : null;
	const washerPerformance = kind === "washer" ? createWasherPerformance(root) : null;
	const kettlePerformance = kind === "kettle" ? createKettlePerformance(root) : null;
	const riceCookerPerformance = kind === "rice-cooker" ? createRiceCookerPerformance(root) : null;
	const robotVacuumPerformance = kind === "robot-vacuum" ? createRobotVacuumPerformance(root) : null;
	const popcornMachinePerformance = kind === "popcorn-machine" ? createPopcornMachinePerformance(root) : null;
	const bubbleMachinePerformance = kind === "bubble-machine" ? createBubbleMachinePerformance(root) : null;
	const smartBinPerformance = kind === "smart-bin" ? createSmartBinPerformance(root) : null;
	const alarmClockPerformance = kind === "alarm-clock" ? createAlarmClockPerformance(root) : null;
	const printerPerformance = kind === "printer" ? createPrinterPerformance(root) : null;
	const recordPlayerPerformance = kind === "record-player" ? createRecordPlayerPerformance(root) : null;
	const inductionCooktopPerformance = kind === "induction-cooktop" ? createInductionCooktopPerformance(root) : null;
	const node = (name) => root.getObjectByName(name) ?? null;
	const rotate = (name, axis, value) => {
		const target = node(name);
		if (target) target.rotation[axis] = value;
	};
	const indicator = () => node("status-indicator");
	const lightIndicator = (strength, color = 16740741) => {
		const mesh = indicator();
		if (!mesh) return;
		mesh.material.color.setHex(strength > .02 ? 16767461 : 8485263);
		mesh.material.emissive.setHex(strength > .02 ? color : 0);
		mesh.material.emissiveIntensity = strength * 1.8;
	};
	const glow = (name, strength, color) => {
		const mesh = node(name);
		if (!mesh) return;
		(Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => {
			const toon = material;
			if (toon.emissive) toon.emissive.setHex(color);
			if (typeof toon.emissiveIntensity === "number") toon.emissiveIntensity = strength;
			if (material.transparent) material.opacity = Math.max(material.opacity, strength * .82);
		});
	};
	root.userData.performanceDefinition = kind;
	return {
		update: (time, power) => {
			restore(objects, materials);
			const p = MathUtils.clamp(power, 0, 1);
			const startup = MathUtils.smoothstep(time, .02, .42);
			const run = startup * p;
			const climax = smoothPulse$1(time, 3.68, 4.18, 4.82) * p;
			signalValue = run;
			lightIndicator(run, kind === "humidifier" ? 6478034 : 16736368);
			switch (kind) {
				case "lamp": {
					const head = node("lamp-head-hinge-pivot");
					if (head) {
						const pose = sampleLampHeadPose(time);
						head.rotation.x += pose.pitch * run;
						head.rotation.z += pose.roll * run;
						head.userData.performancePhase = pose.phase;
						head.userData.performanceSegmentProgress = pose.segmentProgress;
					}
					rotate("lamp-shade-top-button-pivot", "y", -Math.PI * .7 * startup * p);
					glow("lamp-warm-diffuser", run * 1.65, 16763501);
					glow("lamp-shade-front-rim", run * .85, 16767116);
					break;
				}
				case "fan":
					fanPerformance?.apply(time, p);
					signalValue = fanPerformance?.signal() ?? run;
					break;
				case "radio": {
					const antenna = node("radio-antenna-hinge-pivot");
					const aerialRise = MathUtils.smoothstep(time, .06, .5);
					const aerialOvershoot = smoothPulse$1(time, .38, .59, .86) * p;
					const upright = aerialRise * (1 - MathUtils.smoothstep(time, 5.02, 5.18));
					const swayGate = MathUtils.smoothstep(time, .7, .98) * (1 - MathUtils.smoothstep(time, 4.22, 4.34)) * p;
					const sway = (Math.sin((time - .7) * 3.15) + Math.sin((time - .7) * 7.4 + .45) * .33) * .055 * swayGate;
					if (antenna) antenna.rotation.z = MathUtils.lerp(1.12, .035, upright) - aerialOvershoot * .145 + sway;
					const segmentExtensions = [
						MathUtils.smoothstep(time, .5, .95) * (1 - MathUtils.smoothstep(time, 4.84, 5)),
						MathUtils.smoothstep(time, .78, 1.25) * (1 - MathUtils.smoothstep(time, 4.68, 4.84)),
						MathUtils.smoothstep(time, 1.08, 1.58) * (1 - MathUtils.smoothstep(time, 4.52, 4.68)),
						MathUtils.smoothstep(time, 1.4, 2) * (1 - MathUtils.smoothstep(time, 4.34, 4.52))
					];
					["radio-antenna-extension-pivot-2", "radio-antenna-extension-pivot-3"].forEach((name, index) => {
						const segment = node(name);
						if (!segment) return;
						const restY = Number(segment.userData.restY ?? segment.position.y);
						const extendedY = Number(segment.userData.extendedY ?? restY);
						segment.position.y = MathUtils.lerp(restY, extendedY, segmentExtensions[index + 1]);
					});
					const firstSegment = node("radio-antenna-extension-pivot-1");
					if (firstSegment) {
						const restY = Number(firstSegment.userData.restY ?? firstSegment.position.y);
						const extendedY = Number(firstSegment.userData.extendedY ?? restY);
						firstSegment.position.y = MathUtils.lerp(restY, extendedY, segmentExtensions[0]);
					}
					const antennaTipPivot = node("radio-antenna-tip-extension-pivot");
					const trackedSections = [
						{
							object: firstSegment,
							length: 1.35
						},
						{
							object: node("radio-antenna-extension-pivot-2"),
							length: 1.2
						},
						{
							object: node("radio-antenna-extension-pivot-3"),
							length: 1.05
						}
					];
					const highestSectionTop = Math.max(...trackedSections.map(({ object, length }) => object ? object.position.y + length : Number.NEGATIVE_INFINITY));
					if (antennaTipPivot && Number.isFinite(highestSectionTop)) antennaTipPivot.position.y = highestSectionTop;
					const pointer = node("radio-frequency-pointer-pivot");
					if (pointer) pointer.position.x += Math.sin(time * 17) * .27 * Math.min(1, time / 1.6) * run;
					const speaker = node("radio-speaker-diaphragm-pivot");
					if (speaker) {
						const beat = Math.max(0, Math.sin(time * 13)) ** 5 * run;
						speaker.scale.set(1 + beat * .2, 1 + beat * .2, 1 + beat * .32);
					}
					const body = node("radio-body-pivot") ?? root;
					body.scale.x *= 1 + Math.sin(time * 13) * .035 * run;
					const retractionPhase = time < 4.34 ? "none" : time < 4.52 ? "tip" : time < 4.68 ? "segment-3" : time < 4.84 ? "segment-2" : time < 5.02 ? "segment-1" : "hinge-return";
					const antennaTipCap = node("radio-antenna-tip-cap");
					if (antennaTipCap) antennaTipCap.visible = true;
					root.userData.radioPerformanceDiagnostics = {
						timeline: time,
						hingeAngle: antenna?.rotation.z ?? null,
						extension: segmentExtensions[3],
						rise: aerialRise,
						overshoot: aerialOvershoot,
						sway,
						segmentExtensions,
						retractionPhase,
						tipCapVisible: antennaTipCap?.visible ?? false,
						tipTracksHighestSection: antennaTipPivot?.userData.tracksHighestAntennaSection === true,
						tipTopError: antennaTipPivot && Number.isFinite(highestSectionTop) ? Math.abs(antennaTipPivot.position.y - highestSectionTop) : null,
						nearVertical: Math.abs(antenna?.rotation.z ?? 99) < .16
					};
					break;
				}
				case "television":
					applyTelevisionPerformance(root, time, p);
					break;
				case "humidifier":
					applyHumidifierPerformance(root, time, p);
					break;
				case "toaster": {
					const latched = MathUtils.smoothstep(time, .15, .55) * (1 - MathUtils.smoothstep(time, 3.72, 3.86)) * p;
					const carriage = node("toaster-toast-carriage");
					if (carriage) carriage.position.y -= latched * .32;
					const lever = node("toaster-lever-pivot");
					if (lever) lever.position.y -= latched * .37;
					rotate("toaster-browning-knob-pivot", "z", -Math.PI * .72 * startup * p);
					break;
				}
				case "refrigerator":
					applyRefrigeratorPerformance(root, time, p);
					break;
				case "washer":
					washerPerformance?.update(time, p);
					signalValue = washerPerformance?.signal() ?? run;
					break;
				case "microwave":
					applyMicrowavePerformance(root, time, p);
					break;
				case "coffee-maker":
					applyCoffeeMakerPerformance(root, time, p);
					break;
				case "kettle":
					kettlePerformance?.apply(time, p);
					signalValue = kettlePerformance?.signal() ?? 0;
					break;
				case "rice-cooker":
					riceCookerPerformance?.update(time, p);
					signalValue = riceCookerPerformance?.signal() ?? 0;
					break;
				case "phone":
					applyPhonePerformance(root, time, p);
					break;
				case "robot-vacuum":
					robotVacuumPerformance?.apply(time, p);
					signalValue = robotVacuumPerformance?.signal() ?? run;
					break;
				case "bubble-machine":
					bubbleMachinePerformance?.apply(time, p);
					signalValue = bubbleMachinePerformance?.signal() ?? run;
					break;
				case "gumball-machine":
					gumballMachinePerformance?.apply(time, p);
					break;
				case "popcorn-machine":
					popcornMachinePerformance?.apply(time, p);
					signalValue = popcornMachinePerformance?.signal() ?? run;
					break;
				case "alarm-clock":
					alarmClockPerformance?.apply(time, p);
					signalValue = alarmClockPerformance?.signal() ?? run;
					break;
				case "smart-bin":
					smartBinPerformance?.apply(time, p);
					signalValue = smartBinPerformance?.signal() ?? run;
					break;
				case "record-player":
					recordPlayerPerformance?.apply(time, p);
					signalValue = recordPlayerPerformance?.signal() ?? run;
					break;
				case "stand-mixer":
					applyStandMixerPerformance(root, time, p);
					break;
				case "printer":
					printerPerformance?.apply(time, p);
					signalValue = printerPerformance?.signal() ?? run;
					break;
				case "induction-cooktop":
					inductionCooktopPerformance?.apply(time, p);
					signalValue = inductionCooktopPerformance?.signal() ?? run;
					break;
				case "blender":
					applyBlenderPerformance(root, time, p);
					break;
				case "dehumidifier":
					applyDehumidifierPerformance(root, time, p);
					break;
				case "portable-speaker":
					applyPortableSpeakerPerformance(root, time, p);
					break;
				case "hair-dryer":
					rotate("hair-dryer-fan-rotor-pivot", "x", time * 20 * run);
					rotate("hair-dryer-power-slider-pivot", "y", -.28 * startup * p);
					{
						const body = node("hair-dryer-body-pivot");
						if (body) body.position.x += .14 * run + climax * .12;
						applyHairDryerPerformance(root, time, p);
					}
					break;
				case "desktop-computer":
					desktopComputerPerformance?.apply(time, p);
					break;
				case "game-controller": applyGameControllerPerformance(root, time, p);
			}
		},
		stop: () => {
			restore(objects, materials);
			signalValue = 0;
			if (kind === "radio") delete root.userData.radioPerformanceDiagnostics;
			if (kind === "hair-dryer") resetHairDryerPerformance(root);
			if (kind === "refrigerator") delete root.userData.refrigeratorPerformanceDiagnostics;
			if (kind === "game-controller") resetGameControllerPerformance(root);
			if (kind === "dehumidifier") resetDehumidifierPerformance(root);
			if (kind === "desktop-computer") desktopComputerPerformance?.reset();
			if (kind === "stand-mixer") resetStandMixerPerformance(root);
			if (kind === "gumball-machine") gumballMachinePerformance?.reset();
			if (kind === "portable-speaker") resetPortableSpeakerPerformance(root);
			if (kind === "microwave") resetMicrowavePerformance(root);
			if (kind === "fan") fanPerformance?.reset();
			if (kind === "television") resetTelevisionPerformance(root);
			if (kind === "humidifier") resetHumidifierPerformance(root);
			if (kind === "coffee-maker") resetCoffeeMakerPerformance(root);
			if (kind === "washer") washerPerformance?.stop();
			if (kind === "kettle") kettlePerformance?.reset();
			if (kind === "rice-cooker") riceCookerPerformance?.stop();
			if (kind === "phone") resetPhonePerformance(root);
			if (kind === "robot-vacuum") robotVacuumPerformance?.reset();
			if (kind === "popcorn-machine") popcornMachinePerformance?.reset();
			if (kind === "bubble-machine") bubbleMachinePerformance?.reset();
			if (kind === "smart-bin") smartBinPerformance?.reset();
			if (kind === "alarm-clock") alarmClockPerformance?.reset();
			if (kind === "printer") printerPerformance?.reset();
			if (kind === "record-player") recordPlayerPerformance?.reset();
			if (kind === "induction-cooktop") inductionCooktopPerformance?.reset();
			const mesh = indicator();
			if (mesh) {
				mesh.material.color.setHex(8485263);
				mesh.material.emissive.setHex(0);
				mesh.material.emissiveIntensity = 0;
			}
		},
		signal: () => signalValue
	};
}
//#endregion
//#region src/systems/PetalVisual.ts
/**
* One shared sakura silhouette for ambient, opening-screen and spectacle petals.
* A flat ShapeGeometry keeps the petal readable at small screen sizes and avoids
* the dark toon rim produced by the old flattened sphere.
*/
function createSakuraPetalGeometry(scale = 1) {
	const shape = new Shape();
	shape.moveTo(0, .15 * scale);
	shape.bezierCurveTo(.105 * scale, .105 * scale, .145 * scale, .01 * scale, .075 * scale, -.085 * scale);
	shape.bezierCurveTo(.035 * scale, -.135 * scale, -.035 * scale, -.135 * scale, -.075 * scale, -.085 * scale);
	shape.bezierCurveTo(-.145 * scale, .01 * scale, -.105 * scale, .105 * scale, 0, .15 * scale);
	return new ShapeGeometry(shape, 5);
}
function createSakuraPetalMaterial(color = PAL.petal, opacity = .78) {
	return new MeshBasicMaterial({
		color,
		side: 2,
		transparent: true,
		opacity,
		depthWrite: false,
		fog: true
	});
}
//#endregion
//#region src/systems/ApplianceSpectacleSystem.ts
var POOL_CAPACITY = {
	petal: 28,
	steam: 26,
	rain: 28,
	drop: 12,
	sheet: 12,
	bubble: 30,
	note: 22,
	paper: 18,
	trash: 18,
	popcorn: 30,
	rice: 30,
	ribbon: 24,
	debris: 22,
	toast: 6,
	wave: 18,
	spark: 18,
	"blender-drop": 28,
	"blender-splash": 12
};
var PALETTE = [
	PAL.blossomDeep,
	PAL.yellow,
	PAL.teal,
	PAL.blue,
	PAL.purple,
	PAL.orange
];
var Y_AXIS = new Vector3(0, 1, 0);
var Z_AXIS = new Vector3(0, 0, 1);
function smoothPulse(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function sampleCubic(target, curve, progress) {
	const [a, b, c, d] = curve;
	const inverse = 1 - progress;
	target.copy(a).multiplyScalar(inverse ** 3).addScaledVector(b, 3 * inverse * inverse * progress).addScaledVector(c, 3 * inverse * progress * progress).addScaledVector(d, progress ** 3);
}
/** Closed, volumetric and deliberately imperfect: never a flat icon or regular torus. */
function stylizedRadioWaveGeometry(variant) {
	const phase = variant * .91;
	const points = [];
	const pointCount = 48;
	for (let index = 0; index < pointCount; index += 1) {
		const angle = index / pointCount * Math.PI * 2;
		const radialWarp = Math.sin(angle * (3 + variant % 2) + phase) * (.035 + variant * .004) + Math.sin(angle * 7 - phase * .7) * .014;
		const radiusX = .43 + radialWarp;
		const radiusY = .37 + radialWarp * .72;
		points.push(new Vector3(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, Math.sin(angle * (2 + variant % 3) + phase) * (.045 + variant * .006)));
	}
	const curve = new CatmullRomCurve3(points, true, "centripetal", .42);
	const geometry = new TubeGeometry(curve, 96, .045 + variant * .004, 8, true);
	geometry.computeVertexNormals();
	geometry.userData.performanceProp = "irregular-volumetric-radio-wave";
	geometry.userData.variant = variant;
	geometry.userData.forbiddenPrimitives = [
		"PlaneGeometry",
		"TorusGeometry",
		"Line",
		"Sprite"
	];
	return geometry;
}
function noteGeometry() {
	const shape = new Shape();
	shape.moveTo(-.13, -.12);
	shape.bezierCurveTo(-.25, -.18, -.25, .02, -.1, .05);
	shape.bezierCurveTo(.04, .08, .08, -.1, -.03, -.16);
	shape.lineTo(.04, .46);
	shape.lineTo(.13, .46);
	shape.lineTo(.13, .02);
	shape.bezierCurveTo(.28, .12, .32, .26, .19, .34);
	shape.lineTo(.15, .24);
	shape.bezierCurveTo(.22, .19, .19, .12, .13, .1);
	shape.lineTo(.13, -.08);
	shape.bezierCurveTo(.08, -.01, .01, -.04, -.03, -.09);
	shape.bezierCurveTo(-.05, -.11, -.08, -.12, -.13, -.12);
	const geometry = new ExtrudeGeometry(shape, {
		depth: .075,
		steps: 1,
		bevelEnabled: true,
		bevelSize: .018,
		bevelThickness: .018,
		bevelSegments: 2,
		curveSegments: 5
	});
	geometry.translate(0, 0, -.0375);
	return geometry;
}
function sparkGeometry() {
	const shape = new Shape();
	const points = 10;
	for (let index = 0; index < points; index += 1) {
		const angle = Math.PI * .5 + index / points * Math.PI * 2;
		const radius = index % 2 === 0 ? .34 : .13;
		const x = Math.cos(angle) * radius;
		const y = Math.sin(angle) * radius;
		if (index === 0) shape.moveTo(x, y);
		else shape.lineTo(x, y);
	}
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth: .1,
		steps: 1,
		bevelEnabled: true,
		bevelSize: .025,
		bevelThickness: .025,
		bevelSegments: 2
	});
	geometry.translate(0, 0, -.05);
	return geometry;
}
function mergeParts(parts) {
	const normalized = parts.map((part) => part.index ? part.toNonIndexed() : part);
	const geometry = mergeGeometries(normalized, false);
	normalized.forEach((part) => part.dispose());
	parts.forEach((part, index) => {
		if (part !== normalized[index]) part.dispose();
	});
	if (!geometry) throw new Error("Unable to merge appliance performance prop geometry.");
	return geometry;
}
function popcornGeometry() {
	return mergeParts([
		[
			0,
			.07,
			0,
			.13
		],
		[
			-.09,
			0,
			.02,
			.105
		],
		[
			.09,
			.005,
			-.015,
			.11
		],
		[
			-.025,
			-.02,
			.09,
			.1
		],
		[
			.035,
			-.025,
			-.09,
			.095
		]
	].map(([x, y, z, radius]) => new IcosahedronGeometry(radius, 1).translate(x, y, z)));
}
function toastProfile(inset = 0) {
	const shape = new Shape();
	const half = .39 - inset;
	const bottom = -.39 + inset;
	const sideTop = .16 - inset * .18;
	const shoulderOuter = .43 - inset * .72;
	const shoulderInner = .34 - inset * .68;
	const notch = .305 - inset * .48;
	shape.moveTo(-half * .88, bottom);
	shape.quadraticCurveTo(-half, bottom, -half, bottom + .08);
	shape.lineTo(-half, sideTop);
	shape.bezierCurveTo(-half, shoulderInner, -half * .75, shoulderOuter, -half * .31, shoulderOuter);
	shape.bezierCurveTo(-half * .12, shoulderOuter, -half * .1, notch, 0, notch);
	shape.bezierCurveTo(half * .1, notch, half * .12, shoulderOuter, half * .31, shoulderOuter);
	shape.bezierCurveTo(half * .75, shoulderOuter, half, shoulderInner, half, sideTop);
	shape.lineTo(half, bottom + .08);
	shape.quadraticCurveTo(half, bottom, half * .88, bottom);
	shape.closePath();
	return shape;
}
function extrudeToastLayer(shape, depth, centreZ, bevel) {
	const geometry = new ExtrudeGeometry(shape, {
		depth,
		steps: 1,
		bevelEnabled: true,
		bevelSize: bevel,
		bevelThickness: bevel * .72,
		bevelSegments: 3,
		curveSegments: 12
	});
	geometry.translate(0, 0, centreZ - depth * .5);
	return geometry;
}
function toastPerformanceGeometry() {
	const outline = extrudeToastLayer(toastProfile(), .205, 0, .03).scale(1.055, 1.055, 1.08);
	const crust = extrudeToastLayer(toastProfile(), .19, 0, .028);
	const crumbFront = extrudeToastLayer(toastProfile(.085), .035, .113, .018);
	const crumbBack = extrudeToastLayer(toastProfile(.085), .035, -.113, .018);
	const parts = [
		outline,
		crust,
		crumbFront,
		crumbBack
	].map((part) => part.index ? part.toNonIndexed() : part);
	const geometry = mergeGeometries(parts, true);
	parts.forEach((part) => part.dispose());
	[
		outline,
		crust,
		crumbFront,
		crumbBack
	].forEach((part, index) => {
		if (part !== parts[index]) part.dispose();
	});
	if (!geometry) throw new Error("Unable to build layered toast performance geometry.");
	geometry.computeVertexNormals();
	geometry.userData.performanceProp = "layered-toast-slice";
	geometry.userData.components = [
		"outline-hull",
		"crust-volume",
		"crumb-front",
		"crumb-back"
	];
	return geometry;
}
function trashGeometry(variant) {
	if (variant === 0) return new DodecahedronGeometry(.2, 1).scale(1.08, .82, .94);
	if (variant === 1) return mergeParts([
		new CylinderGeometry(.09, .105, .34, 10).translate(0, -.015, 0),
		new CylinderGeometry(.055, .07, .11, 10).translate(0, .21, 0),
		new CylinderGeometry(.061, .061, .045, 10).translate(0, .285, 0)
	]);
	return new RoundedBoxGeometry(.32, .27, .22, 2, .045);
}
function blenderDropGeometry(variant) {
	if (variant === 0) return new IcosahedronGeometry(.17, 2).scale(.9, 1.12, .9);
	if (variant === 1) return new SphereGeometry(.16, 12, 8).scale(.72, 1.72, .72);
	if (variant === 2) {
		const curve = new CatmullRomCurve3([
			new Vector3(0, -.28, 0),
			new Vector3(-.025, -.08, .012),
			new Vector3(.035, .14, -.012),
			new Vector3(0, .32, 0)
		], false, "centripetal", .5);
		return new TubeGeometry(curve, 18, .085, 8, false);
	}
	return mergeParts([new SphereGeometry(.15, 10, 7).scale(1.08, .82, .94), new SphereGeometry(.085, 9, 6).translate(.12, .14, -.025)]);
}
function blenderSplashGeometry(variant) {
	if (variant === 0) {
		const shape = new Shape();
		const count = 18;
		for (let index = 0; index < count; index += 1) {
			const angle = index / count * Math.PI * 2;
			const radius = index % 3 === 0 ? .55 : index % 3 === 1 ? .31 : .42;
			const x = Math.cos(angle) * radius;
			const y = Math.sin(angle) * radius * .72;
			if (index === 0) shape.moveTo(x, y);
			else shape.lineTo(x, y);
		}
		shape.closePath();
		const geometry = new ExtrudeGeometry(shape, {
			depth: .1,
			steps: 1,
			bevelEnabled: true,
			bevelSize: .035,
			bevelThickness: .035,
			bevelSegments: 2,
			curveSegments: 2
		});
		geometry.translate(0, 0, -.05);
		return geometry;
	}
	if (variant === 1) {
		const points = Array.from({ length: 30 }, (_, index) => {
			const angle = index / 30 * Math.PI * 2;
			const radius = .39 + Math.sin(angle * 5 + .7) * .055;
			return new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, .06 + Math.max(0, Math.sin(angle * 5 + .2)) * .16);
		});
		return new TubeGeometry(new CatmullRomCurve3(points, true, "centripetal", .42), 72, .075, 8, true);
	}
	const puddleParts = [new SphereGeometry(.22, 12, 8).scale(1.28, .28, 1.08)];
	for (let index = 0; index < 7; index += 1) {
		const angle = index / 7 * Math.PI * 2 + .18;
		const radius = index % 2 === 0 ? .34 : .29;
		const lobe = new SphereGeometry(.12 + index % 3 * .012, 9, 6).scale(1.65, .34, .72).rotateY(-angle).translate(Math.cos(angle) * radius, index % 2 * .018, Math.sin(angle) * radius);
		puddleParts.push(lobe);
	}
	return mergeParts(puddleParts);
}
var ApplianceSpectacleSystem = class {
	root = new Group();
	lampSpot = new SpotLight(16771488, 0, 8, Math.PI * .2, .6, 1.5);
	lampSpotTarget = new Object3D();
	pools = /* @__PURE__ */ new Map();
	sessions = /* @__PURE__ */ new Map();
	slots = [];
	geometries = /* @__PURE__ */ new Set();
	materials = /* @__PURE__ */ new Set();
	cameraUp = new Vector3();
	cameraRight = new Vector3();
	cameraForward = new Vector3();
	projected = new Vector3();
	socketScale = new Vector3();
	basePosition = new Vector3();
	beamEnd = new Vector3();
	activeCamera = null;
	origin = new Vector3();
	worldScale = new Vector3();
	randomState = 1511508734;
	constructor() {
		this.root.name = "appliance-spectacle-system";
		this.lampSpot.name = "lamp-physical-spotlight";
		this.lampSpot.penumbra = .72;
		this.lampSpot.decay = 1.7;
		this.lampSpot.visible = true;
		this.lampSpot.userData.performanceEffect = true;
		this.lampSpotTarget.name = "lamp-physical-spotlight-target";
		this.root.add(this.lampSpot, this.lampSpotTarget);
		this.lampSpot.target = this.lampSpotTarget;
		Object.keys(POOL_CAPACITY).forEach((kind) => this.buildPool(kind));
		for (let index = 0; index < 8; index += 1) this.slots.push(this.buildAccessorySlot());
	}
	getStateSummary() {
		const activeByKind = {};
		this.pools.forEach((pool, kind) => {
			activeByKind[kind] = pool.reduce((count, particle) => count + Number(particle.active), 0);
		});
		const toast = this.pools.get("toast")?.find((particle) => particle.active) ?? null;
		const toastNdc = toast && this.activeCamera ? toast.position.clone().project(this.activeCamera) : null;
		const lampSlot = [...this.sessions.values()].find((session) => session.target.kind === "lamp")?.slot;
		const lampBeam = lampSlot?.beam.visible ? lampSlot.beam.userData.lampDiagnostics : void 0;
		const radioSession = [...this.sessions.values()].find((session) => session.target.kind === "radio");
		const radioWaves = (this.pools.get("wave") ?? []).filter((particle) => particle.active && particle.owner === radioSession?.target);
		const radioBase = radioSession?.target.root.userData.radioWaveDiagnostics;
		const velocityDots = radioWaves.map((particle) => Number(particle.mesh.userData.radioWave?.velocityDotForward ?? NaN)).filter(Number.isFinite);
		const radioWave = radioBase ? {
			...radioBase,
			activeCount: radioWaves.length,
			geometryVariants: [...new Set(radioWaves.map((particle) => Number(particle.mesh.userData.geometryVariant ?? -1)))],
			minVelocityDotForward: velocityDots.length > 0 ? Math.min(...velocityDots) : null
		} : null;
		const blenderSession = [...this.sessions.values()].find((session) => session.target.kind === "blender");
		const blenderDroplets = (this.pools.get("blender-drop") ?? []).filter((particle) => particle.active && particle.owner === blenderSession?.target);
		const blenderSplashes = (this.pools.get("blender-splash") ?? []).filter((particle) => particle.active && particle.owner === blenderSession?.target);
		const blenderBase = blenderSession?.target.root.userData.blenderSpectacleDiagnostics;
		const blenderSplash = blenderBase ? {
			activeDroplets: blenderDroplets.length,
			activeSplashes: blenderSplashes.length,
			geometryVariants: [...new Set([...blenderDroplets, ...blenderSplashes].map((particle) => Number(particle.mesh.userData.geometryVariant ?? -1)))],
			sourceSocket: blenderBase.sourceSocket ?? "blender-splash-mouth-socket",
			sourceSockets: ["blender-splash-mouth-socket", "blender-splash-right-gap-socket"],
			volumeForms: blenderBase.volumeForms ?? []
		} : null;
		return {
			sessions: this.sessions.size,
			activeTotal: Object.values(activeByKind).reduce((sum, count) => sum + count, 0),
			activeByKind,
			capacityByKind: { ...POOL_CAPACITY },
			activeToastNdc: toastNdc ? [
				toastNdc.x,
				toastNdc.y,
				toastNdc.z
			] : null,
			lampBeam: lampBeam ?? null,
			radioWave,
			blenderSplash
		};
	}
	update(delta, elapsed, camera, targets, petals) {
		camera.updateMatrixWorld(true);
		this.activeCamera = camera;
		this.cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
		this.cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
		camera.getWorldDirection(this.cameraForward);
		for (const target of targets) {
			if (target.state !== "active") continue;
			const session = this.ensureSession(target);
			this.updateSession(session, target.getActiveElapsed(), elapsed, petals);
		}
		for (const [target, session] of [...this.sessions]) {
			if (target.state === "active" && targets.includes(target)) continue;
			this.releaseSession(session);
			this.sessions.delete(target);
		}
		this.updateParticles(delta);
	}
	reset() {
		this.sessions.forEach((session) => this.releaseSession(session));
		this.sessions.clear();
		this.pools.forEach((pool) => pool.forEach((particle) => {
			particle.active = false;
			particle.owner = null;
			particle.mesh.visible = false;
		}));
	}
	stop(target, preserveDetachedToast = false) {
		const session = this.sessions.get(target);
		if (session) {
			this.releaseSession(session);
			this.sessions.delete(target);
		}
		this.pools.forEach((pool, kind) => pool.forEach((particle) => {
			if (particle.owner !== target) return;
			if (preserveDetachedToast && kind === "toast" && particle.active) {
				particle.owner = null;
				return;
			}
			particle.active = false;
			particle.owner = null;
			particle.mesh.visible = false;
		}));
	}
	dispose() {
		this.reset();
		this.geometries.forEach((geometry) => geometry.dispose());
		this.materials.forEach((material) => material.dispose());
		this.lampSpot.dispose();
		this.root.removeFromParent();
	}
	ensureSession(target) {
		const existing = this.sessions.get(target);
		if (existing) return existing;
		const slot = this.slots.find((candidate) => candidate.owner === null) ?? this.slots[0];
		if (slot.owner) {
			if (this.sessions.get(slot.owner)) this.sessions.delete(slot.owner);
		}
		slot.owner = target;
		const session = {
			target,
			emitted: /* @__PURE__ */ new Map(),
			markers: /* @__PURE__ */ new Set(),
			slot
		};
		this.sessions.set(target, session);
		return session;
	}
	releaseSession(session) {
		if (session.target.kind === "radio") delete session.target.root.userData.radioWaveDiagnostics;
		if (session.target.kind === "blender") delete session.target.root.userData.blenderSpectacleDiagnostics;
		session.slot.owner = null;
		session.slot.beam.visible = false;
		session.slot.lightPool.visible = false;
		if (session.target.kind === "lamp") session.slot.spot.intensity = 0;
		session.slot.cloud.visible = false;
		session.slot.lightning.visible = false;
	}
	updateSession(session, time, elapsed, petals) {
		const target = session.target;
		target.root.updateWorldMatrix(true, true);
		target.root.getWorldScale(this.worldScale);
		const unit = MathUtils.clamp(this.worldScale.x * 2.4, .42, 1.18);
		target.root.getWorldPosition(this.origin);
		const inward = this.cameraRight.clone().multiplyScalar(-target.facingSide);
		const towardCamera = this.cameraForward.clone().negate();
		switch (target.kind) {
			case "lamp":
				this.updateLamp(session, time, unit);
				break;
			case "fan":
				this.updateFan(session, time, unit, inward, petals);
				break;
			case "radio":
				this.updateRadio(session, time, unit);
				break;
			case "record-player": break;
			case "portable-speaker": break;
			case "television": break;
			case "humidifier": break;
			case "toaster":
				this.updateToaster(session, time, unit);
				break;
			case "refrigerator": break;
			case "washer": break;
			case "microwave":
				this.updateMicrowave(session, time, unit);
				break;
			case "coffee-maker": break;
			case "kettle":
				this.updateKettle(session, time, unit);
				break;
			case "rice-cooker": break;
			case "phone": break;
			case "robot-vacuum": break;
			case "bubble-machine": break;
			case "gumball-machine": break;
			case "popcorn-machine": break;
			case "alarm-clock": break;
			case "smart-bin": break;
			case "stand-mixer":
				this.updateMixer(session, time);
				break;
			case "blender":
				this.updateBlender(session, time, unit, towardCamera);
				break;
			case "printer": break;
			case "induction-cooktop": break;
			case "dehumidifier":
				this.updateDehumidifier(session, time, unit);
				break;
			case "desktop-computer": this.updateDesktop(session, time, unit);
		}
	}
	updateLamp(session, time, unit) {
		const slot = session.slot;
		const socketNode = session.target.root.getObjectByName("lamp-light-socket");
		const socket = this.socketWorld(session.target, ["lamp-light-socket"], this.origin);
		const direction = this.socketDirection(session.target, "lamp-light-socket", [
			0,
			-1,
			0
		]);
		if (socketNode) socketNode.getWorldScale(this.socketScale);
		else this.socketScale.copy(this.worldScale);
		const radialScale = (Math.abs(this.socketScale.x) + Math.abs(this.socketScale.z)) * .5;
		const apertureLocal = Number(socketNode?.userData.apertureRadius ?? .565);
		const sourceRadius = Math.max(.02, apertureLocal * radialScale);
		const farRadius = sourceRadius * LAMP_BEAM_FAR_TO_NEAR_RATIO;
		this.basePosition.set(0, 0, 0);
		session.target.root.localToWorld(this.basePosition);
		const defaultLength = LAMP_BEAM_DEFAULT_LENGTH_LOCAL * unit;
		const floorDistance = direction.y < -.16 ? (socket.y - this.basePosition.y) / -direction.y : NaN;
		const length = Number.isFinite(floorDistance) && floorDistance > sourceRadius * 2 ? MathUtils.clamp(floorDistance, 2.3 * unit, defaultLength) : defaultLength;
		const climax = smoothPulse(time, 2.64, 3.24, 3.94);
		this.beamEnd.copy(socket).addScaledVector(direction, length);
		slot.beam.visible = true;
		slot.beam.position.copy(socket).addScaledVector(direction, length * .5);
		slot.beam.quaternion.setFromUnitVectors(Y_AXIS, direction);
		slot.beam.scale.set(sourceRadius, length, sourceRadius);
		slot.beam.material.uniforms.uOpacity.value = .15 + climax * .065;
		slot.lightPool.visible = true;
		slot.lightPool.position.copy(this.beamEnd);
		slot.lightPool.position.y += .012;
		slot.lightPool.quaternion.identity();
		slot.lightPool.scale.set(farRadius * 1.08, 1, farRadius * 1.08);
		slot.lightPool.material.uniforms.uOpacity.value = .32 + climax * .12;
		slot.spot.position.copy(socket);
		slot.spotTarget.position.copy(this.beamEnd);
		slot.spot.angle = MathUtils.clamp(Math.atan2(farRadius, length), .18, Math.PI * .34);
		slot.spot.intensity = 9.5 + climax * 2.5;
		slot.spot.distance = length * 1.35;
		const head = session.target.root.getObjectByName("lamp-head-hinge-pivot");
		slot.beam.userData.lampDiagnostics = {
			timelineTime: time,
			headPhase: head?.userData.performancePhase ?? "wake",
			headPitch: head?.rotation.x ?? 0,
			headRoll: head?.rotation.z ?? 0,
			sourceRadius,
			farRadius,
			farToNearRatio: farRadius / sourceRadius,
			length,
			spotAngle: slot.spot.angle,
			socket: [
				socket.x,
				socket.y,
				socket.z
			],
			direction: [
				direction.x,
				direction.y,
				direction.z
			],
			groundSpot: [
				slot.lightPool.position.x,
				slot.lightPool.position.y,
				slot.lightPool.position.z
			],
			geometryAxis: "-Y-near/+Y-far"
		};
	}
	updateFan(session, time, unit, inward, petals) {
		const origin = this.socketWorld(session.target, ["fan-front-air-socket", "fan-rotor-axis-socket"], this.origin);
		const climax = time >= 3.7 && time <= 4.8;
		this.emitEvery(session, "fan-petals", time, climax ? .045 : .085, () => {
			const count = climax ? 3 : 2;
			petals.burst(origin, inward, count);
			for (let index = 0; index < count; index += 1) {
				const velocity = inward.clone().multiplyScalar((5.8 + this.random() * (climax ? 4.5 : 2.8)) * unit).addScaledVector(this.cameraUp, (this.random() - .5) * 1.75 * unit).addScaledVector(this.cameraForward, (this.random() - .5) * 1.05 * unit);
				this.spawn("petal", session.target, origin, velocity, 2.35, {
					drag: .08,
					scale: .85 + this.random() * .85,
					visible: false
				});
			}
		});
		petals.applyWind(origin, inward, climax ? .72 : .34, (climax ? 7.5 : 5.4) * unit);
	}
	updateRadio(session, time, unit) {
		const forward = this.socketDirection(session.target, "radio-speaker-socket", [
			0,
			0,
			1
		]);
		const origin = this.socketWorld(session.target, ["radio-speaker-socket"], this.origin).addScaledVector(forward, .09 * unit);
		session.target.root.userData.radioWaveDiagnostics = {
			timeline: time,
			emitter: "radio-speaker-socket",
			source: origin.toArray(),
			forward: forward.toArray(),
			geometry: "closed-irregular-tube",
			frontOnly: true
		};
		const emitWave = (life, scale, speed) => {
			const velocity = forward.clone().multiplyScalar(speed * unit);
			const wave = this.spawn("wave", session.target, origin, velocity, life, {
				drag: .34,
				scale
			});
			if (!wave) return;
			wave.mesh.quaternion.setFromUnitVectors(Z_AXIS, forward);
			wave.mesh.rotateZ((this.random() - .5) * .82);
			wave.angular.set((this.random() - .5) * .24, (this.random() - .5) * .24, (this.random() - .5) * .7);
			wave.baseScale.set(scale * (.88 + this.random() * .2), scale * (.78 + this.random() * .28), scale * (.72 + this.random() * .3));
			wave.mesh.userData.wavePhase = this.random() * Math.PI * 2;
			wave.mesh.userData.radioWave = {
				emitter: "radio-speaker-socket",
				profile: "closed-irregular-tube",
				source: origin.toArray(),
				forward: forward.toArray(),
				velocityDotForward: velocity.dot(forward),
				noBodyCrossing: velocity.dot(forward) > 0
			};
		};
		[
			1.05,
			2.05,
			3.05
		].forEach((threshold, index) => {
			this.once(session, `radio-wave-${index}`, time, threshold, () => {
				emitWave(1.24, (.39 + index * .035) * unit, .52);
			});
		});
		if (time > 3.72 && time < 4.72) this.emitEvery(session, "radio-climax-waves", time, .18, () => {
			emitWave(1.08, (.48 + this.random() * .11) * unit, .72);
		});
	}
	updateToaster(session, time, unit) {
		this.once(session, "toast-launch", time, 3.72, () => {
			const origin = this.socketWorld(session.target, ["toaster-external-toast-launch-socket", "toaster-carriage-socket"], this.origin);
			const camera = this.activeCamera;
			const projectedOrigin = camera ? origin.clone().project(camera) : new Vector3(session.target.facingSide * .5, 0, 0);
			const apexNdc = new Vector3(0, .58, projectedOrigin.z);
			const toApex = (camera ? apexNdc.unproject(camera) : origin.clone().addScaledVector(this.cameraUp, 3.2 * unit).addScaledVector(this.cameraRight, -session.target.facingSide * 2.4 * unit)).sub(origin);
			const apexTime = .58;
			const gravity = 2 * Math.max(.18 * unit, toApex.dot(this.cameraUp)) / (apexTime * apexTime);
			const velocity = this.cameraUp.clone().multiplyScalar(gravity * apexTime).addScaledVector(this.cameraRight, toApex.dot(this.cameraRight) / apexTime);
			const toast = this.spawn("toast", session.target, origin, velocity, 4.5, {
				gravity,
				drag: 0,
				scale: unit * .82
			});
			if (toast) {
				toast.angular.set(5.4, session.target.facingSide * 1.15, -session.target.facingSide * 2.15);
				toast.mesh.userData.launchVelocity = velocity.toArray();
				toast.mesh.userData.launchFacingSide = session.target.facingSide;
				toast.mesh.userData.targetApexNdcY = .58;
			}
		});
	}
	updateMicrowave(session, time, _unit) {
		session.emitted.set("microwave-model-rig-owned", Math.floor(time * 60));
	}
	updateKettle(session, time, _unit) {
		session.emitted.set("kettle-model-rig-owned", Math.floor(time * 60));
	}
	updateMixer(session, time) {
		session.emitted.set("stand-mixer-model-liquid-owned", Math.floor(time * 60));
	}
	updateBlender(session, time, unit, towardCamera) {
		if (time < 3.02 || time > 4.28) return;
		const origins = [this.socketWorld(session.target, ["blender-splash-mouth-socket"], this.origin), this.socketWorld(session.target, ["blender-splash-right-gap-socket"], this.origin)];
		this.basePosition.set(0, 0, 0);
		session.target.root.localToWorld(this.basePosition);
		const groundY = this.basePosition.y + .035 * unit;
		[{
			key: "blender-splash-first",
			threshold: 3.08,
			count: 8,
			strength: 1
		}, {
			key: "blender-splash-second",
			threshold: 3.54,
			count: 6,
			strength: .76
		}].forEach((burst, burstIndex) => {
			this.once(session, burst.key, time, burst.threshold, () => {
				for (let index = 0; index < burst.count; index += 1) {
					const outletIndex = (index + burstIndex) % origins.length;
					const origin = origins[outletIndex];
					const lane = index - (burst.count - 1) * .5;
					const side = outletIndex === 0 ? -1 : 1;
					const spread = lane * (.58 + burstIndex * .08) * unit;
					const lift = (5.2 + index % 3 * .9) * unit * burst.strength;
					const forward = (3.8 + index % 4 * .62) * unit * burst.strength;
					const velocity = this.cameraUp.clone().multiplyScalar(lift).addScaledVector(towardCamera, forward).addScaledVector(this.cameraRight, spread + side * 1.35 * unit);
					const drop = this.spawn("blender-drop", session.target, origin, velocity, 1.78 + index % 3 * .13, {
						gravity: 6.8 * unit,
						drag: .06,
						groundY,
						bounces: index % 4 === 0 ? 1 : 0,
						scale: (.68 + index % 4 * .14) * unit
					});
					if (drop) drop.mesh.userData.blenderSplash = {
						sourceSocket: outletIndex === 0 ? "blender-splash-mouth-socket" : "blender-splash-right-gap-socket",
						burst: burstIndex + 1,
						lane,
						form: [
							"rounded-drop",
							"long-drop",
							"pulled-tail",
							"double-lobed-drop"
						][Number(drop.mesh.userData.geometryVariant ?? 0)]
					};
				}
				for (let splashIndex = 0; splashIndex < 3; splashIndex += 1) {
					const side = splashIndex - 1;
					const outletIndex = (splashIndex + burstIndex) % origins.length;
					const origin = origins[outletIndex];
					const outletSide = outletIndex === 0 ? -1 : 1;
					const velocity = this.cameraUp.clone().multiplyScalar((3.2 + splashIndex * .48) * unit * burst.strength).addScaledVector(towardCamera, (4.2 + splashIndex * .42) * unit * burst.strength).addScaledVector(this.cameraRight, (side * 1.15 + outletSide * 1.5) * unit);
					const splash = this.spawn("blender-splash", session.target, origin, velocity, 1.42 + splashIndex * .14, {
						gravity: 5.6 * unit,
						drag: .11,
						groundY,
						scale: (.54 + splashIndex * .1) * unit
					});
					if (splash) splash.mesh.userData.blenderSplash = {
						sourceSocket: outletIndex === 0 ? "blender-splash-mouth-socket" : "blender-splash-right-gap-socket",
						burst: burstIndex + 1,
						form: [
							"thick-flat-splash",
							"irregular-crown",
							"concave-puddle"
						][Number(splash.mesh.userData.geometryVariant ?? 0)]
					};
				}
			});
		});
		session.target.root.userData.blenderSpectacleDiagnostics = {
			timelineTime: time,
			sourceSocket: "blender-splash-mouth-socket",
			origins: origins.map((origin) => [
				origin.x,
				origin.y,
				origin.z
			]),
			groundY,
			volumeForms: [
				"rounded-drop",
				"long-drop",
				"pulled-tail",
				"double-lobed-drop",
				"thick-flat-splash",
				"irregular-crown",
				"concave-puddle"
			],
			forbiddenPrimitives: [
				"PlaneGeometry",
				"Line",
				"Sprite"
			]
		};
	}
	updateDehumidifier(_session, _time, _unit) {}
	updateDesktop(session, time, unit) {
		session.emitted.set("desktop-model-smoke-owned", Math.floor(time * 60));
	}
	emitEvery(session, key, time, interval, callback) {
		const tick = Math.floor(time / interval);
		if (tick <= (session.emitted.get(key) ?? -1)) return;
		session.emitted.set(key, tick);
		callback();
	}
	once(session, key, time, threshold, callback) {
		if (time < threshold || session.markers.has(key)) return;
		session.markers.add(key);
		callback();
	}
	spawn(kind, owner, origin, velocity, life, options = {}) {
		const pool = this.pools.get(kind);
		if (!pool) return null;
		const particle = pool.find((candidate) => !candidate.active) ?? pool.reduce((oldest, candidate) => candidate.age / candidate.life > oldest.age / oldest.life ? candidate : oldest);
		particle.active = true;
		particle.owner = owner;
		particle.age = 0;
		particle.life = life;
		particle.position.copy(origin);
		particle.startPosition.copy(origin);
		particle.velocity.copy(velocity);
		particle.startVelocity.copy(velocity);
		particle.angular.set((this.random() - .5) * 8, (this.random() - .5) * 8, (this.random() - .5) * 8);
		particle.gravity = options.gravity ?? 0;
		particle.drag = options.drag ?? .25;
		particle.curve = null;
		particle.curve2 = null;
		particle.curveSplit = .5;
		particle.groundY = options.groundY ?? null;
		particle.bounces = options.bounces ?? 0;
		particle.impactSquash = 0;
		const scale = options.scale ?? 1;
		particle.baseScale.setScalar(scale);
		if (kind === "ribbon" || kind === "rain") particle.baseScale.set(scale * .42, scale, scale * .42);
		if (kind === "paper") particle.baseScale.set(scale, scale * .75, scale);
		if (kind === "sheet") particle.baseScale.set(scale * 1.35, scale, scale);
		if (kind === "blender-drop") {
			const variant = Number(particle.mesh.userData.geometryVariant ?? 0);
			particle.baseScale.set(scale * (variant === 1 ? .78 : 1), scale * (variant === 2 ? 1.28 : 1), scale * (variant === 1 ? .78 : 1));
		}
		if (kind === "blender-splash") {
			const variant = Number(particle.mesh.userData.geometryVariant ?? 0);
			particle.baseScale.set(scale * (1.1 + variant * .12), scale * (.88 + variant * .08), scale);
		}
		particle.mesh.visible = options.visible !== false;
		particle.mesh.position.copy(origin);
		particle.mesh.rotation.set(0, 0, 0);
		particle.mesh.scale.copy(particle.baseScale);
		const material = Array.isArray(particle.mesh.material) ? null : particle.mesh.material;
		if (options.dark && material?.color) material.color.setHex(9144213);
		else if (kind === "note" || kind === "ribbon" || kind === "trash") material?.color.setHex(PALETTE[Math.floor(this.random() * PALETTE.length)]);
		if (kind === "wave") {
			const normal = this.cameraForward.clone().negate();
			particle.mesh.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), normal);
			particle.angular.set(0, 0, 0);
		} else if (kind === "sheet") {
			particle.mesh.quaternion.copy(this.cameraForward.lengthSq() > 0 ? new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), this.cameraForward.clone().negate()) : new Quaternion());
			particle.angular.set(0, 0, (this.random() - .5) * 1.8);
		} else if (kind === "blender-splash") {
			particle.mesh.quaternion.copy(this.cameraForward.lengthSq() > 0 ? new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), this.cameraForward.clone().negate()) : new Quaternion());
			particle.angular.multiplyScalar(.32);
		}
		return particle;
	}
	updateParticles(delta) {
		this.pools.forEach((pool, kind) => {
			pool.forEach((particle) => {
				if (!particle.active) return;
				const flightOverride = typeof window === "undefined" ? void 0 : window.__APPLIANCE_PERFORMANCE_FLIGHT_TIME_OVERRIDE__;
				const flightClock = kind === "toast" && Number.isFinite(flightOverride) ? Math.max(0, flightOverride) : null;
				particle.age = flightClock ?? particle.age + delta;
				const toastBelowViewport = kind === "toast" && particle.age > .72 && this.activeCamera ? this.projected.copy(particle.position).project(this.activeCamera).y < -1.24 : false;
				if (particle.age >= particle.life || toastBelowViewport) {
					particle.active = false;
					particle.owner = null;
					particle.mesh.visible = false;
					return;
				}
				const progress = MathUtils.clamp(particle.age / particle.life, 0, 1);
				if (particle.curve) if (particle.curve2 && progress >= particle.curveSplit) sampleCubic(particle.position, particle.curve2, (progress - particle.curveSplit) / (1 - particle.curveSplit));
				else sampleCubic(particle.position, particle.curve, particle.curve2 ? progress / particle.curveSplit : progress);
				else if (flightClock !== null && kind === "toast") {
					particle.velocity.copy(particle.startVelocity).addScaledVector(this.cameraUp, -particle.gravity * flightClock);
					particle.position.copy(particle.startPosition).addScaledVector(particle.startVelocity, flightClock).addScaledVector(this.cameraUp, -.5 * particle.gravity * flightClock * flightClock);
				} else {
					particle.velocity.addScaledVector(this.cameraUp, -particle.gravity * delta);
					particle.velocity.multiplyScalar(Math.exp(-particle.drag * delta));
					particle.position.addScaledVector(particle.velocity, delta);
					if (particle.groundY !== null && particle.position.y <= particle.groundY && particle.velocity.y < 0) {
						particle.position.y = particle.groundY;
						particle.impactSquash = 1;
						if (particle.bounces > 0) {
							particle.velocity.y *= -.48;
							particle.velocity.x *= .78;
							particle.velocity.z *= .78;
							particle.bounces -= 1;
						} else particle.velocity.set(0, 0, 0);
					}
				}
				particle.mesh.position.copy(particle.position);
				if (flightClock !== null && kind === "toast") particle.mesh.rotation.set(particle.angular.x * flightClock, particle.angular.y * flightClock, particle.angular.z * flightClock);
				else {
					particle.mesh.rotation.x += particle.angular.x * delta;
					particle.mesh.rotation.y += particle.angular.y * delta;
					particle.mesh.rotation.z += particle.angular.z * delta;
				}
				const fade = kind === "toast" ? 1 : Math.min(1, particle.age * 8) * (1 - MathUtils.smoothstep(progress, .76, 1));
				if (kind === "wave") {
					const phase = Number(particle.mesh.userData.wavePhase ?? 0);
					const growth = .34 + MathUtils.smoothstep(progress, 0, .84) * 4.45;
					const morph = Math.sin(progress * Math.PI * 3.2 + phase) * (1 - progress) * .115;
					particle.mesh.scale.set(particle.baseScale.x * growth * (1 + morph), particle.baseScale.y * growth * (1 - morph * .78), particle.baseScale.z * growth * (.88 + Math.sin(progress * Math.PI * 2 + phase) * .09));
				} else {
					const pulse = kind === "bubble" || kind === "steam" ? .72 + progress * .75 : 1;
					particle.mesh.scale.copy(particle.baseScale).multiplyScalar(pulse * (.86 + fade * .14));
				}
				if (particle.impactSquash > .001) {
					particle.mesh.scale.x *= 1 + particle.impactSquash * .85;
					particle.mesh.scale.y *= 1 - particle.impactSquash * .62;
					particle.mesh.scale.z *= 1 + particle.impactSquash * .85;
					particle.impactSquash *= Math.exp(-delta * 11);
				}
				const opacity = fade * (kind === "steam" ? .36 : kind === "bubble" ? .52 : kind === "wave" ? .64 * (1 - progress) : kind === "blender-splash" ? .72 : kind === "blender-drop" ? .84 : .9);
				(Array.isArray(particle.mesh.material) ? particle.mesh.material : [particle.mesh.material]).forEach((material) => {
					material.opacity = kind === "toast" ? 1 : opacity;
				});
			});
		});
	}
	socketWorld(target, names, fallback) {
		for (const name of names) {
			const socket = target.root.getObjectByName(name);
			if (socket) return socket.getWorldPosition(new Vector3());
		}
		return fallback.clone();
	}
	socketDirection(target, name, fallback) {
		const socket = target.root.getObjectByName(name);
		if (!socket) return this.cameraForward.clone();
		return (Array.isArray(socket.userData.direction) ? new Vector3(...socket.userData.direction) : new Vector3(...fallback)).applyQuaternion(socket.getWorldQuaternion(new Quaternion())).normalize();
	}
	buildPool(kind) {
		const variantCount = kind === "wave" || kind === "blender-drop" ? 4 : kind === "trash" || kind === "blender-splash" ? 3 : 1;
		const geometries = Array.from({ length: variantCount }, (_, index) => this.geometryFor(kind, index));
		geometries.forEach((geometry) => this.geometries.add(geometry));
		const pool = [];
		for (let index = 0; index < POOL_CAPACITY[kind]; index += 1) {
			const material = kind === "toast" ? [
				new MeshBasicMaterial({ visible: false }),
				jelly({
					color: 13994820,
					thickness: .2
				}),
				jelly({
					color: 16766078,
					thickness: .16
				}),
				jelly({
					color: 16766078,
					thickness: .16
				})
			] : kind === "wave" ? new MeshPhysicalMaterial({
				color: [
					PAL.blossomDeep,
					PAL.petal,
					16755139,
					14974889
				][index % 4],
				emissive: 12008304,
				emissiveIntensity: .34,
				roughness: .28,
				metalness: .04,
				clearcoat: .72,
				clearcoatRoughness: .2,
				transparent: true,
				opacity: 0,
				side: 2,
				depthWrite: false
			}) : kind === "blender-drop" || kind === "blender-splash" ? new MeshPhysicalMaterial({
				color: kind === "blender-drop" ? [
					16095922,
					16757188,
					15303589,
					16761294
				][index % 4] : [
					15895978,
					16758472,
					15171490
				][index % 3],
				emissive: 9383762,
				emissiveIntensity: .12,
				roughness: .32,
				metalness: 0,
				clearcoat: .58,
				clearcoatRoughness: .24,
				transparent: true,
				opacity: 0,
				side: 2,
				depthWrite: false
			}) : new MeshBasicMaterial({
				color: this.colorFor(kind),
				transparent: true,
				opacity: 0,
				side: 2,
				depthWrite: false,
				fog: true
			});
			const solid = [
				"drop",
				"sheet",
				"bubble",
				"note",
				"paper",
				"trash",
				"popcorn",
				"rice",
				"ribbon",
				"debris",
				"wave",
				"blender-drop",
				"blender-splash"
			].includes(kind);
			let surface = material;
			if (solid && !Array.isArray(material)) {
				surface = jelly({
					color: material.color,
					transparent: true,
					opacity: 0,
					thickness: .16
				});
				material.dispose();
			}
			(Array.isArray(surface) ? surface : [surface]).forEach((entry) => this.materials.add(entry));
			const mesh = new Mesh(geometries[index % geometries.length], surface);
			mesh.name = `spectacle-${kind}-${index + 1}`;
			mesh.visible = false;
			mesh.renderOrder = 7;
			mesh.frustumCulled = false;
			if (kind === "wave") {
				mesh.castShadow = true;
				mesh.userData.performanceProp = "irregular-volumetric-radio-wave";
				mesh.userData.geometryVariant = index % geometries.length;
			}
			if (kind === "blender-drop" || kind === "blender-splash") {
				mesh.castShadow = true;
				mesh.userData.performanceProp = kind === "blender-drop" ? "volumetric-sakura-smoothie-droplet" : "volumetric-sakura-smoothie-splash";
				mesh.userData.geometryVariant = index % geometries.length;
				mesh.userData.forbiddenPrimitives = [
					"PlaneGeometry",
					"Line",
					"Sprite"
				];
			}
			if (kind === "toast") {
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				mesh.userData.performanceProp = "layered-toast-slice";
				mesh.userData.components = [
					"toast-crust-volume",
					"toast-crumb-front",
					"toast-crumb-back",
					"toast-outline-hull"
				];
				mesh.userData.sculptRuntime = {
					pivot: mesh.name,
					launchSocket: "toaster-external-toast-launch-socket",
					lifecycle: "ballistic-until-bottom-viewport-exit"
				};
			}
			this.root.add(mesh);
			pool.push({
				mesh,
				active: false,
				owner: null,
				age: 0,
				life: 1,
				position: new Vector3(),
				startPosition: new Vector3(),
				velocity: new Vector3(),
				startVelocity: new Vector3(),
				angular: new Vector3(),
				gravity: 0,
				drag: 0,
				baseScale: new Vector3(1, 1, 1),
				curve: null,
				curve2: null,
				curveSplit: .5,
				groundY: null,
				bounces: 0,
				impactSquash: 0
			});
		}
		this.pools.set(kind, pool);
	}
	geometryFor(kind, variant = 0) {
		switch (kind) {
			case "petal": return createSakuraPetalGeometry(1.1);
			case "steam": return new SphereGeometry(.16, 8, 6);
			case "rain": return new CylinderGeometry(.018, .018, .42, 5);
			case "drop": return new SphereGeometry(.195, 9, 7).scale(.82, 1.28, .82);
			case "sheet": {
				const shape = new Shape();
				shape.moveTo(0, -.08);
				shape.quadraticCurveTo(-.72, .12, -.92, .48);
				shape.quadraticCurveTo(0, .26, .92, .48);
				shape.quadraticCurveTo(.72, .12, 0, -.08);
				const geometry = new ExtrudeGeometry(shape, {
					depth: .055,
					steps: 1,
					bevelEnabled: true,
					bevelSize: .016,
					bevelThickness: .016,
					bevelSegments: 2,
					curveSegments: 5
				});
				geometry.translate(0, 0, -.0275);
				return geometry;
			}
			case "bubble": return new SphereGeometry(.14, 10, 7);
			case "note": return noteGeometry();
			case "paper": return new RoundedBoxGeometry(.62, .84, .045, 2, .025);
			case "trash": return trashGeometry(variant);
			case "popcorn": return popcornGeometry();
			case "rice": return new CapsuleGeometry(.035, .11, 3, 6).rotateZ(Math.PI * .5);
			case "ribbon": return new TubeGeometry(new CatmullRomCurve3([
				new Vector3(0, -.42, 0),
				new Vector3(.08, -.18, .04),
				new Vector3(-.08, .08, -.03),
				new Vector3(.06, .4, 0)
			]), 14, .035, 6, false);
			case "debris": return new IcosahedronGeometry(.12, 0);
			case "toast": return toastPerformanceGeometry();
			case "wave": return stylizedRadioWaveGeometry(variant);
			case "spark": return sparkGeometry();
			case "blender-drop": return blenderDropGeometry(variant);
			case "blender-splash": return blenderSplashGeometry(variant);
		}
	}
	colorFor(kind) {
		switch (kind) {
			case "petal": return PAL.petal;
			case "steam": return 16250111;
			case "rain":
			case "drop": return 7785953;
			case "sheet": return 16763222;
			case "bubble": return 14285055;
			case "note": return PAL.blossomDeep;
			case "paper": return 16776175;
			case "trash": return PAL.teal;
			case "popcorn": return 16773045;
			case "rice": return 16775388;
			case "ribbon": return PAL.purple;
			case "debris": return 12629960;
			case "toast": return 14193237;
			case "wave": return PAL.blossomDeep;
			case "spark": return PAL.yellow;
			case "blender-drop":
			case "blender-splash": return 16095922;
		}
	}
	buildAccessorySlot() {
		const beam = createLampVolumetricBeam();
		beam.userData.performanceEffect = true;
		this.materials.add(beam.material);
		this.geometries.add(beam.geometry);
		this.root.add(beam);
		const lightPoolMaterial = new ShaderMaterial({
			uniforms: { uOpacity: { value: .32 } },
			vertexShader: `
        varying vec2 vRadial;
        void main() {
          vRadial = position.xz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
			fragmentShader: `
        varying vec2 vRadial;
        uniform float uOpacity;
        void main() {
          float radial = length(vRadial);
          float halo = 1.0 - smoothstep(0.12, 1.0, radial);
          gl_FragColor = vec4(vec3(1.0, 0.79, 0.38), halo * halo * uOpacity);
        }
      `,
			transparent: true,
			depthWrite: false,
			blending: 2
		});
		this.materials.add(lightPoolMaterial);
		const lightPoolGeometry = new CylinderGeometry(1, 1, .018, 40, 1, false);
		this.geometries.add(lightPoolGeometry);
		const lightPool = new Mesh(lightPoolGeometry, lightPoolMaterial);
		lightPool.name = "lamp-ground-light-pool-volume";
		lightPool.visible = false;
		lightPool.renderOrder = 4;
		lightPool.frustumCulled = false;
		lightPool.userData.performanceEffect = true;
		this.root.add(lightPool);
		const spot = this.lampSpot;
		const spotTarget = this.lampSpotTarget;
		const cloud = new Group();
		const cloudPuffs = [];
		const cloudGeometry = new SphereGeometry(.42, 10, 7);
		this.geometries.add(cloudGeometry);
		const cloudMaterial = new MeshBasicMaterial({
			color: 12168906,
			transparent: true,
			opacity: .82,
			depthWrite: false
		});
		this.materials.add(cloudMaterial);
		[
			[
				-.55,
				0,
				0
			],
			[
				-.2,
				.18,
				.04
			],
			[
				.2,
				.2,
				0
			],
			[
				.55,
				0,
				0
			],
			[
				0,
				-.08,
				.08
			]
		].forEach((position, index) => {
			const puff = new Mesh(cloudGeometry, cloudMaterial);
			puff.position.set(position[0], position[1], position[2]);
			puff.scale.set(1 + index % 2 * .2, .72 + index % 3 * .1, .82);
			cloud.add(puff);
			cloudPuffs.push(puff);
		});
		cloud.visible = false;
		cloud.renderOrder = 6;
		this.root.add(cloud);
		const lightningGeometry = new TubeGeometry(new CatmullRomCurve3([
			new Vector3(0, .2, 0),
			new Vector3(-.14, -.12, 0),
			new Vector3(.04, -.1, 0),
			new Vector3(-.12, -.55, 0)
		], false, "chordal"), 9, .035, 6, false);
		this.geometries.add(lightningGeometry);
		const lightningMaterial = new MeshBasicMaterial({
			color: 16773226,
			transparent: true,
			opacity: .95,
			depthWrite: false
		});
		this.materials.add(lightningMaterial);
		const lightning = new Mesh(lightningGeometry, lightningMaterial);
		lightning.visible = false;
		lightning.renderOrder = 8;
		this.root.add(lightning);
		return {
			owner: null,
			beam,
			lightPool,
			spot,
			spotTarget,
			cloud,
			cloudPuffs,
			lightning
		};
	}
	random() {
		this.randomState = Math.imul(this.randomState, 1664525) + 1013904223 >>> 0;
		return this.randomState / 4294967296;
	}
};
//#endregion
//#region src/systems/AppliancePerformanceSystem.ts
var AppliancePerformanceSystem = class {
	root = new Group();
	effects = new ApplianceSpectacleSystem();
	sessions = /* @__PURE__ */ new Map();
	preparedAnimations = /* @__PURE__ */ new WeakMap();
	constructor() {
		this.root.name = "appliance-performance-system";
		this.root.add(this.effects.root);
	}
	start(target) {
		if (this.sessions.has(target)) return;
		const modelRoot = target.root.getObjectByName(`appliance-model-${target.kind}`);
		const rigRoot = modelRoot instanceof Group ? modelRoot : target.root;
		this.sessions.set(target, {
			target,
			animation: this.preparedAnimations.get(target.root) ?? createApplianceMechanicalAnimation(target.kind, rigRoot),
			elapsed: 0
		});
	}
	/** Build the mechanical driver before the appliance becomes interactive. */
	prime(target) {
		if (this.preparedAnimations.has(target.root)) return;
		const modelRoot = target.root.getObjectByName(`appliance-model-${target.kind}`);
		const rigRoot = modelRoot instanceof Group ? modelRoot : target.root;
		this.preparedAnimations.set(target.root, createApplianceMechanicalAnimation(target.kind, rigRoot));
	}
	/** Prime a replacement while its renderer warmup is running. */
	primeRoot(root) {
		const kind = root.userData.applianceKind;
		if (!kind || this.preparedAnimations.has(root)) return;
		const modelRoot = root.getObjectByName(`appliance-model-${kind}`);
		const rigRoot = modelRoot instanceof Group ? modelRoot : root;
		this.preparedAnimations.set(root, createApplianceMechanicalAnimation(kind, rigRoot));
	}
	update(delta, elapsed, camera, targets, petals) {
		targets.forEach((target) => {
			if (target.state !== "active") return;
			this.start(target);
			const session = this.sessions.get(target);
			if (!session) return;
			const powered = poweredAnimationState(target.getActiveElapsed(), target.kind);
			session.elapsed = powered.time;
			if (powered.active) session.animation.update(powered.time, powered.power);
			else session.animation.stop();
			target.root.userData.appliancePerformanceSignal = session.animation.signal();
			target.root.userData.appliancePerformanceElapsed = powered.time;
		});
		[...this.sessions.keys()].forEach((target) => {
			if (target.state === "active" && targets.includes(target)) return;
			this.stop(target, target.kind === "toaster");
		});
		this.effects.update(delta, elapsed, camera, targets, petals);
	}
	stop(target, preserveDetachedToast = false) {
		const session = this.sessions.get(target);
		if (session) session.animation.stop();
		target.root.userData.appliancePerformanceSignal = 0;
		target.root.userData.appliancePerformanceElapsed = 0;
		this.sessions.delete(target);
		this.effects.stop(target, preserveDetachedToast);
		this.preparedAnimations.delete(target.root);
	}
	reset() {
		[...this.sessions.keys()].forEach((target) => this.stop(target));
		this.effects.reset();
	}
	getStateSummary() {
		const effectState = this.effects.getStateSummary();
		const elapsedByKind = {};
		const signalsByKind = {};
		this.sessions.forEach((session) => {
			elapsedByKind[session.target.kind] = session.elapsed;
			signalsByKind[session.target.kind] = session.animation.signal();
		});
		const radioSession = [...this.sessions.values()].find((session) => session.target.kind === "radio");
		const radioMechanics = (radioSession?.target.root.getObjectByName("appliance-model-radio") ?? radioSession?.target.root)?.userData.radioPerformanceDiagnostics;
		const blenderSession = [...this.sessions.values()].find((session) => session.target.kind === "blender");
		const blenderMechanics = (blenderSession?.target.root.getObjectByName("appliance-model-blender") ?? blenderSession?.target.root)?.userData.blenderPerformanceDiagnostics;
		const hairDryerSession = [...this.sessions.values()].find((session) => session.target.kind === "hair-dryer");
		const hairDryerDiagnostics = (hairDryerSession?.target.root.getObjectByName("appliance-model-hair-dryer") ?? hairDryerSession?.target.root)?.userData.hairDryerPerformanceDiagnostics;
		const refrigeratorSession = [...this.sessions.values()].find((session) => session.target.kind === "refrigerator");
		const refrigeratorDiagnostics = (refrigeratorSession?.target.root.getObjectByName("appliance-model-refrigerator") ?? refrigeratorSession?.target.root)?.userData.refrigeratorPerformanceDiagnostics;
		return {
			sessions: this.sessions.size,
			timelineOwners: this.sessions.size,
			kinds: [...this.sessions.values()].map((session) => session.target.kind),
			elapsedByKind,
			signalsByKind,
			activeTotal: effectState.activeTotal,
			activeByKind: effectState.activeByKind,
			capacityByKind: effectState.capacityByKind,
			activeToastNdc: effectState.activeToastNdc,
			lampBeam: effectState.lampBeam,
			radio: {
				mechanics: radioMechanics ?? null,
				wave: effectState.radioWave
			},
			blender: {
				mechanics: blenderMechanics ?? null,
				splash: effectState.blenderSplash
			},
			hairDryer: hairDryerDiagnostics ?? null,
			refrigerator: refrigeratorDiagnostics ?? null
		};
	}
	dispose() {
		this.reset();
		this.effects.dispose();
		this.root.removeFromParent();
	}
};
//#endregion
//#region src/theme/SeasonProfiles.ts
var SEASON_MODES = [
	"spring",
	"summer",
	"autumn",
	"winter"
];
function state(values) {
	return {
		skyTop: new Color(values.sky[0]),
		skyMid: new Color(values.sky[1]),
		skyHaze: new Color(values.sky[2]),
		cloud: new Color(values.clouds[0]),
		cloudShade: new Color(values.clouds[1]),
		cloudOpacity: values.clouds[2],
		cloudShadeOpacity: values.clouds[3],
		fog: new Color(values.fog[0]),
		fogNearScale: values.fog[1],
		fogFarScale: values.fog[2],
		sun: new Color(values.sun[0]),
		sunIntensity: values.sun[1],
		fill: new Color(values.fill[0]),
		fillIntensity: values.fill[1],
		bounce: new Color(values.bounce[0]),
		bounceIntensity: values.bounce[1],
		hemiSky: new Color(values.hemi[0]),
		hemiGround: new Color(values.hemi[1]),
		hemiIntensity: values.hemi[2],
		pageBackground: new Color(values.page),
		startWash: new Color(values.startWash)
	};
}
var SEASON_PROFILES = {
	spring: {
		mode: "spring",
		label: "春",
		day: state({
			sky: [
				PAL.skyTop,
				PAL.skyMid,
				PAL.skyHaze
			],
			clouds: [
				PAL.cloud,
				PAL.cloudShade,
				.48,
				.25
			],
			fog: [
				13953274,
				1,
				1
			],
			sun: [16773586, 2.25],
			fill: [11187436, 1.08],
			bounce: [14207976, .34],
			hemi: [
				13953274,
				10324394,
				1.12
			],
			page: 13953274,
			startWash: 16512490
		}),
		night: state({
			sky: [
				1054255,
				2435925,
				6115950
			],
			clouds: [
				6252674,
				3422805,
				.28,
				.34
			],
			fog: [
				2106945,
				.88,
				.88
			],
			sun: [14081524, .82],
			fill: [11450581, .62],
			bounce: [12888253, .28],
			hemi: [
				11911900,
				7829646,
				.68
			],
			page: 1119532,
			startWash: 1909049
		}),
		cloudScale: 1,
		cloudVerticalScale: 1,
		cloudSpeed: 1,
		starVisibility: 1
	},
	summer: {
		mode: "summer",
		label: "夏",
		day: state({
			sky: [
				9288116,
				12836047,
				14675172
			],
			clouds: [
				15791855,
				12571850,
				.62,
				.22
			],
			fog: [
				14477537,
				1.02,
				1.06
			],
			sun: [16773586, 2.25],
			fill: [11187436, 1.05],
			bounce: [14207976, .32],
			hemi: [
				13953274,
				10324394,
				1.08
			],
			page: 14149087,
			startWash: 14541514
		}),
		night: state({
			sky: [
				465206,
				1193562,
				3234672
			],
			clouds: [
				3165281,
				2111565,
				.08,
				.07
			],
			fog: [
				1389130,
				.92,
				.94
			],
			sun: [14081524, .82],
			fill: [11450581, .62],
			bounce: [12888253, .26],
			hemi: [
				11911900,
				7829646,
				.68
			],
			page: 729147,
			startWash: 1388618
		}),
		cloudScale: 1.04,
		cloudVerticalScale: .86,
		cloudSpeed: .82,
		starVisibility: 1.08
	},
	autumn: {
		mode: "autumn",
		label: "秋",
		day: state({
			sky: [
				10860228,
				14013383,
				15786965
			],
			clouds: [
				16182495,
				13745322,
				.58,
				.2
			],
			fog: [
				15064788,
				.98,
				.98
			],
			sun: [16773586, 2.18],
			fill: [11187436, 1],
			bounce: [14207976, .32],
			hemi: [
				13953274,
				10324394,
				1.05
			],
			page: 14998995,
			startWash: 15784379
		}),
		night: state({
			sky: [
				1317425,
				3159631,
				5919588
			],
			clouds: [
				4737368,
				3421504,
				.09,
				.08
			],
			fog: [
				3027009,
				.88,
				.88
			],
			sun: [14081524, .78],
			fill: [11450581, .58],
			bounce: [12888253, .28],
			hemi: [
				11911900,
				7829646,
				.64
			],
			page: 1908788,
			startWash: 2763842
		}),
		cloudScale: .92,
		cloudVerticalScale: .72,
		cloudSpeed: 1.26,
		starVisibility: .82
	},
	winter: {
		mode: "winter",
		label: "冬",
		day: state({
			sky: [
				10797009,
				13754856,
				14543343
			],
			clouds: [
				16186365,
				12177370,
				.65,
				.24
			],
			fog: [
				14477035,
				.88,
				.84
			],
			sun: [15266559, 2.08],
			fill: [11847132, 1],
			bounce: [13815771, .3],
			hemi: [
				13360616,
				9606562,
				1.02
			],
			page: 14805741,
			startWash: 14409685
		}),
		night: state({
			sky: [
				594982,
				1846080,
				4609898
			],
			clouds: [
				4215655,
				2964813,
				.11,
				.1
			],
			fog: [
				1912125,
				.79,
				.78
			],
			sun: [14478591, .74],
			fill: [11450581, .56],
			bounce: [12888253, .22],
			hemi: [
				11911900,
				7829646,
				.6
			],
			page: 924717,
			startWash: 1583931
		}),
		cloudScale: 1.14,
		cloudVerticalScale: .78,
		cloudSpeed: .66,
		starVisibility: .64
	}
};
function isSeasonMode(value) {
	return value !== null && SEASON_MODES.includes(value);
}
function cloneEnvironmentState(source) {
	return {
		...source,
		skyTop: source.skyTop.clone(),
		skyMid: source.skyMid.clone(),
		skyHaze: source.skyHaze.clone(),
		cloud: source.cloud.clone(),
		cloudShade: source.cloudShade.clone(),
		fog: source.fog.clone(),
		sun: source.sun.clone(),
		fill: source.fill.clone(),
		bounce: source.bounce.clone(),
		hemiSky: source.hemiSky.clone(),
		hemiGround: source.hemiGround.clone(),
		pageBackground: source.pageBackground.clone(),
		startWash: source.startWash.clone()
	};
}
function lerpEnvironmentState(target, from, to, progress) {
	target.skyTop.copy(from.skyTop).lerp(to.skyTop, progress);
	target.skyMid.copy(from.skyMid).lerp(to.skyMid, progress);
	target.skyHaze.copy(from.skyHaze).lerp(to.skyHaze, progress);
	target.cloud.copy(from.cloud).lerp(to.cloud, progress);
	target.cloudShade.copy(from.cloudShade).lerp(to.cloudShade, progress);
	target.fog.copy(from.fog).lerp(to.fog, progress);
	target.sun.copy(from.sun).lerp(to.sun, progress);
	target.fill.copy(from.fill).lerp(to.fill, progress);
	target.bounce.copy(from.bounce).lerp(to.bounce, progress);
	target.hemiSky.copy(from.hemiSky).lerp(to.hemiSky, progress);
	target.hemiGround.copy(from.hemiGround).lerp(to.hemiGround, progress);
	target.pageBackground.copy(from.pageBackground).lerp(to.pageBackground, progress);
	target.startWash.copy(from.startWash).lerp(to.startWash, progress);
	for (const key of [
		"cloudOpacity",
		"cloudShadeOpacity",
		"fogNearScale",
		"fogFarScale",
		"sunIntensity",
		"fillIntensity",
		"bounceIntensity",
		"hemiIntensity"
	]) target[key] = MathUtils.lerp(from[key], to[key], progress);
	return target;
}
//#endregion
//#region src/systems/SeasonParticleVisual.ts
function roundedShape(points) {
	const shape = new Shape();
	const midpoint = (a, b) => [(a[0] + b[0]) * .5, (a[1] + b[1]) * .5];
	const start = midpoint(points[points.length - 1], points[0]);
	shape.moveTo(start[0], start[1]);
	points.forEach((point, index) => {
		const next = points[(index + 1) % points.length];
		const end = midpoint(point, next);
		shape.quadraticCurveTo(point[0], point[1], end[0], end[1]);
	});
	shape.closePath();
	return shape;
}
function finishFlatGeometry(shape, scale, kind) {
	const geometry = new ShapeGeometry(shape, 8);
	geometry.scale(scale, scale, 1);
	geometry.computeBoundingBox();
	geometry.userData.flatParticleKind = kind;
	return geometry;
}
function addVerticalGradient(geometry, bottom, top) {
	geometry.computeBoundingBox();
	const bounds = geometry.boundingBox;
	const height = Math.max(1e-4, bounds.max.y - bounds.min.y);
	const position = geometry.getAttribute("position");
	const bottomColor = new Color(bottom);
	const topColor = new Color(top);
	const mixed = new Color();
	const colors = new Float32Array(position.count * 3);
	for (let index = 0; index < position.count; index += 1) {
		const progress = MathUtils.smoothstep((position.getY(index) - bounds.min.y) / height, .08, .92);
		mixed.copy(bottomColor).lerp(topColor, progress);
		colors[index * 3] = mixed.r;
		colors[index * 3 + 1] = mixed.g;
		colors[index * 3 + 2] = mixed.b;
	}
	geometry.setAttribute("color", new BufferAttribute(colors, 3));
}
function createSummerLeafGeometry(scale = 1) {
	const leaf = new Shape();
	leaf.moveTo(0, .15);
	leaf.bezierCurveTo(.052, .125, .074, .052, .058, -.012);
	leaf.bezierCurveTo(.043, -.08, .016, -.135, 0, -.15);
	leaf.bezierCurveTo(-.016, -.135, -.043, -.08, -.058, -.012);
	leaf.bezierCurveTo(-.074, .052, -.052, .125, 0, .15);
	return finishFlatGeometry(leaf, scale, "summer-leaf");
}
function createAutumnLeafGeometry(scale = 1) {
	const maple = new Shape();
	maple.moveTo(-.004, -.112);
	maple.bezierCurveTo(-.014, -.105, -.016, -.086, -.012, -.07);
	maple.bezierCurveTo(-.04, -.075, -.078, -.09, -.096, -.068);
	maple.bezierCurveTo(-.106, -.054, -.09, -.039, -.07, -.034);
	maple.bezierCurveTo(-.088, -.012, -.115, .007, -.122, .034);
	maple.bezierCurveTo(-.128, .055, -.096, .061, -.058, .03);
	maple.bezierCurveTo(-.052, .078, -.03, .132, 0, .15);
	maple.bezierCurveTo(.03, .132, .052, .078, .058, .03);
	maple.bezierCurveTo(.096, .061, .128, .055, .122, .034);
	maple.bezierCurveTo(.115, .007, .088, -.012, .07, -.034);
	maple.bezierCurveTo(.09, -.039, .106, -.054, .096, -.068);
	maple.bezierCurveTo(.078, -.09, .04, -.075, .012, -.07);
	maple.bezierCurveTo(.017, -.087, .014, -.108, .004, -.112);
	maple.closePath();
	const geometry = finishFlatGeometry(maple, scale, "autumn-maple");
	geometry.userData.autumnStyle = "minimal-rounded-v6";
	geometry.userData.autumnLobeCount = 5;
	geometry.userData.autumnSecondarySerrations = 0;
	geometry.userData.autumnStemCurved = true;
	geometry.userData.autumnStemLengthRatio = .18;
	addVerticalGradient(geometry, 12341077, 14972505);
	return geometry;
}
function createWinterSnowGeometry(scale = 1) {
	const armProfile = [
		[-.014, .034],
		[-.063, .054],
		[-.022, .07],
		[-.054, .091],
		[-.014, .106],
		[0, .145],
		[.014, .106],
		[.054, .091],
		[.022, .07],
		[.063, .054],
		[.014, .034]
	];
	const points = [];
	for (let arm = 0; arm < 6; arm += 1) {
		const angle = -arm * Math.PI / 3;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		for (const [x, y] of armProfile) points.push([x * cos - y * sin, x * sin + y * cos]);
	}
	const geometry = finishFlatGeometry(roundedShape(points), scale, "winter-snow");
	geometry.userData.winterArmCount = 6;
	geometry.userData.winterBranchPairsPerArm = 2;
	return geometry;
}
function createFireflyGeometry(scale = 1) {
	return new CircleGeometry(.055 * scale, 8);
}
function createSeasonParticleMaterial(color, opacity, glow = false, vertexColors = false) {
	if (glow) return new MeshBasicMaterial({
		color,
		side: 2,
		transparent: true,
		opacity,
		depthWrite: false,
		fog: false,
		blending: 2
	});
	return new MeshBasicMaterial({
		color,
		vertexColors,
		side: 2,
		transparent: true,
		opacity,
		depthWrite: false,
		fog: true
	});
}
//#endregion
//#region src/systems/PetalField.ts
var dummy = new Object3D();
function createLowPolySnowflakeGeometry(scale = 1) {
	const parts = [];
	for (const angle of [
		0,
		Math.PI / 3,
		Math.PI * 2 / 3
	]) {
		const arm = new BoxGeometry(.5 * scale, .046 * scale, .018 * scale);
		arm.rotateZ(angle);
		parts.push(arm);
	}
	for (let index = 0; index < 6; index += 1) {
		const angle = index * Math.PI / 3;
		const anchor = new Vector2(Math.cos(angle), Math.sin(angle)).clone().multiplyScalar(.155 * scale);
		for (const side of [-1, 1]) {
			const branchAngle = angle + Math.PI + side * Math.PI / 3;
			const branchDirection = new Vector2(Math.cos(branchAngle), Math.sin(branchAngle));
			const branch = new BoxGeometry(.12 * scale, .028 * scale, .015 * scale);
			branch.rotateZ(branchAngle);
			branch.translate(anchor.x + branchDirection.x * .045 * scale, anchor.y + branchDirection.y * .045 * scale, 0);
			parts.push(branch);
		}
	}
	const geometry = mergeGeometries(parts, false);
	parts.forEach((part) => part.dispose());
	if (!geometry) throw new Error("Unable to build low-poly snowflake geometry.");
	geometry.computeVertexNormals();
	return geometry;
}
var PetalField = class {
	mesh;
	snowMesh;
	summerMesh;
	autumnMesh;
	winterMesh;
	fireflyMesh;
	petals = [];
	baseCount;
	capacity;
	elapsed = 0;
	coldProgress = 0;
	seasonWeights = {
		spring: 1,
		summer: 0,
		autumn: 0,
		winter: 0
	};
	themeProgress = 0;
	activeSeason = "spring";
	populationFactor = 1;
	speedFactor = 1;
	populationTarget = 1;
	speedTarget = 1;
	populationFrom = 1;
	speedFrom = 1;
	variationSegment = -1;
	variationSegmentStartedAt = 0;
	seasonInitialized = false;
	canopyFlowActive = false;
	canopyCenter = new Vector3();
	canopyDirection = new Vector3(1, 0, 0);
	canopyTangent = new Vector3(0, 1, 0);
	canopyBitangent = new Vector3(0, 0, 1);
	canopyRadius = 0;
	canopyStrength = 0;
	random = (() => {
		let state = 1369948382;
		return () => {
			state = Math.imul(1664525, state) + 1013904223;
			return (state >>> 0) / 4294967296;
		};
	})();
	get activeBurstCount() {
		return this.petals.filter((petal) => petal.burstLife > 0).length;
	}
	get ambientDiagnostics() {
		const seasonCounts = {
			spring: 0,
			summer: 0,
			autumn: 0,
			winter: 0
		};
		this.petals.forEach((petal) => {
			if (petal.active) seasonCounts[petal.season] += 1;
		});
		return {
			baseCount: this.baseCount,
			capacity: this.capacity,
			activeCount: this.petals.filter((petal) => petal.active).length,
			speedScale: this.speedFactor,
			populationScale: this.populationFactor,
			seasonCounts
		};
	}
	get canopyFlowState() {
		return {
			active: this.canopyFlowActive,
			particleCount: this.petals.filter((petal) => petal.canopyFlowActive).length,
			radius: this.canopyRadius,
			direction: this.canopyDirection.toArray(),
			path: "open-canopy-outer-arc",
			seasonalProps: true
		};
	}
	constructor(count = 28) {
		this.baseCount = Math.max(1, Math.floor(count));
		this.capacity = Math.max(this.baseCount, Math.ceil(this.baseCount * 1.75));
		const geometry = createSakuraPetalGeometry(.92);
		const material = createSakuraPetalMaterial(PAL.petal, .72);
		this.mesh = new InstancedMesh(geometry, material, this.capacity);
		this.mesh.frustumCulled = false;
		this.mesh.renderOrder = 4;
		this.snowMesh = new InstancedMesh(createLowPolySnowflakeGeometry(.92), createSakuraPetalMaterial(12181999, .92), this.capacity);
		this.snowMesh.name = "refrigerator-low-poly-snowflakes";
		this.snowMesh.frustumCulled = false;
		this.snowMesh.renderOrder = 5;
		this.snowMesh.visible = false;
		this.mesh.add(this.snowMesh);
		this.summerMesh = new InstancedMesh(createSummerLeafGeometry(.92), createSeasonParticleMaterial(8695185, 0), this.capacity);
		this.summerMesh.name = "summer-leaf-particles";
		this.autumnMesh = new InstancedMesh(createAutumnLeafGeometry(.92), createSeasonParticleMaterial(16777215, 0, false, true), this.capacity);
		this.autumnMesh.name = "autumn-leaf-particles";
		this.winterMesh = new InstancedMesh(createWinterSnowGeometry(.98), createSeasonParticleMaterial(16777215, 0), this.capacity);
		this.winterMesh.name = "winter-paper-snow";
		this.fireflyMesh = new InstancedMesh(createFireflyGeometry(1), createSeasonParticleMaterial(16767082, 0, true), this.capacity);
		this.fireflyMesh.name = "summer-night-fireflies";
		for (const seasonal of [
			this.summerMesh,
			this.autumnMesh,
			this.winterMesh,
			this.fireflyMesh
		]) {
			seasonal.frustumCulled = false;
			seasonal.renderOrder = seasonal === this.fireflyMesh ? 6 : 4;
			seasonal.visible = false;
			this.mesh.add(seasonal);
		}
		for (let index = 0; index < this.capacity; index += 1) this.petals.push(this.createAmbientPetal(index < this.baseCount ? index / this.baseCount : 0, index < this.baseCount, index >= this.baseCount));
		this.sync();
	}
	update(delta) {
		this.elapsed += delta;
		this.updateVariation(delta);
		this.updatePopulation();
		for (const petal of this.petals) {
			if (!petal.active) continue;
			petal.ambientAge += delta;
			if (petal.extra && petal.ambientAge >= petal.ambientLifetime) {
				const desiredExtra = Math.max(0, Math.round(this.baseCount * (this.populationFactor - 1)));
				if (this.petals.filter((candidate) => candidate.active && candidate.extra).length > desiredExtra) {
					petal.active = false;
					continue;
				}
				this.resetAmbient(petal, 0);
			}
			if (petal.canopyFlowActive) {
				this.updateCanopyPetal(petal, delta);
				continue;
			}
			const motionDelta = delta * this.speedFactor;
			petal.position.addScaledVector(petal.velocity, motionDelta);
			petal.rotation.x += petal.spin.x * motionDelta;
			petal.rotation.y += petal.spin.y * motionDelta;
			petal.rotation.z += petal.spin.z * motionDelta;
			if (petal.burstLife > 0) {
				petal.burstLife -= delta;
				petal.velocity.multiplyScalar(Math.exp(-delta * .85));
				petal.velocity.y -= delta * .24;
				if (petal.burstLife <= 0) this.resetAmbient(petal, 1);
			} else {
				const sway = Math.sin(this.elapsed * petal.swaySpeed + petal.phase);
				petal.position.x += sway * petal.swayAmplitude * delta;
				petal.position.z += Math.cos(this.elapsed * petal.swaySpeed * .73 + petal.phase) * petal.swayAmplitude * .35 * delta;
				if (petal.season === "autumn") {
					const gust = Math.max(0, Math.sin(this.elapsed * 1.45 + petal.phase));
					petal.position.x -= (.035 + gust * .085) * motionDelta;
				}
				if (petal.season === "winter") {
					const gust = Math.max(0, Math.sin(this.elapsed * 2.35 + petal.phase));
					petal.position.x -= (.12 + gust * .28) * motionDelta;
					petal.position.z += Math.sin(this.elapsed * 2.7 + petal.phase) * .22 * motionDelta;
					petal.rotation.z += (1.1 + petal.coldSeed * 1.6) * motionDelta;
				}
				if (this.coldProgress > .001) {
					const gust = Math.sin(this.elapsed * (1.7 + petal.coldSeed * 2.6) + petal.phase);
					const gustPulse = Math.max(0, gust) ** 2;
					petal.position.x += this.coldProgress * (.46 + petal.coldSeed * .48 + gustPulse * .42) * motionDelta;
					petal.position.y -= this.coldProgress * (.54 + petal.coldSeed * .58) * motionDelta;
					petal.position.z += this.coldProgress * Math.sin(this.elapsed * 2.3 + petal.phase) * .2 * motionDelta;
					petal.rotation.z += this.coldProgress * (1.1 + petal.coldSeed * 2.4) * motionDelta;
				}
				if (petal.position.y < -4.5 || Math.abs(petal.position.x) > 10 || Math.abs(petal.position.z) > 10) this.resetAmbient(petal, 0);
			}
		}
		this.sync();
	}
	setCanopyFlow(flow) {
		const nextActive = flow.active && flow.radius > .1 && flow.strength > .01;
		this.canopyCenter.copy(flow.center);
		this.canopyRadius = Math.max(0, flow.radius);
		this.canopyStrength = MathUtils.clamp(flow.strength, 0, 1);
		this.canopyDirection.copy(flow.direction);
		if (this.canopyDirection.lengthSq() < 1e-4) this.canopyDirection.set(1, 0, 0);
		this.canopyDirection.normalize();
		const helper = Math.abs(this.canopyDirection.y) > .88 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
		this.canopyTangent.crossVectors(helper, this.canopyDirection).normalize();
		this.canopyBitangent.crossVectors(this.canopyDirection, this.canopyTangent).normalize();
		if (nextActive && !this.canopyFlowActive) this.beginCanopyFlow();
		if (!nextActive && this.canopyFlowActive) this.endCanopyFlow();
		this.canopyFlowActive = nextActive;
	}
	setColdProgress(progress) {
		this.coldProgress = MathUtils.clamp(progress, 0, 1);
		this.snowMesh.visible = this.coldProgress > .001;
	}
	setSeasonState(weights, themeProgress) {
		for (const mode of SEASON_MODES) this.seasonWeights[mode] = weights[mode];
		this.themeProgress = MathUtils.clamp(themeProgress, 0, 1);
		this.activeSeason = SEASON_MODES.reduce((best, mode) => weights[mode] > weights[best] ? mode : best, SEASON_MODES[0]);
		if (!this.seasonInitialized) {
			this.seasonInitialized = true;
			this.petals.forEach((petal) => {
				petal.season = this.activeSeason;
				if (petal.active) this.resetAmbient(petal, 0);
			});
		}
		const springMaterial = this.mesh.material;
		const summerMaterial = this.summerMesh.material;
		const autumnMaterial = this.autumnMesh.material;
		const winterMaterial = this.winterMesh.material;
		const fireflyMaterial = this.fireflyMesh.material;
		springMaterial.opacity = .72;
		summerMaterial.opacity = .78 * MathUtils.lerp(1, .35, this.themeProgress);
		autumnMaterial.opacity = .84;
		winterMaterial.opacity = 1;
		fireflyMaterial.opacity = 0;
		this.sync();
	}
	get coldState() {
		return {
			progress: this.coldProgress,
			snowflakeCount: this.petals.filter((petal) => MathUtils.smoothstep(this.coldProgress, petal.coldSeed * .5, petal.coldSeed * .5 + .3) > .5).length
		};
	}
	get seasonState() {
		return {
			weights: { ...this.seasonWeights },
			springOpacity: this.mesh.material.opacity,
			summerOpacity: this.summerMesh.material.opacity,
			autumnOpacity: this.autumnMesh.material.opacity,
			winterOpacity: this.winterMesh.material.opacity,
			fireflyOpacity: this.fireflyMesh.material.opacity,
			refrigeratorSnowVisible: this.snowMesh.visible,
			refrigeratorColdProgress: this.coldProgress
		};
	}
	burst(origin, direction, count = 12) {
		const candidates = this.petals.filter((petal) => petal.active).sort((a, b) => a.burstLife - b.burstLife).slice(0, Math.max(1, Math.min(this.petals.length, count)));
		for (const petal of candidates) {
			petal.position.copy(origin).add(new Vector3((this.random() - .5) * .55, (this.random() - .5) * .55, (this.random() - .5) * .55));
			petal.velocity.copy(direction).multiplyScalar(1.2 + this.random() * 2.1).add(new Vector3((this.random() - .5) * 2.2, (this.random() - .25) * 1.8, (this.random() - .5) * 2.2));
			petal.burstLife = 1.1 + this.random() * .8;
			petal.scale = .7 + this.random() * .75;
		}
	}
	applyWind(origin, direction, strength, radius) {
		const radiusSq = radius * radius;
		const normalized = direction.clone().normalize();
		for (const petal of this.petals) {
			const distanceSq = petal.position.distanceToSquared(origin);
			if (distanceSq > radiusSq) continue;
			const falloff = 1 - Math.sqrt(distanceSq) / radius;
			petal.velocity.addScaledVector(normalized, strength * falloff);
			petal.spin.z += strength * .15 * falloff;
		}
	}
	dispose() {
		for (const seasonal of [
			this.summerMesh,
			this.autumnMesh,
			this.winterMesh,
			this.fireflyMesh
		]) {
			seasonal.geometry.dispose();
			const seasonalMaterial = seasonal.material;
			if (Array.isArray(seasonalMaterial)) seasonalMaterial.forEach((entry) => entry.dispose());
			else seasonalMaterial.dispose();
		}
		this.snowMesh.geometry.dispose();
		const snowMaterial = this.snowMesh.material;
		if (Array.isArray(snowMaterial)) snowMaterial.forEach((entry) => entry.dispose());
		else snowMaterial.dispose();
		this.mesh.geometry.dispose();
		const material = this.mesh.material;
		if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
		else material.dispose();
	}
	createAmbientPetal(progress, active, extra) {
		const petal = {
			active,
			extra,
			season: this.activeSeason,
			position: new Vector3(),
			velocity: new Vector3(),
			rotation: new Euler(),
			spin: new Vector3(),
			scale: 1,
			phase: 0,
			swaySpeed: 1,
			swayAmplitude: .1,
			burstLife: 0,
			coldSeed: 0,
			snowScale: 1,
			canopyFlowActive: false,
			canopyFlowProgress: 0,
			canopyFlowSpeed: 0,
			canopyFlowLane: 0,
			ambientAge: 0,
			ambientLifetime: 8
		};
		this.resetAmbient(petal, progress);
		petal.active = active;
		if (!active) petal.position.set(0, -20, 0);
		return petal;
	}
	resetAmbient(petal, progress) {
		petal.active = true;
		petal.season = this.activeSeason;
		petal.position.set((this.random() - .5) * 17, 5.5 - progress * 10, (this.random() - .5) * 13);
		const summer = this.activeSeason === "summer";
		const autumn = this.activeSeason === "autumn";
		const spring = this.activeSeason === "spring";
		petal.velocity.set(spring ? -.16 - this.random() * .22 : summer ? -.05 - this.random() * .12 : autumn ? -.14 - this.random() * .2 : -.48 - this.random() * .36, spring ? -.42 - this.random() * .34 : summer ? -.18 - this.random() * .2 : autumn ? -.38 - this.random() * .28 : -.68 - this.random() * .34, .04 + this.random() * .14);
		petal.rotation.set(this.random() * Math.PI, this.random() * Math.PI, this.random() * Math.PI);
		petal.spin.set((this.random() - .5) * 2.5, (this.random() - .5) * 2.5, (this.random() - .5) * 2.5);
		petal.scale = .55 + this.random() * .8;
		petal.phase = this.random() * Math.PI * 2;
		petal.swaySpeed = .55 + this.random() * 1.15;
		petal.swayAmplitude = .08 + this.random() * .16;
		petal.burstLife = 0;
		petal.coldSeed = this.random();
		petal.snowScale = .55 + this.random() * .38;
		petal.canopyFlowActive = false;
		petal.canopyFlowProgress = 0;
		petal.canopyFlowSpeed = 0;
		petal.canopyFlowLane = 0;
		petal.ambientAge = 0;
		petal.ambientLifetime = 7.5 + this.random() * 4.5;
	}
	updateVariation(delta) {
		const segmentDuration = 6.5;
		const transitionDuration = 4.2;
		const segment = Math.floor(this.elapsed / segmentDuration);
		if (segment !== this.variationSegment) {
			this.variationSegment = segment;
			this.variationSegmentStartedAt = segment * segmentDuration;
			this.populationFrom = this.populationFactor;
			this.speedFrom = this.speedFactor;
			const hash = (value) => {
				const raw = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
				return raw - Math.floor(raw);
			};
			this.populationTarget = .82 + hash(segment * 2.17 + 4.1) * .9;
			this.speedTarget = .84 + hash(segment * 3.71 + 8.4) * .82;
		}
		const transition = MathUtils.smoothstep((this.elapsed - this.variationSegmentStartedAt) / transitionDuration, 0, 1);
		const nextPopulation = MathUtils.lerp(this.populationFrom, this.populationTarget, transition);
		const nextSpeed = MathUtils.lerp(this.speedFrom, this.speedTarget, transition);
		const frameScale = MathUtils.clamp(delta * 60, .25, 1);
		const maxPopulationStep = .012 * frameScale;
		const maxSpeedStep = .012 * frameScale;
		this.populationFactor += MathUtils.clamp(nextPopulation - this.populationFactor, -maxPopulationStep, maxPopulationStep);
		this.speedFactor += MathUtils.clamp(nextSpeed - this.speedFactor, -maxSpeedStep, maxSpeedStep);
	}
	updatePopulation() {
		const desiredExtra = Math.max(0, Math.min(this.capacity - this.baseCount, Math.round(this.baseCount * Math.max(0, this.populationFactor - 1))));
		const activeExtra = this.petals.filter((petal) => petal.active && petal.extra).length;
		if (activeExtra >= desiredExtra) return;
		let remaining = desiredExtra - activeExtra;
		for (const petal of this.petals) {
			if (remaining <= 0) break;
			if (petal.active || !petal.extra) continue;
			petal.active = true;
			this.resetAmbient(petal, 0);
			remaining -= 1;
		}
	}
	beginCanopyFlow() {
		const count = Math.min(this.petals.length, Math.max(8, Math.round(this.petals.length * .38)));
		this.petals.filter((petal) => petal.active).sort((first, second) => first.burstLife - second.burstLife).slice(0, count).forEach((petal, index) => {
			petal.canopyFlowActive = true;
			petal.canopyFlowProgress = (index / count + this.random() * .12) % 1;
			petal.canopyFlowSpeed = .16 + this.random() * .09;
			petal.canopyFlowLane = index % 3 / 3 + (this.random() - .5) * .075;
			petal.burstLife = 0;
			petal.scale = .62 + this.random() * .62;
			petal.spin.set((this.random() - .5) * 3.8, (this.random() - .5) * 3.8, (this.random() - .5) * 5.2);
			this.placeCanopyPetal(petal);
		});
	}
	endCanopyFlow() {
		for (const petal of this.petals) {
			if (!petal.canopyFlowActive) continue;
			petal.canopyFlowActive = false;
			petal.velocity.copy(this.canopyDirection).multiplyScalar(.9 + this.random() * .8);
			petal.velocity.y -= .18 + this.random() * .22;
			petal.burstLife = .55 + this.random() * .4;
		}
	}
	updateCanopyPetal(petal, delta) {
		petal.canopyFlowProgress += delta * this.speedFactor * petal.canopyFlowSpeed * MathUtils.lerp(.72, 1.45, this.canopyStrength);
		if (petal.canopyFlowProgress >= 1) {
			petal.canopyFlowProgress %= 1;
			petal.canopyFlowLane = (petal.canopyFlowLane + .36 + this.random() * .16) % 1;
			petal.scale = .62 + this.random() * .62;
		}
		this.placeCanopyPetal(petal);
		petal.rotation.x += petal.spin.x * delta;
		petal.rotation.y += petal.spin.y * delta;
		petal.rotation.z += petal.spin.z * delta;
	}
	placeCanopyPetal(petal) {
		const progress = MathUtils.smoothstep(petal.canopyFlowProgress, 0, 1);
		const axisNormalized = MathUtils.lerp(-.96, .76, progress);
		const angle = petal.canopyFlowLane * Math.PI * 2 + Math.sin(progress * Math.PI) * .24 + this.elapsed * .08;
		const radialScale = Math.sqrt(Math.max(.04, 1 - axisNormalized * axisNormalized));
		const radialDirection = this.canopyTangent.clone().multiplyScalar(Math.cos(angle)).addScaledVector(this.canopyBitangent, Math.sin(angle));
		const outerRadius = this.canopyRadius * (1.045 + Math.sin(progress * Math.PI) * .055);
		petal.position.copy(this.canopyCenter).addScaledVector(this.canopyDirection, axisNormalized * this.canopyRadius * 1.06).addScaledVector(radialDirection, radialScale * outerRadius);
		const flutter = Math.sin(this.elapsed * (3.2 + petal.canopyFlowSpeed * 4) + petal.phase) * .055;
		petal.position.addScaledVector(radialDirection, flutter * this.canopyRadius);
	}
	sync() {
		const seasonCounts = {
			spring: 0,
			summer: 0,
			autumn: 0,
			winter: 0
		};
		this.petals.forEach((petal, index) => {
			if (petal.active) seasonCounts[petal.season] += 1;
			const localCold = MathUtils.smoothstep(this.coldProgress, petal.coldSeed * .5, petal.coldSeed * .5 + .3);
			const activeScale = petal.active ? 1 : 0;
			dummy.position.copy(petal.position);
			dummy.rotation.copy(petal.rotation);
			dummy.scale.setScalar(petal.scale * activeScale * Number(petal.season === "spring") * Math.max(.001, 1 - localCold));
			dummy.updateMatrix();
			this.mesh.setMatrixAt(index, dummy.matrix);
			dummy.rotation.set(petal.rotation.x * .18, petal.rotation.y * .18, petal.rotation.z + petal.phase * .12);
			dummy.scale.setScalar(petal.scale * activeScale * petal.snowScale * Math.max(.001, localCold));
			dummy.updateMatrix();
			this.snowMesh.setMatrixAt(index, dummy.matrix);
			dummy.rotation.set(petal.rotation.x * .7, petal.rotation.y * .7, petal.rotation.z);
			dummy.scale.set(petal.scale * activeScale * Number(petal.season === "summer") * (.72 + petal.coldSeed * .1), petal.scale * activeScale * Number(petal.season === "summer") * (.88 + index % 4 * .035), 1);
			dummy.updateMatrix();
			this.summerMesh.setMatrixAt(index, dummy.matrix);
			dummy.rotation.set(petal.rotation.x * .62, petal.rotation.y * .62, petal.rotation.z + petal.phase * .04);
			dummy.scale.set(petal.scale * activeScale * Number(petal.season === "autumn") * (.76 + index % 3 * .07), petal.scale * activeScale * Number(petal.season === "autumn") * (.74 + petal.coldSeed * .16), 1);
			dummy.updateMatrix();
			this.autumnMesh.setMatrixAt(index, dummy.matrix);
			const winterFlutter = Math.sin(this.elapsed * (1.7 + petal.coldSeed * 1.35) + petal.phase);
			dummy.rotation.set(petal.rotation.x * .92 + winterFlutter * .16, petal.rotation.y * .82 + Math.cos(this.elapsed * 1.23 + petal.phase) * .12, petal.rotation.z * .58 + petal.phase * .06);
			dummy.scale.set(petal.scale * activeScale * Number(petal.season === "winter") * (1.04 + index % 4 * .075), petal.scale * activeScale * Number(petal.season === "winter") * (1.04 + petal.coldSeed * .22), 1);
			dummy.updateMatrix();
			this.winterMesh.setMatrixAt(index, dummy.matrix);
			dummy.position.y += Math.sin(this.elapsed * (.65 + petal.coldSeed * .5) + petal.phase) * .42;
			dummy.position.x += Math.cos(this.elapsed * .48 + petal.phase) * .18;
			dummy.scale.setScalar(activeScale * Number(petal.season === "summer") * (.55 + petal.coldSeed * .42) * (.8 + Math.sin(this.elapsed * 1.7 + petal.phase) * .15));
			dummy.updateMatrix();
			this.fireflyMesh.setMatrixAt(index, dummy.matrix);
		});
		this.mesh.instanceMatrix.needsUpdate = true;
		this.snowMesh.instanceMatrix.needsUpdate = true;
		this.summerMesh.instanceMatrix.needsUpdate = true;
		this.autumnMesh.instanceMatrix.needsUpdate = true;
		this.winterMesh.instanceMatrix.needsUpdate = true;
		this.fireflyMesh.instanceMatrix.needsUpdate = true;
		const summerMaterial = this.summerMesh.material;
		const autumnMaterial = this.autumnMesh.material;
		const winterMaterial = this.winterMesh.material;
		this.summerMesh.visible = seasonCounts.summer > 0 && summerMaterial.opacity > .002;
		this.autumnMesh.visible = seasonCounts.autumn > 0 && autumnMaterial.opacity > .002;
		this.winterMesh.visible = seasonCounts.winter > 0 && winterMaterial.opacity > .002;
		this.fireflyMesh.visible = false;
	}
};
//#endregion
export { OrbitControls as C, createLampVolumetricBeam as S, TELEVISION_RECONSTRUCTION_COMMIT_TIME as _, createSummerLeafGeometry as a, LAMP_BEAM_FAR_TO_NEAR_RATIO as b, SEASON_PROFILES as c, lerpEnvironmentState as d, AppliancePerformanceSystem as f, TELEVISION_RAPID_SWITCH_TIMES as g, TELEVISION_INITIAL_SWITCHES as h, createSeasonParticleMaterial as i, cloneEnvironmentState as l, createSakuraPetalMaterial as m, createAutumnLeafGeometry as n, createWinterSnowGeometry as o, createSakuraPetalGeometry as p, createFireflyGeometry as r, SEASON_MODES as s, PetalField as t, isSeasonMode as u, TELEVISION_RECONSTRUCTION_FINAL_LOCK_TIME as v, LAMP_BEAM_SOURCE_RADIUS_LOCAL as x, LAMP_BEAM_DEFAULT_LENGTH_LOCAL as y };
