const $=id=>document.getElementById(id);let data=null,selectedId=null,currentView='lookup',saving=false,lastCheck=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normal=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const dateObj=d=>new Date(d+'T12:00:00Z');
const fmt=(d,opts)=>dateObj(d).toLocaleDateString('en-AU',{timeZone:'UTC',...opts});
const toast=s=>{$('toast').textContent=s;$('toast').hidden=false;setTimeout(()=>$('toast').hidden=true,4000);};
function renderMatches(){
 const q=normal($('search').value);if(!q){$('matches-label').textContent='SEARCH '+data.areas.length.toLocaleString('en-AU')+' LOCALITIES';$('matches').innerHTML='';return;}
 const matches=data.areas.filter(a=>normal(a.name).includes(q)||a.postcode.includes(q)).sort((a,b)=>(normal(b.name)===q)-(normal(a.name)===q)||a.name.localeCompare(b.name)||a.postcode.localeCompare(b.postcode));
 $('matches-label').textContent=matches.length?matches.length+' MATCH'+(matches.length===1?'':'ES')+(matches.length>60?' · FIRST 60 SHOWN':''):'NO MATCHES · TRY ANOTHER SUBURB OR POSTCODE';
 $('matches').innerHTML=matches.slice(0,60).map(a=>'<button class="match '+(a.id===selectedId?'selected':'')+'" data-id="'+a.id+'" aria-pressed="'+(a.id===selectedId)+'"><strong>'+esc(a.name)+'</strong><small>'+esc(a.postcode)+' ↗</small></button>').join('');
}
function available(a){
 if(a.review!=='Confirmed'||a.type==='Regional')return [];
 if(a.type==='Metro'){
  const out=[];const d=dateObj(data.today);for(let i=0;i<120;i++){const iso=d.toISOString().slice(0,10),day=d.getUTCDay();if(day>=2&&day<=5)out.push(iso);d.setUTCDate(d.getUTCDate()+1);}return out;
 }
 return [...new Set(data.dates.filter(d=>d.region===a.region&&d.date>=data.today).map(d=>d.date))].sort();
}
function selected(){return data?.areas.find(a=>a.id===selectedId);}
function renderResult(){
 const a=selected();$('empty').hidden=!!a;$('result').hidden=!a;if(!a)return;
 $('locality').textContent=a.name;$('postcode').textContent='POSTCODE '+a.postcode;$('type').textContent=a.type;$('region').textContent=a.type==='Metro'?'Melbourne Metro':a.type==='Regional'?'Quote required':a.region||'To be assigned';$('review').textContent=a.review;
 const warning=a.review!=='Confirmed'||a.type==='Regional';$('guidance').className='guidance'+(warning?' warning':'');
 $('guidance').textContent=a.review!=='Confirmed'?'This locality requires review. Check the service classification and dates with Dispatch.':a.type==='Regional'?'Contact Management for a delivery fee quote and available delivery dates.':a.type==='Metro'?'Standard Metro service runs Tuesday–Friday. Confirm holidays, stock and route availability with Dispatch.':'Published regional dates are shown below. Confirm stock, route availability and the final booking with Dispatch.';
 const list=available(a);const prev=$('month').value;const months=[...new Set(list.map(d=>d.slice(0,7)))];$('month').innerHTML='<option value="">All upcoming</option>'+months.map(m=>'<option value="'+m+'">'+fmt(m+'-01',{month:'long',year:'numeric'})+'</option>').join('');$('month').value=months.includes(prev)?prev:'';
 const visible=list.filter(d=>!$('month').value||d.startsWith($('month').value));
 $('date-explainer').textContent=a.type==='Metro'?'Standard service days · next 120 days':'Published schedule · upcoming dates';
 $('dates').innerHTML=visible.map(d=>'<div class="date-card"><span>'+fmt(d,{weekday:'long'}).toUpperCase()+'</span><b>'+fmt(d,{day:'2-digit',month:'short'})+'</b><small>'+d.slice(0,4)+(a.type==='Metro'?' · Standard day':' · Planned service')+'</small></div>').join('');
 $('no-dates').hidden=!!visible.length;$('no-dates').textContent=warning?'Dates require confirmation. Please contact '+(a.type==='Regional'?'Management':'Dispatch')+'.':'No upcoming dates have been published for this region. Contact Dispatch for the next service date.';
 $('copy').disabled=false;
}
$('search').addEventListener('input',()=>{selectedId=null;$('month').value='';renderMatches();renderResult();});
$('matches').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(!b)return;selectedId=b.dataset.id;$('month').value='';renderMatches();renderResult();});
$('copy').onclick=async()=>{const a=selected();if(!a)return;if(false){toast('Refresh the shared calendar before copying.');return;}const list=available(a).slice(0,4);const msg='Adriatic Furniture — '+a.name+' '+a.postcode+'. '+(a.review!=='Confirmed'?'Please contact Dispatch to confirm service for this locality.':a.type==='Regional'?'Please contact Management for a delivery quote and available dates.':list.length?(a.type==='Metro'?'Standard service days':'Upcoming planned service dates')+': '+list.map(d=>fmt(d,{weekday:'short',day:'numeric',month:'short',year:'numeric'})).join(', ')+'. Subject to stock, route availability and Dispatch confirmation. No delivery slot has been reserved.':'The next service date is awaiting publication. Please contact Dispatch.');try{await navigator.clipboard.writeText(msg);toast('Customer message copied.');}catch{toast('Copy is unavailable in this browser.');}};
async function loadGuide(){
 try {
 const response=await fetch('lookup.json',{cache:'no-store'});
 if(!response.ok)throw Error();
 data=await response.json();
 data.today=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 $('search').disabled=false;$('notice').textContent=data.notice;$('notice').hidden=!data.notice;
 $('sync').textContent='Calendar snapshot · '+data.snapshot;$('source-meta').textContent=data.areas.length+' localities';
 $('load-error').hidden=true;renderMatches();renderResult();
 }catch{$('load-error').hidden=false;$('load-error').textContent='Unable to load the delivery guide. Please refresh.';}
}
$('month').onchange=renderResult;$('refresh').onclick=loadGuide;loadGuide();
