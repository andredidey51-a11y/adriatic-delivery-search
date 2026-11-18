const origin='https://andredidey51-a11y.github.io';
const callback=origin+'/adriatic-delivery-search/admin-test/';
export default {async fetch(request,env){
 if(request.headers.get('Origin')!==origin)return new Response(null,{status:403});
 const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};
 if(request.method==='OPTIONS')return new Response(null,{headers});
 if(request.method!=='POST')return new Response(null,{status:405,headers});
 try{
 const {code,verifier}=await request.json();
 const response=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json'},body:new URLSearchParams({client_id:env.CLIENT_ID,client_secret:env.CLIENT_SECRET,redirect_uri:callback,code,code_verifier:verifier})});
 const {access_token}=await response.json();
 if(!access_token)return new Response(null,{status:403,headers});
 const identity=await fetch('https://api.github.com/user',{headers:{Authorization:'Bearer '+access_token,'User-Agent':'Adriatic-Desk'}});
 if(!identity.ok||(await identity.json()).id!==358121128)return new Response(null,{status:403,headers});
 return Response.json({token:access_token},{headers});
 }catch{return new Response(null,{status:400,headers});}
}};
