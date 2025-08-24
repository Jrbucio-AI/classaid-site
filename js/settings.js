
// Encryption helpers (AES-GCM via WebCrypto)
async function deriveKey(pass, salt){
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pass), {name:'PBKDF2'}, false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:150000, hash:'SHA-256'}, keyMaterial, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
}
async function exportEncrypted(){
  const pass = prompt('Set a password for the encrypted backup'); if(!pass) return;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt);
  const data = new TextEncoder().encode(Store.export());
  const ct = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, data));
  const payload = { salt: btoa(String.fromCharCode(...salt)), iv:btoa(String.fromCharCode(...iv)), ct:btoa(String.fromCharCode(...ct)) };
  const blob = new Blob([JSON.stringify(payload)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a = Object.assign(document.createElement('a'), {href:url, download:'classaid-encrypted.json'}); a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}
async function importEncrypted(){
  const inp = document.createElement('input'); inp.type='file'; inp.accept='application/json';
  inp.onchange = async ()=>{
    const file = inp.files[0]; if(!file) return; const text = await file.text();
    try{
      const payload = JSON.parse(text);
      const salt = Uint8Array.from(atob(payload.salt), c=> c.charCodeAt(0));
      const iv = Uint8Array.from(atob(payload.iv), c=> c.charCodeAt(0));
      const ct = Uint8Array.from(atob(payload.ct), c=> c.charCodeAt(0));
      const pass = prompt('Enter the password to decrypt'); if(!pass) return;
      const key = await deriveKey(pass, salt);
      const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, ct);
      const json = new TextDecoder().decode(pt);
      Store.import(json); alert('Imported encrypted backup. Reloading…'); location.reload();
    }catch(e){ alert('Failed to decrypt/import. ' + e); }
  };
  inp.click();
}
document.addEventListener('DOMContentLoaded', ()=>{
  const expE = document.getElementById('btnExportEnc'); if(expE) expE.onclick = exportEncrypted;
  const impE = document.getElementById('btnImportEnc'); if(impE) impE.onclick = importEncrypted;
});
