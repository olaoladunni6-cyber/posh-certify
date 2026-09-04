(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__allSites)return;window.__allSites=true;
function groupRole(u){
  if(!u)return false;
  var r=String(u.role||"").toLowerCase();
  return r==="ceo"||r==="gm"||r==="superadmin"||r==="owner";
}
function stamp(){
  (db.users||[]).forEach(function(u){
    if(!groupRole(u))return;
    u.site="All locations";
    u.allSites=true;
  });
}
stamp();
if(typeof siteMatch==="function"){
  var _sm=siteMatch;
  siteMatch=function(site){
    if(user&&groupRole(user))return true;
    return _sm.apply(this,arguments);
  };
}else{
  window.siteMatch=function(site){
    if(!user)return true;
    if(groupRole(user))return true;
    if(!user.site||user.site==="All locations")return true;
    if(!site)return true;
    return site===user.site;
  };
}
if(typeof bind==="function"){
  var _b=bind;
  bind=function(){
    try{_b.apply(this,arguments);}catch(e){}
    stamp();
  };
}
var _d=draw;
draw=function(){
  stamp();
  return _d.apply(this,arguments);
};
try{draw();}catch(e){}
}
boot();
})();
