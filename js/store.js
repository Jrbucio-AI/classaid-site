
const Store = (function(){
  const ROOT_KEY = 'classaid-v3.2';
  function root(){
    try{ return JSON.parse(localStorage.getItem(ROOT_KEY)) || {active:'default', profiles:{}}; }catch{ return {active:'default', profiles:{}}; }
  }
  function save(r){ localStorage.setItem(ROOT_KEY, JSON.stringify(r)); }
  function ensureProfile(id){
    const r = root();
    if(!r.profiles[id]){
      r.profiles[id] = {
        data: { classes:[], assignments:[], decks:[], lastBackup:'' },
        settings: {
          theme:'emerald', accent:'#22e392', layout:'comfortable', focus:false,
          modules: {dashboard:true, assignments:true, gpa:true, flashcards:true, essay:true, import:true, customize:true},
          shortcuts: ['assignments','gpa','flashcards'],
          navOrder: ['dashboard','assignments','gpa','flashcards','essay','import','customize'],
          savedViews: { assignments: [] },
          __welcomed:false
        }
      };
      save(r);
    }
    return r;
  }
  function activeId(){ return root().active || 'default'; }
  function ctx(){ const r = ensureProfile(activeId()); return { r, id: r.active, prof: r.profiles[r.active] }; }
  return {
    profiles(){ return Object.keys(root().profiles); },
    active(){ return activeId(); },
    switch(id){ const r = ensureProfile(id); r.active = id; save(r); },
    create(id){ const r = ensureProfile(id); save(r); },
    rename(oldId, newId){ const r=root(); if(!r.profiles[oldId]) return; r.profiles[newId]=r.profiles[oldId]; delete r.profiles[oldId]; if(r.active===oldId) r.active=newId; save(r); },
    remove(id){ const r=root(); delete r.profiles[id]; if(r.active===id) r.active=Object.keys(r.profiles)[0]||'default'; save(r); },
    get(){ return ctx().prof.data; },
    set(d){ const c=ctx(); c.prof.data=d; save(c.r); },
    patchData(p){ const c=ctx(); Object.assign(c.prof.data, p); save(c.r); },
    settings(){ return ctx().prof.settings; },
    setSettings(s){ const c=ctx(); c.prof.settings=s; save(c.r); },
    patchSettings(p){ const c=ctx(); Object.assign(c.prof.settings, p); save(c.r); },
    export(){ return JSON.stringify(root(), null, 2); },
    import(json){ localStorage.setItem(ROOT_KEY, json); }
  };
})();
