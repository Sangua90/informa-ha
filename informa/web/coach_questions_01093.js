// A durable inbox for Coach questions, including HA notification deep links.
(function(){
 const URL='api/coach-questions',drafts=new Map();
 let items=[],selected=null,saving=false,requestNo=0,lastLink='',error='';
 const app=document.querySelector('.app');if(!app)return;
 const page=document.createElement('section');page.className='page';page.dataset.page='coachquestions';app.appendChild(page);
 function el(tag,text,cls){const node=document.createElement(tag);if(text!=null)node.textContent=text;if(cls)node.className=cls;return node}
 function button(text,action,cls='btn secondary'){const b=el('button',text,cls);b.type='button';b.onclick=action;return b}
 function upsert(q){items=items.filter(x=>x.id!==q.id);items.push(q);items.sort((a,b)=>(b.state==='open')-(a.state==='open')||b.id-a.id)}
 function entries(){
  const count=items.filter(q=>q.state==='open').length,label='Domande del Coach'+(count?' ('+count+')':'');
  for(const name of ['profile','aicoach']){
   const host=document.querySelector('[data-page="'+name+'"]');if(!host)continue;
   let b=host.querySelector('.if1093-entry');if(!b){b=button(label,()=>go('coachquestions'));b.classList.add('if1093-entry');host.querySelector('h1')?.insertAdjacentElement('afterend',b)}
   if(b.textContent!==label)b.textContent=label;
  }
  const home=document.querySelector('[data-page="home"]');let card=document.getElementById('if1093Home');
  if(count&&!card&&home){card=el('div',null,'card coach');card.id='if1093Home';card.append(el('b','Il Coach ha una domanda per te'),button('Leggi e rispondi',()=>go('coachquestions')));home.appendChild(card)}
  if(!count)card?.remove();
 }
 function render(){
  entries();if(!page.classList.contains('active'))return;
  const previousClose=page.querySelector(':scope > .if1088-close');page.replaceChildren();if(previousClose)page.appendChild(previousClose);
  page.append(el('div','AI Coach','ey'),el('h1','Domande del Coach'),el('p','Le tue risposte aiutano il Coach a personalizzare le prossime sedute. Puoi modificarle anche in seguito.','sub'));
  if(error){const p=el('p',error,'card');p.setAttribute('role','alert');page.appendChild(p)}
  const pending=items.filter(q=>q.state==='open'),answered=items.filter(q=>q.state==='answered');
  if(selected==null)selected=pending[0]?.id||answered[0]?.id||null;
  const q=items.find(x=>x.id===selected);
  if(q){
   const card=el('div',null,'card if1093-question');card.dataset.questionId=q.id;
   card.append(el('div',q.state==='answered'?'Risposta salvata':'In attesa della tua risposta','ey'),el('h2',q.body));
   if(q.deferred_until&&q.state==='open')card.appendChild(el('p','Hai rimandato questa domanda. Puoi rispondere quando vuoi.','sub'));
   const label=el('label','La tua risposta al Coach');label.htmlFor='if1093Answer';
   const field=el('textarea');field.id='if1093Answer';field.className='field';field.rows=5;field.maxLength=2000;field.placeholder='Scrivi qui la tua risposta…';field.value=drafts.get(q.id)?.value??q.answer??'';
   field.disabled=saving;field.oninput=()=>drafts.set(q.id,{value:field.value,revision:drafts.get(q.id)?.revision??q.revision});
   card.append(label,field);
   const send=button(saving?'Invio in corso…':q.state==='answered'?'Aggiorna risposta':'Invia risposta al Coach',()=>save(q.id),'btn');send.id='if1093Send';send.disabled=saving;card.appendChild(send);
   if(q.state==='open')card.appendChild(button('Rispondi più tardi · 24 ore',()=>postpone(q.id)));
   if(q.state==='answered')card.appendChild(el('p','Risposta salvata. Il Coach la leggerà alla prossima generazione; la seduta già aperta resta invariata.','sub'));
   if(error&&drafts.has(q.id))card.appendChild(button('Carica risposta salvata (sostituisce la bozza)',()=>reload(q.id)));
   page.appendChild(card);
  }else page.appendChild(el('p',selected?'La domanda non è disponibile. Apri una delle domande qui sotto oppure ricarica.':'Non ci sono domande del Coach in questo momento.','card'));
  if(items.some(q=>q.notification_pending))page.appendChild(button('Riprova la notifica Home Assistant',()=>refresh(true)));
  page.appendChild(button('Prepara allenamento',()=>go('checkin')));
  for(const [title,list] of [['Da rispondere',pending],['Risposte precedenti',answered]]){
   if(!list.length)continue;const group=el('div',null,'card');group.appendChild(el('h2',title));
   for(const question of list){const b=button(question.body,()=>{selected=question.id;error='';render()});b.disabled=saving;b.dataset.questionId=question.id;group.appendChild(b)}page.appendChild(group);
  }
 }
 async function refresh(check=false){
  const token=++requestNo;
  try{const d=await api(URL+(check?'/check':''),check?{method:'POST'}:undefined);if(token!==requestNo)return false;items=Array.isArray(d.items)?d.items:[];error='';render();return true}
  catch(e){if(token!==requestNo)return;error='Non riesco a caricare le domande. Puoi riprovare.';render()}
 }
 async function save(id){
  if(saving)return;const q=items.find(x=>x.id===id),field=document.getElementById('if1093Answer'),answer=field?.value?.trim();if(!q)return;
  if(!answer){error='Scrivi la tua risposta prima di inviarla.';render();return}
  const revision=drafts.get(id)?.revision??q.revision;drafts.set(id,{value:field.value,revision});saving=true;++requestNo;error='';render();
  try{const d=await api(URL+'/'+id+'/answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answer,revision})});upsert(d.question);drafts.delete(id);toast('Risposta inviata al Coach')}
  catch(e){error=e.message||'Risposta non inviata. La tua bozza è conservata: riprova.'}
  finally{saving=false;++requestNo;render()}
 }
 async function postpone(id){
  if(saving)return;saving=true;++requestNo;error='';
  try{const d=await api(URL+'/'+id+'/postpone',{method:'POST'});upsert(d.question);toast('Domanda rimandata di 24 ore');go('checkin')}
  catch(e){error=e.message||'Non riesco a rimandare la domanda'}finally{saving=false;render()}
 }
 async function reload(id){if(await refresh()){drafts.delete(id);selected=id;render()}}
 window.if1093OpenQuestion=function(q){if(q){upsert(q);selected=q.id}go('coachquestions')};
 const baseGo=window.go;
 if(typeof baseGo==='function')window.go=function(name){const out=baseGo.apply(this,arguments);if(name==='coachquestions'){render();refresh()}return out};
 function notificationId(){
  let own=new URLSearchParams(location.search).get('coach_question');
  try{own=new URLSearchParams(window.parent.location.search).get('coach_question')||own}catch(e){}
  return /^[1-9]\d{0,8}$/.test(own||'')?Number(own):null;
 }
 async function checkLink(){const id=notificationId();if(!id||lastLink===String(id))return;lastLink=String(id);selected=id;go('coachquestions')}
 const observer=new MutationObserver(entries);observer.observe(app,{childList:true,subtree:true});
 setTimeout(async()=>{await refresh(true);await checkLink();if(location.hash==='#coachquestions')render()},500);
 setInterval(checkLink,1500);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){refresh();checkLink()}});
 const css=el('style','.if1093-entry{margin-bottom:14px!important}.if1093-question label{display:block;margin:18px 0 8px;font-weight:700}.if1093-question textarea{display:block;width:100%;min-height:140px;resize:vertical;font:inherit;line-height:1.5;box-sizing:border-box}.if1093-question h2{line-height:1.4}');document.head.appendChild(css);
 entries();
})();
