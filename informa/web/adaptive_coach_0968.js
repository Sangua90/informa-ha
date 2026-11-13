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
  const exerciseKey=name=>String(name||'').trim().toLowerCase().replace(/\s+/g,' ');
  window.if68ExerciseKey=exerciseKey;
  async function recentGroups(){
    const h=await history(),items=(h.items||[]).slice(0,8),last={},exercises={};
    for(const w of items){
      const timestamp=Date.parse(w.ts);if(!Number.isFinite(timestamp))continue;
      const hours=Math.max(0,ageHours(w.ts));
      try{
        const d=await api(`api/workouts-0933/${w.id}`),seen=new Set();
        for(const s of d.sets||[]){
          const key=exerciseKey(s.exercise);if(!key)continue;
          const known=Object.values(window.IF72_LIBRARY||{}).find(x=>exerciseKey(x.name)===key);
          const g=known?.group||groupFor(s.exercise);
          if(g&&hours<=168){if(!last[g])last[g]={hours,sets:0};last[g].hours=Math.min(last[g].hours,hours);last[g].sets++}
          if(!seen.has(key)){
            seen.add(key);const x=exercises[key]||(exercises[key]={lastAt:0,sessions:0});
            x.lastAt=Math.max(x.lastAt,timestamp);x.sessions++;
          }
        }
      }catch(e){}
    }
    // Replace on every preparation: unavailable/deleted history must not leave stale rankings.
    IF50.adaptiveExercises=exercises;
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
    try{const data=await api('api/bodyweight-progression-01099?energy='+encodeURIComponent(IF50.energy||'Normale')+'&pain='+encodeURIComponent(IF50.pain||'Nessuno'));IF50.bodyweightProgression=data.items||{};IF50.bodyweightProgressionUnavailable=false}catch(e){IF50.bodyweightProgression={};IF50.bodyweightProgressionUnavailable=true}
    const ranked=['Petto','Schiena','Gambe','Femorali','Spalle','Glutei','Core','Tricipiti','Bicipiti','Polpacci'].map(group=>({group,tie:Math.random()})).sort((a,b)=>score(b.group,last)-score(a.group,last)||a.tie-b.tie).map(x=>x.group);
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
