
let deferredPrompt;

// Install PWA
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBtn').style.display='inline-flex';
});
document.getElementById('installBtn').addEventListener('click', async (e)=>{
  e.preventDefault();
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
});

// Reveal animations
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
},{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// Waitlist queue + sync
const QUEUE='waitlistQueue';
const form=document.getElementById('waitlist');
const toast=(m)=>{const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)};
form?.addEventListener('submit', (ev)=>{
  ev.preventDefault();
  const email=new FormData(form).get('email');
  const q=JSON.parse(localStorage.getItem(QUEUE)||'[]'); q.push({email,at:Date.now()});
  localStorage.setItem(QUEUE, JSON.stringify(q));
  form.reset(); toast('Added — will sync when online.');
  syncQueue();
});
async function syncQueue(){
  const q=JSON.parse(localStorage.getItem(QUEUE)||'[]'); if(!navigator.onLine || q.length===0) return;
  const next=[];
  for(const i of q){
    try{
      const res=await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:i.email})});
      if(!res.ok) throw 0;
    }catch{ next.push(i); }
  }
  localStorage.setItem(QUEUE, JSON.stringify(next));
  if(next.length===0) toast('All signups synced.');
}
window.addEventListener('online', syncQueue);

// SW
if('serviceWorker' in navigator){ navigator.serviceWorker.register('/sw.js'); }
