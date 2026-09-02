// InFormha 0.9.36 - dettaglio attrezzatura reale nel riquadro Attrezzatura
(function(){
  const ITEMS=[
    {name:'Fassi Power 350',type:'Multigym',detail:'3 carrucole frontali fisse: alta, media e bassa. Bracci integrati per chest press / pec fly. Carico gestito a livelli/pin.',tags:['Carrucola alta frontale','Carrucola media frontale','Carrucola bassa frontale','Chest press','Pec fly']},
    {name:'Fassi F 7.9 HRC',type:'Tapis roulant',detail:'Usato per riscaldamento, camminata inclinata, cardio e defaticamento con velocità, durata e inclinazione modulabili.',tags:['Cardio','Velocità','Inclinazione']},
    {name:'Panca regolabile Carnielli',type:'Panca',detail:'Panca regolabile utilizzabile con manubri e per esercizi a corpo libero.',tags:['Panca','Manubri']},
    {name:'Rack Energetics + barra EZ',type:'Pesi liberi',detail:'Rack con barra EZ per esercizi compatibili con la tua dotazione.',tags:['Rack','Barra EZ']},
    {name:'Manubri componibili',type:'Pesi liberi',detail:'Manubri caricabili. I pesi esatti disponibili non vengono inventati: si registrano quelli realmente montati.',tags:['Manubri','Carico reale']},
    {name:'Mini stepper',type:'Cardio',detail:'Attrezzo cardio compatto utilizzabile come alternativa o complemento al tapis roulant.',tags:['Cardio','Stepper']}
  ];
  const ACCESSORIES=['Barra lat larga','Corda tricipiti','Triangolo presa stretta','Barra corta angolata','Cavigliera / cuffia','Maniglia singola / presa morbida'];
  const esc=v=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
  function equipmentCard(){
    const page=document.querySelector('[data-page="connections"]');if(!page)return null;
    return [...page.querySelectorAll(':scope > .card')].find(c=>{const t=(c.textContent||'').toLowerCase();return t.includes('attrezzatura')&&t.includes('la tua macchina')})||null;
  }
  function bodyHtml(){
    return `<div class="if936-list">${ITEMS.map(x=>`<div class="if936-item"><div class="ey">${esc(x.type)}</div><h3>${esc(x.name)}</h3><div class="sub">${esc(x.detail)}</div><div class="if936-tags">${x.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div>`).join('')}</div><div class="if936-accessories"><div class="ey">Accessori disponibili</div>${ACCESSORIES.map(x=>`<div class="measure"><span>${esc(x)}</span><b>✓</b></div>`).join('')}</div><div class="sub" style="margin-top:12px">Questa dotazione è il riferimento per le proposte di esercizio e per le future guide fotografiche.</div>`;
  }
  function install(){
    const card=equipmentCard();if(!card||card.dataset.if936Ready==='1')return;
    card.dataset.if936Ready='1';card.style.cursor='pointer';
    const oldSub=[...card.querySelectorAll('.sub')].find(x=>(x.textContent||'').includes('stand-by'));
    if(oldSub)oldSub.textContent='Tocca per vedere i macchinari e gli accessori disponibili nella tua palestra.';
    const body=document.createElement('div');body.id='if936EquipmentHost';body.className='hide';body.innerHTML=bodyHtml();card.appendChild(body);
    const hint=document.createElement('div');hint.id='if936Hint';hint.className='sub';hint.style.marginTop='10px';hint.textContent='Tocca per aprire il dettaglio attrezzatura.';card.appendChild(hint);
    card.addEventListener('click',e=>{
      if(e.target.closest('button'))return;
      const open=body.classList.contains('hide');body.classList.toggle('hide',!open);hint.textContent=open?'Tocca di nuovo per chiudere.':'Tocca per aprire il dettaglio attrezzatura.';
    });
  }
  const css=document.createElement('style');css.textContent='#if936EquipmentHost{border-top:1px solid var(--ln);padding-top:14px;margin-top:14px}.if936-list{display:grid;grid-template-columns:1fr 1fr;gap:10px}.if936-item{border:1px solid var(--ln);border-radius:16px;padding:13px;background:rgba(255,255,255,.02)}.if936-item h3{margin:3px 0 7px}.if936-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.if936-tags span{font-size:11px;padding:5px 8px;border-radius:999px;background:rgba(90,112,255,.14);border:1px solid rgba(90,112,255,.25)}.if936-accessories{margin-top:14px}@media(max-width:700px){.if936-list{grid-template-columns:1fr}}';document.head.appendChild(css);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,300));else setTimeout(install,300);
  setTimeout(install,800);setInterval(install,1500);
  console.log('[INFORMHA_EQUIPMENT] version=0.9.36 equipment_details=1 real_setup=1');
})();
