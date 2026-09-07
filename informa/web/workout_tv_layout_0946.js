// InFormha 0.9.46 - layout TV compatto e uso completo dello spazio disponibile
(function(){
  const css=document.createElement('style');
  css.textContent=`
    body.if945-tv-mode .app{
      width:100vw!important;
      max-width:100vw!important;
      margin:0!important;
      padding:10px 12px!important;
    }
    body.if945-tv-mode [data-page="workout"].active{
      width:100%!important;
      grid-template-columns:minmax(220px,27%) minmax(0,1fr)!important;
      gap:10px!important;
    }
    body.if945-tv-mode .if945-tv-stage{
      padding:14px!important;
      border-radius:19px!important;
    }
    body.if945-tv-mode .if945-tv-brand{font-size:18px}
    body.if945-tv-mode .if945-tv-live{margin-top:10px}
    body.if945-tv-mode .if945-tv-count{margin-top:5px}
    body.if945-tv-mode .if945-tv-stage>h1{display:none!important}
    body.if945-tv-mode .if945-tv-progress{margin-top:10px}
    body.if945-tv-mode .if945-tv-next{margin-top:14px;padding:10px}
    body.if945-tv-mode .if945-tv-next b{font-size:13px}
    body.if945-tv-mode .if945-tv-nav{margin-top:7px;gap:5px}
    body.if945-tv-mode .if945-tv-nav button{min-height:38px;padding:5px;font-size:10px}
    body.if945-tv-mode .if945-tv-finish{min-height:34px;margin-top:6px}
    body.if945-tv-mode .if945-tv-hint{display:none}
    body.if945-tv-mode [data-page="workout"]>.if945-current{
      padding:13px!important;
      border-radius:19px!important;
    }
    body.if945-tv-mode .if945-current>.row:first-child{min-height:0}
    body.if945-tv-mode .if945-current .if67-index{display:none!important}
    body.if945-tv-mode .if945-current>.row:first-child h2{
      margin:3px 0 5px;
      font-size:clamp(22px,2.7vw,34px);
    }
    body.if945-tv-mode .if945-current>.row:first-child .ey{font-size:10px}
    body.if945-tv-mode .if945-current .if913-load-label{margin:2px 0 7px;font-size:12px}
    body.if945-tv-mode .if945-current>.row:first-child .btn{
      min-height:40px;
      padding:9px 13px!important;
      font-size:13px;
      border-radius:13px;
    }
    body.if945-tv-mode .if945-current .setrow{
      grid-template-columns:30px minmax(90px,1fr) minmax(72px,.65fr) 50px;
      gap:7px;
      margin-top:6px;
      padding:6px;
      border-radius:12px;
    }
    body.if945-tv-mode .if945-current .setrow input{
      min-height:42px;
      padding:8px;
      font-size:16px;
      border-radius:11px;
    }
    body.if945-tv-mode .if945-current .check{height:42px;font-size:20px;border-radius:11px}
    body.if945-tv-mode .if945-current>.row[style*="margin-top"]{margin-top:7px!important}
    body.if945-tv-mode .if945-current>.choice{margin-top:7px;gap:6px}
    body.if945-tv-mode .if945-current>.choice button{min-height:38px;padding:7px 9px;font-size:12px}
  `;
  document.head.appendChild(css);
  console.log('[INFORMHA_WORKOUT_TV_LAYOUT] version=0.9.46 full_width=1 compact_stage=1 compact_sets=1 duplicate_title_hidden=1');
})();
