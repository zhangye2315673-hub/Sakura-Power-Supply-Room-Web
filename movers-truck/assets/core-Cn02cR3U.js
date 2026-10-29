import{a as e,n as t,o as n,r,t as i}from"./shadowfx-USz7PNBc.js";import{$r as a,Dr as o,Hn as s,Qa as c,Qr as l,Rn as u,U as d,Wi as f,Yt as p,_r as m,ar as h,bt as g,do as _,ea as v,ft as y,io as b,ir as x,jr as S,mr as ee,no as C,ro as w,sr as T,ta as E}from"./three.core-Dp-eO7LC.js";var D=new d(`#f8efe2`),O={uBendK:{value:0},uMouthA:{value:[new b,new b]},uMouthB:{value:[new b,new b]},uCoastA:{value:new b(1,0,1e6,1)},uCoastB:{value:new b(0,0,0,0)},uBendC:{value:new w},uRevC:{value:new w},uRevR:{value:9999},uRevSoft:{value:3},uPaper:{value:D.clone()},uTime:{value:0},uCutA:{value:new w},uCutB:{value:new w},uCut:{value:0},uNoCut:{value:0},uTallR:{value:99999},uKeep:{value:new w(1e5,0,1e5)},uShopP:{value:new b(0,0,0,-1)},uFadeBand:{value:5},uInkR:{value:9999},uColR:{value:9999},uDrvC:{value:new w},uDrvR:{value:1e6},uDrvW:{value:45},uFadeO:{value:1},uFarR:{value:1e6},uRing:{value:new b(0,1e9,8,0)},uNight:{value:0},uWind:{value:new b(.8,.6,.6,0)},uWindAcc:{value:new C},uSeason:{value:2},uSeasonW:{value:new b(0,0,1,0)},uSnow:{value:0},uGrassTint:{value:new w(1,1,1)},uWet:{value:0},uWetCA:{value:new b},uWetCR:{value:new b(30,0,0,0)},uRiver:{value:new C},uHL:{value:new b(0,0,0,0)},uHLD:{value:new b(0,0,1,13)},uHLC:{value:new d(`#ffd9a0`)},uRimK:{value:new b(0,0,.5,2)},uBobK:{value:1},uSeaWx:{value:new b(0,0,0,0)}};O.uBobT=O.uTime,Object.assign(O,t),i.uFarR=O.uFarR;function k(e,t,n){let r=Math.sin(e*127.1+t*311.7+n*74.7)*43758.5453;return r-Math.floor(r)}function te(e,t,n,r){let i=Math.floor(e),a=Math.floor(t),o=e-i,s=t-a,c=o*o*(3-2*o),l=s*s*(3-2*s),u=(e,t)=>k((e%r+r)%r,(t%r+r)%r,n);return(u(i,a)*(1-c)+u(i+1,a)*c)*(1-l)+(u(i,a+1)*(1-c)+u(i+1,a+1)*c)*l}function A(e,t,n,r,i=5){let a=.5,o=0,s=1;for(let c=0;c<i;c++)o+=a*te(e*s,t*s,n+c,r*s),a*=.5,s*=2;return o}function j(e,t=256){let n=new Uint8Array(t*t*4);for(let r=0;r<t;r++)for(let i=0;i<t;i++){let a=i/t,o=r/t,s=.5,c=0,l=0,u=A(a*4,o*4,1,4),d=A(a*16,o*16,7,16,3);switch(e){case`plaster`:{s=.47+(u-.5)*.22+(d-.5)*.07;let e=A(a*3,o*6,13,3);e>.66&&(s-=(e-.66)*.5);let t=A(a*6,o*6,21,6);c=t>.7?Math.min(1,(t-.7)*8):0;break}case`paint`:{s=.5+(u-.5)*.16+(d-.5)*.06;let e=A(a*5,o*5,31,5)*.75+A(a*20,o*20,33,20,2)*.25;c=e>.64?Math.min(1,(e-.64)*12):0,l=e>.62&&e<.66?.6:0;break}case`brick`:{let e=o*8,t=Math.floor(e),n=a*4+t%2*.5,r=Math.floor(n),i=n-r,u=e-t,f=i<.05||u<.1;s=f?.72:.42+k(r,t,3)*.16+(d-.5)*.1,l=f?0:i>.94||u>.9?.35:0,c=+!!f;break}case`tile`:{let e=o*8,t=Math.floor(e),n=a*6+t%2*.5,r=Math.floor(n),i=n-r-.5,c=e-t,u=Math.sqrt(i*i*1.4+(c-.15)*(c-.15));s=.4+c*.25+k(r,t,5)*.1+(d-.5)*.08,l=c<.07||u>.62?.55:0;break}case`wood`:{let e=Math.floor(a*5);s=.44+(Math.sin(o*40+A(a*5,o*2,e,5)*6)*.5+.5)*.1+k(e,0,9)*.08,l=a*5-e<.05?.6:0;break}case`stone`:{let e=a*6,t=o*6,n=Math.floor(e+Math.floor(t)%2*.5),r=Math.floor(t),i=e+r%2*.5-n,c=t-r;s=i<.04||c<.05?.38:.48+k(n,r,11)*.08+(d-.5)*.08;break}case`leaf`:s=.42+u*.25+(d-.5)*.12,c=+(A(a*8,o*8,41,8)>.62);break;case`road`:s=.5+(u-.5)*.1+(d-.5)*.1;break;case`dirt`:{let e=A(a*48,o*48,23,48,2),t=k(i,r,31),n=a*22,c=o*22,f=Math.floor(n),p=Math.floor(c);s=.5+(u-.5)*.14+(d-.5)*.12+(e-.5)*.1+(t-.5)*.05;let m=k(f,p,41),h=k(f,p,43),g=.12+k(f,p,47)*.16,_=n-f-.2-m*.6,v=c-p-.2-h*.6,y=Math.sqrt(_*_+v*v)/g;if(k(f,p,53)<.45&&y<1){let e=Math.max(0,-_-v)/g;s+=.1-.06*y+.05*e,y>.75&&(l=.25)}break}default:s=.5+(d-.5)*.06}let f=(r*t+i)*4;n[f]=Math.max(0,Math.min(255,s*255)),n[f+1]=c*255,n[f+2]=l*255,n[f+3]=255}let r=new y(n,t,t,a);return r.wrapS=r.wrapT=f,r.magFilter=u,r.minFilter=s,r.generateMipmaps=!0,r.needsUpdate=!0,r}var M={};function ne(e){return M[e]||(M[e]=j(e))}var N=`
uniform float uBendK; uniform vec3 uBendC; uniform float uZB; uniform vec4 uCoastA; uniform vec4 uCoastB;
uniform float uBobT; uniform float uBobK;
attribute vec4 anc; varying vec3 vAnc; varying float vAncOn;
varying vec3 vWorldP; varying vec3 vObjP; varying vec3 vObjN;
// curved world: drop with distance AND lean tall things outward along the surface normal (buildings follow the curve)
// M3.10 w3: offshore drop = k * (u^2 + W * (r^2 - u^2)), u = r - s (the distance the land part of the view ray covers,
// s = offshore distance): equals the land's k r^2 at the shoreline and grows monotonically along every view ray (the old
// mix(1, W, smoothstep(s)) factor dropped LESS further out -> a 'sea hill' with a hard crest); W small = flat sea to the haze
float coastS(vec2 p){ float t = -p.x * uCoastA.y + p.y * uCoastA.x;
  return p.x * uCoastA.x + p.y * uCoastA.y - (uCoastA.z + 55.0 * sin(t / 310.0 + uCoastB.x) + 22.0 * sin(t / 97.0 + uCoastB.y)); }
vec4 bendW(vec4 w){ vec2 d = w.xz - uBendC.xz; float h = w.y, r2 = dot(d, d), dr = uBendK * r2;
  if (uCoastB.z > 0.5) { float s = coastS(w.xz); if (s > 0.0) { float r = sqrt(r2), u = max(r - s, 0.0); dr = uBendK * (u * u + uCoastA.w * (r2 - u * u)); } }
  float k = r2 > 1.0 ? dr / r2 : uBendK; w.y -= dr; w.xz += d * (2.0 * k * h); return w; }
`,P=`
if (anc.w > 2.5) {
  vec3 fa = anc.xyz; vec4 fw = vec4(fa, 1.0);
  #ifdef USE_INSTANCING
    fw = instanceMatrix * fw;
  #endif
  fw = modelMatrix * fw;
  float fph = dot(fw.xz, vec2(0.37, 0.23)), fk = uBobK;
  float fbob = (0.055 * sin(uBobT * 1.15 + fph) + 0.022 * sin(uBobT * 2.3 + fph * 1.7)) * fk;
  float frl = 0.042 * sin(uBobT * 0.93 + fph * 1.3 + 1.7) * fk, fpt = 0.028 * sin(uBobT * 0.71 + fph * 0.9 + 0.6) * fk;
  vec3 fr = transformed - fa; float c1 = cos(frl), s1 = sin(frl), c2 = cos(fpt), s2 = sin(fpt);
  fr = vec3(fr.x * c1 - fr.y * s1, fr.x * s1 + fr.y * c1, fr.z);
  fr = vec3(fr.x, fr.y * c2 - fr.z * s2, fr.y * s2 + fr.z * c2);
  transformed = fa + fr; transformed.y += fbob;
}
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
  vAnc = (modelMatrix * vec4(anc.xyz, 1.0)).xyz; vAncOn = anc.w > 2.5 ? 1.0 : anc.w > 1.5 ? 2.0 : 1.0 - anc.w;   // (M3.15: w 3 = a floating object - whole, like w 0)
#endif
wP = bendW(wP);
vec4 mvPosition = viewMatrix * wP;
gl_Position = projectionMatrix * mvPosition;
gl_Position.z -= uZB * gl_Position.w;   // M3.4: per-kind depth priority (glass > trims > stone > walls): coplanar window parts no longer z-fight far away
`,I=`
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
  vec4 worldPosition = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    worldPosition = instanceMatrix * worldPosition;
  #endif
  worldPosition = modelMatrix * worldPosition;   // M3.4: shadows live in the flat world (no swim while the bend centre moves)
#endif
`,re=F.replace(`wP = bendW(wP);`,``),L=`
uniform vec4 uMouthA[2]; uniform vec4 uMouthB[2];
uniform vec3 uRevC; uniform float uRevR; uniform float uRevSoft; uniform vec3 uPaper;
uniform vec3 uCutA; uniform vec3 uCutB; uniform float uCut; uniform float uNoCut; uniform float uTallR; uniform vec3 uKeep;
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
`,R=`
{
  vec3 rp = vAncOn > 0.5 ? vAnc : vWorldP;   // whole objects in or out
  float rd = length(rp.xz - uRevC.xz);
  float nz = vn2(rp.xz * 0.35) * 0.65 + vn2(rp.xz * 1.7) * 0.35;
  float edge = uRevR - nz * uRevSoft * 1.6;
  if (rd > edge) discard;
  if (rd > uTallR + (vAncOn > 1.5 ? 7.0 : 0.0) && (vAncOn > 0.5 || vWorldP.y > 0.3) && length(rp.xz - uKeep.xz) > 3.6 && length(rp.xz - uShopP.xz) > uShopP.w) discard;
  if (uCut > 0.5 && uNoCut < 0.5) {
    // M3.4 see-through for the chase camera, no dithered (pixelated) rim any more:
    // small things (trees, lamps, signs, instanced props) standing in the sight line hide whole; buildings get a clean round cut
    vec3 ab = uCutB - uCutA; float L = length(ab); vec3 dir = ab / max(L, 1e-3);
    if (vAncOn > 1.5) {
      vec2 a2 = uCutA.xz, d2 = uCutB.xz - uCutA.xz; float L2 = max(length(d2), 1e-3); vec2 n2 = d2 / L2;
      float t2 = dot(vAnc.xz - a2, n2);
      if (t2 > 1.0 && t2 < L2 - 3.4 && length(vAnc.xz - (a2 + n2 * t2)) < 1.7) discard;
    } else {
      float t = dot(vWorldP - uCutA, dir);
      if (t > 0.0 && t < L - 3.2 && vWorldP.y > uCutB.y + 0.3) {   // M3.10: relative to the truck (1.3 in town)
        float d = length(vWorldP - (uCutA + dir * t));
        if (d < 2.8 * smoothstep(0.0, 3.0, t)) discard;
      }
    }
  }
}
`,z=`
uniform float uFadeO; uniform float uFarR; uniform vec3 uDrvC; uniform vec4 uRing;
float fadeN(){ return fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); }
float fadeD(){
  // M3.10 w2: the far-sea sheet (city.seaSetup, flat at SEA_Y - 0.6 = -7.6) never takes the streamed-town far-edge dissolve
  // in either pass (its id-pass holes read as sky: the sea beyond ~200 m turned into a grey arc behind a paper band)
  if (vWorldP.y < -7.45 && vWorldP.y > -7.75) return 1.0;
  return 1.0 - smoothstep(uFarR - 30.0, uFarR + 10.0, length(vWorldP.xz - uDrvC.xz));
}
// M3.14 试玩 #6: the instanced pools' ring (per object anchor round the truck) - the OUTER edge dithers with the inverted noise,
// so a level dissolving out at radius R and the next level dissolving in at R are exactly complementary (the old shared
// threshold left the middle of every LOD band ~50 % see-through); returns the kept fraction (0 = discard this pixel)
float ringK(float fn){
  if (uRing.w < 0.5) return 1.0;
  float r = length(vAnc.xz - uDrvC.xz), fi = smoothstep(uRing.x - uRing.z, uRing.x, r), fo = 1.0 - smoothstep(uRing.y - uRing.z, uRing.y, r);
  return (fn < fi && 1.0 - fn <= fo) ? max(fi * fo, 1e-3) : 0.0;
}
`,ie=`
if (uFadeO < 0.999 || uFarR < 1e5 || uRing.w > 0.5) {
  float fn = fadeN(), fd = fadeD();
  if (ringK(fn) <= 0.0) discard;
  if (uFadeO >= 1.5) { if (fn >= min(uFadeO - 2.0, fd)) discard; }
  else if (uFadeO >= 0.0) { if (fn >= uFadeO * fd) discard; }
  else if (fn < -uFadeO || fn >= fd) discard;
}
`,ae=`
float fA = 1.0;
if (uFadeO < 0.999 || uFarR < 1e5 || uRing.w > 0.5) {
  float fn = fadeN(), fd = fadeD(), rk = ringK(fn);
  if (rk <= 0.0) discard;
  if (uFadeO >= 1.5) { if (uFadeO < 2.5 || fn >= fd) discard; fA = fd; }
  else if (uFadeO >= 0.0) { fA = uFadeO * fd; if (fn >= fA) discard; }
  else { if (-uFadeO >= 0.5 || fn >= fd) discard; fA = fd; }
  fA *= rk;
}
`,oe=`
{
  vec3 tp = mix(vObjP, vWorldP, uWorldTex);
  vec4 dt = triDet(tp, normalize(vObjN));
  diffuseColor.rgb *= (0.55 + dt.r * 0.9);
  diffuseColor.rgb = mix(diffuseColor.rgb, uChip, dt.g * uChipAmt);
  diffuseColor.rgb *= (1.0 - dt.b * 0.45);
}
`,se=`
#include <begin_vertex>
`+P+`
vObjP = position; vObjN = normal;
#ifdef USE_INSTANCING
  vObjP = (instanceMatrix * vec4(position, 1.0)).xyz;
#endif
`,ce=`
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
`,B=`
{
  float bl = vn2(vWorldP.xz * 0.45 + vWorldP.y * 0.3) * 0.65 + vn2(vWorldP.xz * 1.6 - vWorldP.y) * 0.35;
  diffuseColor.rgb *= mix(vec3(0.86, 0.95, 1.04), vec3(1.12, 1.06, 0.82), bl);
  diffuseColor.rgb *= mix(0.86, 1.1, clamp(vObjP.y * 0.25 - 0.3, 0.0, 1.0));
  float rim = 1.0 - abs(dot(normal, normalize(vViewPosition)));
  diffuseColor.rgb = mix(diffuseColor.rgb, uPaper * 0.55 + diffuseColor.rgb * 0.55, smoothstep(0.35, 1.0, rim) * 0.6);
}
`,V=`
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
`,H=`
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
`,U=`
{
  vec2 p = vWorldP.xz; float t = uTime;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.80, 0.71, 0.58), uRiver.x * 0.45);   // M3.9 milk-tea after a storm
  float w1 = vn2(p * 0.22 + vec2(t * 0.12, t * 0.05)), w2 = vn2(p * 0.7 - vec2(t * 0.22, -t * 0.09));
  diffuseColor.rgb *= mix(0.88, 1.1, w1 * 0.6 + w2 * 0.4);
  float st = vn2(vec2(p.x * 0.9 + t * 0.35, p.y * 0.9 - t * 0.2)) * 0.6 + vn2(p * 2.3 + t * 0.5) * 0.4;
  float ring = abs(fract(st * 3.0) - 0.5);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.98, 0.97), (1.0 - smoothstep(0.03, 0.08, ring)) * 0.32);
  vec2 c = floor(p * 2.0); float h = fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
  float gl = step(0.965, h) * (0.5 + 0.5 * sin(t * 3.0 + h * 40.0)) * (1.0 - smoothstep(0.05, 0.16, length(fract(p * 2.0) - 0.5)));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.99, 0.92), gl * 0.85);
}
`,W=(()=>{let e=typeof location<`u`?new URLSearchParams(location.search).get(`wave`):null;return e===null?2:Math.max(0,Math.min(4,Math.round(+e)||0))})(),G={uWaveV:{value:W}},le=`
uniform float uWaveV; uniform vec4 uCoastA; uniform vec4 uCoastB; uniform vec4 uSeaWx;
float wvH(vec2 c){ return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 seaWave(vec3 col, vec2 p, float y, float t, float v){
  vec2 u = uCoastB.z > 0.5 ? normalize(uCoastA.xy) : vec2(0.6, 0.8);   // offshore (the swells roll in against it)
  vec2 w = vec2(-u.y, u.x);
  float across = dot(p, u), along = dot(p, w);
  float dC = length(p - cameraPosition.xz);
  float rise = clamp(y + 7.0, 0.0, 5.0);                                // 0 on the open sea, > 0 in the shore row
  float foamV = step(0.86, min(col.r, min(col.g, col.b)));               // foam rings / ribbons (near-white) keep their look
  col *= mix(0.97, 1.03, vn2(p * 0.016 + vec2(t * 0.004, -t * 0.003)));  // a big soft colour drift (50-80 m), very low contrast
  if (v < 2.5) {
    // two long swells, crests warped so they are never ruler-straight; faded where they would alias and with distance
    float warp = vn2(p * 0.012 + vec2(t * 0.006, 0.0)) * 7.0;
    float ph1 = across * 0.2856 + t * 0.5 + warp;
    float ph2 = dot(p, normalize(u * 0.9 + w * 0.42)) * 0.4488 + t * 0.62 + warp * 0.6 + 1.7;
    float a1 = 1.0 - smoothstep(0.45, 1.3, fwidth(ph1)), a2 = 1.0 - smoothstep(0.45, 1.3, fwidth(ph2));
    float sw = (0.62 * sin(ph1) * a1 + 0.38 * sin(ph2) * a2) * (1.0 - smoothstep(90.0, 320.0, dC));
    col = col * (1.0 + 0.045 * sw) + vec3(0.004, 0.012, 0.01) * max(sw, 0.0);
    // very sparse foam: short broken streaks on a few crests of the long swell, within ~150 m
    float crest = smoothstep(0.9, 0.985, sin(ph1)) * a1;
    float pat = smoothstep(0.7, 0.82, vn2(vec2(along * 0.06, across * 0.02) + vec2(t * 0.02, 1.3))) * smoothstep(0.3, 0.6, vn2(vec2(along * 0.8, across * 0.4) - t * 0.15));
    col = mix(col, vec3(0.94, 0.97, 0.95), crest * pat * (1.0 - smoothstep(60.0, 150.0, dC)) * 0.6 * (1.0 - foamV));
    if (v > 1.5) {
      // white-wash in the shore row + three lines lapping in up the slope
      float n = vn2(p * 0.35 + vec2(t * 0.2, -t * 0.13));
      float wash = smoothstep(0.08 + 0.25 * n, 0.55 + 0.35 * n, rise);
      float lp = rise * 2.2 - t * 0.35 + vn2(p * 0.2) * 0.8;
      float lap = (1.0 - smoothstep(0.05, 0.1 + fwidth(lp), abs(fract(lp) - 0.5))) * smoothstep(0.02, 0.15, rise);
      col = mix(col, vec3(0.95, 0.98, 0.97), max(wash * 0.78, lap * 0.45));
      // a few slow sparkles near the truck (one 4 m cell in ~70, each twinkling every few seconds)
      vec2 q = p / 4.0, ci = floor(q); float hh = wvH(ci);
      vec2 o = 0.2 + 0.6 * vec2(fract(hh * 7.13), fract(hh * 3.71));
      float tw = max(sin(t * (0.6 + hh * 0.5) + hh * 40.0), 0.0); tw = tw * tw * tw;
      float dd = length(fract(q) - o) * 4.0, r0 = 0.1 + 0.06 * fract(hh * 5.3);
      float sp = step(0.986, hh) * tw * (1.0 - smoothstep(r0 * 0.35, r0 + fwidth(dd), dd)) * (1.0 - smoothstep(35.0, 75.0, dC));
      col = mix(col, vec3(1.0, 0.99, 0.93), sp * 0.85);
    }
  } else {
    // painterly: calm gradient, pale shallows at the shore, sparse '~' strokes (one candidate per 9 x 6 m cell, ~40 % drawn),
    // each fading in / out over 8 s while it drifts in
    col *= mix(0.975, 1.03, vn2(p * 0.01 + vec2(t * 0.003, 0.0)));
    col = mix(col, col * 1.05 + vec3(0.03, 0.03, 0.02), smoothstep(0.0, 1.2, rise) * 0.8);
    vec2 sq = vec2(along / 9.0, (across + t * 0.22) / 6.0), ci = floor(sq), lc = (sq - ci) * vec2(9.0, 6.0);
    float h = wvH(ci + 3.1), h2 = fract(h * 13.7), h3 = fract(h * 71.3);
    float L = 2.0 + 1.6 * h2;
    vec2 lq = lc - vec2(2.2 + 4.6 * h2, 1.8 + 2.4 * h3);
    float ul = lq.x / L, yc = 0.17 * sin(ul * 9.4248), th = 0.075 * (1.0 - 4.0 * ul * ul), fw = fwidth(lq.y), inS = step(abs(ul), 0.5);
    float m = inS * (1.0 - smoothstep(th, th + fw, abs(lq.y - yc)));
    float und = inS * (1.0 - smoothstep(th * 0.8, th * 0.8 + fw, abs(lq.y - yc + th * 2.4)));
    float k = step(0.6, h) * sin(3.14159 * fract(t / 8.0 + h3)) * (1.0 - smoothstep(55.0, 140.0, dC)) * smoothstep(0.6, 1.4, 0.075 / max(fw, 1e-4)) * (1.0 - foamV);
    col = mix(col, col * 0.9, und * max(k, 0.0) * 0.55);
    col = mix(col, vec3(0.97, 0.95, 0.87), m * max(k, 0.0) * 0.85);
  }
  return col;
}
// the swell: two long crest lines running roughly along the shore (the second one a little off-axis and slower), so the
// white water forms long broken streaks instead of a lattice of rings. Returns the surface height 0..1 and its slope.
// M3.15 r3 (Qea 10-29: 海边分层还是偏横线，要随机的弯曲分层): the swell no longer runs along one straight direction. Its "across"
// coordinate is the signed distance to the REAL coastline (the same 310 m / 97 m wiggles the terrain uses), sampled at a position
// that is domain-warped twice (a 55 m and an 18 m warp), so the bands bend with the bays and meander on their own; a second,
// cross swell 38 deg off adds interference, and a slow patch noise makes the bands strong in some places and faint in others.
float wvCoast(vec2 p){ float t = -p.x * uCoastA.y + p.y * uCoastA.x;
  return p.x * uCoastA.x + p.y * uCoastA.y - (uCoastA.z + 55.0 * sin(t / 310.0 + uCoastB.x) + 22.0 * sin(t / 97.0 + uCoastB.y)); }
float wvH(vec2 p, vec2 u, vec2 w, float t, vec4 ph, out vec2 slope){
  float k1 = 6.2831853 / ph.x, k2 = 6.2831853 / ph.y;
  // two-scale domain warp (metres): big lazy bends + smaller kinks, both drifting very slowly
  vec2 q = p + (vec2(vn2(p * 0.018 + vec2(3.1, t * 0.002)), vn2(p * 0.018 + vec2(9.7, -t * 0.002))) - 0.5) * 34.0
             + (vec2(vn2(p * 0.056 + 1.7), vn2(p * 0.056 + 6.3)) - 0.5) * 10.0;
  float across = uCoastB.z > 0.5 ? wvCoast(q) : dot(q, u);
  vec2 d2 = normalize(u * 0.79 + w * 0.62);                               // the cross swell, ~38 deg off
  float a1 = ph.z, a2 = ph.z * 0.55;
  float p1 = across * k1 + t * ph.w;
  float p2 = dot(q, d2) * k2 + t * ph.w * 0.74 + 1.7 + vn2(q * 0.03) * 1.8;
  slope = u * (cos(p1) * a1 * k1) + d2 * (cos(p2) * a2 * k2);
  float bandK = 0.55 + 0.45 * smoothstep(0.25, 0.75, vn2(p * 0.009 + vec2(7.3, 1.1)));   // strong here, faint there ('patch' is a GLSL reserved word)
  return (sin(p1) * 0.7 + sin(p2) * 0.3) * bandK;
}
// (uSeaWx - the sea's weather - is declared by wx/seawx.js installSeaWx(), which owns that uniform on the sea material)
vec3 seaWave4(vec3 col, vec2 p, float y, float t, float v){
  // M3.15 r2 (Qea 10-28/29: 海面像白色长条、没有立体感; r1 read flat from the chase camera): painted three-tone swells
  vec2 u = uCoastB.z > 0.5 ? normalize(uCoastA.xy) : vec2(0.6, 0.8);   // offshore
  vec2 w = vec2(-u.y, u.x);
  float dC = length(p - cameraPosition.xz);
  float rise = clamp(y + 7.0, 0.0, 5.0);                                // 0 open sea, > 0 in the shore row
  float storm = clamp(uSeaWx.x, 0.0, 1.0);
  float foamV = step(0.86, min(col.r, min(col.g, col.b)));
  // longer + taller waves in a storm, the PERIOD grows (11 s -> 17 s): the sea gets heavier, not faster
  vec4 ph = vec4(26.0 + 30.0 * storm, 41.0 + 36.0 * storm, 1.0, 0.55 / (1.0 + 0.45 * storm));
  vec2 slope; float h = wvH(p, u, w, t, ph, slope);                      // -1 trough .. 1 crest
  // the banding fades where one wave would cover too few pixels (no aliasing) and far out (calm gradient to the horizon)
  float aa = 1.0 - smoothstep(0.35, 0.9, fwidth(h) * 3.0);
  float kB = aa * (1.0 - smoothstep(200.0, 460.0, dC)) * (1.0 - 0.45 * rise / 5.0);
  col *= mix(0.975, 1.025, vn2(p * 0.016 + vec2(t * 0.004, -t * 0.003)));
  // VOLUME: three tones - a deeper teal trough, the body, a lighter crest - with soft but distinct edges (a painted band, not a
  // gradient), and the face of the swell turned to the camera a step lighter than the back
  vec3 deep = col * vec3(0.80, 0.875, 0.905);
  vec3 lite = col * vec3(1.075, 1.065, 1.035) + vec3(0.012, 0.018, 0.016);
  float bT = smoothstep(-0.18, -0.46, h), bC = smoothstep(0.28, 0.5, h);
  vec3 c2 = mix(col, deep, bT * (0.85 + 0.15 * storm));
  c2 = mix(c2, lite, bC * 0.9);
  vec2 toCam = normalize(cameraPosition.xz - p + 1e-3);
  c2 *= mix(0.965, 1.035, smoothstep(-0.5, 0.5, dot(slope, toCam) * 1.6));
  col = mix(col, c2, kB);
  // WHITE CAPS: only on the crest, cut into separate short caps (3-8 m) by a cell noise that runs coarse along the crest and fine
  // across it, so they read as caps riding the swell - never a line across the sea. Few in calm weather, big and many in a storm.
  vec2 cq = vec2(dot(p, w), dot(p, u));
  float crest = smoothstep(0.62 - 0.14 * storm, 0.9, h);
  float cn = vn2(vec2(cq.x * mix(0.17, 0.09, storm), cq.y * 0.33) + vec2(t * 0.035, 0.0));
  float cut = smoothstep(0.60 - 0.30 * storm, 0.70 - 0.26 * storm, cn);
  float kF = aa * (1.0 - smoothstep(110.0, 260.0, dC)) * (1.0 - foamV);
  float cap = crest * cut * kF;
  col = mix(col, col * vec3(0.86, 0.9, 0.93), smoothstep(0.0, 0.35, crest * cut) * (1.0 - smoothstep(0.35, 0.7, crest * cut)) * 0.35 * kF);   // a soft shadow under the cap
  col = mix(col, vec3(0.965, 0.98, 0.972), smoothstep(0.25, 0.55, cap) * (0.85 + 0.1 * storm));
  // sun glints: a few slow twinkles near the truck (one 4 m cell in ~60), stronger on the crests, none in a storm
  vec2 gq = p / 4.0, gi = floor(gq); float hh = wvH(gi + 9.1);
  vec2 go = 0.2 + 0.6 * vec2(fract(hh * 7.13), fract(hh * 3.71));
  float tw = max(sin(t * (0.7 + hh * 0.6) + hh * 40.0), 0.0); tw = tw * tw * tw;
  float gd = length(fract(gq) - go) * 4.0, gr = 0.09 + 0.06 * fract(hh * 5.3);
  float gl = step(0.983, hh) * tw * (1.0 - smoothstep(gr * 0.35, gr + fwidth(gd), gd)) * (1.0 - smoothstep(35.0, 80.0, dC)) * (1.0 - storm);
  col = mix(col, vec3(1.0, 0.99, 0.94), gl * 0.85 * (0.6 + 0.4 * bC));
  // the shore: a wash up the slope + two lapping lines (fwidth-safe), a touch stronger in a storm
  if (v > 2.5) {
    float n = vn2(p * 0.35 + vec2(t * 0.18, -t * 0.12));
    float wash = smoothstep(0.08 + 0.25 * n, 0.55 + 0.35 * n, rise);
    float lp = rise * 2.2 - t * (0.30 / (1.0 + 0.5 * storm)) + vn2(p * 0.2) * 0.8;
    float fwl = max(fwidth(lp), 1e-4);
    float lap = (1.0 - smoothstep(0.05, 0.05 + fwl * 1.5, abs(fract(lp) - 0.5))) * smoothstep(0.02, 0.15, rise);
    col = mix(col, vec3(0.95, 0.98, 0.97), max(wash * (0.72 + 0.18 * storm), lap * 0.45));
  }
  return col;
}
`,ue=`
if (uWaveV > 3.5 && vWorldP.y < -2.45) {
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.80, 0.71, 0.58), uRiver.x * 0.45);
  diffuseColor.rgb = seaWave4(diffuseColor.rgb, vWorldP.xz, vWorldP.y, uTime, 3.0);
} else if (uWaveV > 0.5 && vWorldP.y < -2.45) {
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.80, 0.71, 0.58), uRiver.x * 0.45);
  diffuseColor.rgb = seaWave(diffuseColor.rgb, vWorldP.xz, vWorldP.y, uTime, uWaveV);
} else
`+U,de=`
uniform vec4 uSeasonW; uniform float uSnow; uniform vec3 uGrassTint; uniform float uSnowK;
uniform float uWet; uniform vec4 uHL; uniform vec4 uHLD; uniform vec3 uHLC;
uniform vec4 uWetCA; uniform vec4 uWetCR; uniform vec2 uRiver;
`,fe=`
{
  float sfW = clamp(uSeasonW.w, 0.0, 1.0);                                  // winter weight
  vec3 fc = diffuseColor.rgb;
  vec3 fl = dot(fc, vec3(0.3, 0.59, 0.11));
  vec3 sum = mix(fc, fc * vec3(1.04, 0.99, 0.9), 0.5);
  vec3 aut = mix(fc, vec3(0.86, 0.62, 0.30) * (0.35 + 1.1 * fl), 0.62 * clamp(uSeasonW.z, 0.0, 1.0));
  fc = mix(fc, sum, clamp(uSeasonW.y, 0.0, 1.0) * 0.35);
  fc = mix(fc, aut, clamp(uSeasonW.z, 0.0, 1.0) * 0.7);
  fc = mix(fc, vec3(0.56, 0.52, 0.40) * (0.4 + 1.0 * fl), sfW * 0.85);      // frosted / withered
  diffuseColor.rgb = fc;
  // winter: almost all heads go (the stem / leaves stay) - the petals are dropped face by face on a per-object hash, so what
  // is left reads as a few dry withered heads instead of a bed of pink dots on the snow
  float sfH = smoothstep(0.03, 0.2, length(vObjP.xz)) * sfW;
  if (sfH > 0.5 && h12(floor(vObjP.xz * 7.0) + floor(vObjP.y * 9.0) * 2.7) < 0.86) discard;
}
`,pe=`
float wetK = 0.0;
// M3.9: a local cell wets only the swath it rained on; as the road dries it dries in patches (sunny bits first)
float wetA = uWet;
if (uWetCR.y > 0.001) { vec2 pa = vWorldP.xz - uWetCA.xy, ba = uWetCA.zw - uWetCA.xy; float hh = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  wetA = max(wetA, uWetCR.y * (1.0 - smoothstep(uWetCR.x - 8.0, uWetCR.x, length(pa - ba * hh)))); }
if (wetA > 0.001 && wetA < 0.999) wetA = clamp((wetA - 0.35 * vn2(vWorldP.xz * 0.21)) / 0.65, 0.0, 1.0);
if (wetA > 0.001) {
  float wUp = smoothstep(0.55, 0.92, normalize(vObjN).y);
  wetK = wetA * mix(0.3, 1.0, wUp) * mix(0.6, 1.0, uWorldTex);
  diffuseColor.rgb *= 1.0 - 0.16 * wetK;
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.93, 0.96, 1.04), wetK * 0.5);
}
`,me=`
roughnessFactor = mix(roughnessFactor, 0.3, wetK * 0.75);
`,he=`
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
`,ge=`
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
`,_e=`
if (uSnow > 0.001 && uSnowK > 0.001) {
  vec3 fn = normalize(cross(dFdx(vWorldP), dFdy(vWorldP)));
  if (dot(fn, cameraPosition - vWorldP) < 0.0) fn = -fn;
  float nz = vn2(vWorldP.xz * 0.7) * 0.6 + vn2(vWorldP.xz * 2.9 + 3.0) * 0.4;
  float cover = uSnow * uSnowK * uWorldTex;
  float s = smoothstep(0.3, 0.62, fn.y + (nz - 0.5) * 0.5 - (1.0 - cover) * 0.6);
  s *= smoothstep(0.2, 0.55, nz * 0.9 + cover * 0.55) * cover;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.89, 0.95) * (0.94 + 0.08 * nz), s);
}
`,K=`
float nLit = 1.0;
if (vAncOn > 0.5) nLit = step(0.12, h12(floor(vAnc.xz * 0.37) + floor(vAnc.y * 0.5) * 3.1));
#ifdef USE_INSTANCING
  nLit = 1.0;
#endif
`,ve=`
{ ${K}
  totalEmissiveRadiance += (diffuseColor.rgb * 0.5 + vec3(0.42, 0.27, 0.1)) * uNight * mix(0.35, 1.0, nLit) * 1.15; }
`,ye=`
{ ${K}
  totalEmissiveRadiance += vec3(1.0, 0.7, 0.38) * uNight * nLit * 0.75 * step(0.5, uWorldTex); }
`,q=`
for (int k = 0; k < 2; k++) { vec4 ma = uMouthA[k], mb = uMouthB[k]; if (mb.w > 0.5) {
  vec2 d = vWorldP.xz - ma.xy; float al = dot(d, ma.zw), la = abs(ma.z * d.y - ma.w * d.x), hy = vWorldP.y - mb.x;
  if (al > -0.3 && al < mb.y && hy > -0.6 && (hy < 3.0 ? la < mb.z : length(vec2(la, hy - 3.0)) < mb.z)) discard; } }
`,be=`
uniform vec4 uRimK; uniform float uRimM;
`,xe=`
#if NUM_DIR_LIGHTS > 0
if (uRimM * (uRimK.x + uRimK.y) > 0.001) {
  vec3 rLd = directionalLights[0].direction, rLc = directionalLights[0].color;   // 0 = the shadow-casting sun / moon (three sorts casters first)
  float rTr = pow(clamp(dot(geometryViewDir, -(rLd + geometryNormal * uRimK.z)), 0.0, 1.0), uRimK.w);
  float rRim = pow(1.0 - clamp(abs(dot(geometryNormal, geometryViewDir)), 0.0, 1.0), 2.5) * smoothstep(-0.15, 0.55, dot(geometryNormal, rLd));
  totalEmissiveRadiance += diffuseColor.rgb * rLc * (rTr * uRimK.x * vec3(1.06, 1.04, 0.82) + rRim * uRimK.y) * uRimM;
}
#endif
`;function J(t,i={}){let a=i.det??`flat`,o={uDet:{value:ne(a)},uDetS:{value:i.scale??.5},uChip:{value:new d(i.chip??`#f3e6cf`)},uChipAmt:{value:i.chipAmt??0},uWorldTex:{value:+!i.local},uSnowK:{value:i.snow??1},uZB:{value:i.zb??0},uRimM:{value:i.rim??+!!i.wind}};return t.userData.extra=o,i.grass&&(t.userData.grass=!0),t.onBeforeCompile=t=>{Object.assign(t.uniforms,O,o),i.water&&W&&(t.uniforms.uWaveV=G.uWaveV),t.vertexShader=N+(i.wind?`uniform float uTime; uniform vec4 uWind;
`:``)+t.vertexShader.replace(`#include <begin_vertex>`,se+(i.wind?ce:``)).replace(`#include <project_vertex>`,i.flat?re:F).replace(`#include <worldpos_vertex>`,I),t.fragmentShader.includes(`#include <color_fragment>`)?(t.fragmentShader=L+z+de+(t.fragmentShader.includes(`#include <lights_fragment_begin>`)?r:``)+(i.water?`uniform float uTime;
`+(W?le:``):``)+t.fragmentShader.replace(`#include <lights_fragment_begin>`,e(n.lights_fragment_begin)).replace(`#include <common>`,`#include <common>`+be).replace(`#include <lights_fragment_end>`,`#include <lights_fragment_end>`+xe).replace(`#include <clipping_planes_fragment>`,`#include <clipping_planes_fragment>
`+R+ie+(i.grass?q:``)).replace(`#include <color_fragment>`,`#include <color_fragment>
`+oe+(i.flower?fe:``)+(i.grass?`diffuseColor.rgb *= uGrassTint;
`+V:``)+(i.pave?H:``)+(i.water?W?ue:U:``)+(i.wash&&!i.local?ge:``)+(i.local||i.wash?``:_e)+pe),t.fragmentShader.includes(`#include <roughnessmap_fragment>`)&&(t.fragmentShader=t.fragmentShader.replace(`#include <roughnessmap_fragment>`,`#include <roughnessmap_fragment>
`+me)),t.fragmentShader.includes(`#include <emissivemap_fragment>`)&&(t.fragmentShader=t.fragmentShader.replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
`+he)),i.wash&&(t.fragmentShader=t.fragmentShader.replace(`#include <normal_fragment_maps>`,`#include <normal_fragment_maps>
`+B).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
totalEmissiveRadiance += diffuseColor.rgb * 0.26 * (1.0 - 0.7 * uNight);`)),i.lit&&(t.fragmentShader=t.fragmentShader.replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
`+(i.lit===`glass`?ye:ve)))):t.fragmentShader=L+t.fragmentShader.replace(`#include <clipping_planes_fragment>`,`#include <clipping_planes_fragment>
`+R)},t.customProgramCacheKey=()=>`p`+a+(i.local?`L`:`W`)+(i.wind?`w`:``)+(i.wash?`a`:``)+(i.grass?`g`:``)+(i.pave?`v`:``)+(i.water?`q`:``)+(i.lit?`n`+i.lit:``),t}var Y=J(new T({depthPacking:l}),{flat:!0});Y.customProgramCacheKey=()=>`depthFlat`;var X={};function Se(e,t=!1){let n=e+(t?`L`:``);if(X[n])return X[n];let r={plaster:{det:`plaster`,scale:.35,chip:`#d9b9a0`,chipAmt:.35,rough:.95},paint:{det:`paint`,scale:.45,chip:`#efe1c9`,chipAmt:.7,rough:.8},brick:{det:`brick`,scale:.55,chip:`#efe3d0`,chipAmt:.55,rough:.95},tile:{det:`tile`,scale:.7,rough:.85},wood:{det:`wood`,scale:.6,rough:.9},stone:{det:`stone`,scale:.4,rough:.95},pave:{det:`stone`,scale:.4,rough:.95,pave:!0,snow:.8},water:{det:`flat`,scale:.5,rough:.35,metal:.05,water:!0,snow:0},road:{det:`road`,scale:.1,rough:1,snow:.4},dirt:{det:`dirt`,scale:.25,rough:1,snow:.6},leaf:{det:`leaf`,scale:.5,chip:`#fff6c8`,chipAmt:.1,rough:1,wind:!0,wash:!0,snow:.7},grass:{det:`leaf`,scale:.35,chip:`#fff6c8`,chipAmt:.05,rough:1,grass:!0},flat:{det:`flat`,scale:.5,rough:.85},glass:{det:`flat`,scale:.5,rough:.25,metal:.1,lit:`glass`,snow:0},metal:{det:`flat`,scale:.5,rough:.5,metal:.35},cream:{det:`flat`,scale:.5,rough:.55},glow:{det:`flat`,scale:.5,rough:1,emissive:!0,lit:`glow`,snow:0},clear:{det:`flat`,scale:.5,rough:.12,opacity:.16,front:!0},bloom:{det:`flat`,scale:.5,rough:.7,flower:!0,snow:.5}}[e]||{det:`flat`},i=new ee({vertexColors:!0,roughness:r.rough??.9,metalness:r.metal??0,side:2});r.emissive&&(i.emissive=new d(`#ffe7a8`),i.emissiveIntensity=.08),r.opacity&&(i.transparent=!0,i.opacity=r.opacity,i.depthWrite=!1,r.front&&(i.side=0));let a={glass:3,glow:3,paint:2,wood:2,metal:2,cream:2,stone:1,tile:1}[e]||0;return J(i,{...r,local:t,zb:a*4e-7}),X[n]=i,i}var Z=typeof location<`u`&&/[?&]smoothid\b/.test(location.search);function Q(e){let t=e?`flat `:``,n=new E({side:2,uniforms:{...O,uZB:{value:0},uIdMouth:{value:0}},vertexShader:N+`
    attribute float inkId; ${t}varying float vId;
    void main(){
      vec3 transformed = position;
      ${P}
      vObjP = position; vObjN = normal;
      vId = inkId;
      ${F}
    }`,fragmentShader:`
    uniform vec3 uRevC; uniform float uRevR; uniform float uRevSoft; uniform vec4 uCoastA; uniform vec4 uCoastB;
    uniform vec3 uCutA; uniform vec3 uCutB; uniform float uCut; uniform float uNoCut; uniform float uTallR; uniform vec3 uKeep;
    varying vec3 vWorldP; ${t}varying float vId; varying vec3 vAnc; varying float vAncOn; uniform vec4 uShopP;
    uniform vec4 uMouthA[2]; uniform vec4 uMouthB[2]; uniform float uIdMouth;
    float h12(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
    float vn2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(h12(i),h12(i+vec2(1,0)),f.x), mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x), f.y); }
    ${z}
    void main(){
      ${R}
      if (uIdMouth > 0.5) { ${q} }   // M3.14 试玩 #3: the lawn hidden inside the tunnel mouths is hidden in the id pass too (it wiped the portal's ink)
      ${ae}
      // ink part id (0 = soft: foliage, ground, unlisted) packed into 24 bits
      float id = floor(vId + 0.5);
      // M3.10 w2: open sea surface (cells' water layer + far sheet, offshore of the coastline) -> reserved id: the post keeps
      // its colour past the drive colour radius and draws no ink round it (soft)
      // M3.14 试玩 #2 (Qea: 海底隧道里所有描边都没了，货车也没有): only the water layer's height band - everything below -4.5 m
      // used to count as open sea, so the whole undersea tube, the station, the sea floor and the truck in it lost their ink
      if (uCoastB.z > 0.5 && vWorldP.y < -4.5 && vWorldP.y > -9.5) { float st = -vWorldP.x * uCoastA.y + vWorldP.z * uCoastA.x;
        float ss0 = vWorldP.x * uCoastA.x + vWorldP.z * uCoastA.y - (uCoastA.z + 55.0 * sin(st / 310.0 + uCoastB.x) + 22.0 * sin(st / 97.0 + uCoastB.y));
        if (ss0 > 0.5) id = 16777000.0; }
      gl_FragColor = vec4(vec3(mod(id, 256.0), mod(floor(id / 256.0), 256.0), floor(id / 65536.0)) / 255.0, fA);   // a = fade (post scales the ink)
    }`});return n.userData.idPass=!0,n}var $=Q(!Z);typeof location<`u`&&/[?&]flickdbg\b/.test(location.search)&&(globalThis.__IDMATS={flat:Z?Q(!0):$,smooth:Z?$:Q(!1)});{let e=(e,t,n)=>{let r=e.userData.fo??1,i=!1;r!==O.uFadeO.value&&(O.uFadeO.value=r,i=!0);let a=e.userData.ring,o=O.uRing.value;a?o.equals(a)||(o.copy(a),i=!0):o.w!==0&&(o.w=0,i=!0);let s=+!!e.userData.noCut;s!==O.uNoCut.value&&(O.uNoCut.value=s,i=!0),i&&(n.uniformsNeedUpdate=!0,t.state.useProgram(null))};h.prototype.onBeforeShadow=function(t,n,r,i,a,o){e(this,t,o)},h.prototype.onBeforeRender=function(t,n,r,i,a){if(e(this,t,a),!a.userData.idPass)return;let o=this.material?.userData?.extra?.uZB?.value||0;o!==a.uniforms.uZB.value&&(a.uniforms.uZB.value=o,a.uniformsNeedUpdate=!0);let s=+!!this.material?.userData?.grass;a.uniforms.uIdMouth&&s!==a.uniforms.uIdMouth.value&&(a.uniforms.uIdMouth.value=s,a.uniformsNeedUpdate=!0)}}var Ce=`
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
  float seaPx = 1.0 - step(0.5, abs(id0 - 16777000.0));   // M3.10 w2: open sea (id pass): soft, keeps its colour far out
  e *= 1.0 - seaPx;
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
  colM = max(colM, seaPx);
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
}`,we=class{constructor(e,t,n,r={}){this.r=e,this.px=r.px??1.25;let i=()=>new _(t,n,{type:p,samples:r.samples??4});this.rtC=i(),this.rtN=new _(t,n,{samples:0,minFilter:m,magFilter:m,generateMipmaps:!1}),this.rtN.depthTexture=new g(t,n),this.rtN.depthTexture.type=c,this.quadCam=new o(-1,1,1,-1,0,1),this.mat=new E({uniforms:{tColor:{value:this.rtC.texture},tDepth:{value:this.rtN.depthTexture},tNormal:{value:this.rtN.texture},res:{value:new C(t,n)},near:{value:.1},far:{value:1e3},ink:{value:new d(`#22150f`)},paper:{value:D},inkAmt:{value:r.ink??.92},exposure:{value:r.exposure??1},invProj:{value:new x},camWorld:{value:new x},uRevC:O.uRevC,uRevR:O.uRevR,uRevSoft:O.uRevSoft,uFadeBand:O.uFadeBand,uInkR:O.uInkR,uColR:O.uColR,uDrvC:O.uDrvC,uDrvR:O.uDrvR,uDrvW:O.uDrvW,uRainP:{value:new b},uVP:{value:new x},uCamP:{value:new w},uSkyA:{value:new d(`#9aa3b4`)},uSkyB:{value:new d(`#c9cfd8`)},uNightP:O.uNight,grain:{value:r.grain??.05},vign:{value:r.vign??.12},time:{value:0},px:{value:this.px},gk:{value:r.gk??1},dbg:{value:typeof location<`u`&&location.search.includes(`inkdbg`)?location.search.includes(`inkdbg2`)?2:1:0}},vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,fragmentShader:Ce,depthWrite:!1,depthTest:!1,defines:r.rain?{RAINFX:1,SSR_N:r.ssr??10}:{}}),this.mat.toneMapped=!1,this.quad=new h(new S(2,2),this.mat),this.qScene=new v,this.qScene.add(this.quad)}setSize(e,t){this.rtC.setSize(e,t),this.rtN.setSize(e,t),this.mat.uniforms.res.value.set(e,t)}render(e,t,n=null){let r=this.r;if(this.mat.uniforms.near.value=t.near,this.mat.uniforms.far.value=t.far,t.updateMatrixWorld(),this.mat.uniforms.invProj.value.copy(t.projectionMatrixInverse),this.mat.uniforms.camWorld.value.copy(t.matrixWorld),this.mat.defines.RAINFX){let e=this.mat.uniforms;e.uVP.value.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),e.uCamP.value.setFromMatrixPosition(t.matrixWorld)}r.setRenderTarget(this.rtC),r.render(e,t);let i=e.overrideMaterial,a=e.background,o=e.fog;e.overrideMaterial=this.idMat||$,e.background=null,e.fog=null;let s=this._hid||=[];s.length=0;for(let e of this.hide||[])e.visible&&=(s.push(e),!1);let c=r.getClearColor(this._cc||=new d),l=r.getClearAlpha();r.setClearColor(0,1);let u=r.shadowMap.autoUpdate;r.shadowMap.autoUpdate=!1,r.setRenderTarget(this.rtN),r.render(e,t),r.shadowMap.autoUpdate=u,r.setClearColor(c,l),e.overrideMaterial=i,e.background=a,e.fog=o;for(let e of s)e.visible=!0;if(r.setRenderTarget(n),!n){let e=r.getDrawingBufferSize(this._sz||=new C);r.setViewport(0,0,e.x,e.y),r.setScissorTest(!1)}r.render(this.qScene,this.quadCam)}};export{G as a,J as c,O as i,Se as n,W as o,D as r,Y as s,we as t};