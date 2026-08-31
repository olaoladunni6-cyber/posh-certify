(function(){
function boot(){
if(typeof db==="undefined"){setTimeout(boot,60);return;}
if(!db.fxPar)db.fxPar={};
if(!db.fixtures||!db.fixtures.length){
  db.fixtures=[{id:"fx_kettle",name:"Kettle",par:1},{id:"fx_teaspoon",name:"Teaspoon",par:2},{id:"fx_teacup",name:"Tea cup",par:2},{id:"fx_glass",name:"Glass cup",par:2},{id:"fx_mug",name:"Coffee mug",par:2},{id:"fx_ice",name:"Ice bucket",par:1},{id:"fx_tray",name:"Tray",par:1},{id:"fx_remote",name:"TV remote",par:1},{id:"fx_dryer",name:"Hair dryer",par:1}];
}
function fxList(){return (typeof fixtureItems==="function"?fixtureItems():db.fixtures)||[];}
function fxExpected(roomNo,id){
  var row=(db.fxPar||{})[String(roomNo)]||{};
  if(row[id]!=null&&String(row[id])!=="")return Number(row[id]||0);
  var it=fxList().filter(function(x){return x.id===id;})[0];
  return Number(it&&it.par!=null?it.par:0);
}
function fxActual(r,id){
  if(r.fixtureActual&&r.fixtureActual[id]!=null&&String(r.fixtureActual[id])!=="")
    return Number(r.fixtureActual[id]||0);
  return Math.max(0,fxExpected(r.number,id)-Number((r.fixtureMiss||{})[id]||0));
}
function fxShort(r,id){return Math.max(0,fxExpected(r.number,id)-fxActual(r,id));}
fixtureMiss=function(r){return fxList().reduce(function(n,it){return n+fxShort(r,it.id);},0);};
function keepDraft(){
  window.__poshTyping=Date.now();
  if(!db.fxPar)db.fxPar={};
  document.querySelectorAll(".fxpt").forEach(function(inp){
    var room=String(inp.getAttribute("data-room"));
    var id=inp.getAttribute("data-item");
    if(!db.fxPar[room])db.fxPar[room]={};
    var n=parseInt(inp.value,10);
    db.fxPar[room][id]=isNaN(n)?0:n;
  });
  if(typeof roomId!=="undefined"&&roomId){
    var r=db.rooms.filter(function(x){return x.id===roomId;})[0];
    if(r){
      if(!r.fixtureActual)r.fixtureActual={};
      document.querySelectorAll(".fa").forEach(function(inp){
        var id=inp.getAttribute("data-item");
        var n=parseInt(inp.value,10);
        if(inp.value===""||isNaN(n))return;
        r.fixtureActual[id]=n;
      });
    }
  }
  try{localStorage.setItem(typeof KEY==="string"?KEY:"posh-full-v13",JSON.stringify(db));}catch(e){}
}
function ghBox(){
  if(typeof cloudBox==="function")return cloudBox();
  var on=!!localStorage.getItem("posh-gh-token");
  var n=(db.checkins||[]).length;
  return "<div class=card id=sharedHotel><h3>Shared hotel</h3>"+
    "<p>"+(on?"This device can publish to all phones.":"Paste the GitHub token once so staff and folios leave this phone.")+"</p>"+
    "<p>Folios on this phone: <b>"+n+"</b></p>"+
    "<input id=ghTok type=password placeholder='GitHub token'><button type=button class=btn id=saveTok>Save token</button>"+
    "<p><button type=button class=btn id=pullCloud>Refresh from shared list</button> <button type=button class=btn id=pushCloud>Publish this device now</button></p></div>";
}
viewBackup=function(){
  return "<div class=card><h3>Backup hotel data</h3><p>Download after every staff or room change.</p><button class=btn id=dlBak>Download backup</button><p>Restore</p><input id=upBak type=file accept='application/json,.json'><button class='btn dark' id=doBak>Restore backup</button></div>";
};
function staffEditor(){
  var people=(db.users||[]).map(function(u){
    return "<div class=card><b>"+u.name+"</b> · "+roleName(u.role)+" · "+(u.site||"")+"<br><input data-en='"+u.id+"' value='"+u.name+"'>"+roleSel("er-"+u.id,u.role)+locSel("es-"+u.id,u.site)+"<input data-pinfor='"+u.id+"' placeholder='New PIN'><input data-ew='"+u.id+"' value='"+digits(u.whatsapp||"")+"' placeholder='WhatsApp'><br><button class='btn saveU' data-id='"+u.id+"'>Save</button> <button class='btn bad delU' data-id='"+u.id+"'>Remove</button></div>";
  }).join("");
  return "<h1>Staff</h1>"+people+"<div class=card><h3>Add staff</h3><input id=sn placeholder='Name'>"+roleSel("sr","housekeeper")+locSel("ss","Ikeja")+"<input id=sp placeholder='PIN'><button class=btn id=addStaff>Save staff</button></div>";
}
viewFixtures=function(){
  var rooms=(db.rooms||[]).slice().sort(function(a,b){return String(a.number).localeCompare(String(b.number),undefined,{numeric:true});});
  var rows=rooms.map(function(r){
    var cells=fxList().map(function(it){
      return "<p>"+it.name+" — expected <input class=fxpt type=number min=0 data-room='"+r.number+"' data-item='"+it.id+"' value='"+fxExpected(r.number,it.id)+"'></p>";
    }).join("");
    return "<div class=card><h3>Room "+r.number+(r.site?" · "+r.site:"")+"</h3>"+cells+"<button class='btn saveFxPar' data-room='"+r.number+"'>Save Room "+r.number+"</button></div>";
  }).join("");
  return "<h1>Fixture expected by room number</h1>"+(rows||"<p>Add rooms first.</p>")+"<div class=card><h3>Add fixture item</h3><input id=fxname placeholder='e.g. Wine glass'><input id=fxpar type=number min=0 value=1><button class=btn id=addFx>Save fixture</button></div>";
};
var _vsPrev=viewStaff;
viewStaff=function(){
  if(user&&user.role==="superadmin")return ghBox()+viewBackup()+viewFixtures()+staffEditor();
  if(user&&(user.role==="manager"||user.role==="ceo"||user.role==="frontdesk"||user.role==="accountant"))return ghBox()+_vsPrev();
  return _vsPrev();
};
laundryBox=function(r){
  var can=user&&user.role==="housekeeper"&&r.hk===user.id&&r.job;
  var dailyItems=(typeof catalog==="function"?catalog():[]).filter(function(it){return it.cat==="Toiletries"||it.cat==="Towels"||it.cat==="Linen";});
  var fx=fxList().map(function(it){
    var exp=fxExpected(r.number,it.id),short=fxShort(r,it.id);
    var shown=r.fixtureActual&&r.fixtureActual[it.id]!=null?r.fixtureActual[it.id]:"";
    var inp=can?"<input class=fa type=number min=0 inputmode=numeric data-item='"+it.id+"' value='"+shown+"' placeholder='Actual in this room'>":"<span class=qty>"+(shown===""?"not counted":("actual "+shown))+"</span>";
    return "<p><b>"+it.name+"</b><br>Room "+r.number+" expected <b>"+exp+"</b>"+(short&&shown!==""?(" · <b>"+short+" missing</b>"):"")+"<br>"+inp+"</p>";
  }).join("");
  var daily=dailyItems.map(function(it){var n=Number((r.missing||{})[it.id]||0);return "<div class=row><span>"+it.name+" · "+it.cat+"</span>"+(can?"<input class=q type=number min=0 inputmode=numeric data-item='"+it.id+"' value='"+(n||"")+"'>":"<span class=qty>"+n+"</span>")+"</div>";}).join("");
  return "<div class=card><h3>Fixtures · Room "+r.number+"</h3>"+fx+"</div><div class=card><h3>Toiletries, towels and linen</h3>"+daily+(can?"<button class=btn id=lrep>Save counts</button>":"")+"</div>";
};
var _b2=bind;
bind=function(){
  _b2();
  document.querySelectorAll(".fxpt,.fa,.q").forEach(function(inp){
    inp.addEventListener("focus",function(){window.__poshTyping=Date.now();});
    inp.addEventListener("input",keepDraft);
    inp.addEventListener("blur",function(){keepDraft();window.__poshTyping=Date.now();});
  });
  var dlBak=document.getElementById("dlBak");
  if(dlBak)dlBak.onclick=function(){
    var blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});
    var a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download="posh-backup-"+(typeof today==="function"?today():"data")+".json";a.click();
  };
  var doBak=document.getElementById("doBak");
  if(doBak)doBak.onclick=function(){
    var inp=document.getElementById("upBak");var f=inp&&inp.files&&inp.files[0];
    if(!f){alert("Choose a backup file first");return;}
    if(!confirm("Replace staff and rooms on this phone with the backup?"))return;
    var rd=new FileReader();
    rd.onload=function(){try{var x=JSON.parse(rd.result);if(!x||!x.users)throw new Error("bad");db=x;save();draw();}catch(e){alert("Not a valid backup file");}};
    rd.readAsText(f);
  };
  document.querySelectorAll(".saveFxPar").forEach(function(b){
    b.onclick=function(){if(!user||user.role!=="superadmin")return;keepDraft();save();alert("Saved Room "+b.getAttribute("data-room"));};
  });
  var addFx=document.getElementById("addFx");
  if(addFx)addFx.onclick=function(){
    if(!user||user.role!=="superadmin")return;
    var name=(document.getElementById("fxname").value||"").trim();
    var par=parseInt(document.getElementById("fxpar").value,10)||1;
    if(!name){alert("Enter fixture name");return;}
    db.fixtures.push({id:"fx"+Date.now(),name:name,par:par});save();draw();
  };
};
try{draw();}catch(e){}
}
boot();
})();
