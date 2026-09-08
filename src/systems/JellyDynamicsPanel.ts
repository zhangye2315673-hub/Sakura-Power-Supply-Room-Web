import { jellyDefaults, jellyDynamics, setJellyDynamics, saveJellyDynamics, setJellyFeel, getJellyFeel } from './JellyDynamicsSettings';

export function createJellyDynamicsPanel(nudge: () => void): HTMLElement {
  const panel = document.createElement('aside');
  panel.className = 'jelly-dynamics-panel';
  panel.setAttribute('aria-label', '全局果冻动态');
  panel.innerHTML = '<h3>果冻手感</h3><p>调好一次，所有家电一起生效</p>';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  const controls = [
    { label: '捏住范围', help: '小：捏尖角 · 大：拉动一整片', min: 0.12, max: 1.2, step: 0.02,
      get: () => jellyDynamics.radius, set: (v:number) => setJellyDynamics({radius:v}), text:(v:number)=>Math.round((v-0.12)/1.08*100)+'%' },
    { label: 'Q弹程度', help: '低：紧实稳当 · 高：柔软、来回弹', min: 0, max: 100, step: 1,
      get: getJellyFeel, set: setJellyFeel, text:(v:number)=>Math.round(v)+'%' },
    { label: '坠落重量', help: '轻轻落下 ← → 更有分量', min: 0.5, max: 3, step: 0.1,
      get: () => jellyDynamics.gravity, set:(v:number)=>setJellyDynamics({gravity:v}), text:(v:number)=>v.toFixed(1) },
  ];
  const refreshers: Array<()=>void> = [];
  for(const c of controls) {
    const label=document.createElement('label');
    const title=document.createElement('span'); title.textContent=c.label;
    const output=document.createElement('output');
    const input=document.createElement('input'); input.type='range'; input.min=String(c.min); input.max=String(c.max); input.step=String(c.step); input.setAttribute('aria-label',c.label);
    const refresh=()=>{input.value=String(c.get()); output.value=c.text(Number(input.value));}; refreshers.push(refresh); refresh();
    input.addEventListener('input',()=>{c.set(Number(input.value)); refresh(); status.textContent='已应用，尚未保存';});
    input.addEventListener('change',()=>{if(window.matchMedia('(max-width: 700px)').matches) saveJellyDynamics();});
    const hint=document.createElement('small'); hint.textContent=c.help;
    label.append(title,output,input,hint); panel.append(label);
  }
  const actions=document.createElement('div'); actions.className='jelly-dynamics-actions';
  const button=(text:string, action:()=>void)=>{const b=document.createElement('button'); b.type='button'; b.textContent=text; b.addEventListener('click',action); actions.append(b);};
  button('轻推一下',nudge);
  button('恢复默认',()=>{setJellyDynamics(jellyDefaults); setJellyFeel(65); refreshers.forEach(f=>f()); status.textContent='已恢复，尚未保存'; nudge();});
  button('保存手感',()=>{status.textContent=saveJellyDynamics()?'已保存，刷新后仍生效':'保存失败，当前调节仍有效';});
  panel.append(actions,status);
  for(const event of ['pointerdown','pointermove','pointerup','wheel']) panel.addEventListener(event,e=>e.stopPropagation());
  return panel;
}
