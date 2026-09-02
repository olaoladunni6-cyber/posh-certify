(function(){
var PENALTY=500;
function day(){try{return today();}catch(e){return new Date().toISOString().slice(0,10);}}
function monthKey(d){return String(d||day()).slice(0,7);}
function siteOk(s){try{return !user||user.role==="ceo"||user.role==="superadmin"||!user.site||!s||s===user.site;}catch(e){return true;}}
function logList(){
  if(!db.cleanLog)db.cleanLog=[];
  return db.cleanLog.filter(function(x){return x&&siteOk(x.site);});
}
function addLog(r,score,penalty){
  if(!db.cleanLog)db.cleanLog=[];
  db.cleanLog.push({
    id:"cl"+Date.now()+Math.random().toString(16).slice(2),
    day:day(),
    month:monthKey(),
    room:r.number,
    site:r.site||(user&&user.site)||"",
    hk:r.hkName||r.hk||"",
    by:user&&user.name||"",
    score:score||"certified",
    penalty:penalty||0,
    note:r.hkNote||"",
    at:new Date().toLocaleString()
  });
}
function scoped(rows){
  if(user&&user.role==="housekeeper"){
    return rows.filter(function(x){
      return String(x.hk)===String(user.name)||String(x.hk)===String(user.id);
    });
  }
  return rows;
}
function naira(n){return "₦"+Number(n||0).toLocaleString();}
function boardHtml(){
  var all=scoped(logList());
  var m=monthKey();
  var month=all.filter(function(x){return (x.month||monthKey(x.day))===m;});
  var todayRows=all.filter(function(x){return x.day===day()&&x.score==="certified";});
  var retMonth=month.filter(function(x){return x.score==="returned";});
  var retAll=all.filter(function(x){return x.score==="returned";});
  var penMonth=retMonth.reduce(function(s,x){return s+(x.penalty||PENALTY);},0);
  var penAll=retAll.reduce(function(s,x){return s+(x.penalty||PENALTY);},0);
  var by={};
  todayRows.forEach(function(x){by[x.hk||"-"]=(by[x.hk||"-"]||0)+1;});
  var sum=Object.keys(by).map(function(k){return k+": "+by[k];}).join(" · ")||"None yet";
  var list=todayRows.map(function(x){return "<li>Rm "+x.room+" — "+(x.hk||"")+" — certified — "+x.at+"</li>";}).join("");
  var retList=retMonth.map(function(x){return "<li>Rm "+x.room+" — "+(x.hk||"")+" — "+naira(x.penalty||PENALTY)+" — "+x.at+(x.note?(" — "+x.note):"")+"</li>";}).join("");
  return "<div class=card><h3>Rooms cleaned today ("+todayRows.length+")</h3><p>"+sum+"</p><ol>"+list+"</ol></div>"+
    "<div class=card><h3>Monthly returns & penalties "+m+"</h3>"+
    "<p>Returns this month: <b>"+retMonth.length+"</b></p>"+
    "<p>Penalty this month: <b>"+naira(penMonth)+"</b> ("+naira(PENALTY)+" each return)</p>"+
    "<p>Returns to date: <b>"+retAll.length+"</b></p>"+
    "<p>Total penalty received to date: <b>"+naira(penAll)+"</b></p>"+
    (retList?("<ol>"+retList+"</ol>"):"<p>No returns this month.</p>")+"</div>";
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
  addLog(r,"certified",0);
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
  r.returns=(r.returns||0)+1;
  r.penalty=(r.penalty||0)+PENALTY;
  addLog(r,"returned",PENALTY);
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
      extra = "<div class=card><h3>Housekeeping protocol</h3><p>1 Clean the room</p><p>2 Mark the checklist</p><p>3 Attach one walkthrough video</p><p>4 Submit for certification</p><p>All four are required before pay. Each return to service is "+naira(PENALTY)+" penalty. Certified rooms stay closed.</p></div>"+extra;
    }
    return extra+html;
  };
  try{draw();}catch(e){}
}
boot();
})();
