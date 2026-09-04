(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__roleView2)return;window.__roleView2=true;
function role(){return (user&&user.role)||"";}
function isHk(){return role()==="housekeeper";}
function locked(r){return !!(r&&(r.status==="certified"||r.status==="ooo"));}
function hideMealsOnly(){
  if(!isHk())return;
  try{
    var d5=document.getElementById("d5");
    if(d5)d5.style.display="none";
    var d4=document.getElementById("d4");
    if(d4)d4.style.display="";
  }catch(e){}
}
function wireOpenAndMe(){
  document.querySelectorAll(".open").forEach(function(b){
    var id=b.getAttribute("data-id");
    if(!id)return;
    b.style.display="inline-block";
    b.onclick=function(){roomId=id;tab="rooms";draw();};
  });
  var out=document.getElementById("out");
  if(out)out.onclick=function(){user=null;roomId=null;tab="rooms";draw();};
}
if(typeof viewBoard==="function"){
  var _vb=viewBoard;
  viewBoard=function(){
    var html=_vb.apply(this,arguments);
    if(!isHk())return html;
    var list=(db.rooms||[]).filter(function(r){
      if(user&&user.site&&r.site&&r.site!==user.site)return false;
      if(locked(r))return false;
      return !r.hk||r.hk===user.id||r.hk===user.name;
    });
    var cards=list.map(function(r){
      return "<div class=room data-id='"+r.id+"'><b>"+r.number+"</b> "+(r.type||"")+"<br>"+(r.site||"")+" · "+(r.status||"pending")+"<br><button type=button class='btn open' data-id='"+r.id+"'>Open</button></div>";
    }).join("");
    if(!cards)cards="<div class=warn>No rooms on your board yet.</div>";
    return "<h1>My rooms</h1>"+cards;
  };
}
if(typeof bind==="function"){
  var _b=bind;
  bind=function(){try{_b.apply(this,arguments);}catch(e){}hideMealsOnly();wireOpenAndMe();};
}
var _d=draw;
draw=function(){
  if(isHk()&&typeof tab!=="undefined"&&(tab==="meals"||tab==="desk"))tab="rooms";
  var out=_d.apply(this,arguments);
  hideMealsOnly();
  wireOpenAndMe();
  return out;
};
try{draw();}catch(e){}
if(!window.__cloudLoader){
  window.__cloudLoader=true;
  ["cloud.js?v=20260904C","allsites.js?v=20260904D","dockfix.js?v=20260904F"].forEach(function(src){
    var s=document.createElement("script");
    s.src=src;
    document.head.appendChild(s);
  });
}
}
boot();
})();
