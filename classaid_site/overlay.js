
(function(){
  if (window.ClassAidOverlay) return;
  let env = null;
  const KEY='classaid_notes';
  function read(){ try{ return JSON.parse(localStorage.getItem(KEY)) || {notes:[]} }catch{ return {notes:[]} } }
  function write(v){ localStorage.setItem(KEY, JSON.stringify(v)); }

  function ensure(){
    if (env) return env;
    const state = read();
    const root = document.createElement('div');
    Object.assign(root.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:2147483647,display:'none'});
    const bar = document.createElement('div');
    bar.style.cssText='position:fixed;right:16px;top:16px;background:#0d1311;border:1px solid #1b2622;color:#e8f1ed;padding:8px 10px;border-radius:12px;display:flex;gap:8px;align-items:center;pointer-events:auto';
    bar.innerHTML='<b>ClassAid Notes</b>';
    const add=document.createElement('button'); add.textContent='New'; add.style.cssText='padding:6px 10px;border-radius:10px;border:1px solid #1b2622;background:#101614;color:#e8f1ed';
    const hide=document.createElement('button'); hide.textContent='Hide'; hide.style.cssText='padding:6px 10px;border-radius:10px;border:1px solid #1b2622;background:#101614;color:#e8f1ed';
    bar.appendChild(add); bar.appendChild(hide); root.appendChild(bar);
    document.body.appendChild(root);

    function make(n){
      const el=document.createElement('div');
      Object.assign(el.style,{position:'fixed',left:(n.x||60)+'px',top:(n.y||80)+'px',width:'220px',background:'#fff8c6',color:'#1a1a1a',border:'1px solid #d8c96a',borderRadius:'8px',boxShadow:'0 8px 20px rgba(0,0,0,.25)',padding:'8px',pointerEvents:'auto'});
      el.innerHTML='<div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:6px\"><input class=\"tt\" style=\"border:none;background:transparent;font-weight:700;width:150px\" value=\"'+(n.t||'Note')+'\"><button class=\"x\" style=\"border:none;background:transparent;font-weight:700\">×</button></div><textarea class=\"bd\" style=\"width:100%;height:120px;border:none;background:transparent\">'+(n.b||'')+'</textarea>';
      root.appendChild(el);
      let drag=false,dx=0,dy=0;
      el.querySelector('.tt').addEventListener('mousedown',e=>{drag=true;dx=e.clientX-parseInt(el.style.left);dy=e.clientY-parseInt(el.style.top);document.body.style.userSelect='none'});
      window.addEventListener('mousemove',e=>{if(!drag)return;el.style.left=(e.clientX-dx)+'px';el.style.top=(e.clientY-dy)+'px';});
      window.addEventListener('mouseup',()=>{if(drag){drag=false;document.body.style.userSelect='';save()}});
      el.querySelector('.x').onclick=()=>{state.notes=state.notes.filter(x=>x!==n);el.remove();save()};
      el.querySelector('.bd').oninput=save; el.querySelector('.tt').oninput=save;
    }
    function save(){
      state.notes = Array.from(root.querySelectorAll('textarea.bd')).map(ta=>{ const el=ta.parentElement.parentElement;
        return {x:parseInt(el.style.left), y:parseInt(el.style.top), t:el.querySelector('.tt').value, b:ta.value};
      }); write(state);
    }
    add.onclick=()=>{const n={x:80+Math.random()*60,y:120+Math.random()*60,t:'Note',b:''}; state.notes.push(n); make(n); save();};
    hide.onclick=()=>{root.style.display='none'};
    state.notes.forEach(make);
    env={root}; return env;
  }

  function toggle(){
    const r=ensure().root;
    r.style.display = (r.style.display==='none') ? 'block' : 'none';
  }
  function destroy(){ if(!env) return; env.root.remove(); env=null; }
  window.ClassAidOverlay={toggle,destroy};
})();
