// InFormha 0.9.79 - filtro temporaneo attrezzatura
(function(){
 if(typeof IF50==='undefined')return;
 const build0=window.if50BuildPlan;if(typeof build0!=='function')return;
 const replacements={
  dumbbell_shoulder_press:['face_pull','Face pull alla Fassi','face_pull','plates'],
  dumbbell_lateral_raise:['face_pull','Face pull alla Fassi','face_pull','plates'],
  dumbbell_reverse_fly:['face_pull','Face pull alla Fassi','face_pull','plates'],
  one_arm_dumbbell_row:['lat','Lat machine al petto','lat','plates'],
  dumbbell_curl:['incline_support_cable_curl','Curl bicipiti al cavo basso con appoggio inclinato','incline_support_cable_curl','plates'],
  dumbbell_hammer_curl:['incline_support_cable_curl','Curl bicipiti al cavo basso con appoggio inclinato','incline_support_cable_curl','plates'],
  reverse_curl:['incline_support_cable_curl','Curl bicipiti al cavo basso con appoggio inclinato','incline_support_cable_curl','plates'],
  goblet_squat:['leg_extension','Leg extension alla macchina','leg_extension','plates'],
  dumbbell_split_squat:['step_up','Step-up sul gradino','step_up','bodyweight'],
  romanian_deadlift:['hamstring_walkout','Hamstring walkout','hamstring_walkout','bodyweight'],
  single_leg_romanian_deadlift:['hamstring_walkout','Hamstring walkout','hamstring_walkout','bodyweight'],
  seated_dumbbell_calf_raise:['calf_raise','Calf raise in piedi','calf_raise','bodyweight']
 };
 function enabled(){return new Date()<new Date('2026-09-24T00:00:00+02:00')}
 window.if50BuildPlan=function(){
  build0.apply(this,arguments);if(!enabled())return IF50.plan;
  const used=new Set();
  IF50.plan=(IF50.plan||[]).map(ex=>{
   const blocked=ex?.loadType==='kg'||/manubr|dumbbell|bilancier/i.test((ex?.id||'')+' '+(ex?.name||''));
   if(!blocked)return ex;
   const r=replacements[ex.id];if(!r)return null;
   return {...ex,id:r[0],name:r[1],guide:r[2],loadType:r[3]};
  }).filter(Boolean).filter(ex=>{if(ex.cardio||ex.mobility||ex.stretching)return true;if(used.has(ex.id))return false;used.add(ex.id);return true});
  return IF50.plan;
 };
 console.log('[INFORMHA_TEMP_EQUIPMENT] version=0.9.79 dumbbells_off=1 barbell_off=1');
})();
