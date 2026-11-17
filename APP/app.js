'use strict';
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const SOURCE='https://www.petit-princep.cat/collection';
const DATA_KEY='lpp-world-v6-user', OLD_V5='lpp-world-v5-data',OLD_V3='lpp-world-v3-data';
const state={page:'home',languageId:null,search:'',filter:'all',order:'covers',languages:[],books:[],marks:{},notes:{},install:null,error:'',history:[],homeSelection:[],lastHomeSelection:[]};
function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(toast.tm);toast.tm=setTimeout(()=>t.classList.remove('show'),3200)}
// Format local estable: el mateix DATA_KEY de v20 garanteix compatibilitat.
// userVault es podrà importar/fusionar quan afegim autenticació, sense eliminar el local.
function save(){
 try{
  const old=JSON.parse(localStorage.getItem(DATA_KEY)||'{}')||{};
  const vault={...old,version:21,marks:state.marks,notes:state.notes,updatedAt:new Date().toISOString()};
  localStorage.setItem(DATA_KEY,JSON.stringify(vault));
  return true;
 }catch(e){console.warn('Error desant el progrés',e);toast('No s’han pogut guardar les marques');return false;}
}
function loadUser(){try{const d=JSON.parse(localStorage.getItem(DATA_KEY)||'{}');state.marks=d.marks||{};state.notes=d.notes||{}}catch{}}
function readOld(){try{if(localStorage.getItem('lpp-v6-migrated'))return;for(const key of [OLD_V5,OLD_V3]){const o=JSON.parse(localStorage.getItem(key)||'null');if(!o?.marks)continue; // Old entries have different identities: retain them in backup, not auto-match incorrectly.
  localStorage.setItem('lpp-v6-legacy-available', '1'); break;}localStorage.setItem('lpp-v6-migrated','1')}catch{}}
function allOwned(){return state.books.filter(b=>state.marks[b.id]?.owned)}
function allWanted(){return state.books.filter(b=>state.marks[b.id]?.wish)}
function ownedLanguages(){return new Set(allOwned().map(b=>b.languageId))}
function langBooks(id){return state.books.filter(b=>b.languageId===id)}
function representative(lang){return langBooks(lang.id).filter(b=>b.cover).sort((a,b)=>(parseInt(b.year)||0)-(parseInt(a.year)||0))[0]|| (lang.cover ? {cover:lang.cover,year:''} : null)}
function image(src,label){
 const valid=src && (/^https?:\/\//i.test(src)||src.startsWith('./')||src.startsWith('../DATA/covers/'));
 const safe=valid?esc(src):'assets/cover-missing.webp';
 return `<img class="catalog-cover-image" src="${safe}" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="${esc(label||'Portada no disponible')}" onerror="this.onerror=null;this.src='assets/cover-missing.webp'">`;
}
function statCards(){let langs=ownedLanguages().size;return `<div class="statgrid"><div class="stat"><strong>${langs}</strong><span>Idiomes aconseguits</span></div><div class="stat"><strong>${allOwned().length}</strong><span>Edicions que tinc</span></div><div class="stat"><strong>${allWanted().length}</strong><span>Edicions desitjades</span></div><div class="stat"><strong>${state.languages.length}</strong><span>Idiomes precarregats</span></div></div>`}
function note(){const total=state.languages.length, editions=state.books.length, covered=state.books.filter(b=>b.cover).length;const missing=state.languages.filter(l=>!representative(l)).length;const meta=state.catalogInfo||{};return `<div class="source-note"><b>Catàleg local del CAPTURADOR.</b> ${total} idiomes · ${editions} edicions · ${covered} portades locals. ${missing?`${missing} idiomes encara sense portada. `:''}${meta.partial?'La captura és parcial; pots tornar a executar el CAPTURADOR i substituir DATA. ':''}Les marques TINC/VULL es desen al dispositiu i no es modifiquen quan actualitzes DATA. <a href="${SOURCE}" target="_blank" rel="noopener">Font original ↗</a></div>`}
function langCard(l){const b=representative(l),owned=langBooks(l.id).filter(b=>state.marks[b.id]?.owned).length;return `<article class="lang-card"><div class="lang-cover" data-lang="${esc(l.id)}">${image(b?.cover,l.name)}<span class="lang-cover-label"><span>${esc(l.name)}</span></span></div><div class="lang-body"><p>${l.count||0} edicions a la font · ${langBooks(l.id).length} fitxes</p>${owned?`<div class="lang-status">✓ ${owned} a la meva col·lecció</div>`:''}<button class="secondary full" data-lang="${esc(l.id)}">Veure edicions →</button></div></article>`}
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
function languagePage(){const lang=state.languages.find(x=>x.id===state.languageId);if(!lang)return explore();const editions=langBooks(lang.id).sort((a,b)=>(parseInt(b.year)||0)-(parseInt(a.year)||0));const owned=editions.filter(b=>state.marks[b.id]?.owned).length;return `<div class="backline"><button class="ghost" data-back-list="1">← Tots els idiomes</button></div><div class="eyebrow">IDIOMA</div><div class="ed-head"><h1>${esc(lang.name)}</h1><div class="count-pill">${owned} que tinc</div></div><p class="subtle">${lang.count} registres a la font · ${editions.length} incorporats al catàleg</p><div class="linkbar"><a href="${esc(lang.sourceUrl)}" target="_blank" rel="noopener">Consulta totes les edicions a la font original ↗</a></div><div class="catalog-grid">${editions.map(bookCard).join('')}</div>`}
function owned(){const b=allOwned();return `<div class="eyebrow">COL·LECCIÓ</div><h1 class="introtitle">${b.length} edicions que tinc</h1><p class="subtle">${ownedLanguages().size} idiomes amb almenys una edició marcada.</p>${b.length?`<div class="catalog-grid">${b.map(bookCard).join('')}</div>`:`<div class="empty">Encara no has marcat cap edició.</div>`}`}
function wishes(){const b=allWanted();return `<div class="eyebrow">DESITJATS</div><h1 class="introtitle">${b.length} edicions desitjades</h1>${b.length?`<div class="catalog-grid">${b.map(bookCard).join('')}</div>`:`<div class="empty">La teva llista de desitjats és buida.</div>`}`}
function stats(){return `<div class="eyebrow">EL MEU PROGRÉS</div><h2 class="profile-section-heading">La teva col·lecció en xifres</h2>${statCards()}`}
function userPage(){
 const profile=loadProfile(),name=esc(profile.name||'Col·leccionista');
 return `<div class="user-content"><div class="eyebrow">EL MEU UNIVERS</div><h1 class="introtitle">Usuari</h1>
 <div class="panel user-panel"><div class="user-avatar">✦</div><div class="user-profile"><h3>${name}</h3><p class="subtle">Perfil local · sense necessitat de registre</p></div></div>
 <div class="panel user-name-panel"><h3>El teu nom de col·leccionista</h3><p class="subtle">El teu nom i el teu progrés es desen en aquest dispositiu.</p><div class="settings-actions"><input id="userName" maxlength="60" value="${esc(profile.name||'')}" placeholder="Nom del col·leccionista" aria-label="Nom del col·leccionista"><button class="primary" id="saveUserName">Desar nom</button></div></div>
 <button class="panel list-launch" id="saveOwnedPng" type="button"><span class="list-launch-symbol" aria-hidden="true">✦</span><span><strong>GUARDA EL TEU LLISTAT</strong><small>Còpia visual de les portades dels teus ${allOwned().length} exemplars</small></span><span class="list-launch-chevron" aria-hidden="true">›</span></button>
 <section class="user-progress"><div class="eyebrow">LES TEVES ESTADÍSTIQUES</div><h2 class="profile-section-heading">El teu progrés</h2>${statCards()}</section>
 <div class="stats-dog" aria-hidden="true"><img src="assets/dog-principito.webp" loading="lazy" alt=""></div>
 </div>`;
}
const PROFILE_KEY='lpp-world-v15-profile';
function loadProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')||{}}catch{return {}}}
function saveProfile(){const el=$('#userName');const name=(el?.value||'').trim().slice(0,60);try{localStorage.setItem(PROFILE_KEY,JSON.stringify({name}))}catch{toast('No s’ha pogut desar el perfil');return}render();toast('Nom desat')}

function settings(){return `<div class="eyebrow">DADES I AJUSTOS</div><h1 class="introtitle">Les teves dades</h1><div class="panel"><h3>Catàleg local (carpeta DATA)</h3><p class="subtle">La v14 llegeix directament <code>../DATA/catalog-data.js</code> i les portades de <code>../DATA/covers/</code>. No cal internet, servidor ni sincronització per carregar-lo. Quan el CAPTURADOR acabi, copia la carpeta DATA al costat d’APP i torna a obrir la PWA.</p>${note()}<p class="subtle">Pots actualitzar DATA en el futur sense esborrar les teves marques i notes personals.</p></div><div class="panel"><h3>Còpia de seguretat de la col·lecció</h3><p class="subtle">Les marques TINC/VULL i les notes es desen en aquest navegador, de manera independent del catàleg.</p><div class="settings-actions"><button class="primary" id="export">Exportar la meva col·lecció</button><button class="secondary" id="importBackup">Importar còpia JSON</button></div></div><div class="panel"><h3>Compatibilitat</h3><p class="subtle">Es mantenen els identificadors d’edició de la v7/v8 quan provenen de petit-princep.cat. Les fonts anteriors amb identificadors diferents no es fusionen automàticament.</p></div><div class="mutedfoot">Projecte no oficial, sense ànim de lucre. Font: <a href="${SOURCE}" target="_blank" rel="noopener">petit-princep.cat</a>.</div>`}
function render(){const html=state.error?`<section class="hero hero3"><div><div class="eyebrow">LE PETIT PRINCE · WORLD COLLECTION v15</div><h1>El teu univers de llibres</h1><p>La interfície ja està preparada. Només falta copiar les dades del CAPTURADOR.</p></div></section><div class="notice"><b>No s’ha detectat la carpeta DATA completa.</b><p>Assegura’t que hi hagi <code>APP/index.html</code> i <code>DATA/catalog-data.js</code> dins la mateixa carpeta principal. Torna a obrir <code>APP/index.html</code>.</p><small>${esc(state.error)}</small></div>`:({home,explore,language:languagePage,owned,wishes,stats:userPage,user:userPage,settings}[state.page]||home)();$('#main').innerHTML=html;document.querySelectorAll('[data-view]').forEach(t=>t.classList.toggle('active',t.dataset.view===state.page))}
function showBook(id){const b=state.books.find(x=>x.id===id);if(!b)return;const m=state.marks[id]||{}, n=state.notes[id]||{};$('#dialogContent').innerHTML=`<div class="modal-head"><div><div class="eyebrow">FITXA D’EDICIÓ</div><h2>${esc(b.title)}</h2><div class="subtle">${esc(state.languages.find(x=>x.id===b.languageId)?.name||'')}</div></div><button class="close" data-close aria-label="Tancar">×</button></div><div class="detailgrid"><div>${image(b.cover,b.title)}</div><div><dl class="metadata"><dt>Any</dt><dd>${esc(b.year||'—')}</dd><dt>Editorial</dt><dd>${esc(b.publisher||'—')}</dd><dt>ISBN</dt><dd>${esc(b.isbn||'—')}</dd><dt>País</dt><dd>${esc(b.country||'—')}</dd><dt>Traductor</dt><dd>${esc(b.translator||'—')}</dd><dt>Font</dt><dd><a href="${esc(b.sourceUrl)}" target="_blank" rel="noopener">Col·lecció original ↗</a></dd></dl><div class="detail-actions"><button class="mark ${m.owned?'owned':''}" data-mark="owned" data-id="${esc(id)}">✓ Tinc</button><button class="mark ${m.wish?'wish':''}" data-mark="wish" data-id="${esc(id)}">♡ Vull</button></div></div></div><label>Notes personals<textarea id="noteField">${esc(n.note||'')}</textarea></label><div class="detail-actions"><button class="primary" data-save="${esc(id)}">Desar notes</button><button class="ghost" data-close>Tancar</button></div>`;$('#editionDialog').showModal()}
function mark(id,type){if(!state.books.find(x=>x.id===id))return;const mark=state.marks[id]||{};mark[type]=!mark[type];mark.modifiedAt=new Date().toISOString();state.marks[id]=mark;save();if($('#editionDialog').open){$('#editionDialog').close();showBook(id)}render();toast('Col·lecció actualitzada')}
function saveNote(id){state.notes[id]={note:$('#noteField')?.value||''};save();$('#editionDialog').close();toast('Nota desada')}
function exportBackup(){const out={format:'le-petit-prince-v6-user',schemaVersion:23,created:new Date().toISOString(),marks:state.marks,notes:state.notes,profile:loadProfile()};const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='petit-prince-collection-v13.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
async function importBackup(f){if(!f)return;const d=JSON.parse(await f.text());if(d.format!=='le-petit-prince-v6-user'||!d.marks||!d.notes)throw Error('Format no compatible');if(!confirm('Fusionar aquesta còpia amb les marques i notes actuals?'))return;Object.assign(state.marks,d.marks);Object.assign(state.notes,d.notes);if(d.profile?.name&&!loadProfile().name){try{localStorage.setItem(PROFILE_KEY,JSON.stringify(d.profile))}catch{}}save();render();toast('Còpia incorporada')}
function updateBackButton(){
 const back=$('#headerBack');
 if(back)back.disabled=state.history.length===0 && state.page==='home';
}
// Conservem la pàgina i la posició real abans d'entrar en un idioma.
// El retorn restaura el mateix scroll, cerca i filtres sense reinicialitzar-los.
function capturePosition(){
 const y=window.scrollY||document.documentElement.scrollTop||0;
 const first=document.elementFromPoint(Math.min(window.innerWidth/2,200),Math.min(window.innerHeight/2,140));
 const card=first?.closest?.('[data-lang]');
 return {scrollY:y,anchor:card?.getAttribute('data-lang')||''};
}
function restorePosition(position){
 if(!position)return;
 const targetY=Number(position.scrollY)||0;
 const doc=document.documentElement;
 const old=doc.style.scrollBehavior;
 doc.style.scrollBehavior='auto';
 const restore=()=>window.scrollTo({top:Math.max(0,targetY),left:0,behavior:'instant'});
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  restore();
  // Les imatges lazy tenen contenidors amb alçada estable, però fem una segona passada.
  setTimeout(()=>{restore();doc.style.scrollBehavior=old;},100);
 }));
}
function navigate(page, remember=true, restore=null){
 if(remember && (page!==state.page || (page==='language' && state.languageId!==state.lastOpenedLanguageId))){
  state.history.push({page:state.page,languageId:state.page==='language'?state.languageId:(state.lastOpenedLanguageId||null),position:capturePosition()});
  if(state.history.length>50)state.history.shift();
 }
 state.page=page;
 if(page==='home')chooseHomeLanguages();
 if(page==='language')state.lastOpenedLanguageId=state.languageId;
 render();updateBackButton();
 if(restore)restorePosition(restore);else window.scrollTo({top:0,left:0,behavior:'instant'});
}
function goBack(){
 if($('#editionDialog')?.open){$('#editionDialog').close();return;}
 if($('#installDialog')?.open){$('#installDialog').close();return;}
 const prev=state.history.pop();
 if(!prev){if(state.page!=='home')navigate('home',false);return;}
 state.languageId=prev.languageId;
 state.lastOpenedLanguageId=prev.languageId;
 navigate(prev.page,false,prev.position);
}
function backToLanguages(){
 if($('#editionDialog')?.open){$('#editionDialog').close();return;}
 if(state.page==='language'){
  // Preferim l'entrada real d'EXPLORAR dins l'historial.
  let index=-1;for(let i=state.history.length-1;i>=0;i--){if(state.history[i].page==='explore'){index=i;break;}}
  if(index>=0){
   const prev=state.history[index];
   state.history=state.history.slice(0,index);
   state.languageId=prev.languageId;
   navigate('explore',false,prev.position);
   return;
  }
 }
 navigate('explore');
}
function isInstalledPWA(){
 return !!(window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone);
}
function installationHelp(){
 const ua=navigator.userAgent;
 const ios=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const android=/Android/i.test(ua);
 const edge=/Edg\//i.test(ua), chrome=/Chrome|CriOS/i.test(ua);
 const safari=/Safari/i.test(ua)&&!/Chrome|CriOS|FxiOS|Edg/i.test(ua);
 if(isInstalledPWA())return '<p><b>L’app ja està instal·lada.</b> La tens oberta en mode independent.</p>';
 if(location.protocol==='file:')return '<p>Per instal·lar l’app, obre la versió pública HTTPS. Obrir un fitxer local amb doble clic no permet instal·lar-lo.</p>';
 const directLink='<a href="./index.html" class="install-direct-link">Obrir l’adreça de l’app</a>';
 if(android)return `<p><b>Android · APK disponible</b></p><p>Per instal·lar Le Petit Prince com una aplicació independent, descarrega l’APK amb el botó següent. Després obre el fitxer descarregat i confirma la instal·lació. Si Android ho demana, autoritza aquesta font per instal·lar l’APK.</p><p class="install-extra"><b>Versió de prova:</b> l’APK actual té una signatura de desenvolupament. Caldrà una signatura permanent per a les actualitzacions definitives. Pots continuar utilitzant la PWA al navegador.</p>`;
 if(ios)return `<p><b>iPhone / iPad</b></p><ol><li>${safari?'A Safari, toca':'Obre l’app a Safari i toca'} <b>Compartir</b>.</li><li>Tria <b>Afegir a la pantalla d’inici</b> i confirma-ho.</li></ol>`;
 if(android&&chrome){return `<p><b>Android · Chrome</b></p><ol><li>Obre aquesta app a Chrome (no dins d’una altra app).</li><li>Al menú <b>⋮</b>, tria <b>Instal·lar aplicació</b> si apareix.</li><li>Confirma la instal·lació i obre-la des de la seva icona.</li></ol><p><b>Atenció:</b> si Chrome només ofereix <b>Crear drecera</b>, això no garanteix una PWA instal·lada. Prova d’obrir directament <code>/APP/index.html</code> i actualitza la pàgina. ${directLink}</p>`;}
 if(android)return '<p>Obre aquesta pàgina a Google Chrome i busca l’opció <b>Instal·lar aplicació</b> al menú ⋮. Algunes versions del navegador només ofereixen una drecera.</p>';
 if(edge)return '<p><b>Windows · Microsoft Edge</b></p><ol><li>Obre el menú <b>…</b>.</li><li>Selecciona <b>Aplicacions → Instal·la aquest lloc com a aplicació</b>.</li><li>Confirma i fixa-la, si vols, a la barra de tasques.</li></ol>';
 if(chrome)return '<p><b>Google Chrome · Ordinador</b></p><ol><li>Obre el menú <b>⋮</b>.</li><li>Busca <b>Instal·la la pàgina com a aplicació</b> o la icona d’instal·lació de la barra d’adreces.</li><li>Confirma-ho.</li></ol><p>Si Chrome mostra <b>«Obrir a SUPA KEEP ALIVE»</b>, hi ha un registre d’una altra PWA que pot estar capturant aquesta ruta. Revisa <code>chrome://web-app-internals</code> i les instruccions de la v18 abans d’eliminar cap instal·lació.</p>';
 return '<p>Busca l’opció d’instal·lar l’app al menú del navegador. Si només apareix una drecera, el navegador podria no admetre la instal·lació nativa.</p>';
}
function installEnvironment(){
 const ua=navigator.userAgent;
 const ios=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const android=/Android/i.test(ua);
 const chrome=/Chrome|CriOS/i.test(ua)&&!/Edg|OPR|SamsungBrowser|Firefox|FxiOS/i.test(ua);
 return {ios,android,chrome};
}
let princeInstallPending=false;
function syncInstallButton(){
 const el=$('#install');if(!el)return;
 el.hidden=isInstalledPWA();
 el.classList.toggle('install-ready',!!state.install&&!isInstalledPWA());
 el.title=state.install?'Instal·lació nativa disponible':'Obrir assistent d’instal·lació';
}
function openInstallHelp(){
 const help=$('#installHelp');
 const env=installEnvironment();
 help.innerHTML=installationHelp()
  +(env.android&&env.chrome?'<p class="install-extra"><b>Si no apareix «Instal·lar»:</b> obre Chrome directament, no des de WhatsApp o una altra app; comprova que Chrome i els serveis de Google estan actualitzats i que no hi ha cap instal·lació anterior de Prince. El sistema Android decideix si ofereix WebAPK. Aquest botó no el pot forçar.</p>':'')
  +'<p class="install-fallback">Si no hi ha instal·lació disponible, pots continuar utilitzant l’app des del navegador.</p>';
 const apk=$('#installApk');
 if(apk)apk.hidden=!env.android;
 const btn=$('#installNative');
 btn.hidden=!(state.install&&!isInstalledPWA());
 $('#installRecheck').hidden=!(env.android||env.chrome);
 if(!$('#installDialog').open)$('#installDialog').showModal();
}
async function tryNativeInstall(){
 const event=state.install;
 if(!event){openInstallHelp();return;}
 state.install=null;
 try{
  await event.prompt();
  const choice=await event.userChoice;
  if(choice?.outcome==='accepted')toast('Instal·lació acceptada; comprova la pantalla d’inici');
  else toast('Instal·lació cancel·lada');
 }catch(err){console.warn('PWA install prompt:',err);openInstallHelp()}
}

function wire(){document.addEventListener('click',e=>{const t=e.target.closest('[data-view],[data-lang],[data-book],[data-mark],[data-close],[data-save],[data-back-list],#export,#importBackup,#saveUserName,#saveOwnedPng');if(!t)return;if(t.hasAttribute('data-back-list')){backToLanguages();return}if(t.dataset.view){navigate(t.dataset.view);return}if(t.dataset.lang){state.languageId=t.dataset.lang;navigate('language');return}if(t.dataset.book){showBook(t.dataset.book);return}if(t.dataset.mark){mark(t.dataset.id,t.dataset.mark);return}if('close'in t.dataset){$('#editionDialog').close();return}if(t.dataset.save){saveNote(t.dataset.save);return}if(t.id==='saveUserName'){saveProfile();return}if(t.id==='saveOwnedPng'){openListPreview();return}if(t.id==='export'){exportBackup();return}if(t.id==='importBackup'){$('#backupFile').click();return}});document.addEventListener('input',e=>{if(e.target.id==='search'){const caret=e.target.selectionStart;state.search=e.target.value;render();const x=$('#search');if(x){x.focus();x.setSelectionRange(caret,caret)}}});document.addEventListener('change',async e=>{if(e.target.id==='filter'){state.filter=e.target.value;render()}if(e.target.id==='sort'){state.order=e.target.value;render()}if(e.target.id==='backupFile'){try{await importBackup(e.target.files[0])}catch(err){toast('Error: '+err.message)}e.target.value=''}});window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.install=e;syncInstallButton();if($('#installDialog')?.open)$('#installNative').hidden=false});
 window.addEventListener('appinstalled',()=>{state.install=null;syncInstallButton();if($('#installDialog')?.open)$('#installDialog').close();toast('App instal·lada!')});
 $('#headerBack').addEventListener('click',goBack);
 $('#userHeader').addEventListener('click',()=>navigate('user'));
 $('#installNative').addEventListener('click',()=>{if($('#installDialog').open)$('#installDialog').close();tryNativeInstall()});
 $('#install').addEventListener('click',()=>{
  if(isInstalledPWA())return;
  if(installEnvironment().android)openInstallHelp();
  else if(state.install)tryNativeInstall();
  else openInstallHelp();
 });
 $('#installRecheck').addEventListener('click',async()=>{
  const b=$('#installRecheck');b.disabled=true;b.textContent='COMPROVANT…';
  try{
   if('serviceWorker' in navigator){
    const reg=await navigator.serviceWorker.getRegistration('./');
    if(reg)await reg.update();
   }
   await new Promise(r=>setTimeout(r,850));
   if(state.install){$('#installDialog').close();tryNativeInstall();}
   else{toast('Chrome encara no ofereix la instal·lació nativa');openInstallHelp();}
  }catch(err){console.warn('Install recheck',err);toast('No s’ha pogut comprovar la instal·lació');}
  finally{b.disabled=false;b.textContent='TORNAR A COMPROVAR';}
 });
 $('#installClose').addEventListener('click',()=>$('#installDialog').close());
 $('#installDone').addEventListener('click',()=>$('#installDialog').close());
 $('#listPrev').addEventListener('click',()=>showListPage(listExport.page-1));
 $('#listNext').addEventListener('click',()=>showListPage(listExport.page+1));
 $('#listDownload').addEventListener('click',downloadListPage);
 $('#listOpenImage')?.addEventListener('click',openListImage);
 if(isAndroidWebView() && !window.LPPAndroid && $('#listAndroidHelp')){$('#listAndroidHelp').hidden=false;}
 if(isIosDevice()){$('#listOpenImage')?.removeAttribute('hidden');$('#listDownload').textContent='⬇ GUARDAR / COMPARTIR PNG';$('#listIosHelp')?.removeAttribute('hidden');}
 $('#listClose').addEventListener('click',()=>$('#listDialog').close());
 $('#listDialog').addEventListener('click',e=>{if(e.target===$('#listDialog'))$('#listDialog').close()});
}
function init(){
  // Xiaomi WebView: barra d'estat del sistema pot ocupar la part superior.
  const ua=navigator.userAgent||'';
  if(/Android/i.test(ua) && (/\bwv\b/i.test(ua)||/Version\/4\.0.*Chrome/i.test(ua)))document.documentElement.classList.add('android-webview');
  loadUser();readOld();wire();syncInstallButton();
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
  if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{reg.update().catch(()=>{});}).catch(err=>console.warn('Service Worker:',err));
}
/* v22 — còpia visual de les edicions TINC, independent de la sincronització */
const LIST_PER_PAGE=18;
const listExport={page:0,pages:[],url:'',blob:null,blobUrl:'',busy:false,stamp:null,serial:0};
const listSort=(a,b)=>{
 const la=state.languages.find(l=>l.id===a.languageId)?.name||'';
 const lb=state.languages.find(l=>l.id===b.languageId)?.name||'';
 return la.localeCompare(lb,'ca')||(Number(b.year)||0)-(Number(a.year)||0)||String(a.id).localeCompare(String(b.id));
};
function listChunk(books,n){const chunks=[];for(let i=0;i<books.length;i+=n)chunks.push(books.slice(i,i+n));return chunks.length?chunks:[[]]}
function listDate(d){return new Intl.DateTimeFormat('ca-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)}
function listFilename(){const pad=n=>String(n).padStart(2,'0'); const d=listExport.stamp||new Date();return `LE_PETIT_PRINCE_TINC_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_P${pad(listExport.page+1)}-DE-${pad(listExport.pages.length)}.png`}
function roundPath(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function rect(ctx,x,y,w,h,r,fill){roundPath(ctx,x,y,w,h,r);ctx.fillStyle=fill;ctx.fill()}
function fitText(ctx,text,x,y,maxWidth,size,{min=13,font='Arial',color='#f6eedc',weight='600',align='center'}={}){
 const s=String(text||'—');ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;
 let n=size;do{ctx.font=`${weight} ${n}px ${font}`;if(ctx.measureText(s).width<=maxWidth||n<=min)break;n-=1}while(n>min);
 if(ctx.measureText(s).width>maxWidth){let t=s;while(t.length>2&&ctx.measureText(t+'…').width>maxWidth)t=t.slice(0,-1);ctx.fillText(t+'…',x,y)}else ctx.fillText(s,x,y);
}
function loadImageForCanvas(src,timeoutMs=5000){return new Promise(resolve=>{
  if(!src){resolve(null);return}
  const im=new Image();im.crossOrigin='anonymous';let done=false;
  const finish=v=>{if(done)return;done=true;clearTimeout(timer);resolve(v)};
  const timer=setTimeout(()=>finish(null),timeoutMs);
  im.onload=()=>finish(im);im.onerror=()=>finish(null);
  im.src=src;
 })}
async function loadCoverAsDataUrl(src){
 if(!src)return null;
 try{
  const url=new URL(src,location.href);
  if(url.origin!==location.origin&&location.protocol!=='file:')return null;
  if(location.protocol!=='file:'){
   const res=await fetch(url.href,{mode:'same-origin',credentials:'same-origin'});
   if(!res.ok) return null;
   const blob=await res.blob();if(!blob.type.startsWith('image/')||blob.size>10*1024*1024)return null;
   const reader=new FileReader();
   const data=await new Promise((ok,fail)=>{reader.onload=()=>ok(reader.result);reader.onerror=fail;reader.readAsDataURL(blob)});
   return loadImageForCanvas(data);
  }
  return loadImageForCanvas(src);
 }catch{return null}
}
function drawContain(ctx,im,x,y,w,h){const scale=Math.min(w/im.naturalWidth,h/im.naturalHeight);const nw=im.naturalWidth*scale,nh=im.naturalHeight*scale;ctx.drawImage(im,x+(w-nw)/2,y+(h-nh)/2,nw,nh)}
async function makeListCanvas(books){
 const W=1080, margin=53, gap=21, cardW=(W-margin*2-gap*2)/3, rows=Math.max(1,Math.ceil(books.length/3));
 const rowH=374,top=344,footer=162,H=top+rows*rowH+footer;
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas no disponible');
 ctx.fillStyle='#0b1934';ctx.fillRect(0,0,W,H);
 const art=window.LPP_LIST_ART||{};
 const [bg,icon,...covers]=await Promise.all([
  loadImageForCanvas(art.bg),loadImageForCanvas(art.icon),
  ...books.map(b=>loadCoverAsDataUrl(b.cover))
 ]);
 if(bg){const p=ctx.createPattern(bg,'repeat');if(p){ctx.save();ctx.globalAlpha=.23;ctx.fillStyle=p;ctx.fillRect(0,0,W,H);ctx.restore()}}
 ctx.fillStyle='rgba(6,16,37,.60)';ctx.fillRect(0,0,W,H);
 if(icon)drawContain(ctx,icon,70,43,110,110);
 fitText(ctx,'LE PETIT PRINCE',198,85,790,49,{min:35,font:'Georgia',color:'#f6e3af',weight:'bold',align:'left'});
 fitText(ctx,'WORLD COLLECTION  ·  EL MEU LLISTAT',200,127,780,21,{font:'Arial',color:'#dcc88e',weight:'700',align:'left'});
 ctx.fillStyle='#eed19a';ctx.fillRect(margin,173,W-margin*2,3);
 fitText(ctx,'EXEMPLARS QUE TINC',W/2,228,900,39,{min:26,color:'#fff2cf',weight:'bold'});
 fitText(ctx,`${allOwned().length} edicions  ·  ${ownedLanguages().size} idiomes  ·  Pàgina ${listExport.page+1} de ${listExport.pages.length}`,W/2,279,970,23,{min:17,color:'#d8dfef',weight:'500'});
 for(let i=0;i<books.length;i++){
  const b=books[i],col=i%3,row=Math.floor(i/3),x=margin+col*(cardW+gap),y=top+row*rowH;
  rect(ctx,x,y,cardW,355,16,'rgba(19,35,64,.96)');
  ctx.strokeStyle='rgba(236,207,144,.55)';ctx.lineWidth=1.5;roundPath(ctx,x,y,cardW,355,16);ctx.stroke();
  rect(ctx,x+11,y+10,cardW-22,258,10,'#243753');
  const cover=covers[i];
  if(cover){ctx.save();roundPath(ctx,x+12,y+11,cardW-24,256,9);ctx.clip();drawContain(ctx,cover,x+15,y+13,cardW-30,252);ctx.restore()}
  else{
   fitText(ctx,'✦',x+cardW/2,y+105,cardW-30,66,{color:'#edce84'});
   fitText(ctx,'SENSE PORTADA',x+cardW/2,y+174,cardW-32,18,{min:13,color:'#d3dced'});
  }
  const lang=state.languages.find(l=>l.id===b.languageId)?.name||'Idioma no indicat';
  rect(ctx,x+10,y+277,cardW-20,68,9,'#050b16');
  fitText(ctx,lang,x+cardW/2,y+292,cardW-30,16,{min:12,color:'#f6d997'});
  fitText(ctx,b.title||'El Petit Príncep',x+cardW/2,y+315,cardW-30,17,{min:11,color:'#ffffff'});
  fitText(ctx,`${b.year||'Any —'} · ${b.publisher||'Editorial —'} · ID ${b.id}`,x+cardW/2,y+334,cardW-30,12,{min:10,color:'#c7d1e3',weight:'400'});
 }
 ctx.fillStyle='#081226';ctx.fillRect(0,H-footer,W,footer);
 ctx.fillStyle='#e9c984';ctx.fillRect(margin,H-footer,W-margin*2,2);
 fitText(ctx,`Desat el ${listDate(listExport.stamp)}`,W/2,H-104,940,24,{color:'#fff2d9',weight:'500'});
 fitText(ctx,'Còpia visual del teu progrés · Guarda totes les pàgines per consultar-les si perds les marques',W/2,H-62,960,16,{min:12,color:'#adbbd0',weight:'400'});
 return canvas;
}
function openListPreview(){
 listExport.pages=listChunk(allOwned().sort(listSort),LIST_PER_PAGE);
 listExport.stamp=new Date();listExport.page=0;listExport.url='';listExport.blob=null; if(listExport.blobUrl){URL.revokeObjectURL(listExport.blobUrl);listExport.blobUrl='';}
 if(!$('#listDialog').open)$('#listDialog').showModal();
 showListPage(0);
}
async function showListPage(page){
 if(page<0||page>=listExport.pages.length||listExport.busy)return;
 listExport.page=page;listExport.busy=true;
 $('#listStatus').textContent='Preparant les portades…';
 $('#listDownload').disabled=true;$('#listPrev').disabled=true;$('#listNext').disabled=true;
 $('#listPageLabel').textContent=`Pàgina ${page+1} / ${listExport.pages.length}`;
 try{
  const canvas=await makeListCanvas(listExport.pages[page]);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG no disponible')),'image/png'));
  if(listExport.blobUrl)URL.revokeObjectURL(listExport.blobUrl);
  listExport.blob=blob;
  listExport.blobUrl=URL.createObjectURL(blob);
  listExport.url='';
  $('#listPreviewImage').src=listExport.blobUrl;
  $('#listStatus').textContent=listExport.pages[page].length?`${listExport.pages[page].length} edicions en aquesta pàgina`:'Encara no tens exemplars marcats. Pots guardar igualment una imatge de la llista buida.';
 }catch(e){console.warn('PNG:',e);listExport.blob=null;listExport.url='';$('#listStatus').textContent='No s’ha pogut crear el PNG. Comprova que les imatges són accessibles.';toast('Error creant el llistat')}
 finally{listExport.busy=false;$('#listDownload').disabled=!listExport.blob;$('#listPrev').disabled=page===0;$('#listNext').disabled=page===listExport.pages.length-1;}
}
function isIosDevice(){return /iPhone|iPad|iPod/i.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1)}
function isAndroidWebView(){const ua=navigator.userAgent||'';return /Android/i.test(ua)&&(/\bwv\b/i.test(ua)||/Version\/4\.0.*Chrome/i.test(ua))}
function saveListBlobDirect(){
 if(!listExport.blob)return;
 const a=document.createElement('a');
 a.href=listExport.blobUrl;a.download=listFilename();a.style.display='none';
 document.body.appendChild(a);a.click();a.remove();
}
async function downloadListPage(){
 if(!listExport.blob)return;
 const filename=listFilename();
 // APK actualitzada: el pont natiu desa el PNG a Descàrregues (MediaStore).
 if(window.LPPAndroid && typeof window.LPPAndroid.savePng==='function'){
  try{
   const data=await new Promise((resolve,reject)=>{
    const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(listExport.blob);
   });
   window.LPPAndroid.savePng(data,filename);
   toast('Desant el PNG al Xiaomi…');return;
  }catch(e){console.warn('PNG Android:',e);toast('No s’ha pogut desar el PNG.');return}
 }
 if(isAndroidWebView()){
  toast('Cal actualitzar l’APK per descarregar PNG. La web sola no pot activar aquest permís.');
  return;
 }
 // Safari iOS: el full de compartir admet un PNG com a fitxer i ofereix «Desar imatge»/«Desar a Fitxers».
 if(isIosDevice() && navigator.share && typeof File!=='undefined'){
  try{
   const file=new File([listExport.blob],filename,{type:'image/png'});
   if(!navigator.canShare || navigator.canShare({files:[file]})){
    await navigator.share({files:[file],title:'Le Petit Prince · El meu llistat'});
    return;
   }
  }catch(e){if(e?.name==='AbortError')return;console.warn('Safari share:',e)}
 }
 saveListBlobDirect();
 if(isIosDevice())toast('Si no es desa, obre la imatge i mantén-la premuda 2 segons.');
}
function openListImage(){
 if(!listExport.blobUrl)return;
 // Sempre per una pulsació directa: Safari permet mantenir la imatge premuda per desar-la.
 const w=window.open(listExport.blobUrl,'_blank','noopener');
 if(!w){toast('Mantén premuda la imatge de la previsualització durant 2 segons per desar-la.');}
}


// v24 — restauració del bootstrap de la v23 (omès accidentalment).
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
