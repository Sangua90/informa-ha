// InFormha 0.9.66 - tapis roulant unico con durata visibile su Sì
(function(){
  const DEFAULT_MIN=20;
  if(typeof IF50==='undefined')return;
  if(!IF50.treadmill_choice)IF50.treadmill_choice='No';
  if(!Number.isFinite(Number(IF50.treadmillMinutes)))IF50.treadmillMinutes=DEFAULT_MIN;

  function minutes(){const n=parseInt(document.getElementById('if966TreadmillMinutes')?.value||IF50.treadmillMinutes,10);return Number.isFinite(n)&&n>0?Math.min(180,n):DEFAULT_MIN}
  function sync(){
    const yes=IF50.treadmill_choice==='Sì';
    document.querySelectorAll('[data-if966-treadmill]').forEach(b=>b.classList.toggle('on',b.dataset.if966Treadmill===(yes?'yes':'no')));
    const wrap=document.getElementById('if966TreadmillMinutesWrap');if(wrap)wrap.style.display=yes?'block':'none';
  }
  window.if966Treadmill=function(wanted){IF50.treadmill_choice=wanted?'Sì':'No';sync()};
  window.if966TreadmillMinutes=function(v){const n=parseInt(v,10);if(Number.isFinite(n)&&n>0)IF50.treadmillMinutes=Math.min(180,n)};

  function replaceLegacy(){
    const p=document.querySelector('[data-page="checkin"]');if(!p)return;
    const extras=document.getElementById('if931Extras');if(!extras)return;
    let legacy=document.getElementById('if965TreadmillCard')||document.getElementById('if966TreadmillCard');
    if(!legacy)legacy=[...extras.querySelectorAll('.card')].find(c=>{const b=c.querySelector('b');return b&&((b.textContent||'').trim()==='Tapis roulant?'||(b.textContent||'').trim()==='Vuoi fare tapis roulant?')});
    if(!legacy)return;
    legacy.id='if966TreadmillCard';
    legacy.innerHTML=`<b>Vuoi fare tapis roulant?</b><div class="choice"><button type="button" data-if966-treadmill="no" onclick="if966Treadmill(false)">No</button><button type="button" data-if966-treadmill="yes" onclick="if966Treadmill(true)">Sì</button></div><div id="if966TreadmillMinutesWrap" style="display:none;margin-top:12px"><label class="sub" for="if966TreadmillMinutes">Quanti minuti vuoi fare?</label><div class="grid2" style="margin-top:7px"><input class="field" id="if966TreadmillMinutes" type="number" inputmode="numeric" min="1" max="180" step="1" value="${IF50.treadmillMinutes}" oninput="if966TreadmillMinutes(this.value)"><div class="metric"><span>Durata tapis roulant</span><b>minuti</b></div></div></div>`;
    document.getElementById('if964TreadmillCard')?.remove();sync();
  }

  const oldCheckin=window.if50Checkin;if(typeof oldCheckin==='function')window.if50Checkin=function(){const r=oldCheckin.apply(this,arguments);setTimeout(replaceLegacy,0);return r};
  const oldBuild=window.if50BuildPlan;if(typeof oldBuild==='function')window.if50BuildPlan=function(){const plan=oldBuild.apply(this,arguments)||IF50.plan||[];IF50.treadmillMinutes=minutes();IF50.plan=plan.filter(x=>!(x&&(x.id==='treadmill'||x.id==='cardio'||x.cardio)));if(IF50.treadmill_choice==='Sì')IF50.plan.unshift({id:'treadmill',name:'Tapis roulant Fassi',group:'Cardio',equipment:'Fassi F 7.9 HRC',priority:'Opzionale',cardio:true,guide:'treadmill',duration:IF50.treadmillMinutes,protocol:{duration:IF50.treadmillMinutes,phases:[]}});return IF50.plan};
  const oldCard=window.if50ExerciseCard;if(typeof oldCard==='function')window.if50ExerciseCard=function(ex){if(ex?.id==='treadmill'&&ex?.cardio&&Number(ex.duration)>0)return `<div class="card if931-treadmill" id="if50ex_treadmill"><div class="ey">Tapis roulant · ${ex.duration} min</div><h2>${ex.name}</h2><div class="sub">Durata scelta nel check iniziale. Regola velocità e inclinazione in base alla seduta e alle tue sensazioni.</div><div class="grid2" style="margin-top:10px"><input class="field" id="if931TreadmillMin" value="${ex.duration}" inputmode="numeric"><button class="btn secondary" onclick="if931SaveTreadmill()">Salva tapis roulant</button></div><div class="choice"><button onclick="if931BlockStatus('treadmill','Completato',this)">Completato</button><button onclick="if931BlockStatus('treadmill','Parziale',this)">Parziale</button><button onclick="if931BlockStatus('treadmill','Saltato',this)">Saltato</button></div></div>`;return oldCard.apply(this,arguments)};
  setTimeout(replaceLegacy,350);
  console.log('[INFORMHA_TREADMILL] version=0.9.66 replace_legacy=1 custom_minutes=1 visibility_fix=1');
})();
