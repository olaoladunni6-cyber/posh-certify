(function(){
function boot(){
if(typeof db==="undefined"||typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__roleView)return;window.__roleView=true;
function role(){return (user&&user.role)||"";}
function isHk(){return role()==="housekeeper";}
function hideDeskMeals(){
  if(!isHk())return;
  try{
    var css=document.getElementById("roleViewCss");
    if(!css){css=document.createElement("style");css.id="roleViewCss";document.head.appendChild(css);}
    css.textContent="#d3,#d4,button#desk,button#meals,[data-tab='desk'],[data-tab='meals']{display:none!important}";
    var dock=document.querySelector("nav.dock")||document.querySelector(".dock");
    if(dock){
      [].slice.call(dock.querySelectorAll("button,a")).forEach(function(b){
        var t=String(b.textContent||"").toLowerCase();
        if(t.indexOf("desk")>=0||t.indexOf("meal")>=0||t.indexOf("breakfast")>=0)b.style.display="none";
      });
    }
  }catch(e){}
  if(typeof tab!=="undefined"&&(tab==="desk"||tab==="meals"||tab==="meal"))tab="rooms";
}
if(typeof bind==="function"){
  var _b=bind;
  bind=function(){
    try{_b.apply(this,arguments);}catch(e){}
    hideDeskMeals();
    var d3=document.getElementById("d3");
    var d4=document.getElementById("d4");
    if(isHk()&&d3)d3.onclick=function(){tab="rooms";draw();};
    if(isHk()&&d4)d4.onclick=function(){tab="rooms";draw();};
  };
}
var _d=draw;
draw=function(){
  if(isHk()&&typeof tab!=="undefined"&&(tab==="desk"||tab==="meals"||tab==="meal"))tab="rooms";
  var out=_d.apply(this,arguments);
  hideDeskMeals();
  return out;
};
try{draw();}catch(e){}
}
boot();
})();
