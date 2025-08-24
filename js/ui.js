
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
    // Theme & density
    document.body.classList.remove('theme-emerald','theme-royal','theme-rose','theme-amber','theme-graphite','density-compact','density-comfortable','focus');
    document.body.classList.add('theme-'+(s.theme||'emerald'));
    document.body.classList.add('density-'+(s.layout||'comfortable'));
    if(s.focus) document.body.classList.add('focus');
    // Accent override via CSS variable inline
    if(s.accent) document.documentElement.style.setProperty('--brand', s.accent);
    // Modules visibility + nav order
    const order = (s.navOrder && s.navOrder.length)? s.navOrder : ['dashboard','assignments','gpa','flashcards','essay','import','customize'];
    const nav = document.getElementById('nav');
    // sort nav links by order
    const links = Array.from(nav.querySelectorAll('a'));
    links.sort((a,b)=> order.indexOf(a.dataset.mod) - order.indexOf(b.dataset.mod));
    links.forEach(a=> nav.appendChild(a));
    links.forEach(a=>{
      const mod = a.dataset.mod;
      a.style.display = (s.modules?.[mod]===false)? 'none' : '';
    });
    // Active link
    const here = location.pathname.replace(/\/+$/,'') || '/index.html';
    document.querySelectorAll('#nav a').forEach(a=>{
      if(a.getAttribute('href')===here) a.classList.add('active'); else a.classList.remove('active');
    });
    // Header mode/profile
    const hdr = document.getElementById('hdrProfile');
    const installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    hdr.textContent = `Profile: ${Store.active()} • Mode: ${installed?'App':'Web'}`;
  }
  function quickAddAssignment(){
    const title = prompt('Quick Add: Assignment Title'); if(!title) return;
    const due = prompt('Due (YYYY-MM-DD HH:MM, 24h) [default: tomorrow 23:59]') || '';
    const d = due ? new Date(due.replace(' ','T')) : (d=>{ d.setDate(d.getDate()+1); d.setHours(23,59,0,0); return d; })(new Date());
    Assignments.add({title, cls:'', due:d.toISOString(), status:'open'});
    location.href='/pages/assignments.html';
  }
  function enableInstalledMode(){
    const fab = document.createElement('button'); fab.className='fab'; fab.textContent='+'; fab.title='Quick add assignment (Ctrl+K)';
    fab.onclick = quickAddAssignment; document.body.appendChild(fab);
  }
  function saveAll(){
    const st = Store.get(); st.lastBackup = new Date().toISOString(); Store.patchData(st);
  }
  return { el, modal, applySettings, quickAddAssignment, enableInstalledMode, saveAll };
})();

// App bootstrap shared on every page
(function(){
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('/service-worker.js').catch(console.warn); }
  document.getElementById('year').textContent = new Date().getFullYear();
  const installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if(installed) UI.enableInstalledMode();
  // Keyboard shortcuts
  document.addEventListener('keydown', (e)=>{
    if(e.ctrlKey && e.key.toLowerCase()==='k'){ e.preventDefault(); UI.quickAddAssignment(); }
    if(e.ctrlKey && e.key.toLowerCase()==='s'){ e.preventDefault(); UI.saveAll(); }
  });
  // Apply settings on load
  UI.applySettings();
})();
