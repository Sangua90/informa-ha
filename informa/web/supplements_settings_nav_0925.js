// InFormha 0.9.25 - apertura Integratori da qualsiasi pulsante dentro Altro, esclusa barra inferiore
(function(){
  function isProfileIntegratoriButton(target){
    const btn=target.closest('button');if(!btn)return null;
    if((btn.textContent||'').trim()!=='Integratori')return null;
    if(btn.closest('.nav'))return null;
    if(!btn.closest('[data-page="profile"]'))return null;
    return btn;
  }

  window.if925OpenSupplementSettings=function(){
    if(typeof window.if923EnsureSettingsPage==='function')window.if923EnsureSettingsPage();
    let page=document.querySelector('[data-page="supplement-settings-0923"]');
    if(!page){
      page=document.createElement('section');page.className='page';page.dataset.page='supplement-settings-0923';
      page.innerHTML='<div class="ey">Impostazioni</div><h1>Integratori</h1><div class="sub">Configura cosa prendi, dose, giorni e orario.</div><div id="if923SettingsHost"></div><button class="btn secondary" type="button" onclick="go(\'profile\')">Indietro</button>';
      const app=document.querySelector('.app'),nav=document.querySelector('.nav');if(app)app.insertBefore(page,nav||null);
    }
    if(typeof go==='function')go('supplement-settings-0923');
    else{
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      page.classList.add('active');
    }
    setTimeout(()=>{if(typeof window.if923LoadSettings==='function')window.if923LoadSettings()},20);
  };

  function hardWire(){
    const profile=document.querySelector('[data-page="profile"]');if(!profile)return;
    [...profile.querySelectorAll('button')].forEach(btn=>{
      if((btn.textContent||'').trim()!=='Integratori')return;
      if(btn.closest('.nav'))return;
      btn.setAttribute('onclick','if925OpenSupplementSettings(); return false;');
      btn.dataset.if925SettingsNav='1';
    });
  }

  document.addEventListener('click',e=>{
    const btn=isProfileIntegratoriButton(e.target);if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();window.if925OpenSupplementSettings();
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(hardWire,250));else setTimeout(hardWire,250);
  setInterval(hardWire,700);
  console.log('[INFORMHA_SUPPLEMENTS] profile_integratori_anywhere=1 direct_onclick=1');
})();
