
const Customize = (function(){
  function init(){
    const s = Store.settings();
    // Theme
    document.getElementById('theme').value = s.theme || 'emerald';
    document.getElementById('accent').value = s.accent || '#22e392';
    document.getElementById('layout').value = s.layout || 'comfortable';
    document.getElementById('focus').checked = !!s.focus;
    // Modules toggles
    ['dashboard','assignments','gpa','flashcards','essay','import','customize'].forEach(m=>{
      document.getElementById('mod-'+m).checked = s.modules?.[m]!==false;
    });
    // Shortcuts
    ['assignments','gpa','flashcards','essay','import'].forEach(id=>{
      document.getElementById('sc-'+id).checked = (s.shortcuts||[]).includes(id);
    });
    // Nav order simple editor
    const order = (s.navOrder && s.navOrder.length)? s.navOrder : ['dashboard','assignments','gpa','flashcards','essay','import','customize'];
    document.getElementById('navOrder').value = order.join(', ');

    document.getElementById('save').onclick = ()=>{
      const st = Store.settings();
      st.theme = document.getElementById('theme').value;
      st.accent = document.getElementById('accent').value;
      st.layout = document.getElementById('layout').value;
      st.focus = document.getElementById('focus').checked;
      st.modules = st.modules || {};
      ['dashboard','assignments','gpa','flashcards','essay','import','customize'].forEach(m=>{
        st.modules[m] = document.getElementById('mod-'+m).checked;
      });
      st.shortcuts = ['assignments','gpa','flashcards','essay','import'].filter(id=> document.getElementById('sc-'+id).checked);
      st.navOrder = document.getElementById('navOrder').value.split(',').map(s=> s.trim()).filter(Boolean);
      Store.setSettings(st); UI.applySettings(); alert('Saved!');
    };

    // Profiles: list, create, switch, rename, delete
    const list = document.getElementById('profiles'); list.innerHTML = '';
    Store.profiles().forEach(id=>{
      const row = document.createElement('div'); row.className='row'; row.style.marginTop='8px';
      row.innerHTML = `<div class="pill">`+id+`</div>`;
      const act = document.createElement('button'); act.className='btn'; act.textContent='Switch';
      const ren = document.createElement('button'); ren.className='btn'; ren.textContent='Rename';
      const del = document.createElement('button'); del.className='btn danger'; del.textContent='Delete';
      row.appendChild(act); row.appendChild(ren); row.appendChild(del);
      act.onclick = ()=>{ Store.switch(id); UI.applySettings(); location.reload(); };
      ren.onclick = ()=>{ const nn = prompt('New id for profile:', id); if(!nn) return; Store.rename(id, nn); location.reload(); };
      del.onclick = ()=>{ if(confirm('Delete profile "'+id+'"? This removes its local data.')){ Store.remove(id); location.reload(); } };
      list.appendChild(row);
    });
    document.getElementById('newProfile').onclick = ()=>{
      const id = prompt('Profile id (e.g., school, work, summer)'); if(!id) return; Store.create(id); location.reload();
    };
  }
  document.addEventListener('DOMContentLoaded', init);
  return {};
})();
