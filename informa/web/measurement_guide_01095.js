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
 const page=document.createElement('section');page.className='page';page.dataset.page='measureguide';app.appendChild(page);
 function node(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n}
 function diagram(d){
  const stroke=zone=>d.zone===zone?'#ff9418':'#7a838e',width=zone=>d.zone===zone?5:1.5;
  const rings=[['chest',180,126,42,8],['waist',180,195,37,8],['armR',127,141,13,7],['armL',233,141,13,7],['thighR',155,303,17,7],['thighL',205,303,17,7]];
  return `<svg viewBox="0 0 360 440" role="img" aria-labelledby="if1095DiagramTitle if1095DiagramDesc"><title id="if1095DiagramTitle">${d.label}: posizione della misurazione</title><desc id="if1095DiagramDesc">Figura frontale. La zona arancione indica ${d.label.toLowerCase()}. Destra e sinistra si riferiscono al tuo corpo.</desc><circle cx="180" cy="42" r="24" fill="#697581"/><path d="M155 74 L205 74 Q236 78 242 104 L260 213 Q263 225 251 228 Q243 229 239 217 L220 149 L216 225 L225 247 L218 397 L192 397 L180 285 L168 397 L142 397 L135 247 L144 225 L140 149 L121 217 Q117 229 109 228 Q97 225 99 213 L118 104 Q124 78 155 74Z" fill="#505d69" stroke="#89939d" stroke-width="1.5"/>${rings.map(([zone,cx,cy,rx,ry])=>`<ellipse data-zone="${zone}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${stroke(zone)}" stroke-width="${width(zone)}"/>`).join('')}<path d="M62 18V397 M54 28L62 18 70 28 M54 387L62 397 70 387 M60 18H150 M60 397H130" fill="none" stroke="${stroke('height')}" stroke-width="${width('height')}"/><rect x="130" y="402" width="100" height="29" rx="8" fill="#1b252e" stroke="${stroke('weight')}" stroke-width="${width('weight')}"/><text x="180" y="422" text-anchor="middle" fill="${stroke('weight')}" font-size="15">kg</text><text x="103" y="267" text-anchor="middle" fill="#c9d0d8" font-size="15">DX</text><text x="257" y="267" text-anchor="middle" fill="#c9d0d8" font-size="15">SX</text></svg>`;
 }
 function render(){
  const d=data[selected],close=page.querySelector(':scope > .if1088-close');page.replaceChildren();if(close)page.appendChild(close);
  page.append(node('div','Progressi e misure','ey'),node('h1','Come prendere le misure'));
  const choices=node('div',null,'if1095-choices');
  for(const [id,item] of Object.entries(data)){const b=node('button',item.label,'btn secondary');b.type='button';b.setAttribute('aria-pressed',String(id===selected));b.onclick=()=>{selected=id;render()};choices.appendChild(b)}page.appendChild(choices);
  const card=node('div',null,'card if1095-guide'),figure=node('div',null,'if1095-figure');figure.innerHTML=diagram(d);
  const content=node('div');content.append(node('div','Misura in '+d.unit,'ey'),node('h2',d.label));
  if(d.zone.startsWith('arm')||d.zone.startsWith('thigh'))content.appendChild(node('p','DX e SX sono i tuoi lati, non quelli di chi ti guarda.','sub'));
  const steps=node('ol');d.steps.forEach(text=>steps.appendChild(node('li',text)));content.appendChild(steps);card.append(figure,content);page.appendChild(card);
  const common=node('div',null,'card');common.append(node('h2','Per confrontare bene i risultati'),node('p','Per le circonferenze usa un metro morbido non elastico, a contatto con la pelle senza lasciare un solco. Ripeti la misura due volte e riposiziona il metro se i risultati differiscono. Mantieni gli stessi punti e condizioni nelle rilevazioni successive.','sub'));page.appendChild(common);
  const back=node('button','Torna ai valori da inserire','btn');back.type='button';back.onclick=()=>go('progress');page.appendChild(back);
  const sources=node('details',null,'card');sources.appendChild(node('summary','Fonti e metodo'));
  for(const [label,url] of [['WHO · misura della vita','https://www.who.int/docs/default-source/ncds/ncd-surveillance/steps/steps-manual.pdf'],['NHS · tecniche di misurazione','https://elht.nhs.uk/services/dietetics/body-measuring-techniques'],['CDC/NHANES · riferimenti per braccio, coscia e altezza','https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/document.cgi?phd=4124&study_id=phs000007.v21.p8']]){const a=node('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';sources.append(a,node('br'))}page.appendChild(sources);
 }
 window.if1095MeasureGuide=function(id='mWaist'){selected=data[id]?id:'mWaist';go('measureguide')};
 function ensure(){
  const form=document.getElementById('if978Measures');if(!form)return;
  for(const [id,item] of Object.entries(data)){
   const input=document.getElementById(id),label=input?.closest('label');if(!label||label.querySelector('[data-measure-help]'))continue;
   const b=node('button','ⓘ');b.type='button';b.className='if1095-help';b.dataset.measureHelp=id;b.setAttribute('aria-label','Come misurare: '+item.label);b.onclick=event=>{event.preventDefault();window.if1095MeasureGuide(id)};label.querySelector('span')?.appendChild(b);
  }
  if(!form.querySelector('.if1095-open')){const b=node('button','ⓘ Come prendere le misure','btn secondary if1095-open');b.type='button';b.onclick=()=>window.if1095MeasureGuide();form.prepend(b)}
 }
 const baseGo=window.go;window.go=function(name){const r=baseGo.apply(this,arguments);if(name==='measureguide')render();if(name==='progress')ensure();return r};
 const observer=new MutationObserver(ensure);observer.observe(app,{childList:true,subtree:true});ensure();
 const css=node('style',`.if1095-help{margin-left:8px;border:1px solid #bb6914;border-radius:50%;background:#251b10;color:#ffac4b;width:28px;height:28px;cursor:pointer}.if1095-choices{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0}.if1095-choices .btn{width:auto;margin:0;padding:9px 12px}.if1095-choices [aria-pressed=true]{border-color:#ff9418;background:#3b220b}.if1095-guide{display:grid;grid-template-columns:minmax(180px,260px) 1fr;gap:24px;align-items:center}.if1095-figure svg{display:block;width:100%;max-height:420px}.if1095-guide li{margin-bottom:14px;line-height:1.55}.if1095-guide ol{padding-left:22px}@media(max-width:600px){.if1095-guide{grid-template-columns:1fr;gap:10px}.if1095-figure svg{max-height:280px}.if1095-guide li{margin-bottom:12px}}`);document.head.appendChild(css);
})();
