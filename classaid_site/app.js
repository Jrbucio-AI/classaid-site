// Simple local DB
const db = {
  save(key, value){ localStorage.setItem(key, JSON.stringify(value)); },
  load(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch{ return fallback } }
};

// PWA install
let deferredPrompt;
window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredPrompt=e;document.getElementById('installBtn').style.display='inline-block'});
document.getElementById('installBtn').addEventListener('click', async ()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; });

// Toast helper
const toast = (msg)=>{ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); };

// Waitlist (stores offline, tries to sync later)
const queueKey='waitlistQueue';
const form=document.getElementById('waitlist');
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const email = new FormData(form).get('email');
  const q = db.load(queueKey, []);
  q.push({email, at: Date.now()});
  db.save(queueKey,q);
  form.reset();
  toast('Added to queue — will sync when online.');
  syncQueue();
});

async function syncQueue(){
  const q = db.load(queueKey, []);
  if(!navigator.onLine || q.length===0) return;
  // Replace URL below with your real endpoint (Formspree or Vercel function)
  const endpoint = 'https://formspree.io/f/your-id'; // TODO: set this
  const next = [];
  for(const item of q){
    try{
      const res = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:item.email})});
      if(!res.ok) throw 0;
    }catch{ next.push(item); }
  }
  db.save(queueKey,next);
  if(next.length===0) toast('All signups synced.');
}
window.addEventListener('online', syncQueue);

// Demo modals (lightweight)
const demo = {
  open(kind){
    const data = {
      gpa:`
      <h3>GPA Tracker</h3>
      <table><thead><tr><th>Class</th><th>Grade</th><th>Credits</th></tr></thead>
      <tbody id="gpaRows"></tbody></table>
      <p><b>GPA:</b> <span id="gpaOut">0.00</span></p>
      <div class="input"><input id="cls" placeholder="Class"><input id="grd" placeholder="Grade %" type="number"><input id="cr" placeholder="Credits" type="number"><button class="btn alt" id="addG">Add</button></div>`,
      assignments:`
      <h3>Assignments</h3>
      <table><thead><tr><th>Title</th><th>Due</th><th>Status</th></tr></thead><tbody id="aRows"></tbody></table>
      <div class="input"><input id="aTitle" placeholder="Assignment"><input id="aDue" type="datetime-local"><button class="btn alt" id="addA">Add</button></div>
      <p class="small">Enable notifications to get reminders.</p>`,
      resources:`<h3>Resources</h3><ul class="clean"><li><a target="_blank" href="https://www.desmos.com/scientific">Desmos Calculator</a></li><li><a target="_blank" href="https://www.citationmachine.net/">Citation Machine</a></li><li><a target="_blank" href="https://www.khanacademy.org/">Khan Academy</a></li></ul>`,
      essay:`<h3>Essay Helper (Local)</h3><textarea id="essay" rows="8" style="width:100%;background:#0d1311;border:1px solid var(--muted);color:var(--text);border-radius:12px;padding:12px" placeholder="Paste your text"></textarea><div class="cta"><button class="btn alt" id="rewrite">Humanize</button><button class="btn alt" id="outline">Outline</button></div><pre id="out" class="small"></pre>`
    }[kind];
    const modal = document.createElement('div');
    Object.assign(modal.style,{position:'fixed',inset:'0',background:'rgba(0,0,0,.6)',display:'grid',placeItems:'center'});
    modal.innerHTML = `<div class="card" style="max-width:760px;width:92vw;max-height:80vh;overflow:auto;position:relative"><button id="x" class="btn alt" style="position:absolute;right:14px;top:14px">Close</button>${data}</div>`;
    document.body.appendChild(modal);
    modal.querySelector('#x').onclick=()=>modal.remove();

    if(kind==='gpa'){ gpaInit(modal); }
    if(kind==='assignments'){ tasksInit(modal); }
    if(kind==='essay'){ essayInit(modal); }
  }
};

function gpaInit(root){
  const rows = root.querySelector('#gpaRows');
  const out = root.querySelector('#gpaOut');
  const state = db.load('gpa', []);
  const render = ()=>{
    rows.innerHTML = state.map((r,i)=>`<tr><td>${r.c}</td><td>${r.g}%</td><td>${r.cr}</td></tr>`).join('');
    const pts = s=> s>=93?4: s>=90?3.7: s>=87?3.3: s>=83?3: s>=80?2.7: s>=77?2.3: s>=73?2: s>=70?1.7: s>=67?1.3: s>=65?1: 0;
    const sum = state.reduce((a,b)=>({w:a.w + pts(b.g)*b.cr, c:a.c + b.cr}),{w:0,c:0});
    out.textContent = (sum.c? (sum.w/sum.c).toFixed(2):'0.00');
    db.save('gpa', state);
  };
  root.querySelector('#addG').onclick=()=>{
    const c = root.querySelector('#cls').value.trim();
    const g = +root.querySelector('#grd').value;
    const cr= +root.querySelector('#cr').value||1;
    if(!c || isNaN(g)) return toast('Enter class & grade');
    state.push({c,g,cr}); render();
  };
  render();
}

function tasksInit(root){
  const rows = root.querySelector('#aRows');
  const state = db.load('tasks', []);
  const render=()=>{
    rows.innerHTML = state.map((t,i)=>`<tr><td>${t.t}</td><td>${new Date(t.d).toLocaleString()}</td><td>${t.done?'✅':'⏳'}</td></tr>`).join('');
    db.save('tasks', state);
  };
  const askNotif = async()=>{
    if(Notification && Notification.permission==='default'){ await Notification.requestPermission(); }
  };
  root.querySelector('#addA').onclick=async()=>{
    const t = root.querySelector('#aTitle').value.trim();
    const d = root.querySelector('#aDue').value;
    if(!t||!d) return toast('Add title and due date');
    const item={t,d,done:false}; state.push(item); render(); await askNotif();
    const when = new Date(d).getTime()-Date.now();
    if(Notification && Notification.permission==='granted' && when>0){
      setTimeout(()=>new Notification('Assignment due', {body: t+' is due soon'}), Math.min(when, 2147483647));
    }
  };
  render();
}

function essayInit(root){
  const input = root.querySelector('#essay');
  const out = root.querySelector('#out');
  root.querySelector('#rewrite').onclick=()=>{
    let text=input.value;
    // Very simple humanizer: shorten phrases, vary length, swap some words
    const map = { furthermore:'plus', however:'but', therefore:'so', utilize:'use', numerous:'many', extremely:'very', obtain:'get' };
    text = text.replace(/\b(furthermore|however|therefore|utilize|numerous|extremely|obtain)\b/gi, m=>map[m.toLowerCase()]||m);
    text = text.replace(/\s+/g,' ').replace(/,\s*,/g,', ').trim();
    out.textContent = text;
  };
  root.querySelector('#outline').onclick=()=>{
    const s = input.value.split(/\n+|\.\s+/).filter(Boolean);
    out.textContent = s.map(x=>'- '+x.trim()).join('\n');
  };
}

// Register service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js');
}
