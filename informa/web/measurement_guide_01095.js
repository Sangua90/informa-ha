// Measurement landmarks, with an original vector diagram and field-specific help.
(function(){
 const app=document.querySelector('.app');if(!app)return;
 const arms=['Trova il punto a metà tra la punta della spalla e la punta del gomito; puoi segnalarlo con un piccolo segno lavabile.','Lascia il braccio rilassato lungo il fianco. Avvolgi il metro su quel punto, perpendicolare al braccio, senza contrarre il muscolo.'];
 const thighs=['Individua il punto a metà tra la piega dell’inguine e il bordo superiore della rotula. Usa sempre quel punto.','In piedi, distribuisci il peso sulle due gambe e rilassa la coscia. Avvolgi il metro orizzontalmente senza stringere.'];
 const data={
  mHeight:{label:'Altezza',unit:'cm',zone:'height',steps:['Togli le scarpe e mettiti in piedi su un pavimento piano, con i talloni vicini alla parete.','Guarda dritto davanti a te. Appoggia un libro piatto sulla sommità della testa, ad angolo retto con il muro.','Segna il punto e misura dal pavimento al segno. Fatti aiutare se non riesci a mantenere la posizione.']},
  mWeight:{label:'Peso',unit:'kg',zone:'weight',steps:['Usa la stessa bilancia su un pavimento duro e piano.','Pesati possibilmente al mattino, con abiti leggeri simili ogni volta e senza scarpe.','Resta fermo e leggi il valore quando si stabilizza.']},
  mWaist:{label:'Vita',unit:'cm',zone:'waist',steps:['Trova il bordo inferiore dell’ultima costola e la parte alta dell’osso del fianco. Il metro va a metà tra questi due punti.','Fai passare il metro in orizzontale intorno al corpo: non deve scendere sulla schiena. Il punto non coincide necessariamente con l’ombelico.','Rilassa la pancia e leggi dopo una normale espirazione, senza trattenere il respiro o tirare in dentro l’addome.']},
  mChest:{label:'Torace',unit:'cm',zone:'chest',steps:['Fai passare il metro sotto le ascelle e intorno alla parte più ampia del torace.','Tienilo orizzontale anche dietro la schiena. Stai dritto, con le braccia rilassate, senza gonfiare il petto.','Leggi mantenendo una respirazione normale; usa lo stesso riferimento nelle rilevazioni successive.']},
  mArmR:{label:'Braccio destro',unit:'cm',zone:'armR',steps:arms},
  mArmL:{label:'Braccio sinistro',unit:'cm',zone:'armL',steps:arms},
  mThighR:{label:'Coscia destra',unit:'cm',zone:'thighR',steps:thighs},
  mThighL:{label:'Coscia sinistra',unit:'cm',zone:'thighL',steps:thighs}
 };
 let selected='mWaist';
 data.mArm={...data.mArmR,label:'Braccio'};data.mThigh={...data.mThighR,label:'Coscia'};
 for(const id of ['mArmR','mArmL','mThighR','mThighL'])delete data[id];
 data.mHip={label:'Fianchi',unit:'cm',zone:'hips',steps:['In piedi con i piedi vicini, passa il metro intorno alla parte più ampia dei glutei.','Mantieni il metro orizzontale anche dietro, a contatto con la pelle senza stringere.']};
 data.mCalf={label:'Polpaccio',unit:'cm',zone:'calfR',steps:['In piedi, distribuisci il peso sulle due gambe. Cerca il punto più largo del polpaccio del lato scelto.','Passa il metro perpendicolare alla gamba, senza comprimere la pelle. Mantieni sempre la stessa posizione nelle rilevazioni.']};
 function node(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n}
 function diagram(d){
  const stroke=zone=>d.zone===zone?'#ff9418':'#7a838e',width=zone=>d.zone===zone?5:1.5;
  const rings=[['chest',180,126,42,8],['waist',180,195,37,8],['hips',180,235,42,8],['calfR',153,355,14,7],['calfL',207,355,14,7],['armR',127,141,13,7],['armL',233,141,13,7],['thighR',155,303,17,7],['thighL',205,303,17,7]];
  return `<svg viewBox="0 0 360 440" role="img" aria-labelledby="if1095DiagramTitle if1095DiagramDesc"><title id="if1095DiagramTitle">${d.label}: posizione della misurazione</title><desc id="if1095DiagramDesc">Figura frontale. La zona arancione indica ${d.label.toLowerCase()}. Destra e sinistra si riferiscono al tuo corpo.</desc><circle cx="180" cy="42" r="24" fill="#697581"/><path d="M155 74 L205 74 Q236 78 242 104 L260 213 Q263 225 251 228 Q243 229 239 217 L220 149 L216 225 L225 247 L218 397 L192 397 L180 285 L168 397 L142 397 L135 247 L144 225 L140 149 L121 217 Q117 229 109 228 Q97 225 99 213 L118 104 Q124 78 155 74Z" fill="#505d69" stroke="#89939d" stroke-width="1.5"/>${rings.map(([zone,cx,cy,rx,ry])=>`<ellipse data-zone="${zone}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${stroke(zone)}" stroke-width="${width(zone)}"/>`).join('')}<path d="M62 18V397 M54 28L62 18 70 28 M54 387L62 397 70 387 M60 18H150 M60 397H130" fill="none" stroke="${stroke('height')}" stroke-width="${width('height')}"/><rect x="130" y="402" width="100" height="29" rx="8" fill="#1b252e" stroke="${stroke('weight')}" stroke-width="${width('weight')}"/><text x="180" y="422" text-anchor="middle" fill="${stroke('weight')}" font-size="15">kg</text><text x="103" y="267" text-anchor="middle" fill="#c9d0d8" font-size="15">DX</text><text x="257" y="267" text-anchor="middle" fill="#c9d0d8" font-size="15">SX</text></svg>`;
 }

 function render(){
  const body=document.getElementById('if1096Body'),help=document.getElementById('if1096MeasureHelp');if(!body||!help)return;
  const side=document.getElementById('mSide')?.value==='left'?'L':'R',d={...data[selected]};
  if(selected==='mArm')d.zone='arm'+side;if(selected==='mThigh')d.zone='thigh'+side;if(selected==='mCalf')d.zone='calf'+side;
  body.innerHTML=diagram(d);help.replaceChildren();help.appendChild(node('h3',d.label+' · '+d.unit));
  if(['mArm','mThigh','mCalf'].includes(selected))help.appendChild(node('p','Misura il lato '+(side==='R'?'destro':'sinistro')+' del tuo corpo.','sub'));
  const steps=node('ol');d.steps.forEach(text=>steps.appendChild(node('li',text)));help.appendChild(steps);
  for(const [id,item] of Object.entries(data)){const input=document.getElementById(id);if(input&&!input.dataset.inlineGuide){input.dataset.inlineGuide='1';input.addEventListener('focus',()=>{selected=id;render()})}}
  if(!document.getElementById('if1096MeasureSources')){
   const details=node('details');details.id='if1096MeasureSources';details.appendChild(node('summary','Fonti e metodo'));
   for(const [title,url] of [['WHO · vita','https://www.who.int/docs/default-source/ncds/ncd-surveillance/steps/steps-manual.pdf'],['NHS · misure corporee','https://elht.nhs.uk/services/dietetics/body-measuring-techniques'],['CDC/NHANES · braccio, coscia e altezza','https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/document.cgi?phd=4124&study_id=phs000007.v21.p8'],['UCL · polpaccio','https://research.ncl.ac.uk/media/sites/researchwebsites/thebritishregionalheartstudy/BRHS%202018-19%20%28Q40%29%2040yr%20follow-up%20Physical%20examination%20protocol.pdf']]){const a=node('a',title);a.href=url;a.target='_blank';a.rel='noopener noreferrer';details.append(a,node('br'))}help.after(details);
  }
 }
 window.if1095MeasureGuide=function(id){if(data[id])selected=id;render()};
 const go0=window.go;window.go=function(name){if(name==='measureguide')name='progress';const result=go0.call(this,name);if(name==='progress')render();return result};
 const observer=new MutationObserver(()=>{if(document.getElementById('if1096Body')&&!document.getElementById('if1095DiagramTitle'))render()});observer.observe(app,{childList:true,subtree:true});render();
})();
