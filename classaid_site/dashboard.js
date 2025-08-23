
const db={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
const classes=db.get('classes',[]),grades=db.get('grades',[]),tasks=db.get('tasks',[]),resources=db.get('resources',[
  {t:'Desmos Calculator',u:'https://www.desmos.com/scientific'},
  {t:'Khan Academy',u:'https://www.khanacademy.org/'},
  {t:'Citation Machine',u:'https://www.citationmachine.net/'}
]);
const els={clsRows:document.getElementById('clsRows'),gRows:document.getElementById('gRows'),aRows:document.getElementById('aRows'),
           aClass:document.getElementById('aClass'),gClass:document.getElementById('gClass'),gpaOut:document.getElementById('gpaOut'),
           resList:document.getElementById('resList'), caMini:document.getElementById('caMini')};

// Helpers
const fmt=s=>new Date(s).toLocaleString();
const pts=p=>p>=93?4:p>=90?3.7:p>=87?3.3:p>=83?3:p>=80?2.7:p>=77?2.3:p>=73?2:p>=70?1.7:p>=67?1.3:p>=65?1:0;
const popIn=(tr)=>{tr.style.transition='transform .3s cubic-bezier(.2,.7,.3,1), opacity .3s';tr.style.transform='scale(1.02)';tr.style.opacity='.8';setTimeout(()=>{tr.style.transform='';tr.style.opacity='';},10)};

// Renderers
function renderClasses(){
  els.clsRows.innerHTML = classes.map((c,i)=>`<tr><td>${c.n}</td><td>${c.cr||1}</td><td><button data-i='${i}' class='btn alt rmC'>x</button></td></tr>`).join('');
  const opts = classes.map((c,i)=>`<option value='${i}'>${c.n}</option>`).join('');
  els.aClass.innerHTML = '<option value=\"\">Class…</option>'+opts;
  els.gClass.innerHTML = '<option value=\"\">Class…</option>'+opts;
  db.set('classes', classes);
  document.querySelectorAll('.rmC').forEach(b=>b.onclick=()=>{classes.splice(+b.dataset.i,1);renderClasses();renderGrades();renderTasks();});
}
function addClass(){
  const n=document.getElementById('clsName').value.trim();
  const cr=+document.getElementById('clsCred').value||1;
  if(!n) return;
  classes.push({n,cr}); renderClasses();
  document.getElementById('clsName').value=''; document.getElementById('clsCred').value='';
  const last=els.clsRows.lastElementChild; if(last) popIn(last);
}

function renderGrades(){
  els.gRows.innerHTML = grades.map((g,i)=>`<tr><td>${classes[g.c]?.n||'?'}</td><td>${g.p}%</td><td>${pts(g.p)}</td><td>${classes[g.c]?.cr||1}</td><td><button data-i='${i}' class='btn alt rmG'>x</button></td></tr>`).join('');
  const s=grades.reduce((a,g)=>{const cr=classes[g.c]?.cr||1;return{w:a.w+pts(g.p)*cr,c:a.c+cr}},{w:0,c:0});
  els.gpaOut.textContent = s.c?(s.w/s.c).toFixed(2):'0.00';
  db.set('grades', grades);
  document.querySelectorAll('.rmG').forEach(b=>b.onclick=()=>{grades.splice(+b.dataset.i,1);renderGrades();});
}
function addGrade(){
  const c=+document.getElementById('gClass').value; const p=+document.getElementById('gPct').value;
  if(isNaN(c)||isNaN(p)) return; grades.push({c,p}); renderGrades();
  document.getElementById('gPct').value=''; const last=els.gRows.lastElementChild; if(last) popIn(last);
}

function renderTasks(){
  els.aRows.innerHTML = tasks.map((t,i)=>`<tr><td>${t.t}</td><td>${classes[t.c]?.n||''}</td><td>${fmt(t.d)}</td><td>${t.done?'✅':'⏳'}</td><td><button data-i='${i}' class='btn alt dn'>${t.done?'Undo':'Done'}</button></td></tr>`).join('');
  db.set('tasks', tasks);
  document.querySelectorAll('.dn').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;tasks[i].done=!tasks[i].done;renderTasks();});
}
async function addTask(){
  const t=document.getElementById('aTitle').value.trim();
  const c=+document.getElementById('aClass').value;
  const d=document.getElementById('aDue').value;
  if(!t||!d) return;
  tasks.push({t,c:isNaN(c)?null:c,d,done:false}); renderTasks();
  document.getElementById('aTitle').value=''; document.getElementById('aDue').value='';
  if(Notification && Notification.permission==='default'){ await Notification.requestPermission(); }
  const last=els.aRows.lastElementChild; if(last) popIn(last);
}

function renderResources(){
  els.resList.innerHTML = resources.map((r,i)=>`<li><a target=_blank href='${r.u}'>${r.t}</a> <button data-i='${i}' class='btn alt rr' style='padding:4px 8px;margin-left:6px'>x</button></li>`).join('');
  db.set('resources', resources);
  document.querySelectorAll('.rr').forEach(b=>b.onclick=()=>{resources.splice(+b.dataset.i,1);renderResources();});
}
function addResource(){
  const t=document.getElementById('resTitle').value.trim(); const u=document.getElementById('resUrl').value.trim();
  if(!t||!u) return; resources.push({t,u}); renderResources();
  document.getElementById('resTitle').value=''; document.getElementById('resUrl').value='';
}

// Essay helper (local)
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

// Export/Import
function exportAll(){
  const data={classes,grades,tasks,resources,v:1};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:'classaid-backup.json'}); a.click(); URL.revokeObjectURL(a.href);
}
function importAll(file){
  const r=new FileReader();
  r.onload=()=>{ try{
    const d=JSON.parse(r.result);
    ['classes','grades','tasks','resources'].forEach(k=>{ if(Array.isArray(d[k])){ const ref={classes,grades,tasks,resources}[k]; ref.splice(0,ref.length,...d[k]); } });
    renderClasses(); renderGrades(); renderTasks(); renderResources();
  }catch{ alert('Invalid JSON') } };
  r.readAsText(file);
}

// Wire events
document.getElementById('addClass').onclick=addClass;
document.getElementById('addG').onclick=addGrade;
document.getElementById('addA').onclick=addTask;
document.getElementById('exportBtn').onclick=exportAll;
document.getElementById('importFile').onchange=e=>importAll(e.target.files[0]);
document.getElementById('addRes').onclick=addResource;
document.getElementById('toggleOverlay').onclick=()=>{ window.ClassAidOverlay && window.ClassAidOverlay.toggle(); };

// Initial renders
renderClasses(); renderGrades(); renderTasks(); renderResources(); essayInit();

// Show a tiny "Sticky Notes" button when overlay hidden
setTimeout(()=>{ els.caMini.style.display='block'; els.caMini.onclick=()=>window.ClassAidOverlay && window.ClassAidOverlay.toggle(); }, 1200);
