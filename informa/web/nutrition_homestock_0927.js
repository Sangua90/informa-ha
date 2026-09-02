// InFormha 0.9.27 - HomeStock collegato e target alimentari spostati in Altro
(function(){
  let hsItems=[];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numv=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null};
  const first=(o,keys)=>{for(const k of keys){if(o&&o[k]!=null&&o[k]!=='')return o[k]}return null};

  function ensureNutritionSettingsPage(){
    let page=document.querySelector('[data-page="nutrition-settings-0927"]');
    if(page)return page;
    page=document.createElement('section');page.className='page';page.dataset.page='nutrition-settings-0927';
    page.innerHTML='<div class="ey">Impostazioni</div><h1>Alimentazione</h1><div class="sub">Qui imposti i target giornalieri. Il diario resta nella sezione Alimenti.</div><div id="if927GoalsHost"></div><button class="btn secondary" type="button" onclick="go(\'profile\')">Indietro</button>';
    document.querySelector('.app')?.appendChild(page);
    return page;
  }

  async function renderGoals(){
    ensureNutritionSettingsPage();
    const host=document.getElementById('if927GoalsHost');if(!host)return;
    let g={};try{g=(await api('api/nutrition/goals')).goals||{}}catch(e){toast(e.message||'Errore obiettivi')}
    host.innerHTML=`<div class="card"><div class="ey">Target giornalieri</div><h2>Obiettivi alimentari</h2><input class="field" id="if927gCal" placeholder="Calorie kcal" value="${g.calories??''}"><input class="field" id="if927gProt" placeholder="Proteine g" value="${g.protein_g??''}" style="margin-top:8px"><input class="field" id="if927gCarb" placeholder="Carboidrati g" value="${g.carbs_g??''}" style="margin-top:8px"><input class="field" id="if927gFat" placeholder="Grassi g" value="${g.fat_g??''}" style="margin-top:8px"><input class="field" id="if927gFib" placeholder="Fibre g" value="${g.fiber_g??''}" style="margin-top:8px"><input class="field" id="if927gWater" placeholder="Acqua ml" value="${g.water_ml??''}" style="margin-top:8px"><button class="btn" type="button" onclick="if927SaveGoals()">Salva target</button></div>`;
  }

  window.if927SaveGoals=async()=>{
    const val=id=>document.getElementById(id)?.value||null;
    try{await api('api/nutrition/goals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({calories:val('if927gCal'),protein_g:val('if927gProt'),carbs_g:val('if927gCarb'),fat_g:val('if927gFat'),fiber_g:val('if927gFib'),water_ml:val('if927gWater')})});toast('Target salvati');await renderGoals()}catch(e){toast(e.message||'Errore salvataggio')}
  };

  function wireNutritionSettings(){
    const profile=document.querySelector('[data-page="profile"]');if(!profile)return;
    [...profile.querySelectorAll('button')].forEach(btn=>{
      if((btn.textContent||'').trim()!=='Alimentazione')return;
      btn.onclick=()=>{ensureNutritionSettingsPage();go('nutrition-settings-0927');setTimeout(renderGoals,20)};
      btn.dataset.if927NutritionSettings='1';
    });
  }

  function normalizeProduct(x,index){
    const nutr=x?.nutrition||x?.nutriments||x?.nutritional_values||{};
    const pick=(keys)=>first(x,keys)??first(nutr,keys);
    return {
      _raw:x,
      _index:index,
      id:pick(['id','product_id','uuid']),
      name:pick(['name','product_name','title','nome','display_name'])||`Prodotto ${index+1}`,
      brand:pick(['brand','marca','brands']),
      barcode:pick(['barcode','ean','ean13','code']),
      calories:numv(pick(['calories','kcal','energy_kcal','energy-kcal_100g'])),
      protein_g:numv(pick(['protein_g','protein','proteins','proteins_100g'])),
      carbs_g:numv(pick(['carbs_g','carbs','carbohydrates','carbohydrates_100g'])),
      fat_g:numv(pick(['fat_g','fat','fats','fat_100g'])),
      fiber_g:numv(pick(['fiber_g','fiber','fibers','fiber_100g']))
    };
  }

  function catalogArray(data){
    if(Array.isArray(data))return data;
    for(const k of ['items','products','catalog','results','data'])if(Array.isArray(data?.[k]))return data[k];
    return [];
  }

  function renderFoodSearchShell(){
    const page=document.querySelector('[data-page="foodsearch"]');if(!page)return;
    page.innerHTML=`<div class="ey">Alimento</div><h1>Aggiungi al diario</h1>
      <div class="card"><div class="ey">HomeStock</div><h2>Prodotti di casa</h2><div class="sub" id="if927HsStatus">Connessione a HomeStock…</div><input class="field" id="if927HsSearch" placeholder="Cerca prodotto o marca…" style="margin-top:10px"><div id="if927HsResults"></div></div>
      <details class="card"><summary><b>Inserimento manuale</b></summary><div style="margin-top:12px"><select class="field" id="foodMeal"><option>Colazione</option><option>Pranzo</option><option>Cena</option><option>Spuntino</option></select><input class="field" id="foodName" placeholder="Nome alimento" style="margin-top:8px"><input class="field" id="foodBrand" placeholder="Marca (opzionale)" style="margin-top:8px"><input class="field" id="foodQty" placeholder="Quantità g" inputmode="decimal" style="margin-top:8px"><div class="grid2" style="margin-top:8px"><input class="field" id="foodCal" placeholder="kcal"><input class="field" id="foodProtein" placeholder="Proteine g"><input class="field" id="foodCarbs" placeholder="Carbo g"><input class="field" id="foodFat" placeholder="Grassi g"></div><button class="btn" onclick="saveFood()">Aggiungi alimento</button></div></details>
      <button class="btn secondary" onclick="go('nutrition')">Indietro</button>`;
  }

  function renderHsResults(){
    const host=document.getElementById('if927HsResults');if(!host)return;
    const q=(document.getElementById('if927HsSearch')?.value||'').trim().toLowerCase();
    const rows=hsItems.filter(x=>!q||`${x.name} ${x.brand||''} ${x.barcode||''}`.toLowerCase().includes(q)).slice(0,80);
    host.innerHTML=rows.length?rows.map(x=>`<div class="if927-product"><div style="flex:1"><b>${esc(x.name)}</b><div class="sub">${[x.brand,x.barcode,x.calories!=null?`${x.calories} kcal/100g`:null].filter(Boolean).map(esc).join(' · ')}</div></div><button class="btn secondary" style="width:auto" type="button" onclick="if927UseProduct(${x._index})">Usa</button></div>`).join(''):'<div class="sub" style="margin-top:12px">Nessun prodotto trovato.</div>';
  }

  async function loadHomeStockCatalog(){
    renderFoodSearchShell();
    const status=document.getElementById('if927HsStatus');
    try{
      const s=await api('api/homestock/status');
      if(!s.connected){if(status)status.textContent='HomeStock non collegato. Puoi usare l’inserimento manuale.';hsItems=[];renderHsResults();return}
      const d=await api('api/homestock/catalog');
      hsItems=catalogArray(d).map(normalizeProduct);
      if(status)status.textContent=`HomeStock collegato · ${hsItems.length} prodotti disponibili`;
      renderHsResults();
    }catch(e){hsItems=[];if(status)status.textContent=`HomeStock non disponibile: ${e.message||'errore'}`;renderHsResults()}
  }

  window.if927UseProduct=index=>{
    const x=hsItems.find(p=>p._index===index);if(!x)return;
    let qty=100;const raw=prompt(`Quantità in grammi per ${x.name}:`,'100');if(raw===null)return;qty=numv(raw);if(qty==null||qty<=0){toast('Quantità non valida');return}
    const scale=qty/100;
    const body={meal:'Spuntino',source:'homestock',product_id:x.id||null,barcode:x.barcode||null,name:x.name,brand:x.brand||null,quantity_g:qty,calories:x.calories!=null?x.calories*scale:null,protein_g:x.protein_g!=null?x.protein_g*scale:null,carbs_g:x.carbs_g!=null?x.carbs_g*scale:null,fat_g:x.fat_g!=null?x.fat_g*scale:null,fiber_g:x.fiber_g!=null?x.fiber_g*scale:null};
    api('api/nutrition/entry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(()=>{toast('Alimento aggiunto da HomeStock');go('nutrition')}).catch(e=>toast(e.message||'Errore aggiunta'));
  };

  function removeDailyGoalEditor(){
    const page=document.querySelector('[data-page="nutrition"]');if(!page)return;
    [...page.querySelectorAll('.card')].forEach(card=>{if((card.textContent||'').includes('Target giornalieri'))card.remove()});
  }

  document.addEventListener('input',e=>{if(e.target.matches('#if927HsSearch'))renderHsResults()});
  const oldGo=window.go;if(oldGo)window.go=function(page){const r=oldGo.apply(this,arguments);if(page==='foodsearch')setTimeout(loadHomeStockCatalog,40);if(page==='profile')setTimeout(wireNutritionSettings,30);if(page==='nutrition-settings-0927')setTimeout(renderGoals,30);if(page==='nutrition')setTimeout(removeDailyGoalEditor,110);return r};

  const css=document.createElement('style');css.textContent=`.if927-product{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--ln)}.if927-product:last-child{border-bottom:0}.if927-product .btn{margin:0}details.card>summary{cursor:pointer;list-style:none}details.card>summary::-webkit-details-marker{display:none}`;document.head.appendChild(css);
  ensureNutritionSettingsPage();wireNutritionSettings();setInterval(wireNutritionSettings,1200);setTimeout(removeDailyGoalEditor,700);
})();
