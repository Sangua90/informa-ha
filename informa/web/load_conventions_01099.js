// One stored kg value is the discs mounted on ONE dumbbell, on both ends.
// Equipment counts describe the exercise; they never multiply/divide the saved load.
(function(){
 const counts={one_arm_dumbbell_row:1,dumbbell_shoulder_press:2,dumbbell_lateral_raise:2,dumbbell_reverse_fly:2,dumbbell_curl:2,dumbbell_hammer_curl:2,reverse_curl:2,goblet_squat:1,dumbbell_split_squat:2,romanian_deadlift:2,single_leg_romanian_deadlift:1,seated_dumbbell_calf_raise:1,shoulder_press:2,lateral_raise:2};
 Object.freeze(counts);
 window.if1099Load=function(ex){
  if(typeof ex==='string')ex={name:ex};
  ex=ex||{};
  const known=Object.values(window.IF72_LIBRARY||{}).find(x=>x.name===ex.name);
  const id=ex.id||known?.id,kind=ex.loadType||known?.loadType;
  const dumbbell=!ex.cardio&&(!kind||kind==='kg'||kind==='dumbbell'||kind==='dumbbells')&&(Object.hasOwn(counts,id)||/manubr|dumbbell/i.test(ex.name||''));
  const count=(Object.hasOwn(counts,id)?counts[id]:null)||(/monobraccio|un manubrio|con manubrio|a una gamba con manubrio/i.test(ex.name||'')?1:/manubri|dumbbells/i.test(ex.name||'')?2:null);
  return dumbbell?{basis:'dumbbell_discs_each',count,title:'DISCHI PER MANUBRIO · kg',inputLabel:'Dischi su un manubrio in kg',unit:'kg di dischi per manubrio',note:(count===2?'Usa 2 manubri con lo stesso carico. Il valore è per ciascun manubrio, non la somma dei due. ':count===1?'Usa 1 manubrio. ':'Il valore è per un solo manubrio. ')+'Somma i dischi montati alle due estremità; escludi impugnatura e fermadischi.'}:{basis:kind==='plates'?'machine_plates':kind==='bodyweight'?'bodyweight':'kg_total',count:null,title:kind==='plates'?'CARICO · piastre':'PESO · kg',inputLabel:kind==='plates'?'Numero di piastre':'Peso totale in kg',unit:kind==='plates'?'piastre':'kg',note:''};
 };
})();
