(function(){
function boot(){
if(typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__dockWire)return;window.__dockWire=true;
var MAP={d1:"rooms",d2:"desk",d3:"staff",d4:"me",d5:"meals"};
function go(tabName){
  if(!tabName)return;
  if(user&&user.role==="housekeeper"&&(tabName==="meals"||tabName==="desk"))tabName="rooms";
  try{tab=tabName;roomId=null;draw();}catch(e){}
}
function fromBtn(b){
  if(!b)return;
  var id=b.id||"";
  if(MAP[id]){go(MAP[id]);return;}
  var t=String(b.textContent||"").toLowerCase();
  if(t.indexOf("room")>=0)go("rooms");
  else if(t.indexOf("desk")>=0||t.indexOf("sales")>=0)go("desk");
  else if(t.indexOf("staff")>=0||t.indexOf("store")>=0||t.indexOf("laundry")>=0||t.indexOf("fix")>=0)go("staff");
  else if(t.indexOf("meal")>=0||t.indexOf("breakfast")>=0)go("meals");
  else if(t.indexOf("me")>=0||t.indexOf("out")>=0)go("me");
}
if(!window.__dockClicks){
  window.__dockClicks=true;
  document.addEventListener("click",function(ev){
    var n=ev.target;
    while(n&&n!==document.body){
      if(n.id&&MAP[n.id]){ev.preventDefault();fromBtn(n);return;}
      if(n.classList&&n.classList.contains("dock")===false&&n.parentElement&&n.parentElement.classList&&n.parentElement.classList.contains("dock")){
        ev.preventDefault();fromBtn(n);return;
      }
      n=n.parentElement;
    }
  },true);
}
var s=document.getElementById("dockWireCss");
if(!s){
  s=document.createElement("style");s.id="dockWireCss";
  s.textContent=".dock{z-index:200!important;pointer-events:auto!important}.dock button,.dock a{pointer-events:auto!important;min-height:44px}";
  document.head.appendChild(s);
}
}
boot();
})();
