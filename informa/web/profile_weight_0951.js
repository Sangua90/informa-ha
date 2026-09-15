// InFormha 0.9.51 - peso Apple Salute nel profilo
(function(){
  const fmtWeight=value=>`${String(Math.round(Number(value)*100)/100).replace('.',',')} kg`;
  const fmtDate=value=>{
    if(!value)return 'Data non disponibile';
    const date=new Date(value);return Number.isNaN(date.getTime())?String(value):date.toLocaleString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  };

  function ensureRows(){
    const value=document.getElementById('profileWeight');
    const row=value?.closest('.measure');
    if(!row)return null;
    let source=document.getElementById('if951WeightSource');
    if(!source){
      source=document.createElement('div');source.id='if951WeightSource';source.className='measure';
      source.innerHTML='<span>Origine peso</span><b>Verifica Apple Salute…</b>';
      row.insertAdjacentElement('afterend',source);
    }
    let updated=document.getElementById('if951WeightUpdated');
    if(!updated){
      updated=document.createElement('div');updated.id='if951WeightUpdated';updated.className='measure';
      updated.innerHTML='<span>Ultima pesata</span><b>—</b>';
      source.insertAdjacentElement('afterend',updated);
    }
    return {value,source:source.querySelector('b'),updated:updated.querySelector('b')};
  }

  async function loadAppleWeight(){
    const ui=ensureRows();if(!ui)return;
    try{
      const data=await api('api/profile-weight-0951-info');
      if(data.available){
        const shown=fmtWeight(data.value);
        ui.value.textContent=shown;
        document.getElementById('homeWeight')&&(document.getElementById('homeWeight').textContent=shown);
        document.getElementById('pWeight')&&(document.getElementById('pWeight').textContent=shown);
        ui.source.textContent='Apple Salute · Health Auto Export';
        ui.source.classList.add('green');
        ui.updated.textContent=fmtDate(data.last_updated);
      }else{
        ui.source.textContent='Inserimento manuale';
        ui.source.classList.remove('green');
        ui.updated.textContent='Nessun peso ricevuto da Apple Salute';
      }
    }catch(e){
      ui.source.textContent='Peso salvato in InFormha';
      ui.updated.textContent='Sincronizzazione Apple non disponibile';
    }
  }

  const oldGo=window.go;
  if(typeof oldGo==='function')window.go=function(page){
    const result=oldGo.apply(this,arguments);
    if(page==='profiledata')setTimeout(loadAppleWeight,40);
    return result;
  };

  setTimeout(loadAppleWeight,350);
  console.log('[INFORMHA_PROFILE_WEIGHT] version=0.9.51 apple_weight_profile=1 weight_source_ui=1');
})();
