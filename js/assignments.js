
const Assignments = (function(){
  function all(){ return Store.get().assignments || []; }
  function set(arr){ const d = Store.get(); d.assignments = arr; Store.set(d); }
  function add(a){ const arr = all(); arr.push(a); set(arr); render(); schedule(a); }
  function schedule(a){
    if(Notification?.permission!=='granted') return;
    const t = new Date(a.due).getTime() - Date.now() - 30*60*1000;
    if(t>0 && t<2147483647) setTimeout(()=> new Notification('Assignment Reminder',{body: a.title+' @ '+new Date(a.due).toLocaleString()}), t);
  }
  // Saved views (filters) per-profile in settings.savedViews.assignments: [{name, status, days}]
  function applyFilter(list, f){
    if(!f) return list;
    let res = list.slice();
    if(f.status && f.status!=='any'){ res = res.filter(a=> a.status===f.status); }
    if(f.days){ const cutoff = Date.now() + f.days*24*3600*1000; res = res.filter(a=> new Date(a.due).getTime() <= cutoff); }
    return res;
  }
  function render(){
    const tbody = document.querySelector('#tbl tbody'); if(!tbody) return;
    const views = Store.settings().savedViews.assignments || [];
    const sel = document.getElementById('viewSel');
    if(sel){ sel.innerHTML = '<option value="">All</option>' + views.map((v,i)=> `<option value="${i}">${v.name}</option>`).join(''); }
    const base = all().slice().sort((a,b)=> new Date(a.due)-new Date(b.due));
    const chosen = sel && sel.value ? views[Number(sel.value)] : null;
    const list = applyFilter(base, chosen);
    tbody.innerHTML='';
    list.forEach((a, idx)=>{
      const tr = document.createElement('tr');
      const soon = (new Date(a.due)-Date.now())/(1000*60*60) < 24 && a.status!=='done';
      tr.innerHTML = `<td>${a.title}</td>
        <td>${a.cls||'—'}</td>
        <td>${new Date(a.due).toLocaleString()}</td>
        <td>${a.status==='done'?'<span class="pill" style="background:#0f251b;border-color:#1f4b35">Done</span>': (soon?'<span class="pill" style="background:#201b0a;border-color:#3d3210">Soon</span>':'<span class="pill">Open</span>')}</td>
        <td><button class="btn" data-edit="${idx}">Edit</button> <button class="btn" data-done="${idx}">${a.status==='done'?'Reopen':'Done'}</button> <button class="btn danger" data-del="${idx}">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('button[data-edit]').forEach(b=> b.onclick = ()=> edit(Number(b.dataset.edit)));
    tbody.querySelectorAll('button[data-done]').forEach(b=> b.onclick = ()=> toggle(Number(b.dataset.done)));
    tbody.querySelectorAll('button[data-del]').forEach(b=> b.onclick = ()=> del(Number(b.dataset.del)));

    document.getElementById('btnNew').onclick = ()=>{
      const title = prompt('Title?'); if(!title) return;
      const cls = prompt('Class (optional)')||'';
      const due = prompt('Due (YYYY-MM-DD HH:MM, 24h local)?');
      let iso = new Date().toISOString();
      if(due){ const d = new Date(due.replace(' ','T')); if(!isNaN(d)) iso = d.toISOString(); }
      add({title, cls, due: iso, status:'open'});
    };
    const exp = document.getElementById('btnExportICS'); if(exp) exp.onclick = exportICS;
    const noti = document.getElementById('btnNotify'); if(noti) noti.onclick = async ()=>{
      const p = await Notification.requestPermission(); if(p==='granted'){ all().forEach(schedule); alert('Notifications enabled.'); }
    };
    // save view
    const sv = document.getElementById('btnSaveView');
    if(sv) sv.onclick = ()=>{
      const status = document.getElementById('fStatus').value;
      const days = Number(document.getElementById('fDays').value||'0');
      const name = prompt('Name this view (e.g., "Due this week")'); if(!name) return;
      const s = Store.settings(); s.savedViews.assignments.push({name, status, days: days||0}); Store.setSettings(s); render();
    };
    const app = document.getElementById('btnApplyFilter');
    if(app) app.onclick = ()=> render();
    if(sel) sel.onchange = ()=> render();
  }
  function edit(i){
    const st = Store.get(); const a = st.assignments[i];
    const node = UI.el('div',{},[
      UI.el('div',{},[UI.el('label',{innerText:'Title'}), UI.el('input',{id:'eTitle', value:a.title})]),
      UI.el('div',{},[UI.el('label',{innerText:'Class'}), UI.el('input',{id:'eCls', value:a.cls||''})]),
      UI.el('div',{},[UI.el('label',{innerText:'Due (YYYY-MM-DD HH:MM)'}), UI.el('input',{id:'eDue', value:a.due.slice(0,16).replace('T',' ')})])
    ]);
    UI.modal('Edit Assignment', node, ()=>{
      a.title = document.getElementById('eTitle').value||a.title;
      a.cls = document.getElementById('eCls').value||'';
      const v = document.getElementById('eDue').value; if(v){ const d = new Date(v.replace(' ','T')); if(!isNaN(d)) a.due = d.toISOString(); }
      Store.set(st); render();
    });
  }
  function toggle(i){ const st = Store.get(); st.assignments[i].status = st.assignments[i].status==='done'?'open':'done'; Store.set(st); render(); }
  function del(i){ const st = Store.get(); st.assignments.splice(i,1); Store.set(st); render(); }
  function exportICS(){
    const events = all().map((a,j)=>`BEGIN:VEVENT
UID:classaid-${j}@local
DTSTAMP:${icsDate(new Date())}
SUMMARY:${escapeICS(a.title)}
DTSTART:${icsDate(new Date(a.due))}
DTEND:${icsDate(new Date(new Date(a.due).getTime()+3600000))}
DESCRIPTION:ClassAid Assignment
END:VEVENT`).join('\n');
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ClassAid//EN
${events}
END:VCALENDAR`;
    download('classaid-assignments.ics', ics, 'text/calendar');
  }
  function icsDate(d){ const pad=n=> String(n).padStart(2,'0'); return d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())+'T'+pad(d.getUTCHours())+pad(d.getUTCMinutes())+pad(d.getUTCSeconds())+'Z'; }
  function escapeICS(s){ return String(s).replace(/[\\n,;]/g, ' '); }
  function download(name, text, type){ const blob = new Blob([text], {type}); const url = URL.createObjectURL(blob); const a = Object.assign(document.createElement('a'), {href:url, download:name}); a.click(); setTimeout(()=> URL.revokeObjectURL(url), 1000); }
  return { render, add, all };
})();
document.addEventListener('DOMContentLoaded', ()=> Assignments.render());
