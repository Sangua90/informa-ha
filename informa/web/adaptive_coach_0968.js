// InFormha 0.9.68 - iCoach decide autonomamente il focus della seduta
(function(){
  if(typeof IF50==='undefined')return;
  IF50.intent='Coach automatico';
  IF50.focus='Automatico';

  function removeManualChoice(){
    const p=document.querySelector('[data-page="checkin"]');if(!p)return;
    [...p.querySelectorAll('.card')].forEach(c=>{
      const b=c.querySelector('b');const t=(b?.textContent||'').trim();
      if(t==='Cosa vuoi fare?'||t==='Su cosa vuoi lavorare?')c.remove();
    });
    document.getElementById('if50FocusWrap')?.remove();
    IF50.intent='Coach automatico';IF50.focus='Automatico';
    const coach=[...p.querySelectorAll('.card.coach')].find(c=>(c.textContent||'').includes('Logica coach'));
    if(coach){const sub=coach.querySelector('.sub');if(sub)sub.textContent='iCoach sceglie automaticamente cosa allenare in base allo storico recente, al recupero dei gruppi muscolari, al tempo disponibile, all’energia e agli eventuali fastidi. La frequenza settimanale è un riferimento, non un limite.'}
  }

  async function history(){try{return await api('api/workouts-0933')}catch(e){return {items:[]}}}
  function ageHours(ts){const d=new Date(ts);return Number.isNaN(d.getTime())?9999:(Date.now()-d.getTime())/3600000}
  function groupFor(name){const n=String(name||'').toLowerCase();if(n.includes('chest')||n.includes('pec')||n.includes('piegament'))return'Petto';if(n.includes('lat machine')||n.includes('pull-down')||n.includes('rematore'))return'Schiena';if(n.includes('shoulder')||n.includes('alzate laterali')||n.includes('face pull')||n.includes('reverse fly'))return'Spalle';if(n.includes('tricip'))return'Tricipiti';if(n.includes('curl'))return'Bicipiti';if(n.includes('squat')||n.includes('leg extension')||n.includes('step-up'))return'Gambe';if(n.includes('stacco')||n.includes('hamstring'))return'Femorali';if(n.includes('glute')||n.includes('ponte')||n.includes('hip thrust'))return'Glutei';if(n.includes('calf'))return'Polpacci';if(n.includes('plank')||n.includes('crunch')||n.includes('dead bug'))return'Core';return null}
  async function recentGroups(){
    const h=await history(),items=(h.items||[]).slice(0,8),last={};
    for(const w of items){if(ageHours(w.ts)>168)continue;try{const d=await api(`api/workouts-0933/${w.id}`);(d.sets||[]).forEach(s=>{const g=groupFor(s.exercise);if(g&&!last[g])last[g]={hours:ageHours(w.ts),sets:0};if(g)last[g].sets++})}catch(e){}}
    return last;
  }
  function score(g,last){const x=last[g];if(!x)return 100;if(x.hours<24)return 5;if(x.hours<36)return 25;if(x.hours<48)return 45;if(x.hours<72)return 70;return Math.min(95,75+x.hours/12)}

  const oldBuild=window.if50BuildPlan;
  window.if50BuildPlan=function(){
    // Piano provvisorio sincrono: la selezione definitiva viene preparata da if68Prepare.
    IF50.intent='Coach automatico';IF50.focus='Automatico';
    return typeof oldBuild==='function'?oldBuild.apply(this,arguments):IF50.plan||[];
  };

  window.if68Prepare=async function(){
    const last=await recentGroups();
    const ranked=['Petto','Schiena','Gambe','Femorali','Spalle','Glutei','Core','Tricipiti','Bicipiti','Polpacci'].sort((a,b)=>score(b,last)-score(a,last));
    IF50.adaptiveGroups=ranked;
    IF50.adaptiveRecovery=last;
    IF50.intent='Coach automatico';IF50.focus='Automatico';
  };

  const oldGenerate=window.if50Generate;
  if(typeof oldGenerate==='function')window.if50Generate=async function(){await if68Prepare();return oldGenerate.apply(this,arguments)};
  const oldCheckin=window.if50Checkin;if(typeof oldCheckin==='function')window.if50Checkin=function(){const r=oldCheckin.apply(this,arguments);setTimeout(removeManualChoice,0);return r};
  const oldGo=window.go;if(typeof oldGo==='function')window.go=function(page){const r=oldGo.apply(this,arguments);if(page==='checkin')setTimeout(removeManualChoice,20);return r};
  setTimeout(removeManualChoice,300);
  console.log('[INFORMHA_ADAPTIVE_COACH] version=0.9.68 manual_focus=0 history_recovery=1 frequency_flexible=1');
})();
