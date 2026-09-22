// InFormha 0.9.71 - iCoach genera automaticamente il programma tapis roulant
(function(){
  function num(id){const n=parseFloat(String(document.getElementById(id)?.value||'').replace(',','.'));return Number.isFinite(n)?n:null}
  async function plan(minutes){try{return await api(`api/treadmill-0970/plan?minutes=${encodeURIComponent(minutes)}`)}catch(e){return {ok:false,error:e.message||'Errore iCoach'}}}
  function stats(phases){
    let total=0,weightedSpeed=0,weightedIncline=0,maxSpeed=0,maxIncline=0;
    (phases||[]).forEach(p=>{const m=Number(p.minutes)||0,s=Number(p.speed_kmh)||0,i=Number(p.incline_pct)||0;total+=m;weightedSpeed+=m*s;weightedIncline+=m*i;maxSpeed=Math.max(maxSpeed,s);maxIncline=Math.max(maxIncline,i)});
    return {avgSpeed:total?weightedSpeed/total:0,avgIncline:total?weightedIncline/total:0,maxSpeed,maxIncline};
  }
  async function enhance(){
    const card=document.getElementById('if50ex_treadmill');if(!card)return;
    let box=card.querySelector('#if970Treadmill');if(box)box.remove();
    const minutes=num('if931TreadmillMin')||num('if50CardioMin')||Number((IF50.plan||[]).find(x=>x.id==='treadmill')?.minutes)||20;
    const d=await plan(minutes);if(!d.ok)return;
    window.IF970_TREADMILL_PLAN=d;
    box=document.createElement('div');box.id='if970Treadmill';box.className='card coach';
    const rows=(d.phases||[]).map((p,i)=>`<div class="choice" style="margin-top:7px"><b>${i+1}. ${p.name}</b><div class="sub">${p.minutes} min · ${p.speed_kmh} km/h · inclinazione ${p.incline_pct}%</div></div>`).join('');
    box.innerHTML=`<div class="ey">Programma iCoach · ${d.duration_min} min</div>${rows}<div class="sub" style="margin-top:9px">${d.reason||''}</div><label class="sub" style="display:block;margin-top:10px">A fine tapis roulant, com'è andata?<select class="field" id="if970Fatigue"><option>Facile</option><option selected>Giusta</option><option>Dura</option><option>Al limite</option></select></label><button class="btn secondary" type="button" onclick="if970SaveTreadmill()">Completa tapis roulant</button>`;
    const status=card.querySelector('.choice');status?.insertAdjacentElement('beforebegin',box);
  }
  window.if970SaveTreadmill=async function(){
    const d=window.IF970_TREADMILL_PLAN;if(!d?.phases?.length){toast('Programma tapis roulant non disponibile');return}
    const st=stats(d.phases),fatigue=document.getElementById('if970Fatigue')?.value||'Giusta';
    try{
      await api('api/treadmill-0970',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({duration_min:d.duration_min,avg_speed_kmh:Number(st.avgSpeed.toFixed(2)),max_speed_kmh:st.maxSpeed,avg_incline_pct:Number(st.avgIncline.toFixed(2)),max_incline_pct:st.maxIncline,fatigue,phases:d.phases})});
      await api('api/cardio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workout_id:typeof currentWorkoutId!=='undefined'?currentWorkoutId:null,activity:'Tapis roulant Fassi',duration_min:d.duration_min,notes:`Programma iCoach · max ${st.maxSpeed} km/h · inclinazione max ${st.maxIncline}% · fatica ${fatigue}`})});
      toast('Tapis roulant completato e salvato');return true
    }catch(e){toast(e.message||'Errore salvataggio tapis roulant');throw e}
  };
  const render=window.if50RenderWorkout;if(typeof render==='function')window.if50RenderWorkout=function(){const r=render.apply(this,arguments);setTimeout(enhance,100);return r};
  const build=window.if50BuildPlan;if(typeof build==='function')window.if50BuildPlan=function(){const r=build.apply(this,arguments);setTimeout(enhance,120);return r};
  setTimeout(enhance,500);
  console.log('[INFORMHA_TREADMILL_ADAPTIVE] version=0.9.71 icoach_generated=1 multistage=1 manual_speed=0 manual_incline=0');
})();
