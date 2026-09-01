(function(){
function boot(){
if(typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__phoneAlerts)return;window.__phoneAlerts=true;
var PREF_KEY="posh-alert-prefs";
var KINDS=[
  {id:"chat",label:"Staff chat and replies"},
  {id:"certify",label:"Room certified / ready to sell"},
  {id:"ooo",label:"Room out of order"},
  {id:"service",label:"Room in service / returned"},
  {id:"checkout",label:"Checkout / 12:00 in-service"},
  {id:"sales",label:"Sales query from accountant"},
  {id:"folio",label:"New guest folio"}
];
function prefs(){
  var d={chat:true,certify:true,ooo:true,service:true,checkout:true,sales:true,folio:true};
  try{var x=JSON.parse(localStorage.getItem(PREF_KEY)||"{}");Object.keys(x).forEach(function(k){d[k]=!!x[k];});}catch(e){}
  return d;
}
function savePrefs(p){try{localStorage.setItem(PREF_KEY,JSON.stringify(p));}catch(e){}}
function state(){
  try{
    if(!("Notification" in window))return "This browser cannot send phone alerts.";
    if(Notification.permission==="granted")return "Push alerts are ON for this phone.";
    if(Notification.permission==="denied")return "Blocked. iPhone: open from Home Screen, then Allow. Or Settings → Notifications.";
    return "Tap Allow phone alerts, then tick what this phone should receive.";
  }catch(e){return "Alerts not available here.";}
}
function registerSw(){
  if(!("serviceWorker" in navigator))return Promise.resolve(null);
  return navigator.serviceWorker.register("sw.js?v=34C").catch(function(){return null;});
}
function showNote(title,body,tag){
  var ntitle=title||"Posh Manager";
  var nbody=body||"";
  var ntag=tag||"posh";
  function fallback(){try{new Notification(ntitle,{body:nbody,tag:ntag});}catch(e){}}
  if(navigator.serviceWorker&&navigator.serviceWorker.ready){
    navigator.serviceWorker.ready.then(function(reg){
      if(reg&&reg.showNotification)return reg.showNotification(ntitle,{body:nbody,tag:ntag,renotify:true});
      fallback();
    }).catch(fallback);
  }else fallback();
}
window.poshNotify=function(kind,title,body){
  var p=prefs();
  if(kind&&p[kind]===false)return;
  if(!("Notification" in window)||Notification.permission!=="granted")return;
  showNote(title||"Posh Manager",body||"", "posh-"+(kind||"note"));
};
window.poshAllowAlerts=function(){
  if(!("Notification" in window)){alert("This browser cannot send phone alerts");return;}
  registerSw();
  Notification.requestPermission().then(function(perm){
    if(perm==="granted"){
      showNote("Posh Manager","Push alerts are configured on this phone.","posh-alert-on");
      alert("Phone alerts are ON. Tick the events this phone should receive, then keep the app on the Home Screen.");
    }else alert("Alerts: "+perm+". iPhone: Share → Add to Home Screen, open the icon, tap Allow phone alerts.");
    try{draw();}catch(e){}
  });
};
function box(){
  if(!user)return "";
  var p=prefs();
  var ticks=KINDS.map(function(k){
    return "<label class=row style='display:flex;justify-content:space-between;gap:8px;padding:6px 0'><span>"+k.label+"</span><input type=checkbox class=alertKind data-kind='"+k.id+"' "+(p[k.id]!==false?"checked":"")+"></label>";
  }).join("");
  return "<div class=card id=alertCard><h3>Push notifications</h3><p>"+state()+"</p>"+
    "<p>This phone only. Other staff configure their own phone.</p>"+
    ticks+
    "<p><button type=button class=btn id=allowAlerts>Allow phone alerts</button> <button type=button class=btn id=testAlert>Send test alert</button></p></div>";
}
if(!window.__alertClicks){
  window.__alertClicks=true;
  document.addEventListener("change",function(ev){
    var t=ev.target;if(!t||String(t.className||"").indexOf("alertKind")<0)return;
    var p=prefs();p[t.getAttribute("data-kind")]=!!t.checked;savePrefs(p);
  },true);
  document.addEventListener("click",function(ev){
    var t=ev.target;if(!t)return;
    if(t.id==="allowAlerts"){ev.preventDefault();window.poshAllowAlerts();}
    if(t.id==="testAlert"){ev.preventDefault();if(Notification.permission!=="granted"){window.poshAllowAlerts();return;}window.poshNotify("chat","Posh Manager","Test alert for "+(user&&user.name||"this phone"));}
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
registerSw();
try{draw();}catch(e){}
}
boot();
})();
