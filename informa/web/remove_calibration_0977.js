// InFormha 0.9.77 - rimuove definitivamente la vecchia modalita calibrazione dalla Home
(function(){
 function clean(){
  const home=document.querySelector('[data-page="home"]');if(!home)return;
  [...home.querySelectorAll('.metric')].forEach(m=>{
   const label=(m.querySelector('span')?.textContent||'').trim().toLowerCase();
   const value=(m.querySelector('b')?.textContent||'').trim().toLowerCase();
   if(label==='modalità' || value.includes('calibrazione')) m.remove();
  });
 }
 const go0=window.go;if(typeof go0==='function')window.go=function(page){const r=go0.apply(this,arguments);if(page==='home')setTimeout(clean,20);return r};
 const observer=new MutationObserver(()=>{const h=document.querySelector('[data-page="home"].active');if(h)clean()});
 observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
 setTimeout(clean,50);setTimeout(clean,500);
 console.log('[INFORMHA_REMOVE_CALIBRATION] version=0.9.77 calibration_ui_removed=1');
})();
