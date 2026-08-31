// InFormha 0.5.1 - libreria full body + rotazione flessibile A/B/C
const IF51_LIBRARY={
 chest:{name:'Chest press alla macchina',group:'Petto',equipment:'Fassi',priority:'Essenziale',sets:3,reps:10,rest:120,guide:'chest'},
 lat:{name:'Lat machine al petto',group:'Schiena',equipment:'Fassi + barra larga',priority:'Essenziale',sets:3,reps:10,rest:120,guide:'lat'},
 pushdown:{name:'Push-down tricipiti con corda',group:'Tricipiti',equipment:'Fassi + corda',priority:'Utile',sets:3,reps:12,rest:75,guide:'pushdown'},
 curl:{name:'Curl bicipiti al cavo basso',group:'Bicipiti',equipment:'Fassi + barra corta',priority:'Utile',sets:3,reps:12,rest:75,guide:'curl'},
 seated_row:{name:'Rematore al cavo basso',group:'Schiena',equipment:'Fassi + triangolo',priority:'Essenziale',sets:3,reps:10,rest:120},
 pec_fly:{name:'Aperture / pec deck alla macchina',group:'Petto',equipment:'Fassi',priority:'Utile',sets:3,reps:12,rest:90},
 shoulder_press:{name:'Shoulder press',group:'Spalle',equipment:'Manubri + panca',priority:'Essenziale',sets:3,reps:10,rest:120},
 lateral_raise:{name:'Alzate laterali',group:'Spalle',equipment:'Manubri',priority:'Utile',sets:3,reps:12,rest:75},
 goblet_squat:{name:'Goblet squat a box/panca',group:'Gambe',equipment:'Manubrio + panca',priority:'Essenziale',sets:3,reps:10,rest:120,painAvoid:['Ginocchio']},
 romanian_deadlift:{name:'Stacco rumeno con manubri',group:'Catena posteriore',equipment:'Manubri',priority:'Essenziale',sets:3,reps:10,rest:120,painAvoid:['Schiena']},
 glute_bridge:{name:'Ponte glutei su panca',group:'Glutei',equipment:'Panca',priority:'Utile',sets:3,reps:12,rest:90},
 calf_raise:{name:'Calf raise in piedi',group:'Polpacci',equipment:'Corpo libero / manubri',priority:'Utile',sets:3,reps:15,rest:60},
 face_pull:{name:'Face pull con corda',group:'Spalle posteriori',equipment:'Fassi + corda',priority:'Utile',sets:3,reps:12,rest:75,painAvoid:['Spalla']},
 plank:{name:'Plank',group:'Core',equipment:'Corpo libero',priority:'Utile',sets:3,reps:30,rest:60},
 treadmill:{name:'Tapis roulant Fassi',group:'Cardio',equipment:'Fassi F 7.9 HRC',priority:'Opzionale',sets:1,reps:null,rest:0,cardio:true,duration:20},
 stepper:{name:'Mini stepper',group:'Cardio',equipment:'Mini stepper',priority:'Opzionale',sets:1,reps:null,rest:0,cardio:true,duration:10}
};
const IF51_PLANS={
 A:{title:'Spinta + Gambe',ids:['chest','shoulder_press','goblet_squat','pushdown','lateral_raise','calf_raise','treadmill']},
 B:{title:'Trazione + Catena posteriore',ids:['lat','seated_row','romanian_deadlift','curl','face_pull','plank','stepper']},
 C:{title:'Full body tecnico',ids:['chest','lat','glute_bridge','shoulder_press','curl','pushdown','plank','treadmill']}
};
Object.entries(IF51_LIBRARY).forEach(([id,x])=>{if(!x.cardio&&!IF50_EX[id])IF50_EX[id]={id,name:x.name,priority:x.priority,sets:x.sets,reps:x.reps,rest:x.rest,guide:x.guide||null}});
function if51State(){try{return JSON.parse(localStorage.getItem('informha_if51')||'{}')}catch(e){return{}}}
function if51Save(s){localStorage.setItem('informha_if51',JSON.stringify(s))}
function if51NextPlan(){const s=if51State();const seq=['A','B','C'];const last=s.lastPlan;return seq[(Math.max(-1,seq.indexOf(last))+1)%seq.length]}
function if51ApplyPain(ex,pain){return !(ex.painAvoid||[]).includes(pain)}
function if51AdaptPlan(key,time,energy,pain){
 const plan=IF51_PLANS[key]||IF51_PLANS.A;
 let items=plan.ids.map(id=>({id,...IF51_LIBRARY[id]})).filter(ex=>if51ApplyPain(ex,pain));
 if(time<=20)items=items.filter(x=>x.priority==='Essenziale').slice(0,3);
 else if(time<=30)items=items.filter(x=>x.priority!=='Opzionale').slice(0,4);
 else if(time<=45)items=items.filter(x=>x.priority!=='Opzionale').slice(0,6);
 if(energy==='Bassa')items=items.map(x=>x.cardio?x:{...x,sets:Math.max(2,(x.sets||3)-1)});
 if(energy==='Alta'&&time>=60&&!items.some(x=>x.cardio))items.push({id:'treadmill',...IF51_LIBRARY.treadmill});
 return {key,title:plan.title,items};
}
function if51CalibrationNote(){const s=if51State();return s.calibrated?'<span class="green">Progressione attiva</span>':'<span class="blue">Calibrazione iniziale</span>'}
function if51Home(){
 const home=document.querySelector('[data-page="home"]');if(!home||document.getElementById('if51HomeCard'))return;
 const card=document.createElement('div');card.id='if51HomeCard';card.className='card coach';const next=if51NextPlan();card.innerHTML=`<div class="ey">Programmazione flessibile</div><h2>Prossima rotazione: ${next} · ${IF51_PLANS[next].title}</h2><div class="sub">Nessun giorno obbligatorio: InFormha riparte dalla prossima seduta utile in base a ciò che hai realmente completato.</div><div class="measure"><span>Stato coach</span><b>${if51CalibrationNote()}</b></div>`;home.appendChild(card);
}
function if51PatchGenerate(){
 const old=window.if50BuildPlan;
 window.if50BuildPlan=function(){
  if(IF50.intent==='Cambia gruppo')return old();
  const key=if51NextPlan();
  const adapted=if51AdaptPlan(key,IF50.time,IF50.energy,IF50.pain);
  IF50.plan=adapted.items.map(x=>({id:x.id,name:x.name,priority:x.priority,sets:x.sets,reps:x.reps,rest:x.rest,guide:x.guide||null,cardio:x.cardio||false,duration:x.duration||null,equipment:x.equipment,group:x.group}));
  IF50.planTitle=`${key} · ${adapted.title}`;
  return IF50.plan;
 };
 const oldRender=window.if50RenderWorkout;
 window.if50RenderWorkout=function(){oldRender();const h=document.querySelector('[data-page="workout"] h1');if(h&&IF50.planTitle)h.textContent=IF50.planTitle;const st=document.querySelector('[data-page="workout"] .status');if(st)st.textContent+=` · ${if51State().calibrated?'progressione':'calibrazione'}`}
}
function if51MarkPlanComplete(){const s=if51State();const key=(IF50.planTitle||'A').charAt(0);if(['A','B','C'].includes(key))s.lastPlan=key;const setCount=document.querySelectorAll('.check.done').length;if(setCount>=6)s.calibrated=true;s.lastWorkoutAt=new Date().toISOString();if51Save(s)}
(function(){if51Home();if51PatchGenerate();const oldFinish=window.if50Finish;window.if50Finish=async function(){if51MarkPlanComplete();return oldFinish()}})();
