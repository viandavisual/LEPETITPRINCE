'use strict';
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const SOURCE='https://www.petit-princep.cat/collection';
const DATA_KEY='lpp-world-v6-user', OLD_V5='lpp-world-v5-data',OLD_V3='lpp-world-v3-data';
const state={page:'home',languageId:null,search:'',filter:'all',order:'covers',languages:[],books:[],marks:{},notes:{},install:null,error:'',history:[],homeSelection:[],lastHomeSelection:[]};
function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(toast.tm);toast.tm=setTimeout(()=>t.classList.remove('show'),3200)}
function save(){try{localStorage.setItem(DATA_KEY,JSON.stringify({marks:state.marks,notes:state.notes}))}catch(e){toast('No s’han pogut guardar les marques')}}
function loadUser(){try{const d=JSON.parse(localStorage.getItem(DATA_KEY)||'{}');state.marks=d.marks||{};state.notes=d.notes||{}}catch{}}
function readOld(){try{if(localStorage.getItem('lpp-v6-migrated'))return;for(const key of [OLD_V5,OLD_V3]){const o=JSON.parse(localStorage.getItem(key)||'null');if(!o?.marks)continue; // Old entries have different identities: retain them in backup, not auto-match incorrectly.
  localStorage.setItem('lpp-v6-legacy-available', '1'); break;}localStorage.setItem('lpp-v6-migrated','1')}catch{}}
function allOwned(){return state.books.filter(b=>state.marks[b.id]?.owned)}
function allWanted(){return state.books.filter(b=>state.marks[b.id]?.wish)}
function ownedLanguages(){return new Set(allOwned().map(b=>b.languageId))}
function langBooks(id){return state.books.filter(b=>b.languageId===id)}
function representative(lang){return langBooks(lang.id).filter(b=>b.cover).sort((a,b)=>(parseInt(b.year)||0)-(parseInt(a.year)||0))[0]|| (lang.cover ? {cover:lang.cover,year:''} : null)}
function image(src,label){if(!src||!/^https?:\/\//.test(src)&&!src.startsWith('./')&&!src.startsWith('../DATA/covers/'))return '<div class="nocover">✦<small>Portada pendent</small></div>';return `<img src="${esc(src)}" loading="lazy" referrerpolicy="no-referrer" alt="${esc(label||'Portada')}" onerror="this.hidden=true;this.insertAdjacentHTML('afterend','<div class=&quot;nocover&quot;>✦<small>Portada no disponible</small></div>')">`}
function statCards(){let langs=ownedLanguages().size;return `<div class="statgrid"><div class="stat"><strong>${langs}</strong><span>Idiomes aconseguits</span></div><div class="stat"><strong>${allOwned().length}</strong><span>Edicions que tinc</span></div><div class="stat"><strong>${allWanted().length}</strong><span>Edicions desitjades</span></div><div class="stat"><strong>${state.languages.length}</strong><span>Idiomes precarregats</span></div></div>`}
function note(){const total=state.languages.length, editions=state.books.length, covered=state.books.filter(b=>b.cover).length;const missing=state.languages.filter(l=>!representative(l)).length;const meta=state.catalogInfo||{};return `<div class="source-note"><b>Catàleg local del CAPTURADOR.</b> ${total} idiomes · ${editions} edicions · ${covered} portades locals. ${missing?`${missing} idiomes encara sense portada. `:''}${meta.partial?'La captura és parcial; pots tornar a executar el CAPTURADOR i substituir DATA. ':''}Les marques TINC/VULL es desen al dispositiu i no es modifiquen quan actualitzes DATA. <a href="${SOURCE}" target="_blank" rel="noopener">Font original ↗</a></div>`}
function langCard(l){const b=representative(l),owned=langBooks(l.id).filter(b=>state.marks[b.id]?.owned).length;return `<article class="lang-card"><div class="lang-cover" data-lang="${esc(l.id)}">${image(b?.cover,l.name)}</div><div class="lang-body"><h3>${esc(l.name)}</h3><p>${l.count||0} edicions a la font · ${langBooks(l.id).length} fitxes</p>${owned?`<div class="lang-status">✓ ${owned} a la meva col·lecció</div>`:''}<button class="secondary full" data-lang="${esc(l.id)}">Veure edicions →</button></div></article>`}
function bookCard(b){const mark=state.marks[b.id]||{};return `<article class="book"><div class="coverarea" data-book="${esc(b.id)}">${image(b.cover,b.title)}<span class="origin">${esc(b.year||'—')}</span></div><div class="book-body"><h3>${esc(b.title||'El Petit Príncep')}</h3><p>${esc(b.publisher||'Editorial no indicada')}</p><p>${esc(b.year||'Any no indicat')}</p><div class="book-actions"><button class="mark ${mark.owned?'owned':''}" data-mark="owned" data-id="${esc(b.id)}">✓ Tinc</button><button class="mark ${mark.wish?'wish':''}" data-mark="wish" data-id="${esc(b.id)}">♡ Vull</button></div></div></article>`}
function chooseHomeLanguages(){
 const available=state.languages.filter(l=>representative(l));
 const previous=new Set(state.lastHomeSelection);
 const fresh=available.filter(l=>!previous.has(l.id));
 const old=available.filter(l=>previous.has(l.id));
 const shuffle=list=>{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const chosen=[...shuffle(fresh),...shuffle(old)].slice(0,6);
 state.lastHomeSelection=chosen.map(l=>l.id);
 state.homeSelection=chosen;
 return chosen;
}
function home(){const langs=state.homeSelection.length?state.homeSelection:chooseHomeLanguages();return `<section class="hero hero3 hero11"><div class="hero11-content"><div class="eyebrow">LA TEVA CONSTEL·LACIÓ DE LLIBRES</div><img class="home-title-art" src="assets/home-title.webp" alt="Un llibre. Molts mons." loading="eager"><p>Explora idiomes, contempla portades reals i marca les edicions que tens o les que voldries trobar.</p><button class="primary" data-view="explore">✦ Explorar idiomes →</button></div><div class="hero11-art"><img src="assets/banner-principito.webp" alt="La noia i el Petit Príncep contemplant les estrelles"></div></section><div class="section-head"><h2>El teu univers</h2></div>${statCards()}<div class="quickgrid support home-quickgrid"><button class="quick" data-view="explore"><span class="symbol">◈</span><strong>Idiomes</strong><small>Explorar portades</small></button><button class="quick" data-view="owned"><span class="symbol">✓</span><strong>Col·lecció</strong><small>Les teves edicions</small></button><button class="quick" data-view="wishes"><span class="symbol">♡</span><strong>Desitjats</strong><small>La llista de desitjos</small></button></div><div class="section-head"><h2>Portades de la col·lecció</h2><button class="ghost" data-view="explore">Veure idiomes →</button></div><div class="catalog-grid lang-grid">${langs.map(langCard).join('')}</div><div class="home-fox-dog" aria-hidden="true"><img src="assets/fox-dog-principito.webp" loading="lazy" alt=""></div>`}
function explore(){let langs=[...state.languages];if(state.search.trim())langs=langs.filter(l=>norm(l.name).includes(norm(state.search)));if(state.filter==='owned')langs=langs.filter(l=>ownedLanguages().has(l.id));if(state.filter==='covers')langs=langs.filter(l=>!!representative(l));if(state.order==='az')langs.sort((a,b)=>a.name.localeCompare(b.name,'ca'));else if(state.order==='num')langs.sort((a,b)=>b.count-a.count);else langs.sort((a,b)=>Number(!!representative(b))-Number(!!representative(a))||a.name.localeCompare(b.name,'ca'));return `<div class="eyebrow">CATÀLEG VISUAL</div><h1 class="introtitle">Idiomes i dialectes</h1><p class="subtle">Una portada per idioma: la més recent disponible a les fitxes del catàleg local.</p><div class="catalog-summary"><span><strong>${langs.length}</strong> idiomes visibles</span><span><strong>${state.languages.length}</strong> idiomes carregats</span><span><strong>${state.books.length}</strong> edicions precarregades</span></div><div class="toolbar"><div class="searchbox"><input id="search" placeholder="Cercar idioma…" value="${esc(state.search)}"></div><select id="filter"><option value="all" ${state.filter==='all'?'selected':''}>Tots</option><option value="covers" ${state.filter==='covers'?'selected':''}>Amb portada</option><option value="owned" ${state.filter==='owned'?'selected':''}>Els que tinc</option></select><select id="sort"><option value="covers" ${state.order==='covers'?'selected':''}>Portades primer</option><option value="az" ${state.order==='az'?'selected':''}>A–Z</option><option value="num" ${state.order==='num'?'selected':''}>Més edicions</option></select></div>${langs.length?`<div class="catalog-grid lang-grid">${langs.map(langCard).join('')}</div>`:`<div class="no-result">No hi ha idiomes que coincideixin amb la cerca.</div>`}`}
function languagePage(){const lang=state.languages.find(x=>x.id===state.languageId);if(!lang)return explore();const editions=langBooks(lang.id).sort((a,b)=>(parseInt(b.year)||0)-(parseInt(a.year)||0));const owned=editions.filter(b=>state.marks[b.id]?.owned).length;return `<div class="backline"><button class="ghost" data-view="explore">← Tots els idiomes</button></div><div class="eyebrow">IDIOMA</div><div class="ed-head"><h1>${esc(lang.name)}</h1><div class="count-pill">${owned} que tinc</div></div><p class="subtle">${lang.count} registres a la font · ${editions.length} incorporats al catàleg</p><div class="linkbar"><a href="${esc(lang.sourceUrl)}" target="_blank" rel="noopener">Consulta totes les edicions a la font original ↗</a></div><div class="catalog-grid">${editions.map(bookCard).join('')}</div>`}
function owned(){const b=allOwned();return `<div class="eyebrow">COL·LECCIÓ</div><h1 class="introtitle">${b.length} edicions que tinc</h1><p class="subtle">${ownedLanguages().size} idiomes amb almenys una edició marcada.</p>${b.length?`<div class="catalog-grid">${b.map(bookCard).join('')}</div>`:`<div class="empty">Encara no has marcat cap edició.</div>`}`}
function wishes(){const b=allWanted();return `<div class="eyebrow">DESITJATS</div><h1 class="introtitle">${b.length} edicions desitjades</h1>${b.length?`<div class="catalog-grid">${b.map(bookCard).join('')}</div>`:`<div class="empty">La teva llista de desitjats és buida.</div>`}`}
function stats(){return `<div class="eyebrow">ESTADÍSTIQUES</div><h1 class="introtitle">La teva col·lecció</h1>${statCards()}<div class="stats-dog" aria-hidden="true"><img src="assets/dog-principito.webp" loading="lazy" alt=""></div>`}
function settings(){return `<div class="eyebrow">DADES I AJUSTOS</div><h1 class="introtitle">Les teves dades</h1><div class="panel"><h3>Catàleg local (carpeta DATA)</h3><p class="subtle">La v14 llegeix directament <code>../DATA/catalog-data.js</code> i les portades de <code>../DATA/covers/</code>. No cal internet, servidor ni sincronització per carregar-lo. Quan el CAPTURADOR acabi, copia la carpeta DATA al costat d’APP i torna a obrir la PWA.</p>${note()}<p class="subtle">Pots actualitzar DATA en el futur sense esborrar les teves marques i notes personals.</p></div><div class="panel"><h3>Còpia de seguretat de la col·lecció</h3><p class="subtle">Les marques TINC/VULL i les notes es desen en aquest navegador, de manera independent del catàleg.</p><div class="settings-actions"><button class="primary" id="export">Exportar la meva col·lecció</button><button class="secondary" id="importBackup">Importar còpia JSON</button></div></div><div class="panel"><h3>Compatibilitat</h3><p class="subtle">Es mantenen els identificadors d’edició de la v7/v8 quan provenen de petit-princep.cat. Les fonts anteriors amb identificadors diferents no es fusionen automàticament.</p></div><div class="mutedfoot">Projecte no oficial, sense ànim de lucre. Font: <a href="${SOURCE}" target="_blank" rel="noopener">petit-princep.cat</a>.</div>`}
function render(){const html=state.error?`<section class="hero hero3"><div><div class="eyebrow">LE PETIT PRINCE · WORLD COLLECTION v14.0</div><h1>El teu univers de llibres</h1><p>La interfície ja està preparada. Només falta copiar les dades del CAPTURADOR.</p></div></section><div class="notice"><b>No s’ha detectat la carpeta DATA completa.</b><p>Assegura’t que hi hagi <code>APP/index.html</code> i <code>DATA/catalog-data.js</code> dins la mateixa carpeta principal. Torna a obrir <code>APP/index.html</code>.</p><small>${esc(state.error)}</small></div>`:({home,explore,language:languagePage,owned,wishes,stats,settings}[state.page]||home)();$('#main').innerHTML=html;document.querySelectorAll('[data-view]').forEach(t=>t.classList.toggle('active',t.dataset.view===state.page))}
function showBook(id){const b=state.books.find(x=>x.id===id);if(!b)return;const m=state.marks[id]||{}, n=state.notes[id]||{};$('#dialogContent').innerHTML=`<div class="modal-head"><div><div class="eyebrow">FITXA D’EDICIÓ</div><h2>${esc(b.title)}</h2><div class="subtle">${esc(state.languages.find(x=>x.id===b.languageId)?.name||'')}</div></div><button class="close" data-close aria-label="Tancar">×</button></div><div class="detailgrid"><div>${image(b.cover,b.title)}</div><div><dl class="metadata"><dt>Any</dt><dd>${esc(b.year||'—')}</dd><dt>Editorial</dt><dd>${esc(b.publisher||'—')}</dd><dt>ISBN</dt><dd>${esc(b.isbn||'—')}</dd><dt>País</dt><dd>${esc(b.country||'—')}</dd><dt>Traductor</dt><dd>${esc(b.translator||'—')}</dd><dt>Font</dt><dd><a href="${esc(b.sourceUrl)}" target="_blank" rel="noopener">Col·lecció original ↗</a></dd></dl><div class="detail-actions"><button class="mark ${m.owned?'owned':''}" data-mark="owned" data-id="${esc(id)}">✓ Tinc</button><button class="mark ${m.wish?'wish':''}" data-mark="wish" data-id="${esc(id)}">♡ Vull</button></div></div></div><label>Notes personals<textarea id="noteField">${esc(n.note||'')}</textarea></label><div class="detail-actions"><button class="primary" data-save="${esc(id)}">Desar notes</button><button class="ghost" data-close>Tancar</button></div>`;$('#editionDialog').showModal()}
function mark(id,type){if(!state.books.find(x=>x.id===id))return;const mark=state.marks[id]||{};mark[type]=!mark[type];mark.modifiedAt=new Date().toISOString();state.marks[id]=mark;save();if($('#editionDialog').open){$('#editionDialog').close();showBook(id)}render();toast('Col·lecció actualitzada')}
function saveNote(id){state.notes[id]={note:$('#noteField')?.value||''};save();$('#editionDialog').close();toast('Nota desada')}
function exportBackup(){const out={format:'le-petit-prince-v6-user',created:new Date().toISOString(),marks:state.marks,notes:state.notes};const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='petit-prince-collection-v13.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
async function importBackup(f){if(!f)return;const d=JSON.parse(await f.text());if(d.format!=='le-petit-prince-v6-user'||!d.marks||!d.notes)throw Error('Format no compatible');if(!confirm('Fusionar aquesta còpia amb les marques i notes actuals?'))return;Object.assign(state.marks,d.marks);Object.assign(state.notes,d.notes);save();render();toast('Còpia incorporada')}
function updateBackButton(){
 const back=$('#headerBack');if(back)back.disabled=state.history.length===0 && state.page==='home';
}
function navigate(page, remember=true){
 if(remember && (page!==state.page || (page==='language' && state.languageId!==state.lastOpenedLanguageId))){
   state.history.push({page:state.page,languageId:state.lastOpenedLanguageId||null});
   if(state.history.length>50)state.history.shift();
 }
 state.page=page;
 if(page==='home')chooseHomeLanguages();
 if(page==='language')state.lastOpenedLanguageId=state.languageId;
 render();updateBackButton();window.scrollTo(0,0);
}
function goBack(){
 if($('#editionDialog')?.open){$('#editionDialog').close();return}
 if($('#installDialog')?.open){$('#installDialog').close();return}
 const prev=state.history.pop();
 if(!prev){if(state.page!=='home')navigate('home',false);return}
 state.languageId=prev.languageId;state.lastOpenedLanguageId=prev.languageId;
 navigate(prev.page,false);
}
function installationHelp(){
 const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const safari=/Safari/i.test(navigator.userAgent)&&!/Chrome|CriOS|FxiOS|Edg/i.test(navigator.userAgent);
 const android=/Android/i.test(navigator.userAgent);
 const standalone=window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone;
 if(standalone)return 'La PWA ja està oberta com a aplicació instal·lada.';
 if(location.protocol==='file:')return 'Per instal·lar-la, obre la versió publicada a GitHub Pages (HTTPS). Des d’un fitxer local pots utilitzar-la però no instal·lar-la com a PWA.';
 if(ios)return safari?'Toca el botó Compartir de Safari i selecciona «Afegir a la pantalla d’inici». Després confirma amb «Afegir».':'Obre aquesta pàgina amb Safari. Toca Compartir i «Afegir a la pantalla d’inici».';
 if(android)return 'Obre el menú ⋮ del navegador i selecciona «Instal·lar aplicació» o «Afegir a la pantalla d’inici».';
 return 'Obre el menú del navegador i selecciona «Instal·lar aplicació» o busca la icona d’instal·lació a la barra d’adreces. Si no és disponible, pots continuar utilitzant la PWA des del navegador.';
}
function openInstallHelp(){
 $('#installHelp').textContent=installationHelp();$('#installDialog').showModal();
}

function wire(){document.addEventListener('click',e=>{const t=e.target.closest('[data-view],[data-lang],[data-book],[data-mark],[data-close],[data-save],#export,#importBackup');if(!t)return;if(t.dataset.view){navigate(t.dataset.view);return}if(t.dataset.lang){state.languageId=t.dataset.lang;navigate('language');return}if(t.dataset.book){showBook(t.dataset.book);return}if(t.dataset.mark){mark(t.dataset.id,t.dataset.mark);return}if('close'in t.dataset){$('#editionDialog').close();return}if(t.dataset.save){saveNote(t.dataset.save);return}if(t.id==='export'){exportBackup();return}if(t.id==='importBackup'){$('#backupFile').click();return}});document.addEventListener('input',e=>{if(e.target.id==='search'){const caret=e.target.selectionStart;state.search=e.target.value;render();const x=$('#search');if(x){x.focus();x.setSelectionRange(caret,caret)}}});document.addEventListener('change',async e=>{if(e.target.id==='filter'){state.filter=e.target.value;render()}if(e.target.id==='sort'){state.order=e.target.value;render()}if(e.target.id==='backupFile'){try{await importBackup(e.target.files[0])}catch(err){toast('Error: '+err.message)}e.target.value=''}});window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.install=e});
 window.addEventListener('appinstalled',()=>{state.install=null;toast('App instal·lada!')});
 $('#headerBack').addEventListener('click',goBack);
 $('#install').addEventListener('click',async()=>{
   if(state.install){const prompt=state.install;state.install=null;try{await prompt.prompt()}catch{openInstallHelp()}return}
   openInstallHelp();
 });
 $('#installClose').addEventListener('click',()=>$('#installDialog').close());
 $('#installDone').addEventListener('click',()=>$('#installDialog').close());
}
function init(){
  loadUser();readOld();wire();
  try{
    // El catàleg s'inclou com a script clàssic i no necessita fetch().
    // Per tant, funciona obrint index.html directament en file:// i també per HTTPS.
    const d=window.LPP_CATALOG;
    if(!d||!Array.isArray(d.languages)||!Array.isArray(d.editions))throw Error('Falta catalog-data.js o té un format incorrecte');
    state.languages=d.languages;
    state.books=d.editions;
    state.catalogInfo={partial:!!d.partial,sourceCountLanguages:d.sourceCountLanguages,sourceCountEditions:d.sourceCountEditions};
    state.error='';
    chooseHomeLanguages();
    render();updateBackButton();
  }catch(err){
    state.error='No s’ha pogut carregar DATA/catalog-data.js: '+err.message;
    render();
  }
  // Service Worker només quan el navegador admet instal·lació i HTTPS/localhost.
  if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))navigator.serviceWorker.register('./sw.js').catch(console.warn);
}
init();


/* v10 — transició d'entrada i feedback màgic */
(function installMagic(){
 const opening=document.getElementById('opening');
 if(opening){
  const remove=()=>opening.remove();
  opening.addEventListener('animationend',e=>{if(e.target===opening)remove()},{once:true});
  // When reduced motion is enabled, don't leave an invisible blocking layer.
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)remove();
  // An accessibility fallback; the animation is otherwise exactly 2500 ms.
  setTimeout(remove,2900);
 }
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 document.addEventListener('pointerdown',event=>{
  if(reduced() || event.button>0)return;
  const t=event.target.closest('button,[data-lang],[data-book]');
  if(!t || t.disabled || document.getElementById('opening'))return;
  let x=event.clientX,y=event.clientY;
  const r=t.getBoundingClientRect();
  // prevent particles appearing off-screen on keyboard-less synthetic clicks
  if(!Number.isFinite(x)||!Number.isFinite(y)){x=r.left+r.width/2;y=r.top+r.height/2}
  const special=t.matches('[data-mark]');
  const ring=document.createElement('i');ring.className='magic-ring';ring.style.cssText=`left:${x}px;top:${y}px;width:18px;height:18px`;
  document.body.appendChild(ring);ring.addEventListener('animationend',()=>ring.remove(),{once:true});
  const count=special?9:5;
  for(let i=0;i<count;i++){
   const a=(Math.PI*2*i/count)+Math.random()*.42;
   const d=(special?32:22)+Math.random()*(special?52:38);
   const star=document.createElement('i');star.className='magic-star';star.textContent=i%3===0?'✦':i%3===1?'✧':'·';
   star.style.cssText=`left:${x}px;top:${y}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d}px;--rot:${Math.round(Math.random()*260-130)}deg;--duration:${.48+Math.random()*.27}s;--star-size:${10+Math.random()*11}px`;
   document.body.appendChild(star);star.addEventListener('animationend',()=>star.remove(),{once:true});
  }
 },{passive:true});
})();
