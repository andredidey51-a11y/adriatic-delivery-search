import {clientId,workerOrigin} from './config.js';
const el=id=>document.getElementById(id);
const endpoint='https://api.github.com/repos/andredidey51-a11y/adriatic-delivery-search/contents/admin-test/calendar.json';
let calendar,sha,token;
function showDates(){
 el('dates').replaceChildren();
 for(const entry of calendar.dates.filter(d=>d.region===el('region').value).sort((a,b)=>a.date.localeCompare(b.date))){
 const li=document.createElement('li');li.textContent=entry.date;el('dates').append(li);}
}
async function refresh(){
 const response=await fetch(endpoint+'?ref=main',{cache:'no-store'});
 if(!response.ok)throw Error('Calendar unavailable ('+response.status+').');
 const file=await response.json();sha=file.sha;
 calendar=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(file.content),c=>c.charCodeAt(0))));
 const previous=el('region').value;
 el('region').replaceChildren(...calendar.regions.map(r=>new Option(r,r)));
 if(calendar.regions.includes(previous))el('region').value=previous;
 showDates();
}
const report=e=>el('status').textContent=e.message;
el('region').onchange=showDates;
el('login').onclick=async()=>{
 try{
 if(clientId.startsWith('SET_'))throw Error('Configure the GitHub App to enable sign-in.');
 const state=crypto.randomUUID(),verifier=crypto.randomUUID()+crypto.randomUUID();
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
 const challenge=btoa(String.fromCharCode(...new Uint8Array(digest))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
 sessionStorage.setItem('desk-auth',JSON.stringify({state,verifier}));
 const params=new URLSearchParams({client_id:clientId,redirect_uri:location.origin+location.pathname,state,code_challenge:challenge,code_challenge_method:'S256'});
 location.assign('https://github.com/login/oauth/authorize?'+params);
 }catch(e){report(e);}
};
el('logout').onclick=()=>location.replace(location.pathname);
el('save').onclick=async()=>{
 el('save').disabled=true;
 try{
 const date=el('date').value,region=el('region').value;
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(!date||date<today||![2,3,4,5].includes(new Date(date+'T12:00:00Z').getUTCDay()))throw Error('Choose a future service date, Tuesday to Friday.');
 if(calendar.dates.some(d=>d.date===date&&d.region===region))throw Error('Date already published.');
 const updated={...calendar,dates:[...calendar.dates,{date,region}]};
 const content=btoa(Array.from(new TextEncoder().encode(JSON.stringify(updated,null,2)),b=>String.fromCharCode(b)).join(''));
 const response=await fetch(endpoint,{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({message:'Publish test service date',content,sha,branch:'main'})});
 if(response.status===409){await refresh();throw Error('Calendar changed. Review the new dates and retry.');}
 if(!response.ok)throw Error('GitHub refused the save ('+response.status+').');
 await refresh();el('status').textContent='Test date published.';
 }catch(e){report(e);}finally{el('save').disabled=false;}
};
async function start(){
 await refresh();const q=new URLSearchParams(location.search);if(!q.has('code'))return;
 history.replaceState(null,'',location.pathname);
 const saved=JSON.parse(sessionStorage.getItem('desk-auth')||'null');sessionStorage.removeItem('desk-auth');
 if(!saved||q.get('state')!==saved.state)throw Error('Sign-in expired. Please try again.');
 const r=await fetch(workerOrigin,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:q.get('code'),verifier:saved.verifier})});
 if(!r.ok)throw Error('Administrator sign-in was declined.');
 token=(await r.json()).token;el('admin').hidden=false;el('login').hidden=true;
}
start().catch(report);
