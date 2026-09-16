// InFormha 0.9.81 - audio agganciato al timer recupero reale
(function(){
 let ctx=null;
 function ensureAudio(){
  try{
   if(!ctx)ctx=new (window.AudioContext||window.webkitAudioContext)();
   if(ctx.state==='suspended')ctx.resume();
   return ctx;
  }catch(e){return null}
 }
 function tone(freq,duration,delay,volume){
  const c=ensureAudio();if(!c)return;
  const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+(delay||0);
  o.type='sine';o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(volume||0.16,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+duration);
  o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration+.03);
 }
 function countdown(){tone(880,.11,0,.16)}
 function finished(){tone(660,.16,0,.18);tone(1040,.24,.18,.20)}
 function unlock(){ensureAudio()}
 document.addEventListener('pointerdown',unlock,{capture:true});
 document.addEventListener('touchstart',unlock,{capture:true,passive:true});
 document.addEventListener('keydown',unlock,{capture:true});

 // Sostituisce direttamente la funzione reale usata da completeSet/if50CompleteSet.
 startTimer=function(sec){
  clearInterval(timerInt);
  ensureAudio();
  let left=sec,total=sec;
  const draw=()=>{
   const e=document.getElementById('timer'),b=document.getElementById('timerbar');
   if(!e||!b)return;
   const m=Math.floor(left/60),s=left%60;
   e.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
   b.style.width=(left/total*100)+'%';
  };
  draw();
  timerInt=setInterval(()=>{
   left--;
   draw();
   if(left>=1&&left<=5)countdown();
   if(left<=0){
    clearInterval(timerInt);
    const e=document.getElementById('timer');if(e)e.textContent='VAI!';
    finished();
   }
  },1000);
 };
 console.log('[INFORMHA_RECOVERY_SOUND_FIX] version=0.9.81 real_startTimer=1 last5_beep=1 finish_double_tone=1 audio_unlock=1');
})();
