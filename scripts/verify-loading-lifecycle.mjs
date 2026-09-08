import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
const source = process.argv.includes('--baseline') ? execFileSync('git', ['show', 'HEAD:src/systems/PuzzleLoadingOverlay.ts'], {encoding:'utf8'}) : readFileSync('src/systems/PuzzleLoadingOverlay.ts','utf8');
function setup() {
  let id=0; const timers=new Map(), frames=new Map(), elements=new Map();
  const element=()=>({classList:{values:new Set(),contains(v){return this.values.has(v)},add(v){this.values.add(v)},remove(v){this.values.delete(v)}},style:{setProperty(){}},setAttribute(){}});
  const context={exports:{},require:()=>({t:k=>k}),performance:{now:()=>0},document:{querySelector:s=>{if(!elements.has(s))elements.set(s,element()); return elements.get(s)}},window:{setTimeout:f=>{timers.set(++id,f);return id},clearTimeout:i=>timers.delete(i)},requestAnimationFrame:f=>{frames.set(++id,f);return id},cancelAnimationFrame:i=>frames.delete(i)};
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
  return {overlay:new context.exports.PuzzleLoadingOverlay(),async flush(){await Promise.resolve();await Promise.resolve();},timers(){for(const [i,f] of [...timers]){timers.delete(i);f()}},frames(){for(const [i,f] of [...frames]){frames.delete(i);f()}}};
}
const h=setup(); let release; let newApplied=false;let staleFinished=false;
h.overlay.show('old');h.overlay.complete(()=>new Promise(r=>release=r),()=>staleFinished=true);h.timers();
h.overlay.show('new');h.overlay.complete(()=>{newApplied=true});release();await h.flush();h.frames();h.frames();
assert.equal(h.overlay.active,true,'stale completion hid the new loader');assert.equal(staleFinished,false,'stale completion unlocked the new scene');h.timers();await h.flush();h.frames();h.frames();assert.equal(newApplied,true,'new scene application was cancelled');
const n=setup();let done=false;let resolve;n.overlay.complete(()=>new Promise(r=>resolve=r),()=>done=true);assert.equal(done,false,'non-overlay load completed before scene');resolve();await n.flush();assert.equal(done,true);
console.log('PASS: stale completion cannot cancel new scene; non-overlay completion awaits scene');
