// InFormha 0.9.67 - sostituisce il blocco tapis roulant realmente attivo (if932Extras)
(function(){
  const DEFAULT_MIN=20;
  if(typeof IF50==='undefined')return;
  if(!IF50.treadmill_choice)IF50.treadmill_choice='No';
  if(!Number.isFinite(Number(IF50.treadmillMinutes)))IF50.treadmillMinutes=DEFAULT_MIN;

  function minutes(){const n=parseInt(document.getElementById('if967TreadmillMinutes')?.value||IF50.treadmillMinutes,10);return Number.isFinite(n)&&n>0?Math.min(180,n):DEFAULT_MIN}
  function sync(){const yes=IF50.treadmill_choice==='Sì';document.querySelectorAll('[data-if967-treadmill]').forEach(b=>b.classList.toggle('on',b.dataset.if967Treadmill===(yes?'yes':'no')));const w=document.getElementById('if967TreadmillMinutesWrap');if(w)w.style.display=yes?'block':'none'}
  window.if967Treadmill=function(wanted){IF50.treadmill_choice=wanted?'Sì':'No';sync()};
  window.if967TreadmillMinutes=function(v){const n=parseInt(v,10);if(Number.isFinite(n)&&n>0)IF50.treadmillMinutes=Math.min(180,n)};

  function replaceActive(){
    const p=document.querySelector('[data-page="checkin"]');if(!p)return;
    const extras=document.getElementById('if932Extras')||document.getElementById('if931Extras');if(!extras)return;
    let card=document.getElementById('if967TreadmillCard');
    if(!card)card=[...extras.querySelectorAll('.card')].find(c=>{const b=c.querySelector('b');const t=(b?.textContent||'').trim();return t==='Tapis roulant?'||t==='Vuoi fare tapis roulant?'});
    if(!card)return;
    card.id='if967TreadmillCard';
    card.innerHTML=`<b>Vuoi fare tapis roulant?</b><div class="choice"><button type="button" data-if967-treadmill="no">No</button><button type="button" data-if967-treadmill="yes">Sì</button></div><div id="if967TreadmillMinutesWrap" style="display:none;margin-top:12px"><label class="sub" for="if967TreadmillMinutes">Quanti minuti vuoi fare?</label><div class="grid2" style="margin-top:7px"><input class="field" id="if967TreadmillMinutes" type="number" inputmode="numeric" min="1" max="180" step="1" value="${IF50.treadmillMinutes}"><div class="metric"><span>Durata tapis roulant</span><b>minuti</b></div></div></div>`;
    const no=card.querySelector('[data-if967-treadmill="no"]'),yes=card.querySelector('[data-if967-treadmill="yes"]'),inp=card.querySelector('#if967TreadmillMinutes');
    no?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if967Treadmill(false)});
    yes?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if967Treadmill(true)});
    inp?.addEventListener('input',()=>if967TreadmillMinutes(inp.value));
    document.getElementById('if964TreadmillCard')?.remove();sync();
  }

  const oldGo=window.go;if(typeof oldGo==='function')window.go=function(page){const r=oldGo.apply(this,arguments);if(page==='checkin'){setTimeout(replaceActive,1);setTimeout(replaceActive,100)}return r};
  const oldCheckin=window.if50Checkin;if(typeof oldCheckin==='function')window.if50Checkin=function(){const r=oldCheckin.apply(this,arguments);setTimeout(replaceActive,1);setTimeout(replaceActive,100);return r};
  const oldBuild=window.if50BuildPlan;if(typeof oldBuild==='function')window.if50BuildPlan=function(){const plan=oldBuild.apply(this,arguments)||IF50.plan||[];IF50.treadmillMinutes=minutes();IF50.plan=plan.filter(x=>!(x&&(x.id==='treadmill'||x.id==='cardio'||x.cardio)));if(IF50.treadmill_choice==='Sì')IF50.plan.unshift({id:'treadmill',name:'Tapis roulant Fassi',group:'Cardio',equipment:'Fassi F 7.9 HRC',priority:'Opzionale',cardio:true,guide:'treadmill',duration:IF50.treadmillMinutes,protocol:{duration:IF50.treadmillMinutes,phases:[]}});return IF50.plan};
  const oldCard=window.if50ExerciseCard;if(typeof oldCard==='function')window.if50ExerciseCard=function(ex){if(ex?.id==='treadmill'&&ex?.cardio&&Number(ex.duration)>0)return `<div class="card if931-treadmill" id="if50ex_treadmill"><div class="ey">Tapis roulant · ${ex.duration} min</div><h2>${ex.name}</h2><div class="sub">Durata scelta nel check iniziale.</div><div class="grid2" style="margin-top:10px"><input class="field" id="if931TreadmillMin" value="${ex.duration}" inputmode="numeric"><button class="btn secondary" onclick="if931SaveTreadmill()">Salva tapis roulant</button></div><div class="choice"><button onclick="if931BlockStatus('treadmill','Completato',this)">Completato</button><button onclick="if931BlockStatus('treadmill','Parziale',this)">Parziale</button><button onclick="if931BlockStatus('treadmill','Saltato',this)">Saltato</button></div></div>`;return oldCard.apply(this,arguments)};
  setTimeout(replaceActive,1);setTimeout(replaceActive,300);
  console.log('[INFORMHA_TREADMILL] version=0.9.67 active_if932=1 custom_minutes=1');
})();
