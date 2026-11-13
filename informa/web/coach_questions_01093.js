// A durable inbox for Coach questions, including HA notification deep links.
(function(){
 const URL='api/coach-questions',drafts=new Map();
 let items=[],selected=null,saving=false,requestNo=0,lastLink='',error='',editing=false,notice='';
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
  const previousNotes=page.querySelector('#if1101Notes');if(previousNotes)previousNotes.remove();
  const previousClose=page.querySelector(':scope > .if1088-close');page.replaceChildren();if(previousClose)page.appendChild(previousClose);
  page.append(el('div','AI Coach','ey'),el('h1','Domande del Coach'),el('p','Le tue risposte aiutano il Coach a personalizzare le prossime sedute. Puoi modificarle anche in seguito.','sub'));
  if(previousNotes)page.appendChild(previousNotes);window.if1101MountNotes?.();
  if(error){const p=el('p',error,'card');p.setAttribute('role','alert');page.appendChild(p)}
  const pending=items.filter(q=>q.state==='open'),answered=items.filter(q=>q.state==='answered');
  if(selected==null)selected=pending[0]?.id||null;
  const q=items.find(x=>x.id===selected);
  if(q&&(q.state==='open'||editing)){
   const card=el('div',null,'card if1093-question');card.dataset.questionId=q.id;
   card.append(el('div',q.state==='answered'?'Risposta salvata':'In attesa della tua risposta','ey'),el('h2',q.body));
   if(q.deferred_until&&q.state==='open')card.appendChild(el('p','Hai rimandato questa domanda. Puoi rispondere quando vuoi.','sub'));
   const label=el('label','La tua risposta al Coach');label.htmlFor='if1093Answer';
   const field=el('textarea');field.id='if1093Answer';field.className='field';field.rows=5;field.maxLength=2000;field.placeholder='Scrivi qui la tua risposta…';field.value=drafts.get(q.id)?.value??q.answer??'';
   field.disabled=saving;field.oninput=()=>drafts.set(q.id,{value:field.value,revision:drafts.get(q.id)?.revision??q.revision});
   card.append(label,field);
   if(q.state==='open'&&q.mobile_notification_error)card.appendChild(el('p',q.mobile_notification_error,'sub'));
   const send=button(saving?'Invio in corso…':q.state==='answered'?'Aggiorna risposta':'Invia risposta al Coach',()=>save(q.id),'btn');send.id='if1093Send';send.disabled=saving;card.appendChild(send);
   if(q.state==='open')card.appendChild(button('Rispondi più tardi · 24 ore',()=>postpone(q.id)));
   if(q.state==='answered')card.appendChild(el('p','Risposta salvata. Il Coach la leggerà alla prossima generazione; la seduta già aperta resta invariata.','sub'));
   if(error&&drafts.has(q.id))card.appendChild(button('Carica risposta salvata (sostituisce la bozza)',()=>reload(q.id)));
   page.appendChild(card);
  }else{const p=el('p',notice||q?.state==='answered'?'Risposta salvata. La domanda è completata. Il Coach userà la risposta nelle prossime proposte.':selected?'La domanda non è disponibile. Apri una delle domande qui sotto oppure ricarica.':'Non ci sono domande in attesa di risposta.','card');p.id='if1093Confirmation';p.setAttribute('role','status');page.appendChild(p)}
  if(items.some(q=>q.notification_pending))page.appendChild(button('Riprova la notifica Home Assistant',()=>refresh(true)));
  page.appendChild(button('Prepara allenamento',()=>go('checkin')));
  page.appendChild(button('Prova notifica iPhone',async event=>{const b=event?.currentTarget;if(b)b.disabled=true;try{await api(URL+'/test-notification',{method:'POST'});toast('Notifica di prova inviata all’iPhone')}catch(e){error=e.message||'Notifica non inviata';render()}finally{if(b)b.disabled=false}}));
  for(const [title,list] of [['Da rispondere',pending],['Risposte precedenti',answered]]){
   if(!list.length)continue;const history=title==='Risposte precedenti',group=el(history?'details':'div',null,'card');group.appendChild(el(history?'summary':'h2',title));
   for(const question of list){const b=button(question.body,()=>{selected=question.id;editing=history;notice='';error='';render()});b.disabled=saving;b.dataset.questionId=question.id;group.appendChild(b)}page.appendChild(group);
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
  try{const d=await api(URL+'/'+id+'/answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answer,revision})});upsert(d.question);drafts.delete(id);selected=null;editing=false;notice='saved';toast('Risposta inviata al Coach')}
  catch(e){error=e.message||'Risposta non inviata. La tua bozza è conservata: riprova.'}
  finally{saving=false;++requestNo;render()}
 }
 async function postpone(id){
  if(saving)return;saving=true;++requestNo;error='';
  try{const d=await api(URL+'/'+id+'/postpone',{method:'POST'});upsert(d.question);toast('Domanda rimandata di 24 ore');go('checkin')}
  catch(e){error=e.message||'Non riesco a rimandare la domanda'}finally{saving=false;render()}
 }
 async function reload(id){if(await refresh()){drafts.delete(id);selected=id;render()}}
 window.if1093OpenQuestion=function(q){editing=false;notice='';if(q){upsert(q);selected=q.id}go('coachquestions')};
 const baseGo=window.go;
 if(typeof baseGo==='function')window.go=function(name){if(name!=='coachquestions'&&page.classList.contains('active'))clearNotificationLink();const out=baseGo.apply(this,arguments);if(name==='coachquestions'){render();refresh()}return out};
 let haRoute=null;
 function target(path,search=''){
  const value=new URLSearchParams(search).get('coach_question')||path.match(/\/coachquestions\/([1-9]\d{0,8})\/?$/)?.[1];
  return /^[1-9]\d{0,8}$/.test(value||'')?{id:Number(value),key:path+'?'+search}:null;
 }
 function notificationTarget(){
  // HA forwards the route to subscribed app frames; no parent URL access needed.
  const route=haRoute&&target(haRoute.prefix+haRoute.path);if(route)return route;
  try{const p=window.parent.location;const t=target(p.pathname,p.search);if(t)return t}catch(e){}
  return target(location.pathname,location.search);
 }
 function clearNotificationLink(){
  if(!notificationTarget())return;
  if(window.parent===window){const url=new window.URL(location.href);url.searchParams.delete('coach_question');url.pathname=url.pathname.replace(/\/coachquestions\/[1-9]\d{0,8}\/?$/,'');history.replaceState(null,'',url);haRoute=null;lastLink='';return}
  let path=haRoute?.prefix;
  try{const url=new window.URL(window.parent.location.href);url.searchParams.delete('coach_question');url.pathname=url.pathname.replace(/\/coachquestions\/[1-9]\d{0,8}\/?$/,'');path=url.pathname+url.search}catch(e){}
  if(typeof path==='string'&&/^\/(?:app\/[a-z0-9_]+|[a-z0-9_]+)(?:\?[^#]*)?$/.test(path))window.parent.postMessage({type:'home-assistant/navigate',path,options:{replace:true}},location.origin);
 }
 function checkLink(force=false){const t=notificationTarget();if(!t){lastLink='';return}if(!force&&lastLink===t.key)return;lastLink=t.key;selected=t.id;editing=false;notice='';go('coachquestions')}
 function subscribe(){if(window.parent!==window)window.parent.postMessage({type:'home-assistant/subscribe-properties'},location.origin)}
 window.addEventListener('message',event=>{
  if(event.source!==window.parent||event.origin!==location.origin||event.data?.type!=='home-assistant/properties')return;
  const route=event.data.route;if(!route||typeof route.path!=='string'||typeof route.prefix!=='string')return;
  haRoute={prefix:route.prefix,path:route.path};checkLink();
 });
 window.addEventListener('pageshow',()=>{subscribe();checkLink(true)});
 subscribe();
 const observer=new MutationObserver(entries);observer.observe(app,{childList:true,subtree:true});
 setTimeout(async()=>{await refresh(true);await checkLink();if(location.hash==='#coachquestions')render()},500);
 setInterval(checkLink,1500);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){subscribe();refresh();checkLink(true)}});
 const css=el('style','.if1093-entry{margin-bottom:14px!important}.if1093-question label{display:block;margin:18px 0 8px;font-weight:700}.if1093-question textarea{display:block;width:100%;min-height:140px;resize:vertical;font:inherit;line-height:1.5;box-sizing:border-box}.if1093-question h2{line-height:1.4}');document.head.appendChild(css);
 entries();
})();
