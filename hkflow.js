(function(){
function day(){try{return today();}catch(e){return new Date().toISOString().slice(0,10);}}
function siteOk(s){try{return !user||!user.site||!s||s===user.site;}catch(e){return true;}}
function logList(){
  if(!db.cleanLog)db.cleanLog=[];
  return db.cleanLog.filter(function(x){return x&&siteOk(x.site);});
}
function addLog(r,score){
  if(!db.cleanLog)db.cleanLog=[];
  db.cleanLog.push({
    id:"cl"+Date.now(),
    day:day(),
    room:r.number,
    site:r.site||(user&&user.site)||"",
    hk:r.hkName||r.hk||"",
    by:user&&user.name||"",
    score:score||"certified",
    at:new Date().toLocaleString()
  });
}
function todayLog(hk){
  return logList().filter(function(x){
    if(x.day!==day())return false;
    if(hk&&x.hk&&String(x.hk)!==String(hk)&&String(x.hk)!==String(user&&user.name))return false;
    return true;
  });
}
function boardHtml(){
  var rows=todayLog();
  if(user&&user.role==="housekeeper"){
    rows=todayLog(user.name);
  }
  var by={};
  rows.forEach(function(x){by[x.hk||"-"]=(by[x.hk||"-"]||0)+1;});
  var sum=Object.keys(by).map(function(k){return k+": "+by[k];}).join(" · ")||"None yet";
  var list=rows.map(function(x){return "<li>Rm "+x.room+" — "+(x.hk||"")+" — "+x.score+" — "+x.at+"</li>";}).join("");
  return "<div class=card><h3>Rooms cleaned today ("+rows.length+")</h3><p>"+sum+"</p><ol>"+list+"</ol></div>";
}
function protocolCard(r){
  if(!r)return "";
  var steps=[
    ["Checklist marked", !!(r.laundryChecked||r.checklistDone)],
    ["Video attached", !!r.videoReady],
    ["Submitted to DM", r.status==="submitted"||r.status==="certified"],
    ["DM certified", r.status==="certified"]
  ];
  return "<div class=card><h3>Room "+r.number+" clearance</h3>"+steps.map(function(s){
    return "<p>"+(s[1]?"✓":"○")+" "+s[0]+"</p>";
  }).join("")+(r.hkNote?("<p><b>DM: </b>"+r.hkNote+"</p>"):"")+"</div>";
}
window.poshHkReady=function(r){
  if(!r)return false;
  if(r.status==="certified"||r.status==="ooo")return false;
  return !!(r.laundryChecked||r.checklistDone) && !!r.videoReady;
};
window.poshHkLock=function(r){
  if(!r)return;
  r.status="certified";
  r.locked=true;
  r.payOk=true;
  r.certifiedAt=new Date().toLocaleString();
  r.certifiedDay=day();
  addLog(r,"certified");
};
window.poshHkReturn=function(r,note){
  if(!r)return;
  r.status="pending";
  r.job="inservice";
  r.locked=false;
  r.videoReady=false;
  r.laundryChecked=false;
  r.checklistDone=false;
  r.hkNote=note||"Return to service";
  r.payOk=false;
};
window.poshCleanBoard=boardHtml;
function boot(){
  if(typeof viewBoard!=="function"){setTimeout(boot,80);return;}
  if(window.__hkFlow)return;window.__hkFlow=true;
  var _vb=viewBoard;
  viewBoard=function(){
    var html=_vb.apply(this,arguments);
    var extra=boardHtml();
    if(user&&user.role==="housekeeper"){
      var open=(db.rooms||[]).filter(function(r){
        if(!siteOk(r.site))return false;
        if(r.status==="certified"||r.status==="ooo"||r.locked)return false;
        return !r.hk||r.hk===user.id||r.hk===user.name;
      });
      extra += open.map(protocolCard).join("");
      extra = "<div class=card><h3>Housekeeping protocol</h3><p>1 Clean the room</p><p>2 Mark the checklist</p><p>3 Attach one walkthrough video</p><p>4 Submit for certification</p><p>All four are required before pay. Certified rooms stay closed.</p></div>"+extra;
    }
    return extra+html;
  };
  try{draw();}catch(e){}
}
boot();
})();
