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
 const {access_token,error}=await response.json();
 if(!access_token){const messages={incorrect_client_credentials:'GitHub rejected the app credentials. Check the Worker client ID and secret.',bad_verification_code:'GitHub rejected the one-time code. Start a fresh sign-in in the same tab.',redirect_uri_mismatch:'Check the callback URL in GitHub App settings.'};return Response.json({message:messages[error]||'GitHub could not exchange the login code.'},{status:403,headers});}
 const identity=await fetch('https://api.github.com/user',{headers:{Authorization:'Bearer '+access_token,'User-Agent':'Adriatic-Desk'}});
 if(!identity.ok)return Response.json({message:'GitHub could not verify your identity.'},{status:403,headers});
 if((await identity.json()).id!==358121128)return Response.json({message:'Sign in with the administrator account andredidey51-a11y.'},{status:403,headers});
 return Response.json({token:access_token},{headers});
 }catch{return new Response(null,{status:400,headers});}
}};
