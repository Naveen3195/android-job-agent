const $ = s => document.querySelector(s);
const allowed = new Set(['saved','applied','interview','rejected']);
const storageKey = 'next-role-tracking-v1';
let jobs = [], tracking = {}, storageOK = true;
function cleanTracking(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid tracking file');
  return Object.fromEntries(Object.entries(value).filter(([id, s]) => id.length < 500 && allowed.has(s)));
}
try { tracking = cleanTracking(JSON.parse(localStorage.getItem(storageKey) || '{}')); } catch { storageOK = false; }
function save() {try {localStorage.setItem(storageKey,JSON.stringify(tracking));} catch {storageOK=false; $('#notice').textContent='Browser storage is unavailable. Export tracking before closing this page.';}}
function text(tag, value) {const el=document.createElement(tag);el.textContent=value;return el;}
function safeUrl(url) {try {const u=new URL(url);return u.protocol==='https:' ? u.href : null;}catch{return null;}}
function stats() {
  $('#count-total').textContent=jobs.length;
  for (const s of ['saved','applied','interview']) $('#count-'+s).textContent=Object.values(tracking).filter(x=>x===s).length;
}
function render() {
  stats(); const query=$('#search').value.toLowerCase().trim(), location=$('#location').value, status=$('#status').value;
  let filtered=jobs.filter(j=>(!query || [j.title,j.company,j.description,...(j.matchedSkills||[])].join(' ').toLowerCase().includes(query)) && (!location || j.locationGroup===location) && (!status || (tracking[j.id]||'new')===status));
  filtered.sort($('#sort').value==='recent' ? (a,b)=>(Date.parse(b.postedAt)||0)-(Date.parse(a.postedAt)||0) : (a,b)=>b.score-a.score);
  $('#results-count').textContent=filtered.length+' of '+jobs.length+' openings';
  $('#jobs').replaceChildren();
  if (!filtered.length) {
    const box=text('div','');box.className='empty';box.append(text('h3',jobs.length?'No jobs match these filters.':'Your shortlist is waiting for its first matches.'),text('p',jobs.length?'Try another location, progress status or keyword.':'Run the GitHub workflow to collect jobs. No matching openings can also mean these free sources currently have no suitable roles. See source status below.'));$('#jobs').append(box);return;
  }
  for (const j of filtered) {
    const c=$('#card').content.cloneNode(true);
    c.querySelector('.company').textContent=j.company;
    c.querySelector('h3').textContent=j.title;
    c.querySelector('.score').textContent=j.score+' / 100 match';
    const date=j.postedAt && Number.isFinite(Date.parse(j.postedAt)) ? new Date(j.postedAt).toLocaleDateString('en-IN') : 'Date not provided';
    c.querySelector('.job-meta').textContent=[j.locationGroup,j.eligibility,date].filter(Boolean).join(' · ');
    for(const skill of j.matchedSkills||[]) c.querySelector('.chips').append(text('span',skill));
    c.querySelector('.salary').textContent=j.salaryStatus;
    c.querySelector('.excerpt').textContent=(j.description||'').slice(0,210)+((j.description||'').length>210?'…':'');
    for (const r of j.review||[]) c.querySelector('.review').append(text('p','↳ '+r));
    if(j.analysis){c.querySelector('.ai').append(text('p','Gemini: '+j.analysis.summary));for(const gap of j.analysis.gaps||[])c.querySelector('.ai').append(text('p','Check: '+gap));}
    const link=c.querySelector('.apply');link.href=safeUrl(j.url);if(!safeUrl(j.url)){link.removeAttribute('href');link.textContent='Link unavailable';}
    const select=c.querySelector('.track');select.value=tracking[j.id]||'new';select.setAttribute('aria-label','Application status for '+j.title+' at '+j.company);
    select.addEventListener('change',()=>{if(allowed.has(select.value))tracking[j.id]=select.value;else delete tracking[j.id];save();render();});
    const source=text('a',j.source);source.href=safeUrl(j.sourceHome)||safeUrl(j.url);source.target='_blank';source.rel='noopener noreferrer';c.querySelector('.attribution').append('Source: ',source);
    $('#jobs').append(c);
  }
}
async function load() {
  $('#reload').disabled=true;
  try {
    const response=await fetch('data/jobs.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error('Load failed'); const data=await response.json();
    if(!Array.isArray(data.jobs))throw new Error('Invalid data');jobs=data.jobs;
    const updated=Date.parse(data.updatedAt), stale=Number.isFinite(updated) && Date.now()-updated>48*3600000;
    $('#freshness').textContent=Number.isFinite(updated)?'Last collected: '+new Date(updated).toLocaleString('en-IN')+(stale?' · update overdue':''):'Not collected yet';
    $('#notice').textContent=data.message || (stale?'These results are more than 48 hours old. Check GitHub Actions for the latest collection.':'');
    if(!storageOK)$('#notice').textContent+=' Browser storage unavailable; export tracking before leaving.';
    $('#sources').replaceChildren();
    for(const s of data.sources||[]){const el=text('span',s.name+' · '+(s.status==='ok'?s.fetched+' fetched':s.message||'unavailable'));el.className='source-item '+s.status;$('#sources').append(el);}
    if(!data.sources?.length)$('#sources').textContent='Not run yet. Source status appears after collection.';
    $('#ai-status').textContent='AI analysis: '+(data.ai?.status||'disabled');render();
  }catch{$('#notice').textContent='Could not load the published job data. Check your connection, then reload. If you opened index.html directly, use a web server or GitHub Pages.';render();}
  finally{$('#reload').disabled=false;}
}
for(const id of ['search','location','status','sort'])$('#'+id).addEventListener(id==='search'?'input':'change',render);
$('#reload').addEventListener('click',load);
$('#export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,tracking},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='job-tracking-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('#import').addEventListener('change',async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>1000000)throw new Error('Too large');const data=JSON.parse(await file.text());if(data.version!==1)throw new Error('Unknown version');tracking={...tracking,...cleanTracking(data.tracking)};save();render();$('#notice').textContent='Tracking imported and merged.';}catch{$('#notice').textContent='Import failed. Choose a tracking JSON exported by this app (under 1 MB).';}finally{event.target.value='';}});
load();
