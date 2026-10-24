import{A as e,At as t,B as n,Et as r,J as i,K as a,Mt as o,N as s,Nt as c,Q as l,R as u,T as d,V as f,X as p,Z as m,a as h,b as g,ct as _,d as v,dt as y,et as b,f as x,g as S,gt as C,ht as w,it as ee,j as te,jt as T,kt as ne,mt as re,n as ie,o as ae,ot as oe,q as E,r as se,st as ce,t as le,tt as D,u as O,w as ue,x as de,xt as fe,y as pe}from"./shadowfx-dulobzyO.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var k=new S(`#f8efe2`),A={uBendK:{value:0},uBendC:{value:new T},uRevC:{value:new T},uRevR:{value:9999},uRevSoft:{value:3},uPaper:{value:k.clone()},uTime:{value:0},uCutA:{value:new T},uCutB:{value:new T},uCut:{value:0},uTallR:{value:99999},uKeep:{value:new T(1e5,0,1e5)},uShopP:{value:new o(0,0,0,-1)},uFadeBand:{value:5},uInkR:{value:9999},uColR:{value:9999},uDrvC:{value:new T},uDrvR:{value:1e6},uDrvW:{value:45},uFadeO:{value:1},uFarR:{value:1e6},uRing:{value:new o(0,1e9,8,0)},uNight:{value:0},uWind:{value:new o(.8,.6,.6,0)},uWindAcc:{value:new t},uSeason:{value:2},uSeasonW:{value:new o(0,0,1,0)},uSnow:{value:0},uGrassTint:{value:new T(1,1,1)},uWet:{value:0},uHL:{value:new o(0,0,0,0)},uHLD:{value:new o(0,0,1,13)},uHLC:{value:new S(`#ffd9a0`)}};Object.assign(A,ie),le.uFarR=A.uFarR;function j(e,t,n){let r=Math.sin(e*127.1+t*311.7+n*74.7)*43758.5453;return r-Math.floor(r)}function me(e,t,n,r){let i=Math.floor(e),a=Math.floor(t),o=e-i,s=t-a,c=o*o*(3-2*o),l=s*s*(3-2*s),u=(e,t)=>j((e%r+r)%r,(t%r+r)%r,n);return(u(i,a)*(1-c)+u(i+1,a)*c)*(1-l)+(u(i,a+1)*(1-c)+u(i+1,a+1)*c)*l}function M(e,t,n,r,i=5){let a=.5,o=0,s=1;for(let c=0;c<i;c++)o+=a*me(e*s,t*s,n+c,r*s),a*=.5,s*=2;return o}function he(e,t=256){let r=new Uint8Array(t*t*4);for(let n=0;n<t;n++)for(let i=0;i<t;i++){let a=i/t,o=n/t,s=.5,c=0,l=0,u=M(a*4,o*4,1,4),d=M(a*16,o*16,7,16,3);switch(e){case`plaster`:{s=.47+(u-.5)*.22+(d-.5)*.07;let e=M(a*3,o*6,13,3);e>.66&&(s-=(e-.66)*.5);let t=M(a*6,o*6,21,6);c=t>.7?Math.min(1,(t-.7)*8):0;break}case`paint`:{s=.5+(u-.5)*.16+(d-.5)*.06;let e=M(a*5,o*5,31,5)*.75+M(a*20,o*20,33,20,2)*.25;c=e>.64?Math.min(1,(e-.64)*12):0,l=e>.62&&e<.66?.6:0;break}case`brick`:{let e=o*8,t=Math.floor(e),n=a*4+t%2*.5,r=Math.floor(n),i=n-r,u=e-t,f=i<.05||u<.1;s=f?.72:.42+j(r,t,3)*.16+(d-.5)*.1,l=f?0:i>.94||u>.9?.35:0,c=+!!f;break}case`tile`:{let e=o*8,t=Math.floor(e),n=a*6+t%2*.5,r=Math.floor(n),i=n-r-.5,c=e-t,u=Math.sqrt(i*i*1.4+(c-.15)*(c-.15));s=.4+c*.25+j(r,t,5)*.1+(d-.5)*.08,l=c<.07||u>.62?.55:0;break}case`wood`:{let e=Math.floor(a*5);s=.44+(Math.sin(o*40+M(a*5,o*2,e,5)*6)*.5+.5)*.1+j(e,0,9)*.08,l=a*5-e<.05?.6:0;break}case`stone`:{let e=a*6,t=o*6,n=Math.floor(e+Math.floor(t)%2*.5),r=Math.floor(t),i=e+r%2*.5-n,c=t-r;s=i<.04||c<.05?.38:.48+j(n,r,11)*.08+(d-.5)*.08;break}case`leaf`:s=.42+u*.25+(d-.5)*.12,c=+(M(a*8,o*8,41,8)>.62);break;case`road`:s=.5+(u-.5)*.1+(d-.5)*.1;break;default:s=.5+(d-.5)*.06}let f=(n*t+i)*4;r[f]=Math.max(0,Math.min(255,s*255)),r[f+1]=c*255,r[f+2]=l*255,r[f+3]=255}let i=new g(r,t,t,_);return i.wrapS=i.wrapT=y,i.magFilter=n,i.minFilter=f,i.generateMipmaps=!0,i.needsUpdate=!0,i}var N={};function ge(e){return N[e]||(N[e]=he(e))}var P=`
uniform float uBendK; uniform vec3 uBendC; uniform float uZB;
attribute vec4 anc; varying vec3 vAnc; varying float vAncOn;
varying vec3 vWorldP; varying vec3 vObjP; varying vec3 vObjN;
// curved world: drop with distance AND lean tall things outward along the surface normal (buildings follow the curve)
vec4 bendW(vec4 w){ vec2 d = w.xz - uBendC.xz; float h = w.y; w.y -= uBendK * dot(d, d); w.xz += d * (2.0 * uBendK * h); return w; }
`,F=`
vec4 wP = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
  wP = batchingMatrix * wP;
#endif
#ifdef USE_INSTANCING
  wP = instanceMatrix * wP;
#endif
wP = modelMatrix * wP;
vWorldP = wP.xyz;
#ifdef USE_INSTANCING
  vAnc = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; vAncOn = 2.0;
#else
  vAnc = (modelMatrix * vec4(anc.xyz, 1.0)).xyz; vAncOn = anc.w > 1.5 ? 2.0 : 1.0 - anc.w;
#endif
wP = bendW(wP);
vec4 mvPosition = viewMatrix * wP;
gl_Position = projectionMatrix * mvPosition;
gl_Position.z -= uZB * gl_Position.w;   // M3.4: per-kind depth priority (glass > trims > stone > walls): coplanar window parts no longer z-fight far away
`,_e=`
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
  vec4 worldPosition = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    worldPosition = instanceMatrix * worldPosition;
  #endif
  worldPosition = modelMatrix * worldPosition;   // M3.4: shadows live in the flat world (no swim while the bend centre moves)
#endif
`,ve=F.replace(`wP = bendW(wP);`,``),I=`
uniform vec3 uRevC; uniform float uRevR; uniform float uRevSoft; uniform vec3 uPaper;
uniform vec3 uCutA; uniform vec3 uCutB; uniform float uCut; uniform float uTallR; uniform vec3 uKeep;
varying vec3 vAnc; varying float vAncOn; uniform vec4 uShopP;
uniform float uNight;
uniform sampler2D uDet; uniform float uDetS; uniform vec3 uChip; uniform float uChipAmt; uniform float uWorldTex;
varying vec3 vWorldP; varying vec3 vObjP; varying vec3 vObjN;
float h12(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
float vn2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h12(i),h12(i+vec2(1,0)),f.x), mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x), f.y); }
vec4 triDet(vec3 p, vec3 n){
  vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z + 1e-4);
  vec4 a = texture2D(uDet, p.zy * uDetS); vec4 b = texture2D(uDet, p.xz * uDetS); vec4 c = texture2D(uDet, p.xy * uDetS);
  return a * w.x + b * w.y + c * w.z;
}
`,L=`
{
  vec3 rp = vAncOn > 0.5 ? vAnc : vWorldP;   // whole objects in or out
  float rd = length(rp.xz - uRevC.xz);
  float nz = vn2(rp.xz * 0.35) * 0.65 + vn2(rp.xz * 1.7) * 0.35;
  float edge = uRevR - nz * uRevSoft * 1.6;
  if (rd > edge) discard;
  if (rd > uTallR + (vAncOn > 1.5 ? 7.0 : 0.0) && (vAncOn > 0.5 || vWorldP.y > 0.3) && length(rp.xz - uKeep.xz) > 3.6 && length(rp.xz - uShopP.xz) > uShopP.w) discard;
  if (uCut > 0.5) {
    // M3.4 see-through for the chase camera, no dithered (pixelated) rim any more:
    // small things (trees, lamps, signs, instanced props) standing in the sight line hide whole; buildings get a clean round cut
    vec3 ab = uCutB - uCutA; float L = length(ab); vec3 dir = ab / max(L, 1e-3);
    if (vAncOn > 1.5) {
      vec2 a2 = uCutA.xz, d2 = uCutB.xz - uCutA.xz; float L2 = max(length(d2), 1e-3); vec2 n2 = d2 / L2;
      float t2 = dot(vAnc.xz - a2, n2);
      if (t2 > 1.0 && t2 < L2 - 3.4 && length(vAnc.xz - (a2 + n2 * t2)) < 1.7) discard;
    } else {
      float t = dot(vWorldP - uCutA, dir);
      if (t > 0.0 && t < L - 3.2 && vWorldP.y > 1.3) {
        float d = length(vWorldP - (uCutA + dir * t));
        if (d < 2.8 * smoothstep(0.0, 3.0, t)) discard;
      }
    }
  }
}
`,R=`
uniform float uFadeO; uniform float uFarR; uniform vec3 uDrvC; uniform vec4 uRing;
float fadeN(){ return fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); }
float fadeD(){
  float f = 1.0 - smoothstep(uFarR - 30.0, uFarR + 10.0, length(vWorldP.xz - uDrvC.xz));
  if (uRing.w > 0.5) { float r = length(vAnc.xz - uDrvC.xz); f *= smoothstep(uRing.x - uRing.z, uRing.x, r) * (1.0 - smoothstep(uRing.y - uRing.z, uRing.y, r)); }
  return f;
}
`,ye=`
if (uFadeO < 0.999 || uFarR < 1e5 || uRing.w > 0.5) {
  float fn = fadeN(), fd = fadeD();
  if (uFadeO >= 1.5) { if (fn >= min(uFadeO - 2.0, fd)) discard; }
  else if (uFadeO >= 0.0) { if (fn >= uFadeO * fd) discard; }
  else if (fn < -uFadeO || fn >= fd) discard;
}
`,be=`
float fA = 1.0;
if (uFadeO < 0.999 || uFarR < 1e5 || uRing.w > 0.5) {
  float fn = fadeN(), fd = fadeD();
  if (uFadeO >= 1.5) { if (uFadeO < 2.5 || fn >= fd) discard; fA = fd; }
  else if (uFadeO >= 0.0) { fA = uFadeO * fd; if (fn >= fA) discard; }
  else { if (-uFadeO >= 0.5 || fn >= fd) discard; fA = fd; }
}
`,xe=`
{
  vec3 tp = mix(vObjP, vWorldP, uWorldTex);
  vec4 dt = triDet(tp, normalize(vObjN));
  diffuseColor.rgb *= (0.55 + dt.r * 0.9);
  diffuseColor.rgb = mix(diffuseColor.rgb, uChip, dt.g * uChipAmt);
  diffuseColor.rgb *= (1.0 - dt.b * 0.45);
}
`,Se=`
#include <begin_vertex>
vObjP = position; vObjN = normal;
#ifdef USE_INSTANCING
  vObjP = (instanceMatrix * vec4(position, 1.0)).xyz;
#endif
`,Ce=`
{
  vec3 base = vec3(0.0);
  mat3 wR = mat3(modelMatrix);
  #ifdef USE_INSTANCING
    base = instanceMatrix[3].xyz;
    wR = wR * mat3(instanceMatrix);
  #endif
  base += modelMatrix[3].xyz;
  float hgt = max(0.0, position.y - 0.9);
  #ifndef USE_INSTANCING
    // M3.4: merged (non-instanced) foliage carries absolute heights; window boxes / balcony planters high on a facade used to
    // swing like a wave. Elevated decorations only tremble a little; ground shrubs sway from their own base.
    float rel = position.y - anc.y;
    float up = smoothstep(1.4, 2.2, rel);
    if (anc.w > 1.5) hgt = max(0.0, rel - 0.9);                                    // a plant object: sway from its own base
    else if (anc.w < 0.5) hgt = clamp(rel - 0.35, 0.0, 1.0) * (1.0 - up) + 0.1 * up;  // leaves on a building: tremble only
  #endif
  float ph = base.x * 0.31 + base.z * 0.23;
  vec2 wd = uWind.xy;
  float wave = 0.5 + 0.5 * sin(uTime * 0.8 - dot(base.xz + position.xz, wd) * 0.09);
  float ws = uWind.z * (0.75 + 0.5 * wave);
  vec3 ld = transpose(wR) * vec3(wd.x, 0.0, wd.y); ld = normalize(vec3(ld.x, 0.0, ld.z) + 1e-5);
  vec3 lp = vec3(-ld.z, 0.0, ld.x);
  // M3.4b: one slow, soft sway of the whole crown + a smooth ripple through the leaves (the old per-cell flutter made
  // patches of a tree jitter independently: it read as shaking, not wind)
  float sway = sin(uTime * 0.9 + ph) * 0.65 + sin(uTime * 1.7 + ph * 1.7) * 0.2;
  float flutter = sin(uTime * 2.3 + ph * 3.0 + position.y * 1.1 + (position.x + position.z) * 0.7) * 0.3;
  vec3 dsp = ld * (0.012 * ws + sway * 0.016 * ws) + lp * (sway * 0.009 * ws) + vec3(flutter * 0.004, flutter * 0.002, flutter * 0.004) * (0.4 + ws);
  transformed.xz += dsp.xz * hgt;
}
`,we=`
{
  float bl = vn2(vWorldP.xz * 0.45 + vWorldP.y * 0.3) * 0.65 + vn2(vWorldP.xz * 1.6 - vWorldP.y) * 0.35;
  diffuseColor.rgb *= mix(vec3(0.86, 0.95, 1.04), vec3(1.12, 1.06, 0.82), bl);
  diffuseColor.rgb *= mix(0.86, 1.1, clamp(vObjP.y * 0.25 - 0.3, 0.0, 1.0));
  float rim = 1.0 - abs(dot(normal, normalize(vViewPosition)));
  diffuseColor.rgb = mix(diffuseColor.rgb, uPaper * 0.55 + diffuseColor.rgb * 0.55, smoothstep(0.35, 1.0, rim) * 0.6);
}
`,Te=`
{
  vec2 p = vWorldP.xz;
  float wob = vn2(p * 0.03) * 1.6;
  float stripe = smoothstep(0.42, 0.58, abs(fract((p.x * 0.8 + p.y * 0.6) / 9.0 + wob * 0.15) - 0.5) * 2.0);
  diffuseColor.rgb *= mix(0.94, 1.05, stripe);
  float cl = vn2(p * 0.11 + 2.0) * 0.7 + vn2(p * 0.37) * 0.3;
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.84, 0.92, 0.80), smoothstep(0.56, 0.78, cl) * 0.7);
  diffuseColor.rgb *= mix(vec3(1.0), vec3(1.07, 1.04, 0.88), smoothstep(0.62, 0.9, vn2(p * 0.045 + 7.0)) * 0.6);
  vec2 c = floor(p * 1.7); vec2 f = fract(p * 1.7) - 0.5;
  float h = fract(sin(dot(c, vec2(127.1, 311.7))) * 43758.5453);
  vec2 o = vec2(fract(h * 13.7), fract(h * 71.3)) - 0.5;
  float d = length(f - o * 0.6);
  float show = step(0.88, h) * smoothstep(0.45, 0.7, vn2(p * 0.06 + 3.0));
  vec3 fc = fract(h * 37.0) > 0.45 ? vec3(1.0, 0.98, 0.93) : vec3(1.0, 0.86, 0.45);
  float petal = 1.0 - smoothstep(0.05, 0.085, d);
  diffuseColor.rgb = mix(diffuseColor.rgb, fc, show * petal);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.8, 0.35), show * (1.0 - smoothstep(0.015, 0.03, d)) * step(0.45, fract(h * 37.0)));
}
`,Ee=`
{
  vec2 p = vWorldP.xz * 1.1;
  vec2 g = floor(p), f = fract(p);
  float d1 = 9.0, d2 = 9.0; vec2 id = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j));
    vec2 h = fract(sin(vec2(dot(g + o, vec2(127.1, 311.7)), dot(g + o, vec2(269.5, 183.3)))) * 43758.5453);
    vec2 r = o + 0.5 + (h - 0.5) * 0.55 - f;
    float d = max(abs(r.x), abs(r.y)) * 0.75 + length(r) * 0.25;
    if (d < d1) { d2 = d1; d1 = d; id = g + o; } else if (d < d2) d2 = d;
  }
  float edge = d2 - d1;
  float hs = fract(sin(dot(id, vec2(41.3, 289.1))) * 15731.7);
  diffuseColor.rgb *= mix(0.9, 1.06, hs);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.03, 0.98, 0.92), step(0.82, hs) * 0.8);
  diffuseColor.rgb *= mix(0.66, 1.0, smoothstep(0.02, 0.07, edge));
}
`,De=`
{
  vec2 p = vWorldP.xz; float t = uTime;
  float w1 = vn2(p * 0.22 + vec2(t * 0.12, t * 0.05)), w2 = vn2(p * 0.7 - vec2(t * 0.22, -t * 0.09));
  diffuseColor.rgb *= mix(0.88, 1.1, w1 * 0.6 + w2 * 0.4);
  float st = vn2(vec2(p.x * 0.9 + t * 0.35, p.y * 0.9 - t * 0.2)) * 0.6 + vn2(p * 2.3 + t * 0.5) * 0.4;
  float ring = abs(fract(st * 3.0) - 0.5);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.98, 0.97), (1.0 - smoothstep(0.03, 0.08, ring)) * 0.32);
  vec2 c = floor(p * 2.0); float h = fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
  float gl = step(0.965, h) * (0.5 + 0.5 * sin(t * 3.0 + h * 40.0)) * (1.0 - smoothstep(0.05, 0.16, length(fract(p * 2.0) - 0.5)));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.99, 0.92), gl * 0.85);
}
`,Oe=`
uniform vec4 uSeasonW; uniform float uSnow; uniform vec3 uGrassTint; uniform float uSnowK;
uniform float uWet; uniform vec4 uHL; uniform vec4 uHLD; uniform vec3 uHLC;
`,ke=`
float wetK = 0.0;
if (uWet > 0.001) {
  float wUp = smoothstep(0.55, 0.92, normalize(vObjN).y);
  wetK = uWet * mix(0.3, 1.0, wUp) * mix(0.6, 1.0, uWorldTex);
  diffuseColor.rgb *= 1.0 - 0.16 * wetK;
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.93, 0.96, 1.04), wetK * 0.5);
}
`,Ae=`
roughnessFactor = mix(roughnessFactor, 0.3, wetK * 0.75);
`,je=`
if (uHL.w > 0.001) {
  vec3 hp = vWorldP - uHL.xyz; float hd = length(hp);
  if (hd < uHLD.w && hd > 0.25) {
    vec3 hL = hp / hd;
    float ca = dot(hL, uHLD.xyz);
    float soft = mix(0.006, 0.07, smoothstep(1.5, uHLD.w, hd));
    float cone = smoothstep(0.915 - soft, 0.915 + soft, ca);
    float att = (1.0 - smoothstep(uHLD.w * 0.45, uHLD.w, hd)) / (1.0 + 0.045 * hd * hd);
    vec3 wn = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
    float lam = max(dot(wn, -hL), 0.0) * 0.8 + 0.2;
    totalEmissiveRadiance += diffuseColor.rgb * uHLC * (cone * att * lam * uHL.w * 2.6);
  }
}
`,Me=`
{
  vec3 c = diffuseColor.rgb;
  float L = dot(c, vec3(0.3, 0.59, 0.11));
  float th = h12(floor(vAnc.xz * 0.53) + 7.0);
  float isG = smoothstep(-0.005, 0.05, c.g - c.r);
  float isP = smoothstep(0.02, 0.1, c.r - c.g) * smoothstep(-0.04, 0.05, c.b - c.g * 0.85);
  float isO = smoothstep(0.02, 0.1, c.r - c.g) * (1.0 - isP);
  float inst = step(1.5, vAncOn);   // trees / bushes (instanced, or a builder object that is mostly foliage)
  #ifdef USE_INSTANCING
    inst = 1.0;
  #endif
  float bl = vn2(vWorldP.xz * 0.9 + vWorldP.y * 0.7);
  vec3 spring = vec3(0.50, 0.78, 0.22) * (0.25 + 1.05 * L);
  vec3 summer = vec3(0.28, 0.6, 0.2) * (0.18 + 0.85 * L);
  vec3 aA = th < 0.36 ? vec3(0.97, 0.45, 0.12) : th < 0.62 ? vec3(0.93, 0.26, 0.15) : vec3(0.98, 0.7, 0.16);
  vec3 aB = th < 0.5 ? vec3(0.99, 0.64, 0.18) : vec3(0.95, 0.38, 0.14);
  vec3 autumn = mix(aA, aB, smoothstep(0.55, 0.8, bl) * 0.6) * (0.5 + 1.1 * L);
  // M3.5a (Qea): winter keeps a dark evergreen crown (no bare grey canopy, no holes); snow only caps the tops (below)
  vec3 winter = mix(vec3(0.2, 0.4, 0.27), vec3(0.24, 0.43, 0.33), bl) * (0.3 + 0.45 * L);
  vec3 g = spring * uSeasonW.x + summer * uSeasonW.y + autumn * uSeasonW.z + winter * uSeasonW.w;
  vec3 pk = mix(vec3(L), c, 1.25) * vec3(1.03, 0.97, 1.0);
  vec3 p = pk * uSeasonW.x + summer * uSeasonW.y + vec3(0.93, 0.4, 0.24) * (0.45 + 0.9 * L) * uSeasonW.z + winter * uSeasonW.w;
  vec3 o = spring * uSeasonW.x + summer * uSeasonW.y + c * 1.04 * uSeasonW.z + winter * uSeasonW.w;
  vec3 r = mix(c, g, isG * 0.88);
  r = mix(r, mix(mix(c, pk, uSeasonW.x), p, inst), isP * mix(1.0, 0.92, inst) * min(1.0, inst + uSeasonW.x + uSeasonW.w * 0.8));
  r = mix(r, o, isO * 0.95 * min(1.0, inst + uSeasonW.w * 0.8 * (1.0 - inst)));
  // spring: a few city trees are in blossom (white / pale pink dots)
  vec3 q = vWorldP * 3.2; vec3 qi = floor(q); float qh = fract(sin(dot(qi, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  float dot1 = 1.0 - smoothstep(0.18, 0.3, length(fract(q) - 0.5));
  r = mix(r, qh > 0.5 ? vec3(1.0, 0.93, 0.95) : vec3(0.98, 0.72, 0.8), step(0.72, qh) * dot1 * uSeasonW.x * step(th, 0.45) * isG * inst);
  // M3.5a winter snow caps: only the up-facing top of every lobe / tier (smooth normal.y), soft edge, large-scale noise
  if (uSnow > 0.001) {
    float ny = normalize(vObjN).y;
    float sn = vn2(vWorldP.xz * 0.6 + vWorldP.y * 0.45) * 0.65 + vn2(vWorldP.xz * 1.7 - vWorldP.y * 0.9) * 0.35;
    float cap = smoothstep(0.6, 0.8, ny + (sn - 0.5) * 0.26 - (1.0 - uSnow) * 0.5) * uSnow;
    r = mix(r, vec3(0.93, 0.95, 0.99) * (0.96 + 0.06 * sn), cap * mix(0.75, 1.0, inst) * max(isG, max(isP, isO) * inst));
  }
  diffuseColor.rgb = r;
}
`,Ne=`
if (uSnow > 0.001 && uSnowK > 0.001) {
  vec3 fn = normalize(cross(dFdx(vWorldP), dFdy(vWorldP)));
  if (dot(fn, cameraPosition - vWorldP) < 0.0) fn = -fn;
  float nz = vn2(vWorldP.xz * 0.7) * 0.6 + vn2(vWorldP.xz * 2.9 + 3.0) * 0.4;
  float cover = uSnow * uSnowK * uWorldTex;
  float s = smoothstep(0.3, 0.62, fn.y + (nz - 0.5) * 0.5 - (1.0 - cover) * 0.6);
  s *= smoothstep(0.2, 0.55, nz * 0.9 + cover * 0.55) * cover;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.89, 0.95) * (0.94 + 0.08 * nz), s);
}
`,z=`
float nLit = 1.0;
if (vAncOn > 0.5) nLit = step(0.12, h12(floor(vAnc.xz * 0.37) + floor(vAnc.y * 0.5) * 3.1));
#ifdef USE_INSTANCING
  nLit = 1.0;
#endif
`,Pe=`
{ ${z}
  totalEmissiveRadiance += (diffuseColor.rgb * 0.5 + vec3(0.42, 0.27, 0.1)) * uNight * mix(0.35, 1.0, nLit) * 1.15; }
`,Fe=`
{ ${z}
  totalEmissiveRadiance += vec3(1.0, 0.7, 0.38) * uNight * nLit * 0.75 * step(0.5, uWorldTex); }
`;function B(e,t={}){let n=t.det??`flat`,r={uDet:{value:ge(n)},uDetS:{value:t.scale??.5},uChip:{value:new S(t.chip??`#f3e6cf`)},uChipAmt:{value:t.chipAmt??0},uWorldTex:{value:+!t.local},uSnowK:{value:t.snow??1},uZB:{value:t.zb??0}};return e.userData.extra=r,e.onBeforeCompile=e=>{Object.assign(e.uniforms,A,r),e.vertexShader=P+(t.wind?`uniform float uTime; uniform vec4 uWind;
`:``)+e.vertexShader.replace(`#include <begin_vertex>`,Se+(t.wind?Ce:``)).replace(`#include <project_vertex>`,t.flat?ve:F).replace(`#include <worldpos_vertex>`,_e),e.fragmentShader.includes(`#include <color_fragment>`)?(e.fragmentShader=I+R+Oe+(e.fragmentShader.includes(`#include <lights_fragment_begin>`)?se:``)+(t.water?`uniform float uTime;
`:``)+e.fragmentShader.replace(`#include <lights_fragment_begin>`,h(ae.lights_fragment_begin)).replace(`#include <clipping_planes_fragment>`,`#include <clipping_planes_fragment>
`+L+ye).replace(`#include <color_fragment>`,`#include <color_fragment>
`+xe+(t.grass?`diffuseColor.rgb *= uGrassTint;
`+Te:``)+(t.pave?Ee:``)+(t.water?De:``)+(t.wash&&!t.local?Me:``)+(t.local||t.wash?``:Ne)+ke),e.fragmentShader.includes(`#include <roughnessmap_fragment>`)&&(e.fragmentShader=e.fragmentShader.replace(`#include <roughnessmap_fragment>`,`#include <roughnessmap_fragment>
`+Ae)),e.fragmentShader.includes(`#include <emissivemap_fragment>`)&&(e.fragmentShader=e.fragmentShader.replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
`+je)),t.wash&&(e.fragmentShader=e.fragmentShader.replace(`#include <normal_fragment_maps>`,`#include <normal_fragment_maps>
`+we).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
totalEmissiveRadiance += diffuseColor.rgb * 0.26 * (1.0 - 0.7 * uNight);`)),t.lit&&(e.fragmentShader=e.fragmentShader.replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
`+(t.lit===`glass`?Fe:Pe)))):e.fragmentShader=I+e.fragmentShader.replace(`#include <clipping_planes_fragment>`,`#include <clipping_planes_fragment>
`+L)},e.customProgramCacheKey=()=>`p`+n+(t.local?`L`:`W`)+(t.wind?`w`:``)+(t.wash?`a`:``)+(t.grass?`g`:``)+(t.pave?`v`:``)+(t.water?`q`:``)+(t.lit?`n`+t.lit:``),e}var V=B(new p({depthPacking:ce}),{flat:!0});V.customProgramCacheKey=()=>`depthFlat`;var H={};function Ie(e,t=!1){let n=e+(t?`L`:``);if(H[n])return H[n];let r={plaster:{det:`plaster`,scale:.35,chip:`#d9b9a0`,chipAmt:.35,rough:.95},paint:{det:`paint`,scale:.45,chip:`#efe1c9`,chipAmt:.7,rough:.8},brick:{det:`brick`,scale:.55,chip:`#efe3d0`,chipAmt:.55,rough:.95},tile:{det:`tile`,scale:.7,rough:.85},wood:{det:`wood`,scale:.6,rough:.9},stone:{det:`stone`,scale:.4,rough:.95},pave:{det:`stone`,scale:.4,rough:.95,pave:!0,snow:.8},water:{det:`flat`,scale:.5,rough:.35,metal:.05,water:!0,snow:0},road:{det:`road`,scale:.1,rough:1,snow:.4},leaf:{det:`leaf`,scale:.5,chip:`#fff6c8`,chipAmt:.1,rough:1,wind:!0,wash:!0,snow:.7},grass:{det:`leaf`,scale:.35,chip:`#fff6c8`,chipAmt:.05,rough:1,grass:!0},flat:{det:`flat`,scale:.5,rough:.85},glass:{det:`flat`,scale:.5,rough:.25,metal:.1,lit:`glass`,snow:0},metal:{det:`flat`,scale:.5,rough:.5,metal:.35},cream:{det:`flat`,scale:.5,rough:.55},glow:{det:`flat`,scale:.5,rough:1,emissive:!0,lit:`glow`,snow:0},clear:{det:`flat`,scale:.5,rough:.12,opacity:.16,front:!0}}[e]||{det:`flat`},i=new m({vertexColors:!0,roughness:r.rough??.9,metalness:r.metal??0,side:2});r.emissive&&(i.emissive=new S(`#ffe7a8`),i.emissiveIntensity=.6),r.opacity&&(i.transparent=!0,i.opacity=r.opacity,i.depthWrite=!1,r.front&&(i.side=0));let a={glass:3,glow:3,paint:2,wood:2,metal:2,cream:2,stone:1,tile:1}[e]||0;return B(i,{...r,local:t,zb:a*4e-7}),H[n]=i,i}var U=typeof location<`u`&&/[?&]smoothid\b/.test(location.search);function W(e){let t=e?`flat `:``,n=new w({side:2,uniforms:{...A,uZB:{value:0}},vertexShader:P+`
    attribute float inkId; ${t}varying float vId;
    void main(){
      vec3 transformed = position;
      vObjP = position; vObjN = normal;
      vId = inkId;
      ${F}
    }`,fragmentShader:`
    uniform vec3 uRevC; uniform float uRevR; uniform float uRevSoft;
    uniform vec3 uCutA; uniform vec3 uCutB; uniform float uCut; uniform float uTallR; uniform vec3 uKeep;
    varying vec3 vWorldP; ${t}varying float vId; varying vec3 vAnc; varying float vAncOn; uniform vec4 uShopP;
    float h12(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
    float vn2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(h12(i),h12(i+vec2(1,0)),f.x), mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x), f.y); }
    ${R}
    void main(){
      ${L}
      ${be}
      // ink part id (0 = soft: foliage, ground, unlisted) packed into 24 bits
      float id = floor(vId + 0.5);
      gl_FragColor = vec4(vec3(mod(id, 256.0), mod(floor(id / 256.0), 256.0), floor(id / 65536.0)) / 255.0, fA);   // a = fade (post scales the ink)
    }`});return n.userData.idPass=!0,n}var G=W(!U);typeof location<`u`&&/[?&]flickdbg\b/.test(location.search)&&(globalThis.__IDMATS={flat:U?W(!0):G,smooth:U?G:W(!1)});{let e=(e,t,n)=>{let r=e.userData.fo??1,i=!1;r!==A.uFadeO.value&&(A.uFadeO.value=r,i=!0);let a=e.userData.ring,o=A.uRing.value;a?o.equals(a)||(o.copy(a),i=!0):o.w!==0&&(o.w=0,i=!0),i&&(n.uniformsNeedUpdate=!0,t.state.useProgram(null))};i.prototype.onBeforeShadow=function(t,n,r,i,a,o){e(this,t,o)},i.prototype.onBeforeRender=function(t,n,r,i,a){if(e(this,t,a),!a.userData.idPass)return;let o=this.material?.userData?.extra?.uZB?.value||0;o!==a.uniforms.uZB.value&&(a.uniforms.uZB.value=o,a.uniformsNeedUpdate=!0)}}var Le=`
uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tNormal;
uniform vec2 res; uniform float near; uniform float far; uniform vec3 ink; uniform vec3 paper;
uniform float inkAmt; uniform float exposure; uniform float grain; uniform float vign; uniform float time; uniform float px; uniform float gk;
uniform vec4 uRainP; uniform mat4 uVP; uniform vec3 uCamP; uniform vec3 uSkyA; uniform vec3 uSkyB; uniform float uNightP;
uniform float dbg; uniform mat4 invProj; uniform mat4 camWorld; uniform vec3 uRevC; uniform float uRevR; uniform float uRevSoft; uniform float uFadeBand; uniform float uInkR; uniform float uColR; uniform vec3 uDrvC; uniform float uDrvR; uniform float uDrvW;
varying vec2 vUv;
float lin(float d){ float z = d * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }
float h12(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float vn2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h12(i),h12(i+vec2(1,0)),f.x), mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x), f.y); }
float idAt(vec2 uv){ vec3 v = floor(texture2D(tNormal, uv).rgb * 255.0 + 0.5); return v.r + v.g * 256.0 + v.b * 65536.0; }
void main(){
  vec2 t = px / res;
  vec4 col = texture2D(tColor, vUv);
  float d0 = lin(texture2D(tDepth, vUv).r);
  // Object-level ink: a line only where one PART meets another part / the sky / a soft thing,
  // drawn on the nearer part's side. Creases inside a part (window bars, planks, bevels) get no line.
  float id0 = idAt(vUv);
  float e = 0.0;
  if (id0 > 0.5) {
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785398;
      vec2 o = vec2(cos(a), sin(a)) * t;
      float idn = idAt(vUv + o);
      float dn = lin(texture2D(tDepth, vUv + o).r);
      float rel = (dn - d0) / max(d0, 0.5);
      float hit = 0.0;
      if (abs(idn - id0) > 0.5) hit = (rel > 0.004 || (idn > 0.5 && rel > -0.004 && idn < id0)) ? 1.0 : 0.0;  // soft things in front never leave a line on what is behind them
      else hit = step(0.06, rel);             // same part folding over itself (dome over wall)
      e += hit;
    }
    e = clamp(e / 2.0, 0.0, 1.0);
  }
  e *= 1.0 - smoothstep(35.0, 160.0, d0) * 0.85;
  { float a0 = texture2D(tNormal, vUv).a; e *= a0 * a0; }   // M3.5i: a fading (dithered) part's ink comes in with it   // far small parts would shimmer: lines thin out with distance
  float bg = step(0.9999, texture2D(tDepth, vUv).r);
#ifdef RAINFX
  // ---- M3.6 rain (weather.js): uRainP = (rain 0..1, splash density, puddles on, time)
  if (bg < 0.5 && (uRainP.x > 0.01 || uRainP.z > 0.5)) {
    float dr = texture2D(tDepth, vUv).r;
    vec4 rv = invProj * vec4(vUv * 2.0 - 1.0, dr * 2.0 - 1.0, 1.0); rv /= rv.w;
    vec3 rp = (camWorld * rv).xyz;
    float rdist = length(rp - uCamP);
    // puddles (weather.js) mark themselves in the colour alpha: 0.5 at the rim .. 0 in the middle
    float pm = col.a < 0.62 ? clamp(1.0 - col.a / 0.5, 0.0, 1.0) : 0.0;
    vec3 V = (rp - uCamP) / max(rdist, 1e-3);
    if (pm > 0.0) {
      // ripples: one drop ring per 0.45 m cell, perturbing the mirror normal
      vec3 n = vec3(0.0, 1.0, 0.0);
      float ring = 0.0;
      if (uRainP.x > 0.01) {
        vec2 q = rp.xz / 0.45; vec2 ci = floor(q - 0.5);
        for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
          vec2 cc = ci + vec2(float(i), float(j));
          float h = h12(cc + 0.37); vec2 o = cc + 0.35 + 0.3 * vec2(h12(cc + 3.1), h12(cc + 7.9));
          float ph = fract(uRainP.w * (0.6 + 0.5 * h) + h * 7.0);
          vec2 dv = q - o; float dl = length(dv);
          float rr = ph * 0.6, w = 1.0 - smoothstep(0.0, 0.07, abs(dl - rr));
          float a = w * (1.0 - ph) * step(h12(cc + 11.0), uRainP.x);
          ring += a; n.xz += (dv / max(dl, 1e-3)) * a * 0.18;
        }
        n = normalize(n);
      }
      vec3 R = reflect(V, n);
      vec3 refl = mix(uSkyA, uSkyB, smoothstep(0.0, 0.55, R.y));
#if SSR_N > 0
      // SSR-lite: march the mirrored ray through last colour / this depth (no extra pass), sky gradient when it misses
      float t = 0.35; float fnd = 0.0; vec2 huv = vec2(0.0);
      for (int k = 0; k < SSR_N; k++) {
        vec3 qp = rp + R * t; vec4 cp = uVP * vec4(qp, 1.0);
        vec2 uv = cp.xy / cp.w * 0.5 + 0.5;
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 || cp.w < 0.0) break;
        float sd = lin(texture2D(tDepth, uv).r);
        if (cp.w > sd + 0.03 && cp.w - sd < max(1.2, t * 0.5)) { fnd = 1.0; huv = uv; break; }
        t *= 1.5;
      }
      if (fnd > 0.5) {
        vec2 e2 = min(huv, 1.0 - huv);
        float ef = smoothstep(0.0, 0.08, min(e2.x, e2.y)) * (1.0 - smoothstep(18.0, 40.0, t));
        refl = mix(refl, texture2D(tColor, huv).rgb, ef);
      }
#endif
      float fres = 0.42 + 0.5 * pow(1.0 - clamp(-V.y, 0.0, 1.0), 3.0);
      // M3.6c at night the shaped light reflections (vlights.js decals, lamp pools) stay in the puddle: their bright part is
      // kept (a little stronger: still water mirrors sharper than wet asphalt), read through the ripple-bent normal
      vec3 hiL = max(texture2D(tColor, vUv + n.xz * vec2(0.03, 0.05)).rgb - 0.2, 0.0) * smoothstep(0.3, 0.8, uNightP);
      col.rgb = mix(col.rgb, refl * vec3(0.86, 0.9, 0.96), fres * pm * 0.85);
      col.rgb += hiL * fres * pm * 1.05;
      col.rgb += vec3(0.7, 0.75, 0.82) * min(ring, 1.0) * pm * (0.12 + 0.1 * (1.0 - uNightP));
    }
    // splashes on anything that faces the sky within 40 m: a thin ring + six little arcs, 0.3 s, one chance per cell
    if (uRainP.x > 0.01 && rdist < 40.0) {
      vec3 nn = normalize(cross(dFdx(rp), dFdy(rp)));
      if (abs(nn.y) > 0.86) {
        vec2 q = rp.xz / 0.8; vec2 ci = floor(q) + floor(rp.y * 1.7) * 13.0;
        float h = h12(ci + 1.7);
        float per = 0.55 + 1.1 * h12(ci + 5.3);
        float age = fract(uRainP.w / per + h) * per / 0.3;
        if (age < 1.0 && h12(ci + 9.1) < uRainP.y * uRainP.x) {
          vec2 o = floor(q) + 0.25 + 0.5 * vec2(h12(ci + 2.2), h12(ci + 4.4));
          vec2 dv = (q - o) * 0.8; float dl = length(dv);
          float rr = 0.04 + 0.16 * age;
          float a = (1.0 - smoothstep(0.0, 0.012 + 0.006 * rdist * 0.05, abs(dl - rr))) * (1.0 - age) * 0.45;
          float ang = atan(dv.y, dv.x) * 0.95493 + h * 6.0;   // 6 arcs
          float sg = abs(fract(ang) - 0.5);
          float r2 = 0.03 + 0.09 * sqrt(age);
          a = max(a, step(sg, 0.16) * (1.0 - smoothstep(0.0, 0.016, abs(dl - r2))) * (1.0 - age * age) * 0.75);
          a *= 1.0 - smoothstep(25.0, 40.0, rdist);
          vec3 sc = col.rgb * 1.25 + vec3(0.13, 0.14, 0.16) * (1.0 - 0.55 * uNightP);
          col.rgb = mix(col.rgb, sc, clamp(a, 0.0, 1.0));
        }
      }
    }
  }
#endif
  vec3 c = col.rgb * exposure;
  vec3 rawBg = col.rgb;
  // Khronos neutral tone map
  float x = min(c.r, min(c.g, c.b)); float off = x < 0.08 ? x - 6.25 * x * x : 0.04; c -= off;
  float pk = max(c.r, max(c.g, c.b));
  if (pk > 0.8) { float d = 0.2; float np = 1.0 - d * d / (pk + d - 0.8); c *= np / pk; float gg = 1.0 - 1.0 / (0.15 * (pk - np) + 1.0); c = mix(c, vec3(np), gg); }
  // ---- soft paper edge + intro (ink first, then colour), from the reconstructed world position
  float dep = texture2D(tDepth, vUv).r;
  vec4 vp = invProj * vec4(vUv * 2.0 - 1.0, dep * 2.0 - 1.0, 1.0); vp /= vp.w;
  vec3 wp = (camWorld * vp).xyz;
  float rd = length(wp.xz - uRevC.xz);
  float wob = vn2(wp.xz * 0.22) * 0.7 + vn2(wp.xz * 0.9) * 0.3;
  float rg = uRevR - uRevSoft * 1.6 - 0.25;            // geometry is cut further out; fade is complete before it
  float fade = smoothstep(rg - uFadeBand, rg, rd + (wob - 0.5) * uFadeBand * 0.9);
  float inkM = 1.0 - smoothstep(uInkR - 2.5, uInkR, rd + (wob - 0.5) * 3.0);
  float colM = 1.0 - smoothstep(uColR - 4.0, uColR, rd + (wob - 0.5) * 5.0);
  { float dd = length(wp.xz - uDrvC.xz) + (wob - 0.5) * 8.0;
    colM *= 1.0 - smoothstep(uDrvR - uDrvW, uDrvR, dd); inkM *= 1.0 - smoothstep(uDrvR + 22.0, uDrvR + 40.0, dd); }
  vec3 pap = paper;
  // watercolour: a faint pigment bloom where the wash meets the paper
  float bloom = (fade * (1.0 - fade) + colM * (1.0 - colM)) * 4.0;
  vec3 painted = mix(pap, c * (1.0 - 0.07 * bloom), colM * (1.0 - fade));
  c = mix(painted, ink, e * inkAmt * (1.0 - bg) * inkM * (1.0 - fade));
  if (bg > 0.5) c = rawBg;
  // paper grain + gentle warm grade + vignette
  vec2 gp = vUv * res / gk;   // M3.5u grain in reference px (gk = render px per desktop px) so a phone's paper is not finer/coarser
  float g = vn2(gp * 0.6) * 0.6 + vn2(gp * 0.15) * 0.4;
  c *= 1.0 - grain * (g - 0.5);
  c = mix(c, c * vec3(1.03, 1.0, 0.95), 0.6);
  vec2 q = vUv - 0.5;
  c *= 1.0 - vign * dot(q, q) * 1.4;
  c = pow(max(c, 0.0), vec3(1.0 / 2.2));
  if (dbg > 1.5) c = vec3(d0 / 40.0); else if (dbg > 0.5) c = vec3(fract(id0 * 0.1373), fract(id0 * 0.0717), fract(id0 * 0.0311)) * step(0.5, id0) + e;
  gl_FragColor = vec4(c, 1.0);
}`,Re=class{constructor(e,n,r,a={}){this.r=e,this.px=a.px??1.25;let s=()=>new c(n,r,{type:te,samples:a.samples??4});this.rtC=s(),this.rtN=new c(n,r,{samples:0,minFilter:l,magFilter:l,generateMipmaps:!1}),this.rtN.depthTexture=new de(n,r),this.rtN.depthTexture.type=ne,this.quadCam=new b(-1,1,1,-1,0,1),this.mat=new w({uniforms:{tColor:{value:this.rtC.texture},tDepth:{value:this.rtN.depthTexture},tNormal:{value:this.rtN.texture},res:{value:new t(n,r)},near:{value:.1},far:{value:1e3},ink:{value:new S(`#22150f`)},paper:{value:k},inkAmt:{value:a.ink??.92},exposure:{value:a.exposure??1},invProj:{value:new E},camWorld:{value:new E},uRevC:A.uRevC,uRevR:A.uRevR,uRevSoft:A.uRevSoft,uFadeBand:A.uFadeBand,uInkR:A.uInkR,uColR:A.uColR,uDrvC:A.uDrvC,uDrvR:A.uDrvR,uDrvW:A.uDrvW,uRainP:{value:new o},uVP:{value:new E},uCamP:{value:new T},uSkyA:{value:new S(`#9aa3b4`)},uSkyB:{value:new S(`#c9cfd8`)},uNightP:A.uNight,grain:{value:a.grain??.05},vign:{value:a.vign??.12},time:{value:0},px:{value:this.px},gk:{value:a.gk??1},dbg:{value:typeof location<`u`&&location.search.includes(`inkdbg`)?location.search.includes(`inkdbg2`)?2:1:0}},vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,fragmentShader:Le,depthWrite:!1,depthTest:!1,defines:a.rain?{RAINFX:1,SSR_N:a.ssr??10}:{}}),this.mat.toneMapped=!1,this.quad=new i(new ee(2,2),this.mat),this.qScene=new re,this.qScene.add(this.quad)}setSize(e,t){this.rtC.setSize(e,t),this.rtN.setSize(e,t),this.mat.uniforms.res.value.set(e,t)}render(e,t,n=null){let r=this.r;if(this.mat.uniforms.near.value=t.near,this.mat.uniforms.far.value=t.far,t.updateMatrixWorld(),this.mat.uniforms.invProj.value.copy(t.projectionMatrixInverse),this.mat.uniforms.camWorld.value.copy(t.matrixWorld),this.mat.defines.RAINFX){let e=this.mat.uniforms;e.uVP.value.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),e.uCamP.value.setFromMatrixPosition(t.matrixWorld)}r.setRenderTarget(this.rtC),r.render(e,t);let i=e.overrideMaterial,a=e.background,o=e.fog;e.overrideMaterial=this.idMat||G,e.background=null,e.fog=null;let s=this._hid||=[];s.length=0;for(let e of this.hide||[])e.visible&&=(s.push(e),!1);let c=r.getClearColor(this._cc||=new S),l=r.getClearAlpha();r.setClearColor(0,1);let u=r.shadowMap.autoUpdate;r.shadowMap.autoUpdate=!1,r.setRenderTarget(this.rtN),r.render(e,t),r.shadowMap.autoUpdate=u,r.setClearColor(c,l),e.overrideMaterial=i,e.background=a,e.fog=o;for(let e of s)e.visible=!0;r.setRenderTarget(n),r.render(this.qScene,this.quadCam)}},K=new T;function q(e,t,n,r,i,a){let o=2*Math.PI*i/4,s=Math.max(a-2*i,0),c=Math.PI/4;K.copy(t),K[r]=0,K.normalize();let l=.5*o/(o+s),u=1-K.angleTo(e)/c;return Math.sign(K[n])===1?u*l:s/(o+s)+l+l*(1-u)}var ze=class e extends O{constructor(e=1,t=1,n=1,r=2,i=.1){let a=r*2+1;if(i=Math.min(e/2,t/2,n/2,i),super(1,1,1,a,a,a),this.type=`RoundedBoxGeometry`,this.parameters={width:e,height:t,depth:n,segments:r,radius:i},a===1)return;let o=this.toNonIndexed();this.index=null,this.attributes.position=o.attributes.position,this.attributes.normal=o.attributes.normal,this.attributes.uv=o.attributes.uv;let s=new T,c=new T,l=new T(e,t,n).divideScalar(2).subScalar(i),u=this.attributes.position.array,d=this.attributes.normal.array,f=this.attributes.uv.array,p=u.length/6,m=new T,h=.5/a;for(let r=0,a=0;r<u.length;r+=3,a+=2)switch(s.fromArray(u,r),c.copy(s),c.x-=Math.sign(c.x)*h,c.y-=Math.sign(c.y)*h,c.z-=Math.sign(c.z)*h,c.normalize(),u[r+0]=l.x*Math.sign(s.x)+c.x*i,u[r+1]=l.y*Math.sign(s.y)+c.y*i,u[r+2]=l.z*Math.sign(s.z)+c.z*i,d[r+0]=c.x,d[r+1]=c.y,d[r+2]=c.z,Math.floor(r/p)){case 0:m.set(1,0,0),f[a+0]=q(m,c,`z`,`y`,i,n),f[a+1]=1-q(m,c,`y`,`z`,i,t);break;case 1:m.set(-1,0,0),f[a+0]=1-q(m,c,`z`,`y`,i,n),f[a+1]=1-q(m,c,`y`,`z`,i,t);break;case 2:m.set(0,1,0),f[a+0]=1-q(m,c,`x`,`z`,i,e),f[a+1]=q(m,c,`z`,`x`,i,n);break;case 3:m.set(0,-1,0),f[a+0]=1-q(m,c,`x`,`z`,i,e),f[a+1]=1-q(m,c,`z`,`x`,i,n);break;case 4:m.set(0,0,1),f[a+0]=1-q(m,c,`x`,`y`,i,e),f[a+1]=1-q(m,c,`y`,`x`,i,t);break;case 5:m.set(0,0,-1),f[a+0]=q(m,c,`x`,`y`,i,e),f[a+1]=1-q(m,c,`y`,`x`,i,t)}}static fromJSON(t){return new e(t.width,t.height,t.depth,t.segments,t.radius)}};function Be(e,t=!1){let n=e[0].index!==null,r=new Set(Object.keys(e[0].attributes)),i=new Set(Object.keys(e[0].morphAttributes)),a={},o={},s=e[0].morphTargetsRelative,c=new x,l=0;for(let u=0;u<e.length;++u){let d=e[u],f=0;if(n!==(d.index!==null))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.`),null;for(let e in d.attributes){if(!r.has(e))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure "`+e+`" attribute exists among all geometries, or in none of them.`),null;a[e]===void 0&&(a[e]=[]),a[e].push(d.attributes[e]),f++}if(f!==r.size)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. Make sure all geometries have the same number of attributes.`),null;if(s!==d.morphTargetsRelative)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. .morphTargetsRelative must be consistent throughout all geometries.`),null;for(let e in d.morphAttributes){if(!i.has(e))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`.  .morphAttributes must be consistent throughout all geometries.`),null;o[e]===void 0&&(o[e]=[]),o[e].push(d.morphAttributes[e])}if(t){let e;if(n)e=d.index.count;else if(d.attributes.position!==void 0)e=d.attributes.position.count;else return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. The geometry must have either an index or a position attribute`),null;c.addGroup(l,e,u),l+=e}}if(n){let t=0,n=[];for(let r=0;r<e.length;++r){let i=e[r].index;for(let e=0;e<i.count;++e)n.push(i.getX(e)+t);t+=e[r].attributes.position.count}c.setIndex(n)}for(let e in a){let t=Ve(a[e]);if(!t)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` attribute.`),null;c.setAttribute(e,t)}for(let e in o){let t=o[e][0].length;if(t!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[e]=[];for(let n=0;n<t;++n){let t=[];for(let r=0;r<o[e].length;++r)t.push(o[e][r][n]);let r=Ve(t);if(!r)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` morphAttribute.`),null;c.morphAttributes[e].push(r)}}}return c}function Ve(e){let t,n,r,i=-1,a=0;for(let o=0;o<e.length;++o){let s=e[o];if(t===void 0&&(t=s.array.constructor),t!==s.array.constructor)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.`),null;if(n===void 0&&(n=s.itemSize),n!==s.itemSize)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.`),null;if(r===void 0&&(r=s.normalized),r!==s.normalized)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.`),null;if(i===-1&&(i=s.gpuType),i!==s.gpuType)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.`),null;a+=s.count*n}let o=new t(a),s=new v(o,n,r),c=0;for(let t=0;t<e.length;++t){let r=e[t];if(r.isInterleavedBufferAttribute){let e=c/n;for(let t=0,i=r.count;t<i;t++)for(let i=0;i<n;i++){let n=r.getComponent(t,i);s.setComponent(t+e,i,n)}}else o.set(r.array,c);c+=r.count*n}return i!==void 0&&(s.gpuType=i),s}function He(e,t=1e-4){t=Math.max(t,2**-52);let n={},r=e.getIndex(),i=e.getAttribute(`position`),a=r?r.count:i.count,o=0,s=Object.keys(e.attributes),c={},l={},u=[],d=[`getX`,`getY`,`getZ`,`getW`],f=[`setX`,`setY`,`setZ`,`setW`];for(let t=0,n=s.length;t<n;t++){let n=s[t],r=e.attributes[n];c[n]=new r.constructor(new r.array.constructor(r.count*r.itemSize),r.itemSize,r.normalized);let i=e.morphAttributes[n];i&&(l[n]||(l[n]=[]),i.forEach((e,t)=>{let r=new e.array.constructor(e.count*e.itemSize);l[n][t]=new e.constructor(r,e.itemSize,e.normalized)}))}let p=t*.5,m=10**Math.log10(1/t),h=p*m;for(let t=0;t<a;t++){let i=r?r.getX(t):t,a=``;for(let t=0,n=s.length;t<n;t++){let n=s[t],r=e.getAttribute(n),o=r.itemSize;for(let e=0;e<o;e++)a+=`${Math.trunc(r[d[e]](i)*m+h)},`}if(a in n)u.push(n[a]);else{for(let t=0,n=s.length;t<n;t++){let n=s[t],r=e.getAttribute(n),a=e.morphAttributes[n],u=r.itemSize,p=c[n],m=l[n];for(let e=0;e<u;e++){let t=d[e],n=f[e];if(p[n](o,r[t](i)),a)for(let e=0,r=a.length;e<r;e++)m[e][n](o,a[e][t](i))}}n[a]=o,u.push(o),o++}}let g=e.clone();for(let t in e.attributes){let e=c[t];if(g.setAttribute(t,new e.constructor(e.array.slice(0,o*e.itemSize),e.itemSize,e.normalized)),t in l)for(let e=0;e<l[t].length;e++){let n=l[t][e];g.morphAttributes[t][e]=new n.constructor(n.array.slice(0,o*n.itemSize),n.itemSize,n.normalized)}}return g.setIndex(u),g}function Ue(e,t=Math.PI/3){let n=e.index?e.toNonIndexed():e,r=n.attributes.position,i=r.count,a;if(r.isBufferAttribute===!0&&r.itemSize===3&&r.normalized===!1)a=r.array;else{a=new Float64Array(i*3);for(let e=0;e<i;e++)a[3*e+0]=r.getX(e),a[3*e+1]=r.getY(e),a[3*e+2]=r.getZ(e)}let o=Math.cos(t),s=(1+1e-10)*100,c=i/3,l=new Float64Array(c*3);for(let e=0;e<c;e++){let t=9*e,n=a[t+0],r=a[t+1],i=a[t+2],o=a[t+3],s=a[t+4],c=a[t+5],u=a[t+6],d=a[t+7],f=a[t+8],p=u-o,m=d-s,h=f-c,g=n-o,_=r-s,v=i-c,y=m*v-h*_,b=h*g-p*v,x=p*_-m*g,S=1/(Math.sqrt(y*y+b*b+x*x)||1);l[3*e+0]=y*S,l[3*e+1]=b*S,l[3*e+2]=x*S}let u=new Int32Array(i),d=new Float64Array(i*3),f=1;for(;f<i*2;)f<<=1;let p=f-1,m=new Int32Array(f),h=0;for(let e=0;e<i;e++){let t=3*e,n=Math.trunc(a[t+0]*s),r=Math.trunc(a[t+1]*s),i=Math.trunc(a[t+2]*s),o=(Math.imul(n,73856093)^Math.imul(r,19349663)^Math.imul(i,83492791))&p;for(;;){let t=m[o];if(t===0){let t=3*h;d[t+0]=n,d[t+1]=r,d[t+2]=i,m[o]=h+1,u[e]=h++;break}let a=3*(t-1);if(d[a+0]===n&&d[a+1]===r&&d[a+2]===i){u[e]=t-1;break}o=o+1&p}}let g=new Int32Array(h+1);for(let e=0;e<i;e++)g[u[e]+1]++;for(let e=0;e<h;e++)g[e+1]+=g[e];let _=new Int32Array(i),y=g.slice(0,h);for(let e=0;e<c;e++){let t=3*e;_[y[u[t+0]]++]=e,_[y[u[t+1]]++]=e,_[y[u[t+2]]++]=e}let b=new Float32Array(i*3);for(let e=0;e<c;e++){let t=3*e,n=l[t+0],r=l[t+1],i=l[t+2];for(let e=0;e<3;e++){let a=t+e,s=u[a],c=0,d=0,f=0;for(let e=g[s],t=g[s+1];e<t;e++){let t=3*_[e],a=l[t+0],s=l[t+1],u=l[t+2];n*a+r*s+i*u>o&&(c+=a,d+=s,f+=u)}let p=1/(Math.sqrt(c*c+d*d+f*f)||1);b[3*a+0]=c*p,b[3*a+1]=d*p,b[3*a+2]=f*p}}return n.setAttribute(`normal`,new v(b,3,!1)),n}new E;var We=new oe,Ge=new ue;new T,new T;function Ke(e=0,t=0,n=0,r=0,i=0,a=0,o=1,s=1,c=1){return Ge.set(i,r,a,`YXZ`),We.setFromEuler(Ge),new E().compose(new T(e,t,n),We.clone(),new T(o,s,c))}var qe=e=>e instanceof S?e:new S(e),J=1;function Je(e){let t=J;return J=(J+e)%16e6,t}var Ye=new Set([`leaf`,`grass`]),Y=new Map,X=new Map,Z=new E,Xe=new a;function Q(e,t){return Y.has(e)||Y.set(e,t()),Y.get(e)}function $(e){e.index&&(e=e.toNonIndexed());for(let t of Object.keys(e.attributes))t!==`position`&&t!==`normal`&&t!==`inkId`&&e.deleteAttribute(t);return e.attributes.normal||e.computeVertexNormals(),e}var Ze=class n{static lite=!1;static mid=!1;static farSkip=!1;constructor(){this.parts={},this.stack=[new E],this.inkPart=0,this.inkSoft=0,this.anc=null,this.inkBase=J,J=(J+1024)%16e6}part(e){return this.inkPart?(e(this),this):(this.inkPart=J,J=(J+1)%16e6,e(this),this.inkPart=0,this)}soft(e){return this.inkSoft++,e(this),this.inkSoft--,this}get top(){return this.stack[this.stack.length-1]}push(e){return this.stack.push(this.top.clone().multiply(e)),this}pop(){return this.stack.pop(),this}with(e,t){let n=this.stack.length===1&&!this.anc;if(n&&(this.anc=new T().setFromMatrixPosition(this.top.clone().multiply(e)),this.ancGeos=[],this.ancLeaf=0,this.ancAll=0),this.push(e),t(this),this.pop(),n){if(this.ancLeaf>this.ancAll*.4)for(let e of this.ancGeos){let t=e.attributes.anc.array;for(let e=3;e<t.length;e+=4)t[e]=2}this.anc=null,this.ancGeos=null}return this}add(e,t,n,r,i=.02){if(Z.multiplyMatrices(this.top,t),this.farSkip){if(n===`leaf`)return this;e.boundingBox||e.computeBoundingBox();let t=Z.elements,r=e.boundingBox,i=(r.max.x-r.min.x)*Math.hypot(t[0],t[1],t[2]),a=(r.max.y-r.min.y)*Math.hypot(t[4],t[5],t[6]),o=(r.max.z-r.min.z)*Math.hypot(t[8],t[9],t[10]),s=Math.max(i,a,o),c=i+a+o-s-Math.min(i,a,o);if(!(s>1.6&&c>.9))return this}Xe.getNormalMatrix(Z);let a=Z.elements,o=Xe.elements,s=e.attributes.position.array,c=e.attributes.normal.array,l=e.attributes.position.count,u=new Float32Array(l*3),d=new Float32Array(l*3);for(let e=0,t=0;e<l;e++,t+=3){let e=s[t],n=s[t+1],r=s[t+2];u[t]=a[0]*e+a[4]*n+a[8]*r+a[12],u[t+1]=a[1]*e+a[5]*n+a[9]*r+a[13],u[t+2]=a[2]*e+a[6]*n+a[10]*r+a[14];let i=c[t],l=c[t+1],f=c[t+2],p=o[0]*i+o[3]*l+o[6]*f,m=o[1]*i+o[4]*l+o[7]*f,h=o[2]*i+o[5]*l+o[8]*f,g=Math.hypot(p,m,h)||1;d[t]=p/g,d[t+1]=m/g,d[t+2]=h/g}let f=new x;f.setAttribute(`position`,new v(u,3)),f.setAttribute(`normal`,new v(d,3));let p=new Float32Array(l*3),m=typeof r==`string`?X.get(r)||(X.set(r,new S(r)),X.get(r)):qe(r),h=1+(Math.random()-.5)*i*2;for(let e=0;e<l;e++)p[e*3]=m.r*h,p[e*3+1]=m.g*h,p[e*3+2]=m.b*h;f.setAttribute(`color`,new v(p,3));let g=0;!this.inkSoft&&!Ye.has(n)&&(g=this.inkPart||this.inkBase+(Math.round(m.r*255)*7+Math.round(m.g*255)*13+Math.round(m.b*255)*29)%1021+1),f.setAttribute(`inkId`,new v(new Float32Array(l).fill(g),1));let _=new Float32Array(l*4),y=this.anc;for(let e=0;e<l;e++)y?(_[e*4]=y.x,_[e*4+1]=y.y,_[e*4+2]=y.z):_[e*4+3]=1;return f.setAttribute(`anc`,new v(_,4)),y&&(this.ancGeos.push(f),this.ancAll+=l,n===`leaf`&&(this.ancLeaf+=l)),(this.parts[n]||=[]).push(f),this}box(e,t,r,i,a,o,s=.04,c=2){n.lite&&(s=0),n.mid&&(c=1,Math.min(t,r,i)<.09&&(s=0)),s>0&&`${c}`;let l;if(s>0){let e=Math.min(s,t*.49,r*.49,i*.49);l=Q(`rb${t.toFixed(3)}_${r.toFixed(3)}_${i.toFixed(3)}_${c}_${e.toFixed(3)}`,()=>$(new ze(t,r,i,c,e)))}else l=Q(`box`,()=>$(new O(1,1,1)));return this.add(l,s>0?e:e.clone().multiply(new E().makeScale(t,r,i)),a,o)}cyl(e,t,r,i,a,o,s=16,c=!1){n.mid&&(s=Math.min(s,Math.max(t,r)<.06?6:Math.max(t,r)<.25?10:14)),n.lite&&(s=Math.max(6,s>>1));let l=Q(`c${t}_${r}_${s}_${c}`,()=>$(new pe(t,r,1,s,1,c)));return this.add(l,e.clone().multiply(new E().makeScale(1,i,1)),a,o)}sphere(e,t,r,i,a=16,o=1,s=1,c=1){n.mid&&(a=Math.min(a,t*Math.max(o,s,c)<.12?6:10)),n.lite&&(a=Math.max(6,a>>1));let l=Q(`s${a}`,()=>$(new fe(1,a,Math.max(6,a*.6|0))));return this.add(l,e.clone().multiply(new E().makeScale(t*o,t*s,t*c)),r,i)}ico(e,t,r,i,a=1,o=1,c=1,l=1){n.lite&&(a=Math.min(a,1));let u=Q(`i${a}`,()=>$(new s(1,a)));return this.add(u,e.clone().multiply(new E().makeScale(t*o,t*c,t*l)),r,i)}torus(e,t,i,a,o,s=24,c=Math.PI*2){let l=n.lite?3:n.mid?4:6;n.lite&&(s=Math.max(6,s>>1)),n.mid&&(s=Math.min(s,12));let u=Q(`t${t}_${i}_${s}_${c}_${l}`,()=>$(new r(t,i,l,s,c)));return this.add(u,e,a,o)}lathe(e,r,i,a,o=24){n.mid&&(o=Math.min(o,14)),n.lite&&(o=Math.max(6,o>>1));let s=Q(`l`+r.map(e=>e.join(`,`)).join(`;`)+o,()=>$(new u(r.map(e=>new t(e[0],e[1])),o)));return this.add(s,e,i,a)}extrude(e,t,r,i,a,o=.02,s=null){let c=n.mid&&this.curveMid?this.curveMid:12,l=()=>$(new d(t,{depth:r,bevelEnabled:o>0,bevelThickness:o,bevelSize:o,bevelSegments:1,curveSegments:c})),u=s?Q(`e`+s+r+o+(c===12?``:`_c`+c),l):l();return this.add(u,e,i,a)}geo(e,t,n,r){return this.add($(t),e,n,r)}merge(e){for(let t in e.parts)(this.parts[t]||=[]).push(...e.parts[t])}build(t={}){let n=new e;for(let e in this.parts){let r=this.buildKind(e,t);r&&n.add(r)}return n}buildKind(e,t={}){let n=this.parts[e];if(!n||!n.length)return null;let r=n.length===1&&n[0].userData.own?n[0]:Be(n,!1);r.computeBoundingSphere();let a=new i(r,Ie(e,t.local));return a.castShadow=t.cast??!0,a.receiveShadow=t.receive??!0,a.customDepthMaterial=V,a.frustumCulled=t.cull??!0,a.name=e,a}};function Qe(e,t,n=0){let r=new C,i=e/2;if(r.moveTo(-i,0),r.lineTo(i,0),r.lineTo(i,t-i),r.absarc(0,t-i,i,0,Math.PI,!1),r.lineTo(-i,0),n>0){let e=new D,a=i-n;e.moveTo(-a,n),e.absarc(0,t-i,a,Math.PI,0,!0),e.lineTo(a,n),e.lineTo(-a,n),r.holes.push(e)}return r}function $e(e,t,n){let r=new C;r.moveTo(-e/2,0),r.lineTo(e/2,0),r.lineTo(e/2,t),r.lineTo(-e/2,t),r.lineTo(-e/2,0);let i=new D;return i.moveTo(-e/2+n,n),i.lineTo(-e/2+n,t-n),i.lineTo(e/2-n,t-n),i.lineTo(e/2-n,n),i.lineTo(-e/2+n,n),r.holes.push(i),r}export{Je as a,He as c,Re as d,Ie as f,B as g,V as h,Qe as i,Ue as l,A as m,qe as n,$e as o,k as p,Ke as r,Be as s,Ze as t,ze as u};