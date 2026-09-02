// InFormha 0.9.24 - apertura robusta impostazioni Integratori da Altro
(function(){
  function settingsPage(){return document.querySelector('[data-page="supplement-settings-0923"]')}
  function ensureSettingsPage924(){
    if(typeof window.if923EnsureSettingsPage==='function') return window.if923EnsureSettingsPage();
    let page=settingsPage();
    if(page)return page;
    page=document.createElement('section');page.className='page';page.dataset.page='supplement-settings-0923';
    page.innerHTML='<div class="ey">Impostazioni</div><h1>Integratori</h1><div class="sub">Configura cosa prendi, dose, giorni e orario.</div><div id="if923SettingsHost"></div><button class="btn secondary" type="button" data-if924-back>Indietro</button>';
    const app=document.querySelector('.app'),nav=document.querySelector('.nav');if(app)app.insertBefore(page,nav||null);
    return page;
  }
  function showSettings924(){
    ensureSettingsPage924();
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const page=settingsPage();if(!page)return;
    page.classList.add('active');
    document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.nav==='profile'));
    history.replaceState(null,'','#supplement-settings-0923');
    window.scrollTo({top:0,behavior:'auto'});
    if(typeof window.if923LoadSettings==='function')window.if923LoadSettings();
    else if(typeof loadSettings==='function')loadSettings();
  }
  function isSettingsIntegratoriButton(target){
    const btn=target.closest('button');if(!btn)return false;
    if((btn.textContent||'').trim()!=='Integratori')return false;
    return !!btn.closest('#if912SettingsSection');
  }
  document.addEventListener('click',e=>{
    if(isSettingsIntegratoriButton(e.target)){
      e.preventDefault();e.stopImmediatePropagation();showSettings924();return;
    }
    if(e.target.closest('[data-if924-back]')){
      e.preventDefault();e.stopImmediatePropagation();if(typeof go==='function')go('profile');
    }
  },true);
  function mark(){const s=document.getElementById('if912SettingsSection');if(!s)return;const b=[...s.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='Integratori');if(b)b.dataset.if924SettingsNav='1'}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mark,300));else setTimeout(mark,300);
  setInterval(mark,1200);
  console.log('[INFORMHA_SUPPLEMENTS] settings_nav_capture=1');
})();
