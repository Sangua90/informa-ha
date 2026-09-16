// InFormha 0.9.80 - avvisi sonori timer recupero
(function(){
 let ctx=null,last=null,watch=null;
 function audio(){try{if(!ctx)ctx=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx}catch(e){return null}}
 function tone(freq,duration,delay,volume){const c=audio();if(!c)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+(delay||0);o.type='sine';o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(volume||0.12,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+duration);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration+.03)}
 function beep(){tone(880,.09,0,.10)}
 function finish(){tone(660,.12,0,.12);tone(990,.16,.15,.14)}
 function seconds(){const page=document.querySelector('[data-page="recovery"]');if(!page)return null;const candidates=[...page.querySelectorAll('b,.timer,.time,[id*="timer"],[class*="timer"]')];for(const el of candidates){const s=(el.textContent||'').trim(),m=s.match(/^(?:(\d+):)?(\d{1,2})$/);if(m){const n=m[1]?Number(m[1])*60+Number(m[2]):Number(m[2]);if(Number.isFinite(n)&&n>=0&&n<=600)return n}}return null}
 function tick(){const n=seconds();if(n===null)return;if(n===last)return;last=n;if(n>=1&&n<=5)beep();else if(n===0)finish()}
 function unlock(){audio();document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('keydown',unlock,true)}
 document.addEventListener('pointerdown',unlock,true);document.addEventListener('keydown',unlock,true);
 watch=setInterval(tick,200);
 window.addEventListener('pagehide',()=>{if(watch)clearInterval(watch)});
 console.log('[INFORMHA_RECOVERY_SOUND] version=0.9.80 last5_beep=1 finish_double_tone=1');
})();
