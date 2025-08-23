// Auth / user
const currentEmail = localStorage.getItem('ca:current'); if(!currentEmail){ location.href='login.html'; }
const userRaw = localStorage.getItem('ca:user:'+currentEmail); if(!userRaw){ location.href='login.html'; }
const user = JSON.parse(userRaw); document.getElementById('who').textContent = user.name;

// Per-user storage
const NS = 'ca:'+currentEmail+':';
const db = { get:(k,d)=>{ try { return JSON.parse(localStorage.getItem(NS+k)) ?? d } catch { return d } }, set:(k,v)=>localStorage.setItem(NS+k,JSON.stringify(v)) };

// Theme
const root = document.documentElement;
const settings = Object.assign({fontScale:1,accent:'#00e090',contrast:false,lh:1.55}, user.settings||{});
function applyTheme(){ root.style.setProperty('--fontScale', settings.fontScale); root.style.setProperty('--lh', settings.lh); root.style.setProperty('--brand', settings.accent); document.body.classList.toggle('high-contrast', !!settings.contrast); }
applyTheme();
['sFont','sLh','sAccent','sContrast'].forEach(id=>{ const el=document.getElementById(id); if(!el) return; if(id==='sFont') el.value=settings.fontScale; if(id==='sLh') el.value=settings.lh; if(id==='sAccent') el.value=settings.accent; if(id==='sContrast') el.checked=!!settings.contrast; el.oninput=()=>{ settings.fontScale=parseFloat(sFont.value); settings.lh=parseFloat(sLh.value); settings.accent=sAccent.value; settings.contrast=sContrast.checked; applyTheme(); user.settings=settings; localStorage.setItem('ca:user:'+currentEmail, JSON.stringify(user)); }; });

// Data
const classes = db.get('classes', []), grades=db.get('grades', []), tasks=db.get('tasks', []), notes=db.get('quicknotes', []), sets=db.get('sets', []);
const els = { clsRows:$('#clsRows'), gRows:$('#gRows'), aRows:$('#aRows'), aClass:$('#aClass'), gClass:$('#gClass'), gpaOut:$('#gpaOut'),
  dashUpcoming:$('#dashUpcoming'), qText:$('#qText'), qList:$('#qList'), setList:$('#setList'), playSet:$('#playSet'), playArea:$('#playArea') };
function $(id){ return document.getElementById(id); }
const toast = m => {const t=$('toast'); if(!t) return; t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2000)};
const pts = p => p>=93?4:p>=90?3.7:p>=87?3.3:p>=83?3:p>=80?2.7:p>=77?2.3:p>=73?2:p>=70?1.7:p>=67?1.3:p>=65?1:0;

// Nav
document.querySelectorAll('.navbtn').forEach(btn=>{ btn.onclick=()=>{ document.querySelectorAll('.navbtn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); $('#view-'+btn.dataset.view).classList.add('active'); }; });

// Classes
function renderClasses(){
  els.clsRows.innerHTML = classes.map((c,i)=>`<tr>
    <td><div style="width:16px;height:16px;border-radius:50%;background:${c.color||'#00e090'}"></div></td>
    <td contenteditable data-i="${i}" class="cedit">${c.n}</td>
    <td contenteditable data-i="${i}" data-field="cr" class="cedit">${c.cr||1}</td>
    <td><button data-i="${i}" class="btn alt rmC">x</button></td></tr>`).join('');
  const opts = classes.map((c,i)=>`<option value="${i}">${c.n}</option>`).join('');
  els.aClass.innerHTML = '<option value="">Class…</option>'+opts; els.gClass.innerHTML = '<option value="">Class…</option>'+opts;
  db.set('classes', classes);
  document.querySelectorAll('.rmC').forEach(b=>b.onclick=()=>{classes.splice(+b.dataset.i,1);renderClasses();renderGrades();renderTasks();});
  document.querySelectorAll('.cedit').forEach(cell=>{ cell.onblur=()=>{ const i=+cell.dataset.i; if(cell.dataset.field==='cr'){ classes[i].cr=+cell.textContent||1 } else { classes[i].n=cell.textContent.trim() } db.set('classes',classes); renderGrades(); renderTasks(); }; });
}
$('#addClass').onclick=()=>{ const n=$('clsName').value.trim(), cr=+$('clsCred').value||1, color=$('clsColor').value||'#00e090'; if(!n) return; classes.push({n,cr,color}); renderClasses(); $('clsName').value=''; $('clsCred').value=''; };
renderClasses();

// Grades / GPA
function renderGrades(){
  els.gRows.innerHTML = grades.map((g,i)=>`<tr><td>${classes[g.c]?.n||'?'}</td><td contenteditable data-i="${i}" class="gedit">${g.p}</td><td>${pts(g.p)}</td><td>${classes[g.c]?.cr||1}</td><td><button data-i="${i}" class="btn alt rmG">x</button></td></tr>`).join('');
  const s=grades.reduce((a,g)=>{const cr=classes[g.c]?.cr||1;return{w:a.w+pts(g.p)*cr,c:a.c+cr}},{w:0,c:0}); els.gpaOut.textContent=s.c?(s.w/s.c).toFixed(2):'0.00';
  db.set('grades',grades);
  document.querySelectorAll('.rmG').forEach(b=>b.onclick=()=>{grades.splice(+b.dataset.i,1);renderGrades();});
  document.querySelectorAll('.gedit').forEach(cell=>{ cell.onblur=()=>{ const i=+cell.dataset.i; grades[i].p=+cell.textContent||0; db.set('grades',grades); renderGrades(); }; });
}
$('#addG').onclick=()=>{ const c=+$('gClass').value; const p=+$('gPct').value; if(isNaN(c)||isNaN(p)) return; grades.push({c,p}); renderGrades(); $('gPct').value=''; };
renderGrades();

// Assignments
function renderTasks(){
  tasks.sort((a,b)=>new Date(a.d)-new Date(b.d));
  els.aRows.innerHTML = tasks.map((t,i)=>`<tr>
    <td><span style="display:inline-flex;align-items:center;gap:8px"><span style="width:12px;height:12px;border-radius:50%;background:${classes[t.c]?.color||'#00e090'}"></span>${classes[t.c]?.n||''}</span></td>
    <td contenteditable data-i="${i}" class="tedit">${t.t}</td>
    <td>${new Date(t.d).toLocaleString()}</td>
    <td>${t.done?'✅':'⏳'}</td><td><button data-i="${i}" class="btn alt dn">${t.done?'Undo':'Done'}</button></td></tr>`).join('');
  db.set('tasks',tasks);
  document.querySelectorAll('.dn').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;tasks[i].done=!tasks[i].done;renderTasks();});
  document.querySelectorAll('.tedit').forEach(cell=>{ cell.onblur=()=>{ const i=+cell.dataset.i; tasks[i].t=cell.textContent.trim(); db.set('tasks',tasks); }; });
  renderDash();
}
$('#addA').onclick=async()=>{ const t=$('aTitle').value.trim(), c=+$('aClass').value, d=$('aDue').value; if(!t||!d) return; tasks.push({t,c:isNaN(c)?null:c,d,done:false}); renderTasks(); $('aTitle').value=''; $('aDue').value=''; if(Notification && Notification.permission==='default'){ await Notification.requestPermission(); } };
renderTasks();
function renderDash(){ const upcoming=tasks.filter(t=>!t.done).slice(0,5); els.dashUpcoming.innerHTML = upcoming.length?('<ul>'+upcoming.map(t=>`<li><b>${classes[t.c]?.n||'General'}</b>: ${t.t} — <span class="small">${new Date(t.d).toLocaleString()}</span></li>`).join('')+'</ul>'):'<p>No upcoming work 🎉</p>'; }

// Study sets
function renderSets(){ $('setList').innerHTML = sets.map((s,i)=>`<li><b style="color:${s.color}">${s.name}</b> — ${s.items.length} terms <button class='btn alt' onclick='window.__editSet(${i})' style='padding:4px 8px;margin-left:6px'>Edit</button></li>`).join(''); $('playSet').innerHTML = sets.map((s,i)=>`<option value="${i}">${s.name}</option>`).join(''); db.set('sets',sets); }
window.__editSet = (i)=>{ const s = sets[i]; const lines = s.items.map(x=>`${x.t} - ${x.d}`).join('\\n'); const text = prompt('Edit terms (term - definition per line):', lines); if(text==null) return; s.items = parseItems(text); renderSets(); };
function parseItems(text){ const out=[]; const rows=text.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean); for(let j=0;j<rows.length;j++){ const r=rows[j]; if(r.includes(' - ')){ const [t,...rest]=r.split(' - '); out.push({t:t.trim(), d:rest.join(' - ').trim()}); continue; } if(r.includes(',')){ const [t,...rest]=r.split(','); out.push({t:t.trim(), d:rest.join(',').trim()}); continue; } } if(out.length===0){ for(let j=0;j<rows.length;j+=2){ const t=rows[j], d=rows[j+1]||''; if(t) out.push({t,d}); } } return out; }
$('#addSet').onclick=()=>{ const name=$('setName').value.trim(); if(!name) return; const color=$('setColor').value||'#35c995'; sets.push({name,color,items:[]}); renderSets(); $('setName').value=''; };
$('#importSet').onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ const text=r.result; const name=prompt('Name this set:' , f.name.replace(/\\.(txt|csv)$/i,''))||'Imported'; sets.push({name,color:'#35c995',items:parseItems(text)}); renderSets(); }; r.readAsText(f); };
renderSets();

// Game helpers
function el(tag, attrs={}, html=''){ const x=document.createElement(tag); Object.entries(attrs).forEach(([k,v])=>x.setAttribute(k,v)); x.innerHTML=html; return x; }
function sample(arr, n){ const a=[...arr]; const out=[]; while(a.length && out.length<n){ out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); } return out; }
// Flashcards
$('#pFlash').onclick=()=>{ const s=sets[+$('playSet').value]; if(!s||s.items.length===0){ toast('Add terms first'); return; } const items=[...s.items]; let i=0,side=0; $('playArea').innerHTML=''; const card=el('div',{'class':'flashcard',style:`border-color:${s.color}`},''); const stat=el('div',{'class':'small'},''); const btns=el('div',{'class':'row'},'<button class="btn alt" id="prev">Prev</button><button class="btn alt" id="flip">Flip</button><button class="btn alt" id="next">Next</button><button class="btn ghost" id="shuffle">Shuffle</button>'); $('playArea').append(card,stat,btns); function draw(){ const it=items[i]; card.textContent = side?it.d:it.t; stat.textContent=(i+1)+'/'+items.length; } draw(); card.onclick=()=>{side^=1;draw()}; btns.querySelector('#flip').onclick=()=>{side^=1;draw()}; btns.querySelector('#prev').onclick=()=>{i=(i-1+items.length)%items.length;side=0;draw()}; btns.querySelector('#next').onclick=()=>{i=(i+1)%items.length;side=0;draw()}; btns.querySelector('#shuffle').onclick=()=>{items.sort(()=>Math.random()-0.5);i=0;side=0;draw()}; };
// Match
$('#pMatch').onclick=()=>{ const s=sets[+$('playSet').value]; if(!s||s.items.length<4){ toast('Need at least 4 terms'); return; } const picks=sample(s.items, Math.min(8, s.items.length)); const terms=picks.map(x=>({k:x.t,v:x.d,type:'t'})); const defs=picks.map(x=>({k:x.t,v:x.d,type:'d'})); const board=[...terms,...defs].sort(()=>Math.random()-0.5); $('playArea').innerHTML=''; const grid=el('div',{'class':'grid-match'},''); $('playArea').append(grid); let first=null, matched=0, start=Date.now(); board.forEach((it)=>{ const tile=el('div',{'class':'match-item','data-k':it.k},it.type==='t'?it.k:it.v); tile.onclick=()=>{ if(tile.classList.contains('done')) return; tile.style.borderColor=getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()||'#00e090'; if(!first){ first=tile; } else { if(first.getAttribute('data-k')===tile.getAttribute('data-k') && first!==tile){ first.classList.add('done'); tile.classList.add('done'); first.style.opacity=0.5; tile.style.opacity=0.5; matched+=1; if(matched===picks.length){ const sec=Math.round((Date.now()-start)/1000); toast('Match complete in '+sec+'s'); } } else { const a=first; setTimeout(()=>{ a.style.borderColor=''; tile.style.borderColor=''; },280); } first=null; } }; grid.appendChild(tile); }); };
// MCQ
$('#pMCQ').onclick=()=>{ const s=sets[+$('playSet').value]; if(!s||s.items.length<4){ toast('Need at least 4 terms'); return; } const items=[...s.items]; items.sort(()=>Math.random()-0.5); let q=0,score=0,limit=Math.min(10,items.length); $('playArea').innerHTML=''; const ask=el('div',{},''), choices=el('div',{},''), meta=el('div',{'class':'small'},''); $('playArea').append(ask,choices,meta); function draw(){ const it=items[q]; ask.innerHTML='<h3>'+it.t+'</h3>'; const opts=sample(items.filter(x=>x!==it),3).map(x=>x.d); opts.push(it.d); opts.sort(()=>Math.random()-0.5); choices.innerHTML=opts.map(o=>`<div class='choice'>${o}</div>`).join(''); choices.querySelectorAll('.choice').forEach(c=>c.onclick=()=>{ if(c.textContent===it.d){ c.classList.add('correct'); score++; } else { c.classList.add('wrong'); } setTimeout(()=>{ q++; if(q>=limit){ meta.textContent='Score: '+score+'/'+limit; toast('MCQ finished: '+score+'/'+limit); } else draw(); },420); }); meta.textContent='Question '+(q+1)+'/'+limit+' — Score '+score; } draw(); };
// Quick Points
$('#pRush').onclick=()=>{ const s=sets[+$('playSet').value]; if(!s||s.items.length<4){ toast('Need at least 4 terms'); return; } const items=[...s.items]; let idx=0,points=0,streak=0; $('playArea').innerHTML=''; const ask=el('div',{},''), opts=el('div',{},''), meta=el('div',{'class':'small'},''); $('playArea').append(ask,opts,meta); function draw(){ const it=items[idx%items.length]; ask.innerHTML='<h3>'+it.t+'</h3>'; const choices=sample(items.filter(x=>x!==it),3).map(x=>x.d); choices.push(it.d); choices.sort(()=>Math.random()-0.5); opts.innerHTML=choices.map(o=>`<div class='choice'>${o}</div>`).join(''); opts.querySelectorAll('.choice').forEach(c=>c.onclick=()=>{ if(c.textContent===it.d){ streak++; points+=10*streak; c.classList.add('correct'); } else { streak=0; c.classList.add('wrong'); } setTimeout(()=>{ idx++; draw(); },340); }); meta.textContent='Points: '+points+' — Streak: '+streak; } draw(); };

// Notes + Pomodoro
const qList = $('qList'); function renderNotes(){ qList.innerHTML = notes.map((n,i)=>`<li>${n.t} <button class='btn alt rmN' data-i='${i}' style='padding:4px 8px;margin-left:6px'>x</button></li>`).join(''); db.set('quicknotes', notes); document.querySelectorAll('.rmN').forEach(b=>b.onclick=()=>{notes.splice(+b.dataset.i,1);renderNotes()}); }
$('#qAdd').onclick=()=>{ const t=$('qText').value.trim(); if(!t) return; notes.push({t,at:Date.now()}); $('qText').value=''; renderNotes(); };
renderNotes();

let pTimer=null, pEnd=0; function tickPomodoro(){ const left = Math.max(0, pEnd - Date.now()); const m = Math.floor(left/60000).toString().padStart(2,'0'); const s = Math.floor((left%60000)/1000).toString().padStart(2,'0'); $('pOut').innerHTML = `<b>${m}:${s}</b> <span class='small'>Focus</span>`; if(left<=0){ clearInterval(pTimer); pTimer=null; toast('Time! Take a break.'); if(Notification && Notification.permission==='granted'){ new Notification('ClassAid', {body:'Pomodoro finished'}); } } }
$('#pStart').onclick=async()=>{ const mins = +$('pDur').value || 25; pEnd = Date.now() + mins*60000; tickPomodoro(); clearInterval(pTimer); pTimer=setInterval(tickPomodoro, 250); if(Notification && Notification.permission==='default'){ await Notification.requestPermission(); } };
$('#pStop').onclick=()=>{ clearInterval(pTimer); pTimer=null; $('pOut').innerHTML = `<b>${(+$('pDur').value||25).toString().padStart(2,'0')}:00</b> <span class='small'>Focus</span>`; };

// Export / Import
function exportAll(){ const data={classes,grades,tasks,quicknotes:notes,settings,sets,version:9}; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:'classaid-backup.json'}); a.click(); URL.revokeObjectURL(a.href); }
function importAll(file){ const r=new FileReader(); r.onload=()=>{ try{ const d=JSON.parse(r.result); ['classes','grades','tasks','quicknotes','sets'].forEach(k=>{ if(Array.isArray(d[k])){ const ref={classes,grades,tasks,quicknotes:notes,sets}[k]; ref.splice(0,ref.length,...d[k]); } }); if(d.settings){ Object.assign(settings,d.settings); const userRaw=localStorage.getItem('ca:user:'+currentEmail); if(userRaw){ const u=JSON.parse(userRaw); u.settings=settings; localStorage.setItem('ca:user:'+currentEmail, JSON.stringify(u)); } applyTheme(); } renderClasses(); renderGrades(); renderTasks(); renderNotes(); renderSets(); }catch{ alert('Invalid JSON') } }; r.readAsText(file); }
$('#exportBtn').onclick=exportAll; $('#importFile').onchange=e=>importAll(e.target.files[0]);

// Logout
$('#btnLogout').onclick=()=>{ localStorage.removeItem('ca:current'); location.href='login.html'; };

// Overlay toggle chip
setTimeout(()=>{ const mini=document.getElementById('caMini'); if(mini){ mini.style.display='inline-flex'; mini.onclick=()=>window.ClassAidOverlay&&window.ClassAidOverlay.toggle(); } },800);
