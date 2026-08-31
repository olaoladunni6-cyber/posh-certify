(function(){
function boot(){
if(typeof db==="undefined"){setTimeout(boot,80);return;}
if(window.__statusWa)return;window.__statusWa=true;
function ng(n){n=String(n||"").replace(/\D/g,"");if(n.indexOf("234")===0)return n;if(n.length===11&&n.charAt(0)==="0")return "234"+n.slice(1);if(n.length===10)return "234"+n;return n;}
function add(out,seen,n){n=ng(n);if(n&&n.length>=13&&!seen[n]){seen[n]=1;out.push(n);}}
window.pingRoomWa=function(room,kind){
  if(!db.deskNotes)db.deskNotes=[];
  db.deskNotes.push({id:"n"+Date.now(),room:room,kind:kind,site:user&&user.site||"",at:new Date().toLocaleString()});
  var out=[],seen={};
  try{if(typeof fdDigits==="function")add(out,seen,fdDigits());}catch(e){}
  try{if(typeof waDigits==="function")add(out,seen,waDigits());}catch(e){}
  add(out,seen,db.frontDesk);add(out,seen,db.whatsapp);
  (db.users||[]).forEach(function(u){
    if(!u.whatsapp)return;
    if((u.role==="frontdesk"||u.role==="manager")&&(!user||!u.site||u.site===user.site))add(out,seen,u.whatsapp);
  });
  var text="POSH MANAGER\nRoom "+room+"\n"+kind+"\n"+new Date().toLocaleString();
  if(!out.length){alert("Save Front Desk and duty manager WhatsApp numbers on Staff.");return 0;}
  out.forEach(function(num,i){setTimeout(function(){window.open("https://wa.me/"+num+"?text="+encodeURIComponent(text),"_blank");},i*800);});
  return out.length;
};
}
boot();
})();
