/* DAM Libre – moteur du jeu. Données : etapes.js (window.ETAPES). Chaque écran vierge de index.html
   est rempli par fill() : tout élément portant data-f="clé" reçoit la valeur de la même clé. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)},$$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var E=window.ETAPES,KEY='dam69_etape',i=0,placed=[],tray=[],ctx=null,stream=null;
var store={get:function(){try{return +localStorage.getItem(KEY)||0}catch(e){return 0}},set:function(v){try{localStorage.setItem(KEY,v)}catch(e){}}};
var norm=function(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f\s]/g,'').toUpperCase()};
var pad=function(n){return String(n).padStart(2,'0')};
function fill(root,d){root.querySelectorAll('[data-f]').forEach(function(el){var k=el.getAttribute('data-f');if(d[k]!==undefined)el.textContent=d[k]})}
function show(id){$$('.screen').forEach(function(s){s.hidden=s.id!==id});var s=$('#'+id);s.classList.remove('in');void s.offsetWidth;s.classList.add('in')}
/* ---- sons (synthétisés ; un fichier assets/<son> est utilisé s'il existe) ---- */
function synth(t){try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();var o=ctx.createOscillator(),g=ctx.createGain(),n=ctx.currentTime;o.connect(g);g.connect(ctx.destination);
 if(t==='sirene'){o.type='sawtooth';for(var k=0;k<6;k++)o.frequency.setValueAtTime(k%2?600:900,n+k*.5);g.gain.setValueAtTime(.12,n);g.gain.linearRampToValueAtTime(0,n+3);o.start(n);o.stop(n+3)}
 else if(t==='explosion'){var b=ctx.createBuffer(1,ctx.sampleRate*1.2,ctx.sampleRate),d=b.getChannelData(0);for(var j=0;j<d.length;j++)d[j]=(Math.random()*2-1)*Math.pow(1-j/d.length,3);var s=ctx.createBufferSource();s.buffer=b;g.gain.value=.8;s.connect(g);s.start()}
 else if(t==='crackle'){var b2=ctx.createBuffer(1,ctx.sampleRate*.8,ctx.sampleRate),d2=b2.getChannelData(0);for(var m=0;m<d2.length;m++)d2[m]=(Math.random()<.04?(Math.random()*2-1):0)*(1-m/d2.length);var s2=ctx.createBufferSource();s2.buffer=b2;g.gain.value=.9;s2.connect(g);s2.start()}
 else if(t==='beep'){o.type='square';o.frequency.value=880;g.gain.setValueAtTime(.1,n);g.gain.setValueAtTime(0,n+.18);o.start(n);o.stop(n+.2)}
 else if(t==='fanfare'){o.type='triangle';[523,659,784,1047].forEach(function(f,k){o.frequency.setValueAtTime(f,n+k*.18)});g.gain.setValueAtTime(.18,n);g.gain.linearRampToValueAtTime(0,n+.9);o.start(n);o.stop(n+.9)}
 else{o.frequency.setValueAtTime(660,n);o.frequency.linearRampToValueAtTime(990,n+.15);g.gain.setValueAtTime(.15,n);g.gain.linearRampToValueAtTime(0,n+.4);o.start(n);o.stop(n+.4)}}catch(e){}}
function kind(f){var s=String(f||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return /sirene/.test(s)?'sirene':/explosion/.test(s)?'explosion':/gresill|electric/.test(s)?'crackle':/beep/.test(s)?'beep':/musique|celebr/.test(s)?'fanfare':'chime'}
function play(f){var t=kind(f);if(!f)return synth('chime');try{var au=new Audio('assets/'+encodeURI(f));au.addEventListener('error',function(){synth(t)});au.play().catch(function(){synth(t)})}catch(e){synth(t)}}
/* ---- navigation ---- */
function go(n){i=Math.max(0,Math.min(E.length-1,+n||0));store.set(i);var d=E[i];
 $('#app').className='t-'+String(d.theme||'bleu').toLowerCase();
 $('#dots').hidden=i===0;$$('#dots i').forEach(function(x,k){x.className=(k<i?'on ':'')+(k+1===i?'cur':'')});
 $('[data-f=compteur]').textContent=i?pad(i)+' / 10':'ACCÈS SÉCURISÉ';
 var view={intro:'s-intro',code:'s-mission',rubans:'s-rubans',final:'s-final'}[d.type],sc=$('#'+view),x={};for(var k in d)x[k]=d[k];x.numero=pad(i);x.phase=String(d.phase||'').toUpperCase();
 fill(sc,x);if(d.type==='code'){$('#code').value='';$('#indice').hidden=true}
 if(d.type==='rubans')initRubans(d);if(d.type==='final'){$('#btn-scan').hidden=false;$('#statut').hidden=true;$('#lien').hidden=true}
 show(view)}
function ok(){var d=E[i];fill($('#s-reussite'),{reussite:d.reussite});var v=$('#media');v.hidden=!d.media;if(d.media)v.src='assets/'+d.media;show('s-reussite');play(d.son);if(navigator.vibrate)navigator.vibrate(60)}
function ko(){fill($('#s-erreur'),{erreur:'Code incorrect : retourne travailler !'});show('s-erreur');if(navigator.vibrate)navigator.vibrate([80,60,80])}
function check(v){return norm(v)===norm(E[i].reponse)}
$('#btn-start').onclick=function(){play();go(1)};
$('#btn-valider').onclick=function(){check($('#code').value)?ok():ko()};
$('#code').addEventListener('keydown',function(e){if(e.key==='Enter')$('#btn-valider').click()});
$('#btn-indice').onclick=function(){var h=$('#indice');fill($('#s-mission'),{indice:E[i].indice||'Pas d’indice pour cette étape.'});h.hidden=!h.hidden};
$('#btn-suivant').onclick=function(){go(E[i].suivante)};
$('#btn-reessayer').onclick=function(){show(E[i].type==='rubans'?'s-rubans':'s-mission')};
/* ---- rubans à déplacer (étape de type "rubans") ---- */
function ribSVG(c){return '<svg viewBox="-30 -50 60 90"><path d="M0 4L-13 36M0 4L13 36" stroke="'+c+'" stroke-width="10" stroke-linecap="round"/><path d="M0 8C-28-18-16-46 0-28C16-46 28-18 0 8Z" fill="'+c+'" stroke="#fff" stroke-width="2.2"/></svg>'}
function initRubans(d){placed=[null,null,null];tray=d.depart.slice();drawR()}
function drawR(){var d=E[i],by={};d.rubans.forEach(function(r){by[r.id]=r});
 var el=function(id){var r=by[id];return '<div class="rub" data-id="'+id+'">'+ribSVG(r.couleur)+'<b>'+r.chiffre+'</b></div>'};
 $('#slots').innerHTML=placed.map(function(id,k){return '<div class="slot" data-k="'+k+'"><small>'+['1ER','2E','3E'][k]+'</small>'+(id?el(id):'')+'</div>'}).join('');
 $('#tray').innerHTML=tray.map(el).join('');
 $('#rcode').textContent=placed.map(function(id){return id?by[id].chiffre:'_'}).join(' ');
 $$('.rub').forEach(bindDrag)}
function out(id){var k=placed.indexOf(id);if(k>-1)placed[k]=null;var t=tray.indexOf(id);if(t>-1)tray.splice(t,1)}
function putSlot(id,k){var old=placed[k];out(id);if(old)tray.push(old);placed[k]=id;drawR()}
function putTray(id){out(id);tray.push(id);drawR()}
function bindDrag(node){var id=node.getAttribute('data-id'),sx,sy,clone,moved;
 node.addEventListener('pointerdown',function(e){sx=e.clientX;sy=e.clientY;moved=false;node.setPointerCapture(e.pointerId);
  node.onpointermove=function(m){if(!moved&&Math.hypot(m.clientX-sx,m.clientY-sy)<8)return;moved=true;
   if(!clone){clone=node.cloneNode(true);clone.classList.add('drag');document.body.appendChild(clone);node.style.opacity=.25}
   clone.style.left=(m.clientX-24)+'px';clone.style.top=(m.clientY-40)+'px';
   $$('.slot').forEach(function(s){s.classList.remove('over')});var t=document.elementsFromPoint(m.clientX,m.clientY).filter(function(n){return n.classList&&n.classList.contains('slot')})[0];if(t)t.classList.add('over')};
  node.onpointerup=function(u){node.onpointermove=node.onpointerup=null;if(clone){clone.remove();clone=null}
   if(!moved){var k=placed.indexOf(id);if(k>-1)return putTray(id);var f=placed.indexOf(null);return f>-1?putSlot(id,f):drawR()}
   var hit=document.elementsFromPoint(u.clientX,u.clientY),s=hit.filter(function(n){return n.classList&&n.classList.contains('slot')})[0];
   if(s)putSlot(id,+s.getAttribute('data-k'));else putTray(id)}})}
$('#btn-recommencer').onclick=function(){initRubans(E[i])};
$('#btn-valider-rubans').onclick=function(){var d=E[i],by={};d.rubans.forEach(function(r){by[r.id]=r});
 if(placed.indexOf(null)>-1)return ko();check(placed.map(function(id){return by[id].chiffre}).join(''))?ok():ko()};
/* ---- final : scan du QR code (jsQR) ---- */
function okQR(t){return !E[i].qr||norm(t)===norm(E[i].qr)||/^https?:\/\//i.test(String(t).trim())}
function reveal(data){stopCam();$('#scanner').hidden=true;var d=E[i],l=$('#lien');fill($('#s-final'),{message:d.reussite});$('#statut').hidden=false;$('#btn-scan').hidden=true;
 if(data&&/^https?:\/\//i.test(String(data).trim())){l.href=String(data).trim();l.hidden=false}else l.hidden=true;confetti();play(d.son)}
function stopCam(){if(stream){stream.getTracks().forEach(function(t){t.stop()});stream=null}}
function tick(){if($('#scanner').hidden)return;var cam=$('#cam'),cv=$('#cv');
 if(cam.readyState===4&&window.jsQR){cv.width=cam.videoWidth;cv.height=cam.videoHeight;var c=cv.getContext('2d');c.drawImage(cam,0,0);var im=c.getImageData(0,0,cv.width,cv.height),r=window.jsQR(im.data,im.width,im.height);
  if(r&&okQR(r.data))return reveal(r.data)}
 requestAnimationFrame(tick)}
$('#btn-scan').onclick=function(){$('#scanner').hidden=false;
 navigator.mediaDevices&&navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(function(s){stream=s;$('#cam').srcObject=s;return $('#cam').play()}).then(tick).catch(function(){$('#btn-manuel').hidden=false})};
$('#btn-fermer').onclick=function(){stopCam();$('#scanner').hidden=true};
$('#btn-manuel').onclick=function(){var w=prompt('Mot écrit sous le QR code ?');if(w&&okQR(w))reveal(w);else if(w)ko()};
function confetti(){var c=$('#confetti'),col=['#fff','#B3141E','#0033A0','#2E8B57','#FFD60A'],h='';for(var k=0;k<36;k++)h+='<i style="left:'+Math.random()*100+'%;background:'+col[k%5]+';animation-duration:'+(5+Math.random()*4)+'s;animation-delay:'+Math.random()*5+'s"></i>';c.innerHTML=h}
/* ---- démarrage ---- */
$('#dots').innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>';
var t0;$('#logo').addEventListener('pointerdown',function(){t0=setTimeout(function(){if(confirm('Recommencer le jeu depuis le début ?')){$('#confetti').innerHTML='';go(0)}},1500)});
['pointerup','pointerleave'].forEach(function(n){$('#logo').addEventListener(n,function(){clearTimeout(t0)})});
var q=new URLSearchParams(location.search);if(q.has('reset'))store.set(0);
go(q.has('etape')?q.get('etape'):store.get());
})();
