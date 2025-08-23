
// ---------- Auth ----------
async function sha256(t){const d=new TextEncoder().encode(t);const h=await crypto.subtle.digest('SHA-256',d);return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('')}
const currentEmail = localStorage.getItem('ca:current');
if(!currentEmail){ location.href='/login.html'; }
const userRaw = localStorage.getItem('ca:user:'+currentEmail);
if(!userRaw){ location.href='/login.html'; }
const user = JSON.parse(userRaw);
document.getElementById('who').textContent = user.name;

// Namespaced storage per-user
const NS = 'ca:'+currentEmail+':';
const db = {
  get:(k,d)=>{ try { return JSON.parse(localStorage.getItem(NS+k)) ?? d } catch { return d } },
  set:(k,v)=>localStorage.setItem(NS+k,JSON.stringify(v))
};

// ---------- Theming / accessibility ----------
const root = document.documentElement;
const settings = Object.assign({fontScale:1,accent:'#00e090',contrast:false,lh:1.55}, user.settings||{});
function applyTheme(){
  root.style.setProperty('--fontScale', settings.fontScale);
  root.style.setProperty('--lh', settings.lh);
  root.style.setProperty('--brand', settings.accent);
  document.body.classList.toggle('high-contrast', !!settings.contrast);
}
applyTheme();

// Controls
document.getElementById('sFont').value = settings.fontScale;
document.getElementById('sLh').value = settings.lh;
document.getElementById('sAccent').value = settings.accent;
document.getElementById('sContrast').checked = !!settings.contrast;

['sFont','sLh','sAccent','sContrast'].forEach(id=>{
  const el = document.getElementById(id);
  if(!el) return;
  el.oninput = ()=>{
    settings.fontScale = parseFloat(document.getElementById('sFont').value);
    settings.lh = parseFloat(document.getElementById('sLh').value);
    settings.accent = document.getElementById('sAccent').value;
    settings.contrast = document.getElementById('sContrast').checked;
    applyTheme();
    user.settings = settings;
    localStorage.setItem('ca:user:'+currentEmail, JSON.stringify(user));
  };
});

// ---------- Data ----------
const classes = db.get('classes', []);
const grades  = db.get('grades', []);
const tasks   = db.get('tasks', []);
const notes   = db.get('quicknotes', []);

const els = {
  clsRows:document.getElementById('clsRows'), gRows:document.getElementById('gRows'), aRows:document.getElementById('aRows'),
  aClass:document.getElementById('aClass'), gClass:document.getElementById('gClass'), gpaOut:document.getElementById('gpaOut'),
  dashUpcoming:document.getElementById('dashUpcoming'),
  qText:document.getElementById('qText'), qList:document.getElementById('qList'),
};

const fmt = s => new Date(s).toLocaleString();
const pts = p => p>=93?4:p>=90?3.7:p>=87?3.3:p>=83?3:p>=80?2.7:p>=77?2.3:p>=73?2:p>=70?1.7:p>=67?1.3:p>=65?1:0;
const toast = m => {const t=document.getElementById('toast');t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2000)};

// ---------- Navigation ----------
document.querySelectorAll('.navbtn').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.navbtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+btn.dataset.view).classList.add('active');
  };
});

// ---------- Classes ----------
function renderClasses(){
  els.clsRows.innerHTML = classes.map((c,i)=>`<tr>
    <td><div style="width:16px;height:16px;border-radius:50%;background:${c.color||'#00e090'}"></div></td>
    <td contenteditable data-i="${i}" class="cedit">${c.n}</td>
    <td contenteditable data-i="${i}" data-field="cr" class="cedit">${c.cr||1}</td>
    <td><button data-i="${i}" class="btn alt rmC">x</button></td>
  </tr>`).join('');
  const opts = classes.map((c,i)=>`<option value="${i}">${c.n}</option>`).join('');
  els.aClass.innerHTML = '<option value="">Class…</option>'+opts;
  els.gClass.innerHTML = '<option value="">Class…</option>'+opts;
  db.set('classes', classes);
  document.querySelectorAll('.rmC').forEach(b=>b.onclick=()=>{classes.splice(+b.dataset.i,1);renderClasses();renderGrades();renderTasks();});
  document.querySelectorAll('.cedit').forEach(cell=>{
    cell.onblur=()=>{
      const i=+cell.dataset.i;
      if(cell.dataset.field==='cr'){ classes[i].cr = +cell.textContent || 1; }
      else { classes[i].n = cell.textContent.trim(); }
      db.set('classes',classes); renderGrades(); renderTasks();
    };
  });
}
document.getElementById('addClass').onclick=()=>{
  const n=document.getElementById('clsName').value.trim();
  const cr=+document.getElementById('clsCred').value||1;
  const color=document.getElementById('clsColor').value||'#00e090';
  if(!n) return; classes.push({n,cr,color}); renderClasses();
  document.getElementById('clsName').value=''; document.getElementById('clsCred').value='';
};
renderClasses();

// ---------- Grades / GPA ----------
function renderGrades(){
  els.gRows.innerHTML = grades.map((g,i)=>`<tr>
    <td>${classes[g.c]?.n||'?'}</td>
    <td contenteditable data-i="${i}" class="gedit">${g.p}</td>
    <td>${pts(g.p)}</td><td>${classes[g.c]?.cr||1}</td>
    <td><button data-i="${i}" class="btn alt rmG">x</button></td>
  </tr>`).join('');
  const s=grades.reduce((a,g)=>{const cr=classes[g.c]?.cr||1;return{w:a.w+pts(g.p)*cr,c:a.c+cr}},{w:0,c:0});
  els.gpaOut.textContent=s.c?(s.w/s.c).toFixed(2):'0.00';
  db.set('grades',grades);
  document.querySelectorAll('.rmG').forEach(b=>b.onclick=()=>{grades.splice(+b.dataset.i,1);renderGrades();});
  document.querySelectorAll('.gedit').forEach(cell=>{
    cell.onblur=()=>{ const i=+cell.dataset.i; grades[i].p=+cell.textContent||0; db.set('grades',grades); renderGrades(); };
  });
}
document.getElementById('addG').onclick=()=>{
  const c=+document.getElementById('gClass').value; const p=+document.getElementById('gPct').value;
  if(isNaN(c)||isNaN(p)) return; grades.push({c,p}); renderGrades(); document.getElementById('gPct').value='';
};
renderGrades();

// ---------- Assignments ----------
function renderTasks(){
  tasks.sort((a,b)=>new Date(a.d)-new Date(b.d));
  els.aRows.innerHTML = tasks.map((t,i)=>`<tr>
    <td><span style="display:inline-flex;align-items:center;gap:8px">
      <span style="width:12px;height:12px;border-radius:50%;background:${classes[t.c]?.color||'#00e090'}"></span>${classes[t.c]?.n||''}</span></td>
    <td contenteditable data-i="${i}" class="tedit">${t.t}</td>
    <td>${new Date(t.d).toLocaleString()}</td>
    <td>${t.done?'✅':'⏳'}</td>
    <td><button data-i="${i}" class="btn alt dn">${t.done?'Undo':'Done'}</button></td>
  </tr>`).join('');
  db.set('tasks',tasks);
  document.querySelectorAll('.dn').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;tasks[i].done=!tasks[i].done;renderTasks();});
  document.querySelectorAll('.tedit').forEach(cell=>{
    cell.onblur=()=>{ const i=+cell.dataset.i; tasks[i].t=cell.textContent.trim(); db.set('tasks',tasks); };
  });
  renderDash();
}
document.getElementById('addA').onclick=async()=>{
  const t=document.getElementById('aTitle').value.trim();
  const c=+document.getElementById('aClass').value; const d=document.getElementById('aDue').value;
  if(!t||!d) return; tasks.push({t,c:isNaN(c)?null:c,d,done:false}); renderTasks();
  document.getElementById('aTitle').value=''; document.getElementById('aDue').value='';
  if(Notification && Notification.permission==='default'){ await Notification.requestPermission(); }
};
renderTasks();

function renderDash(){
  const upcoming = tasks.filter(t=>!t.done).slice(0,5);
  els.dashUpcoming.innerHTML = upcoming.length?('<ul>'+upcoming.map(t=>`<li><b>${classes[t.c]?.n||'General'}</b>: ${t.t} — <span class="small">${new Date(t.d).toLocaleString()}</span></li>`).join('')+'</ul>'):'<p>No upcoming work 🎉</p>';
}

// ---------- Essay helper ----------
function essayInit(){
  const input=document.getElementById('essay'); const out=document.getElementById('out');
  document.getElementById('rewrite').onclick=()=>{
    let text=input.value;
    const map={furthermore:'plus',however:'but',therefore:'so',utilize:'use',numerous:'many',extremely:'very',obtain:'get'};
    text=text.replace(/\b(furthermore|however|therefore|utilize|numerous|extremely|obtain)\b/gi,m=>map[m.toLowerCase()]||m);
    text=text.replace(/\s+/g,' ').trim(); out.textContent=text;
  };
  document.getElementById('outline').onclick=()=>{
    const s=input.value.split(/\n+|\.\\s+/).filter(Boolean);
    out.textContent=s.map(x=>'- '+x.trim()).join('\\n');
  };
}
essayInit();

// ---------- Quick notes & Pomodoro ----------
const qList = document.getElementById('qList');
function renderNotes(){
  qList.innerHTML = notes.map((n,i)=>`<li>${n.t} <button class='btn alt rmN' data-i='${i}' style='padding:4px 8px;margin-left:6px'>x</button></li>`).join('');
  db.set('quicknotes', notes);
  document.querySelectorAll('.rmN').forEach(b=>b.onclick=()=>{notes.splice(+b.dataset.i,1);renderNotes()});
}
document.getElementById('qAdd').onclick=()=>{ const t=document.getElementById('qText').value.trim(); if(!t) return; notes.push({t,at:Date.now()}); document.getElementById('qText').value=''; renderNotes(); };
renderNotes();

let pTimer=null, pEnd=0;
function tickPomodoro(){
  const left = Math.max(0, pEnd - Date.now());
  const m = Math.floor(left/60000).toString().padStart(2,'0');
  const s = Math.floor((left%60000)/1000).toString().padStart(2,'0');
  document.getElementById('pOut').innerHTML = `<b>${m}:${s}</b> <span class='small'>Focus</span>`;
  if(left<=0){ clearInterval(pTimer); pTimer=null; toast('Time! Take a break.'); if(Notification && Notification.permission==='granted'){ new Notification('ClassAid', {body:'Pomodoro finished'}); } }
}
document.getElementById('pStart').onclick=async()=>{
  const mins = +document.getElementById('pDur').value || 25;
  pEnd = Date.now() + mins*60000; tickPomodoro(); clearInterval(pTimer); pTimer=setInterval(tickPomodoro, 250);
  if(Notification && Notification.permission==='default'){ await Notification.requestPermission(); }
};
document.getElementById('pStop').onclick=()=>{ clearInterval(pTimer); pTimer=null; document.getElementById('pOut').innerHTML = `<b>${(+document.getElementById('pDur').value||25).toString().padStart(2,'0')}:00</b> <span class='small'>Focus</span>`; };

// ---------- Export / Import ----------
function exportAll(){
  const data={classes,grades,tasks,quicknotes:notes,settings,version:2};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:'classaid-backup.json'}); a.click(); URL.revokeObjectURL(a.href);
}
function importAll(file){
  const r=new FileReader();
  r.onload=()=>{ try{
    const d=JSON.parse(r.result);
    ['classes','grades','tasks','quicknotes'].forEach(k=>{ if(Array.isArray(d[k])){ const ref={classes,grades,tasks,quicknotes:notes}[k]; ref.splice(0,ref.length,...d[k]); } });
    if(d.settings){ Object.assign(settings,d.settings); applyTheme(); }
    renderClasses(); renderGrades(); renderTasks(); renderNotes();
  }catch{ alert('Invalid JSON') } };
  r.readAsText(file);
}
document.getElementById('exportBtn').onclick=exportAll;
document.getElementById('importFile').onchange=e=>importAll(e.target.files[0]);

// ---------- Logout ----------
document.getElementById('btnLogout').onclick=()=>{ localStorage.removeItem('ca:current'); location.href='/login.html'; };

// ---------- Overlay toggle from mini chip (created in HTML in previous versions) ----------
setTimeout(()=>{
  const mini=document.createElement('button'); mini.textContent='Sticky Notes'; mini.className='btn alt'; mini.style.position='fixed'; mini.style.left='16px'; mini.style.bottom='16px'; mini.style.zIndex='25';
  mini.onclick=()=>{ window.ClassAidOverlay && window.ClassAidOverlay.toggle(); };
  document.body.appendChild(mini);
},1200);
