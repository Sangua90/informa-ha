// InFormha 0.9.23 - separa funzioni consultabili e impostazioni nella sezione Altro
(function(){
  const VIEW_LABELS=['Esercizi','Settimana e Coach','Progressi e misure','Alimentazione'];
  const SETTINGS_LABELS=['Profilo','Connessioni e dispositivi','Integratori'];
  const clean=s=>(s||'').replace(/^🏋️\s*/,'').trim();

  function pickButton(profile,label){
    const matches=[...profile.querySelectorAll('button')].filter(b=>clean(b.textContent)===label);
    if(!matches.length)return null;
    const preferred=matches.find(b=>b.id==='if63ExercisesButton')||matches[0];
    matches.forEach(b=>{if(b!==preferred)b.remove()});
    return preferred;
  }

  function makeSection(id,title){
    let card=document.getElementById(id);
    if(!card){
      card=document.createElement('div');card.id=id;card.className='card';
      card.innerHTML=`<div class="ey">${title}</div>`;
    }
    return card;
  }

  function arrangeProfile(){
    const profile=document.querySelector('[data-page="profile"]');if(!profile)return;
    const versionCard=[...profile.querySelectorAll(':scope > .card')].find(c=>c.querySelector('#version')||(c.textContent||'').includes('Versione'));
    const view=makeSection('if912ViewSection','Consultazione / Funzioni');
    const settings=makeSection('if912SettingsSection','Impostazioni');

    VIEW_LABELS.forEach(label=>{const b=pickButton(profile,label);if(b)view.appendChild(b)});
    SETTINGS_LABELS.forEach(label=>{const b=pickButton(profile,label);if(b)settings.appendChild(b)});

    const anchor=versionCard||null;
    if(view.parentElement!==profile)profile.insertBefore(view,anchor);
    if(settings.parentElement!==profile)profile.insertBefore(settings,anchor);
    if(view.nextElementSibling!==settings)profile.insertBefore(view,settings);

    [...profile.querySelectorAll(':scope > .card')].forEach(card=>{
      if(card===view||card===settings||card===versionCard)return;
      const hasButton=card.querySelector('button');
      const meaningful=[...card.children].some(el=>!el.matches('.ey')&&(el.textContent||'').trim());
      if(!hasButton&&!meaningful)card.remove();
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arrangeProfile);else arrangeProfile();
  setTimeout(arrangeProfile,250);setInterval(arrangeProfile,1200);
})();
