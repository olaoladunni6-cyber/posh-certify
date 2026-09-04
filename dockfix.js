(function(){
function boot(){
if(typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__dockFix)return;window.__dockFix=true;
var css=document.getElementById("dockFixCss");
if(!css){
  css=document.createElement("style");
  css.id="dockFixCss";
  css.textContent=".dock{z-index:200!important;pointer-events:auto!important}.dock button,.dock a{pointer-events:auto!important;touch-action:manipulation;min-height:44px}";
  document.head.appendChild(css);
}
function go(name){
  roomId=null;
  tab=name;
  try{draw();}catch(e){}
}
function which(b){
  if(!b)return "";
  var id=b.id||"";
  var t=String(b.textContent||"").toLowerCase();
  if(id==="d1"||t.indexOf("room")>=0)return "rooms";
  if(id==="d2"||t.indexOf("desk")>=0)return "desk";
  if(id==="d5"||t.indexOf("meal")>=0)return "meals";
  if(id==="d4"||t==="me"||t.indexOf("sign")>=0)return "me";
  if(id==="d3"||t.indexOf("staff")>=0||t.indexOf("fix")>=0||t.indexOf("issue")>=0||t.indexOf("store")>=0||t.indexOf("laundry")>=0)return "staff";
  return "";
}
if(!window.__dockClicks){
  window.__dockClicks=true;
  document.addEventListener("click",function(ev){
    var n=ev.target;
    if(!n)return;
    var b=n.closest?n.closest(".dock button,.dock a,button#d1,button#d2,button#d3,button#d4,button#d5"):null;
    if(!b){
      if(n.id&&String(n.id).charAt(0)==="d"&&n.tagName==="BUTTON")b=n;
    }
    if(!b)return;
    var name=which(b);
    if(!name)return;
    ev.preventDefault();
    ev.stopPropagation();
    go(name);
  },true);
}
function wire(){
  ["d1","d2","d3","d4","d5"].forEach(function(id){
    var b=document.getElementById(id);
    if(!b)return;
    b.onclick=function(ev){
      if(ev){ev.preventDefault();ev.stopPropagation();}
      var name=which(b);if(name)go(name);
    };
  });
}
if(typeof bind==="function"){
  var _b=bind;
  bind=function(){try{_b.apply(this,arguments);}catch(e){}wire();};
}
var _d=draw;
draw=function(){var out=_d.apply(this,arguments);wire();return out;};
wire();
}
boot();
})();
