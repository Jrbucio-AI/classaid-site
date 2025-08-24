
const GPA = (function(){
  const GP = {'A+':4.0,'A':4.0,'A-':3.7,'B+':3.3,'B':3.0,'B-':2.7,'C+':2.3,'C':2.0,'C-':1.7,'D+':1.3,'D':1.0,'F':0.0};
  function compute(){
    const classes = Store.get().classes||[];
    let uw=0,w=0,cr=0;
    classes.forEach(c=>{
      const gp = GP[c.grade]||0; const cred = Number(c.credits)||0;
      const add = c.weight==='AP'?1.0 : (c.weight==='Honors'?0.5:0);
      uw += gp*cred; w += (gp+add)*cred; cr += cred;
    });
    return {unweighted: uw/cr, weighted: w/cr};
  }
  function render(){
    const st = Store.get(); const tbody = document.querySelector('#tblC tbody'); if(!tbody) return;
    tbody.innerHTML='';
    (st.classes||[]).forEach((c,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${c.name}</td><td>${c.grade}</td><td>${c.credits}</td><td>${c.weight||'None'}</td>
      <td><button class="btn" data-edit="${i}">Edit</button> <button class="btn danger" data-del="${i}">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    const g = compute();
    document.getElementById('gUnw').textContent = isNaN(g.unweighted)?'—':g.unweighted.toFixed(2);
    document.getElementById('gW').textContent = isNaN(g.weighted)?'—':g.weighted.toFixed(2);

    tbody.querySelectorAll('button[data-edit]').forEach(b=> b.onclick = ()=>{
      const i = Number(b.dataset.edit), c = st.classes[i];
      const node = UI.el('div',{},[
        UI.el('div',{},[UI.el('label',{innerText:'Class'}), UI.el('input',{id:'n', value:c.name})]),
        UI.el('div',{},[UI.el('label',{innerText:'Grade'}), UI.el('input',{id:'g', value:c.grade})]),
        UI.el('div',{},[UI.el('label',{innerText:'Credits'}), UI.el('input',{id:'cr', value:c.credits})]),
        UI.el('div',{},[UI.el('label',{innerText:'Weight (None/Honors/AP)'}), UI.el('input',{id:'w', value:c.weight||'None'})])
      ]);
      UI.modal('Edit Class', node, ()=>{
        c.name = document.getElementById('n').value||c.name;
        c.grade = document.getElementById('g').value||c.grade;
        c.credits = parseFloat(document.getElementById('cr').value)||c.credits;
        const ww = document.getElementById('w').value;
        c.weight = (ww==='Honors'||ww==='AP')? ww : 'None';
        Store.set(st); render();
      });
    });
    tbody.querySelectorAll('button[data-del]').forEach(b=> b.onclick = ()=>{
      const i = Number(b.dataset.del); st.classes.splice(i,1); Store.set(st); render();
    });

    document.getElementById('btnAdd').onclick = ()=>{
      const name = document.getElementById('clsName').value.trim();
      const grade = document.getElementById('clsGrade').value;
      const credits = parseFloat(document.getElementById('clsCredits').value||'1');
      const weight = document.getElementById('clsWeight').value;
      if(!name) return alert('Enter class name');
      st.classes = st.classes||[]; st.classes.push({name, grade, credits, weight});
      Store.set(st); render();
    };
  }
  return { compute, render };
})();
document.addEventListener('DOMContentLoaded', ()=> { if(document.getElementById('tblC')) GPA.render(); });
