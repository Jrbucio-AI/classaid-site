
const Essay = (function(){
  const TRANS = {
    'Balanced transitions': ['Moreover','Furthermore','In addition','However','Therefore','For example','In contrast','Similarly','Ultimately'],
    'Concise': ['Also','But','So','For example','Thus','Yet','Still','Plus'],
    'Elaborate': ['Notwithstanding','Nevertheless','Accordingly','By contrast','In light of this','As a result','Insofar as','To that end','With this in mind']
  };
  function outline(){
    const prompt = document.getElementById('ehPrompt').value.trim();
    const thesis = document.getElementById('ehThesis').value.trim();
    const structure = document.getElementById('ehStructure').value;
    const tone = document.getElementById('ehTone').value;
    const transKey = document.getElementById('ehTransitions').value;
    const T = TRANS[transKey]||TRANS['Balanced transitions'];
    function bullet(parts){ return parts.map(s=>'• '+s).join('\\n'); }
    let out = `Prompt: ${prompt||'(none)'}\\nThesis: ${thesis||'(draft)'}\\nTone: ${tone}\\n\\n`;
    if(structure==='five'){
      out += 'I. Introduction\\n' + bullet([`Hook`,`Context`,`Thesis: ${thesis||'(draft your claim here)'}`]) + '\\n\\n';
      out += 'II. Body 1\\n' + bullet([`${T[0]}: Topic sentence`,`Evidence`,`Explanation`,`Mini-Conclusion`]) + '\\n\\n';
      out += 'III. Body 2\\n' + bullet([`${T[1]}: Topic sentence`,`Evidence`,`Analysis`,`Close`]) + '\\n\\n';
      out += 'IV. Body 3\\n' + bullet([`${T[2]}: Topic sentence`,`Evidence`,`Counterclaim + Rebuttal`,`Synthesis`]) + '\\n\\n';
      out += 'V. Conclusion\\n' + bullet([`${T[3]}: Revisit thesis`,`Key insights`,`So-what`]) + '\\n';
    } else if(structure==='compare'){
      out += 'I. Intro + Thesis\\n\\nII. Point-by-point: Criteria A/B/C with ' + T[0] + '\\n\\nIII. Evaluation\\n\\nIV. Conclusion\\n';
    } else if(structure==='argument'){
      out += 'I. Intro + Claim\\n\\nII. Evidence 1 → Explain\\n\\nIII. Evidence 2 → Explain\\n\\nIV. Counterclaim → Rebuttal\\n\\nV. Conclusion\\n';
    } else {
      out += 'I. Hook + Setting\\n\\nII. Rising action\\n\\nIII. Climax\\n\\nIV. Reflection\\n\\nV. Closing image\\n';
    }
    document.getElementById('ehOutput').value = out;
  }
  function copy(){ const ta = document.getElementById('ehOutput'); ta.select(); document.execCommand('copy'); }
  document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementById('ehOutlineBtn').onclick=outline;
    document.getElementById('ehCopy').onclick=copy;
  });
  return { outline };
})();
