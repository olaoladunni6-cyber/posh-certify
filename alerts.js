(function(){
function boot(){
if(typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__phoneAlerts)return;window.__phoneAlerts=true;
function state(){
  try{
    if(!("Notification" in window))return "This browser cannot send phone alerts.";
    if(Notification.permission==="granted")return "Phone alerts are ON on this device.";
    if(Notification.permission==="denied")return "Alerts were blocked. iPhone: Settings → Safari → Posh Manager → Allow Notifications, or add to Home Screen and tap Allow.";
    return "Tap Allow phone alerts so new chat, certify and checkout notices can ping this phone.";
  }catch(e){return "Alerts not available here.";}
}
window.poshAllowAlerts=function(){
  if(!("Notification" in window)){alert("This browser cannot send phone alerts");return;}
  Notification.requestPermission().then(function(p){
    if(p==="granted"){
      try{new Notification("Posh Manager",{body:"Phone alerts are on.",tag:"posh-alert-on");}catch(e){}
      alert("Phone alerts are ON.");
    }else alert("Alerts: "+p+". On iPhone add this page to Home Screen, open it from the icon, then tap Allow phone alerts again.");
    try{draw();}catch(e){}
  });
};
function box(){
  if(!user)return "";
  return "<div class=card id=alertCard><h3>Phone alerts</h3><p>"+state()+"</p><p><button type=button class=btn id=allowAlerts>Allow phone alerts</button></p></div>";
}
if(!window.__alertClicks){
  window.__alertClicks=true;
  document.addEventListener("click",function(ev){
    if(ev.target&&ev.target.id==="allowAlerts"){ev.preventDefault();window.poshAllowAlerts();}
  },true);
}
function inject(){
  if(!user)return;
  if(document.getElementById("alertCard"))return;
  var wrap=document.querySelector(".wrap")||document.getElementById("app");
  if(!wrap)return;
  wrap.insertAdjacentHTML("afterbegin",box());
}
var _draw=draw;
draw=function(){
  _draw.apply(this,arguments);
  try{inject();}catch(e){}
};
try{draw();}catch(e){}
}
boot();
})();
