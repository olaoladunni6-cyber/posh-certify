(function(){
function boot(){
if(typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__dockFix2)return;window.__dockFix2=true;
var css=document.getElementById("dockFixCss");
if(!css){
  css=document.createElement("style");
  css.id="dockFixCss";
  css.textContent=".dock{display:none!important}#poshNav{position:sticky;top:0;z-index:300;background:#c4a574;padding:8px;display:flex;flex-wrap:wrap;gap:6px}#poshNav button{pointer-events:auto!important;touch-action:manipulation;min-height:40px;padding:8px 12px;border:0;border-radius:99px;background:#101512;color:#fff;font-weight:700}";
  document.head.appendChild(css);
}
function go(name){
  roomId=null;
  tab=name;
  try{draw();}catch(e){alert(String(e));}
}
function strip(){
  if(!user){
    var old=document.getElementById("poshNav");
    if(old&&old.parentNode)old.parentNode.removeChild(old);
    return;
  }
  var d=document.getElementById("poshNav");
  if(!d){
    d=document.createElement("div");
    d.id="poshNav";
    var host=document.querySelector(".wrap")||document.body;
    host.insertBefore(d,host.firstChild);
  }
  var role=(user.role||"");
  var items=["rooms","desk","staff","meals","me"];
  if(role==="housekeeper")items=["rooms","staff","me"];
  if(role==="kitchen")items=["meals","staff","me"];
  if(role==="laundry")items=["staff","rooms","me"];
  d.innerHTML="";
  items.forEach(function(name){
    var b=document.createElement("button");
    b.type="button";
    b.textContent=name==="me"?"Me":name.charAt(0).toUpperCase()+name.slice(1);
    b.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}go(name);};
    d.appendChild(b);
  });
}
if(typeof bind==="function"){
  var _b=bind;
  bind=function(){try{_b.apply(this,arguments);}catch(e){}strip();};
}
var _d=draw;
draw=function(){var out=_d.apply(this,arguments);strip();return out;};
strip();
}
boot();
})();
