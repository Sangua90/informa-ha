// One gesture-unlocked audio context for recovery and timed exercises.
(function(){
 let ctx=null,pending=null,hidden=false;
 const timers=new Map(),nodes=new Map();
 function status(text){document.querySelectorAll('[data-if1104-status]').forEach(n=>n.textContent=text)}
 function stopNodes(key){for(const n of nodes.get(key)||[]){try{n.stop()}catch(e){}try{n.disconnect()}catch(e){}}nodes.delete(key)}
 function silence(){for(const key of [...nodes.keys()])stopNodes(key)}
 function create(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C();ctx.onstatechange=()=>{if(ctx?.state==='running'&&[...timers.keys()].some(k=>!nodes.has(k)))refresh();if(ctx?.state==='interrupted'||ctx?.state==='suspended'){silence();status('Audio da riattivare: tocca Prova suono.')}};return ctx}catch(e){status('Audio non disponibile in questo browser.');return null}}
 function tone(key,frequency,at,duration,volume){
  if(!ctx||ctx.state!=='running')return false;
  try{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(frequency,at);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(volume,at+.01);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(ctx.destination);const set=nodes.get(key)||new Set();set.add(o);nodes.set(key,set);o.onended=()=>{set.delete(o);try{o.disconnect();g.disconnect()}catch(e){}};o.start(at);o.stop(at+duration+.03);return true}catch(e){status('Audio non avviato: tocca Prova suono.');return false}
 }
 function schedule(key,end){
  stopNodes(key);if(!ctx||ctx.state!=='running')return;
  const left=(end-Date.now())/1000;if(left<=0){timers.delete(key);return}
  const base=ctx.currentTime;
  for(let n=5;n>=1;n--){const wait=left-n;if(wait>=-.05)tone(key,880,base+Math.max(0,wait),.12,.20)}
  tone(key,660,base+left,.16,.22);tone(key,1040,base+left+.18,.25,.24);
 }
 function refresh(){for(const [key,end] of timers)schedule(key,end)}
 function reset(){silence();const old=ctx;ctx=null;pending=null;if(old){old.onstatechange=null;try{Promise.resolve(old.close()).catch(()=>{})}catch(e){}}}
 function unlock(gesture=false,force=false){
  // Recreate an interrupted/closed context inside the next real gesture.
  if(force||gesture&&ctx&&['interrupted','closed'].includes(ctx.state))reset();
  // Some WebKit versions leave a non-gesture resume promise pending forever.
  // The next tap must get a new gesture-backed attempt rather than reuse it.
  if(gesture&&pending&&ctx?.state!=='running')reset();
  const fresh=!ctx,c=ctx||create();if(!c)return Promise.resolve(false);
  if(c.state==='running'){if(fresh)refresh();return Promise.resolve(true)}
  if(pending)return pending;
  try{const result=c.resume();pending=Promise.resolve(result).then(()=>{if(c!==ctx)return false;if(c.state==='running'){refresh();status('Suoni pronti: ultimi 5 secondi e fine timer.');return true}status('Tocca Prova suono per riattivare l’audio.');return false},()=>{if(c===ctx)status('Tocca Prova suono per consentire l’audio.');return false}).finally(()=>{if(c===ctx)pending=null});return pending}catch(e){status('Tocca Prova suono per consentire l’audio.');return Promise.resolve(false)}
 }
 window.if1104Audio={
  unlock,
  arm(key,end){timers.set(key,end);schedule(key,end);if(!ctx||ctx.state!=='running')unlock(false)},
  cancel(key){timers.delete(key);stopNodes(key)},
  complete(key){timers.delete(key)},
  clear(){timers.clear();silence()},
  state:()=>ctx?.state||'inactive'
 };
 window.if1104TestSound=async function(){const ready=await unlock(true,true);if(!ready)return;const t=ctx.currentTime;tone('test',880,t,.15,.22);tone('test',1040,t+.22,.22,.24);status('Segnale di prova inviato. Se non lo senti, verifica volume e modalità Silenzioso.');};
 function gesture(){const before=ctx;unlock(true).then(ok=>{if(ok&&before!==ctx)refresh()})}
 for(const event of ['pointerdown','touchend','click','keydown'])document.addEventListener(event,gesture,{capture:true,passive:true});
 function foreground(){const was=hidden;hidden=document.hidden;if(hidden){silence();return}if(!ctx&&!timers.size)return;if(was||ctx?.state!=='running')unlock(false).then(ok=>{if(ok)refresh()})}
 document.addEventListener('visibilitychange',foreground);window.addEventListener('pageshow',()=>{hidden=document.hidden;if(ctx||timers.size)unlock(false).then(ok=>{if(ok)refresh()})});
 function mount(){const page=document.getElementById('if912SettingsSection');if(!page||page.querySelector('.if1104-audio'))return;const box=document.createElement('details');box.className='card if1104-audio';const title=document.createElement('summary');title.textContent='Suoni timer';const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent='🔊 Prova suono';button.onclick=window.if1104TestSound;const note=document.createElement('p');note.className='sub';note.dataset.if1104Status='';note.textContent='Segnale negli ultimi 5 secondi e alla fine. Tocca per provare l’audio del dispositivo.';box.append(title,button,note);page.appendChild(box)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
 const go=window.go;if(typeof go==='function')window.go=function(){const out=go.apply(this,arguments);mount();return out};mount();
})();
