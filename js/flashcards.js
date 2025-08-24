
const Flashcards = (function(){
  let current=null;
  function decks(){ return Store.get().decks||[]; }
  function renderDecks(){
    const cont = document.getElementById('decks'); if(!cont) return;
    cont.innerHTML='';
    decks().forEach((d,i)=>{
      const card = document.createElement('div'); card.className='card';
      card.innerHTML = `<div class="row"><div style="font-weight:700">${d.title}</div><div class="right muted">${d.cards.length} cards</div></div>
      <div class="row" style="margin-top:8px"><button class="btn" data-edit="${i}">Edit</button><button class="btn brand" data-study="${i}">Study</button><button class="btn danger right" data-del="${i}">Delete</button></div>`;
      cont.appendChild(card);
    });
    document.getElementById('btnNewDeck').onclick = ()=> openEditor({title:'Untitled Deck', cards:[]}, true);
    cont.querySelectorAll('button[data-edit]').forEach(b=> b.onclick = ()=> openEditor(decks()[Number(b.dataset.edit)], false));
    cont.querySelectorAll('button[data-study]').forEach(b=> b.onclick = ()=> startStudy(decks()[Number(b.dataset.study)]));
    cont.querySelectorAll('button[data-del]').forEach(b=> b.onclick = ()=>{ const i=Number(b.dataset.del); const st=Store.get(); st.decks.splice(i,1); Store.set(st); renderDecks(); });
  }
  function openEditor(deck, isNew){
    current = JSON.parse(JSON.stringify(deck));
    const ed = document.getElementById('deckEditor'); ed.style.display='block';
    document.getElementById('studyView').style.display='none';
    document.getElementById('deckTitle').value = current.title;
    renderCards();
    document.getElementById('btnAddCard').onclick = ()=> { current.cards.push({q:'',a:''}); renderCards(); };
    document.getElementById('btnCloseDeck').onclick = ()=> ed.style.display='none';
    document.getElementById('btnSaveDeck').onclick = ()=>{
      current.title = document.getElementById('deckTitle').value || 'Untitled';
      const st = Store.get(); st.decks = st.decks || [];
      const i = st.decks.findIndex(d=> d.title===deck.title && d.cards===deck.cards);
      if(isNew || i<0) st.decks.push(current); else st.decks[i]=current;
      Store.set(st); renderDecks(); ed.style.display='none';
    };
  }
  function renderCards(){
    const cont = document.getElementById('cards'); cont.innerHTML='';
    current.cards.forEach((c,i)=>{
      const row = document.createElement('div'); row.className='row'; row.style.marginTop='8px';
      row.innerHTML = `<input placeholder="Front (Q)" value="${c.q.replaceAll('"','&quot;')}">
      <input placeholder="Back (A)" value="${c.a.replaceAll('"','&quot;')}">
      <button class="btn danger" data-del="${i}">Delete</button>`;
      cont.appendChild(row);
    });
    cont.querySelectorAll('input').forEach((inp, idx)=>{
      const i = Math.floor(idx/2); const isQ = idx%2===0;
      inp.addEventListener('input', ()=>{ if(isQ) current.cards[i].q = inp.value; else current.cards[i].a = inp.value; });
    });
    cont.querySelectorAll('button[data-del]').forEach(b=> b.onclick = ()=>{ const i=Number(b.dataset.del); current.cards.splice(i,1); renderCards(); });
  }
  let study=null;
  function startStudy(deck){
    study = { deck, i:0, flipped:false, correct:0 };
    document.getElementById('deckEditor').style.display='none';
    document.getElementById('studyView').style.display='block';
    document.getElementById('studyTitle').textContent = deck.title;
    document.getElementById('btnFlip').onclick = ()=>{ study.flipped=!study.flipped; show(); };
    document.getElementById('btnAgain').onclick = ()=>{ study.i = Math.min(study.i+1, deck.cards.length-1); study.flipped=false; show(); };
    document.getElementById('btnGood').onclick = ()=>{ study.correct++; study.i = Math.min(study.i+1, deck.cards.length-1); study.flipped=false; show(); };
    document.getElementById('btnExit').onclick = ()=> document.getElementById('studyView').style.display='none';
    show();
  }
  function show(){
    const c = study.deck.cards[study.i]||{q:'(no cards)',a:''};
    document.getElementById('studyProgress').textContent = (study.i+1)+'/'+study.deck.cards.length+' • Correct '+study.correct;
    document.getElementById('studyCard').textContent = study.flipped? (c.a || '(no answer)') : (c.q || '(no question)');
  }
  return { renderDecks };
})();
document.addEventListener('DOMContentLoaded', ()=> { if(document.getElementById('decks')) Flashcards.renderDecks(); });
