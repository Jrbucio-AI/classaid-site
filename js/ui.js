try{
  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
  }
  if(window.caches){
    caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))));
  }
}catch(e){}

const UI = (function(){
  function el(tag, attrs={}, children=[]){
    const x = Object.assign(document.createElement(tag), attrs);
    (children||[]).forEach(c=> x.appendChild(typeof c==='string'? document.createTextNode(c):c));
    return x;
  }
  function modal(title, bodyNode, onConfirm, opts={confirmText:'Save'}){
    const m = document.getElementById('modal'); m.classList.add('active');
    const panel = m.querySelector('.panel'); panel.innerHTML='';
    panel.appendChild(el('h3',{innerText:title}));
    panel.appendChild(bodyNode);
    const row = el('div', {className:'row'});
    const ok = el('button',{className:'btn brand', innerText: opts.confirmText || 'Save'});
    const cancel = el('button',{className:'btn', innerText:'Cancel'});
    row.appendChild(ok); row.appendChild(cancel);
    panel.appendChild(row);
    cancel.onclick = ()=> m.classList.remove('active');
    ok.onclick = ()=>{ if(onConfirm) onConfirm(); m.classList.remove('active'); };
  }
  function applySettings(){
    const s = Store.settings();
    document.body.className = '';
    document.body.classList.add('theme-'+(s.theme||'emerald'));
    document.body.classList.add('density-'+(s.layout||'comfortable'));
    if(s.focus) document.body.classList.add('focus');
    if(s.accent) document.documentElement.style.setProperty('--brand', s.accent);
    const order = (s.navOrder && s.navOrder.length)? s.navOrder : ['dashboard','assignments','gpa','flashcards','essay','import','customize'];
    const nav = document.getElementById('nav'); if(nav){
      const links = Array.from(nav.querySelectorAll('a'));
      links.sort((a,b)=> order.indexOf(a.dataset.mod) - order.indexOf(b.dataset.mod));
      links.forEach(a=> nav.appendChild(a));
      links.forEach(a=> a.style.display = (s.modules?.[a.dataset.mod]===false)? 'none' : '');
      const here = location.pathname.endsWith('/')? '/index.html' : location.pathname;
      links.forEach(a=> (a.getAttribute('href').endsWith(here.split('/').pop()))? a.classList.add('active'):a.classList.remove('active'));
    }
    const hdr = document.getElementById('hdrProfile');
    const installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if(hdr) hdr.textContent = `Profile: ${Store.active()} â€¢ Mode: ${installed?'App':'Web'}`;
  }
  function quickAddAssignment(){
    const title = prompt('Quick Add: Assignment Title'); if(!title) return;
    const due = prompt('Due (YYYY-MM-DD HH:MM, 24h) [default: tomorrow 23:59]') || '';
    const d = due ? new Date(due.replace(' ','T')) : (d=>{ d.setDate(d.getDate()+1); d.setHours(23,59,0,0); return d; })(new Date());
    Assignments.add({title, cls:'', due:d.toISOString(), status:'open'});
    location.href= (location.pathname.includes('/pages/')? 'assignments.html' : './pages/assignments.html');
  }
  function enableInstalledMode(){
    const fab = document.createElement('button'); fab.className='fab'; fab.textContent='+'; fab.title='Quick add assignment (Ctrl+K)';
    fab.onclick = quickAddAssignment; document.body.appendChild(fab);
  }
  function saveAll(){ const d=Store.get(); d.lastBackup=new Date().toISOString(); Store.set(d); }
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt = e; });
  function openQuickMenu(){ const dd = document.getElementById('qm-dropdown'); if(dd) dd.classList.toggle('open'); }
  async function doInstall(){ if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; } else alert('Use your browserâ€™s â€œInstall Appâ€'); }
  function toggleFocus(){ const s=Store.settings(); s.focus=!s.focus; Store.setSettings(s); applySettings(); }
  function switchProfile(){ const next = prompt('Switch to profile id (existing or new)'); if(!next) return; Store.create(next); Store.switch(next); location.reload(); }
  function maybeWelcome(){
    const st = Store.settings(); if(st.__welcomed) return;
    const wrap = el('div',{},[
      el('div',{className:'wizard-step'},[ el('label',{innerText:'Pick a theme'}),
        (()=>{ const s = el('select',{id:'wTheme'}); ['emerald','royal','rose','amber','graphite'].forEach(t=> s.appendChild(el('option',{innerText:t, value:t}))); return s; })()
      ]),
      el('div',{className:'wizard-step'},[ el('label',{innerText:'Layout density'}),
        (()=>{ const s = el('select',{id:'wLayout'}); ['comfortable','compact'].forEach(t=> s.appendChild(el('option',{innerText:t, value:t}))); return s; })()
      ]),
      el('div',{className:'wizard-step'},[ el('label',{innerText:'Home shortcuts'}),
        (()=>{ const box = el('div',{className:'wizard-row'}); ['assignments','gpa','flashcards','essay','import'].forEach(id=>{
          const lab = el('label'); const cb = el('input',{type:'checkbox', checked:['assignments','gpa','flashcards'].includes(id)});
          cb.dataset.id=id; lab.appendChild(cb); lab.appendChild(document.createTextNode(' '+id)); box.appendChild(lab);
        }); return box; })()
      ]),
    ]);
    modal('Welcome to ClassAid', wrap, ()=>{
      const s=Store.settings();
      s.theme = document.getElementById('wTheme').value;
      s.layout = document.getElementById('wLayout').value;
      s.shortcuts = Array.from(wrap.querySelectorAll('input[type=checkbox]')).filter(i=>i.checked).map(i=> i.dataset.id);
      s.__welcomed = true;
      Store.setSettings(s); applySettings();
    }, {confirmText:'Start'});
  }
  return { el, modal, applySettings, quickAddAssignment, enableInstalledMode, saveAll, openQuickMenu, doInstall, toggleFocus, switchProfile, maybeWelcome };
})();

(function(){
  if('serviceWorker' in navigator && !location.search.includes('sw=off')){ navigator.serviceWorker.register('./service-worker.js').catch(()=>{}); }
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();
  const installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if(installed) UI.enableInstalledMode();
  document.addEventListener('keydown', (e)=>{
    if(e.ctrlKey && e.key.toLowerCase()==='k'){ e.preventDefault(); UI.quickAddAssignment(); }
    if(e.ctrlKey && e.key.toLowerCase()==='s'){ e.preventDefault(); UI.saveAll(); }
  });
  UI.applySettings(); UI.maybeWelcome();
})();

