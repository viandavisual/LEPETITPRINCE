/* Le Petit Prince World Collection v11 — independent persistent background music */
(()=>{
 'use strict';
 const audio=document.getElementById('bgMusic');
 const toggle=document.getElementById('musicToggle');
 const next=document.getElementById('musicNext');
 const label=document.getElementById('musicLabel');
 if(!audio||!toggle||!next)return;
 const TRACKS=[1,2,3,4].map(n=>'assets/music/principito_'+n+'.mp3');
 const KEY='lpp-world-music-preference-v11';
 const LAST='lpp-world-music-last-v11';
 let enabled=localStorage.getItem(KEY)!=='off';
 let last=-1;
 const old=Number(localStorage.getItem(LAST));
 if(Number.isInteger(old)&&old>=0&&old<TRACKS.length) last=old;
 let active=-1, pending=false;
 audio.volume=0.32;
 function draw(){
  const playing=!audio.paused;
  toggle.classList.toggle('is-playing',playing);
  toggle.setAttribute('aria-pressed',String(enabled));
  label.textContent=playing?'Sonant':enabled?'Música':'Silenci';
  toggle.title=enabled?'Silenciar música':'Activar música';
  toggle.setAttribute('aria-label',toggle.title);
  next.disabled=!enabled;
 }
 function choose(){
  if(TRACKS.length===1)return 0;
  let index=Math.floor(Math.random()*(TRACKS.length-1));
  if(index>=last)index++;
  last=index;
  try{localStorage.setItem(LAST,String(last))}catch{}
  return index;
 }
 async function playNew(){
  if(!enabled||pending)return;
  pending=true;
  active=choose();
  audio.src=TRACKS[active];
  audio.load();
  try{await audio.play();}catch(err){
   // User gesture required by some browsers: retry on first interaction.
   if(err.name!=='NotAllowedError')console.warn('Music:',err);
  }finally{pending=false;draw()}
 }
 async function resume(){
  if(!enabled||pending)return;
  if(active<0){await playNew();return}
  try{await audio.play()}catch{}draw();
 }
 toggle.addEventListener('click',async()=>{
  enabled=!enabled;
  try{localStorage.setItem(KEY,enabled?'on':'off')}catch{}
  if(enabled)await resume();else audio.pause();
  draw();
 });
 next.addEventListener('click',()=>{if(enabled)playNew()});
 audio.addEventListener('ended',()=>{if(enabled)playNew()});
 audio.addEventListener('error',()=>{
  // A broken audio file must not create an endless retry loop.
  draw();
 });
 audio.addEventListener('play',draw);
 audio.addEventListener('pause',draw);
 // We try once after the intro. Browsers may require explicit interaction.
 setTimeout(()=>{if(enabled)resume()},2500);
 const gesture=()=>{if(enabled&&audio.paused)resume()};
 document.addEventListener('pointerdown',gesture,{capture:true});
 document.addEventListener('keydown',gesture,{capture:true});
 draw();
})();
