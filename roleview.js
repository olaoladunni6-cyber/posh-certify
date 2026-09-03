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
    if(d5&&/meal/i.test(d5.textContent||""))d5.style.display="none";
    var d4=document.getElementById("d4");
    if(d4)d4.style.display="";
    var d3=document.getElementById("d3");
    if(d3)d3.style.display="";
  }catch(e){}
  if(typeof tab!=="undefined"&&(tab==="meals"||tab==="meal"||tab==="desk"))tab="rooms";
}
function wireOpenAndMe(){
  document.querySelectorAll(".open,.room").forEach(function(b){
    var id=b.getAttribute("data-id");
    if(!id&&b.querySelector){
      var inner=b.querySelector(".open,[data-id]");
      id=inner&&inner.getAttribute("data-id");
    }
    if(!id)return;
    var r=(db.rooms||[]).filter(function(x){return x.id===id;})[0];
    if(isHk()&&r&&locked(r))return;
    b.onclick=function(ev){
      if(ev)ev.preventDefault();
      roomId=id;tab="rooms";draw();
    };
  });
  document.querySelectorAll(".open").forEach(function(b){
    var id=b.getAttribute("data-id");
    if(!id)return;
    b.style.display="inline-block";
    b.onclick=function(){roomId=id;tab="rooms";draw();};
  });
  var out=document.getElementById("out");
  if(out)out.onclick=function(){user=null;roomId=null;tab="rooms";draw();};
  var d4=document.getElementById("d4");
  if(d4){
    d4.style.display="";
    d4.textContent="Me";
    d4.onclick=function(){tab="me";roomId=null;draw();};
  }
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
    if(!cards)cards="<div class=warn>No rooms on your board yet. Ask Front Desk to assign a checkout or in-house room.</div>";
    return "<h1>My rooms</h1>"+cards;
  };
}
if(typeof viewMe!=="function"){
  viewMe=function(){
    return "<h1>"+(user&&user.name||"Me")+"</h1><p>"+(user&&user.role||"")+"</p><button class=btn type=button id=out>Sign out</button>";
  };
}else{
  var _vm=viewMe;
  viewMe=function(){
    var html=_vm.apply(this,arguments);
    if(String(html||"").indexOf("id=out")<0&&String(html||"").indexOf('id="out"')<0){
      html+="<p><button class=btn type=button id=out>Sign out</button></p>";
    }
    return html;
  };
}
if(typeof bind==="function"){
  var _b=bind;
  bind=function(){
    try{_b.apply(this,arguments);}catch(e){}
    hideMealsOnly();
    wireOpenAndMe();
  };
}
var _d=draw;
draw=function(){
  if(isHk()&&typeof tab!=="undefined"&&(tab==="meals"||tab==="meal"||tab==="desk"))tab="rooms";
  var out=_d.apply(this,arguments);
  hideMealsOnly();
  wireOpenAndMe();
  return out;
};
try{draw();}catch(e){}
}
boot();
})();
