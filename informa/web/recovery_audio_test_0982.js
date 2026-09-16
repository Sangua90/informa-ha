// InFormha 0.9.82 - test audio esplicito nella schermata recupero
(function(){
 let testCtx=null;
 function ctx(){try{if(!testCtx)testCtx=new (window.AudioContext||window.webkitAudioContext)();return testCtx}catch(e){return null}}
 async function testSound(){
  const c=ctx();
  if(!c){toast('Audio non disponibile in questo browser');return}
  try{if(c.state==='suspended')await c.resume()}catch(e){}
  try{
   const o=c.createOscillator(),g=c.createGain(),t=c.currentTime;
   o.type='square';o.frequency.setValueAtTime(740,t);
   g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.22,t+.02);g.gain.exponentialRampToValueAtTime(0.0001,t+.35);
   o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.4);
   const status=document.getElementById('if982AudioStatus');if(status)status.textContent='Test inviato · stato audio: '+c.state;
  }catch(e){const status=document.getElementById('if982AudioStatus');if(status)status.textContent='Errore audio: '+e.message}
 }
 window.if982TestSound=testSound;
 function install(){
  const page=document.querySelector('[data-page="recovery"]');if(!page||document.getElementById('if982AudioTest'))return;
  const box=document.createElement('div');box.id='if982AudioTest';box.className='card';box.style.marginTop='12px';
  box.innerHTML='<button class="btn secondary" type="button" onclick="if982TestSound()">🔊 Prova suono</button><div id="if982AudioStatus" class="sub" style="margin-top:8px">Premi il pulsante per verificare l’audio del dispositivo.</div>';
  page.appendChild(box);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
 console.log('[INFORMHA_AUDIO_TEST] version=0.9.82 explicit_button=1');
})();
