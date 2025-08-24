
const Importers = (function(){
  function csv(){
    const text = document.getElementById('csvInput').value.trim(); if(!text) return alert('Paste CSV first');
    const rows = text.split(/\r?\n/).map(r=> r.split(','));
    const assigns = rows.map(r=> ({ title:r[0], cls:r[1], due:new Date(r[2]).toISOString(), status:r[3]||'open' }));
    const d = Store.get(); d.assignments = (d.assignments||[]).concat(assigns); Store.set(d);
    alert('Imported '+assigns.length+' assignments'); location.href='/pages/assignments.html';
  }
  function parseICS(){
    const text = document.getElementById('icsInput').value.trim(); if(!text) return alert('Paste ICS first');
    const events = []; const lines = text.split(/\r?\n/); let cur=null;
    lines.forEach(l=>{
      if(l.startsWith('BEGIN:VEVENT')) cur={};
      else if(l.startsWith('SUMMARY:')) cur.title = l.slice(8).trim();
      else if(l.startsWith('DTSTART')){ const dt = l.split(':')[1]; cur.due = toISO(dt.trim()); }
      else if(l.startsWith('END:VEVENT')){ if(cur?.title && cur?.due){ cur.cls=''; cur.status='open'; events.push(cur);} cur=null; }
    });
    const p = document.getElementById('icsPreview'); p.textContent = events.length? ('Parsed '+events.length+' events. Click to import.') : 'No events parsed.';
    p.onclick = ()=>{ const d=Store.get(); d.assignments=(d.assignments||[]).concat(events); Store.set(d); alert('Imported '+events.length+' events'); location.href='/pages/assignments.html'; };
  }
  function toISO(dt){
    const y=dt.slice(0,4), m=dt.slice(4,6), d=dt.slice(6,8), hh=dt.slice(9,11), mm=dt.slice(11,13), ss=dt.slice(13,15);
    if(dt.endsWith('Z')) return new Date(Date.UTC(+y,+m-1,+d,+hh,+mm,+ss)).toISOString();
    return new Date(+y,+m-1,+d,+hh,+mm,+ss).toISOString();
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementById('btnImportCSV').onclick=csv;
    document.getElementById('btnImportICS').onclick=parseICS;
  });
  return {};
})();
