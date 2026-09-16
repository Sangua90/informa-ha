// InFormha 0.9.64 - scelta tapis roulant e durata nel check iniziale
(function(){
  const CARD_ID='if964TreadmillCard';
  const DEFAULT_MIN=20;
  if(typeof IF50==='undefined')return;

  if(typeof IF50.treadmillWanted!=='boolean')IF50.treadmillWanted=false;
  if(!Number.isFinite(Number(IF50.treadmillMinutes)))IF50.treadmillMinutes=DEFAULT_MIN;

  function minutes(){
    const n=parseInt(document.getElementById('if964TreadmillMinutes')?.value||IF50.treadmillMinutes,10);
    return Number.isFinite(n)&&n>0?Math.min(180,n):DEFAULT_MIN;
  }
  function sync(){
    const yes=!!IF50.treadmillWanted;
    document.querySelectorAll('[data-if964-treadmill]').forEach(b=>b.classList.toggle('on',b.dataset.if964Treadmill===(yes?'yes':'no')));
    document.getElementById('if964TreadmillMinutesWrap')?.classList.toggle('hide',!yes);
  }
  window.if964Treadmill=function(wanted){IF50.treadmillWanted=!!wanted;sync()};
  window.if964TreadmillMinutes=function(v){const n=parseInt(v,10);if(Number.isFinite(n)&&n>0)IF50.treadmillMinutes=Math.min(180,n)};

  function inject(){
    const p=document.querySelector('[data-page="checkin"]');
    if(!p||document.getElementById(CARD_ID))return;
    const generate=[...p.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Genera allenamento'));
    if(!generate)return;
    const card=document.createElement('div');card.className='card';card.id=CARD_ID;
    card.innerHTML=`<b>Vuoi fare tapis roulant?</b><div class="choice"><button class="on" data-if964-treadmill="no" onclick="if964Treadmill(false)">No</button><button data-if964-treadmill="yes" onclick="if964Treadmill(true)">Sì</button></div><div id="if964TreadmillMinutesWrap" class="hide" style="margin-top:12px"><label class="sub" for="if964TreadmillMinutes">Quanti minuti vuoi fare?</label><div class="grid2" style="margin-top:7px"><input class="field" id="if964TreadmillMinutes" type="number" inputmode="numeric" min="1" max="180" step="1" value="${IF50.treadmillMinutes}" onchange="if964TreadmillMinutes(this.value)"><div class="metric"><span>Durata tapis roulant</span><b>minuti</b></div></div></div>`;
    generate.parentNode.insertBefore(card,generate);sync();
  }

  const oldCheckin=window.if50Checkin;
  if(typeof oldCheckin==='function')window.if50Checkin=function(){const r=oldCheckin.apply(this,arguments);setTimeout(inject,0);return r};

  const oldBuild=window.if50BuildPlan;
  if(typeof oldBuild==='function')window.if50BuildPlan=function(){
    const plan=oldBuild.apply(this,arguments)||IF50.plan||[];
    IF50.treadmillMinutes=minutes();
    const without=plan.filter(x=>!(x&&x.cardio));
    if(IF50.treadmillWanted)without.push({id:'cardio',name:'Tapis roulant Fassi',priority:'Opzionale',sets:1,reps:null,rest:0,guide:'treadmill',cardio:true,duration:IF50.treadmillMinutes});
    IF50.plan=without;return IF50.plan;
  };

  const oldGenerate=window.if50Generate;
  if(typeof oldGenerate==='function')window.if50Generate=async function(){
    if(IF50.treadmillWanted){IF50.treadmillMinutes=minutes();const input=document.getElementById('if964TreadmillMinutes');if(input&&(!parseInt(input.value,10)||parseInt(input.value,10)<=0)){if(typeof toast==='function')toast('Inserisci i minuti di tapis roulant');return}}
    return oldGenerate.apply(this,arguments);
  };

  setTimeout(inject,350);
  console.log('[INFORMHA_TREADMILL] version=0.9.64 yes_no=1 custom_minutes=1');
})();
