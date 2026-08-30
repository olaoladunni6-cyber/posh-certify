(function(){
if(typeof db==="undefined")return;
if(!db.fxPar)db.fxPar={};
if(!db.fixtures)db.fixtures=[];
function fxList(){return db.fixtures||[];}
function roomTypes(){
  var t={};
  (db.rooms||[]).forEach(function(r){if(r.type)t[r.type]=1;});
  ["Deluxe King","Executive King","Standard"].forEach(function(x){t[x]=1;});
  return Object.keys(t);
}
function fxExpected(type,id){
  var row=(db.fxPar||{})[type]||{};
  if(row[id]!=null&&String(row[id])!=="")return Number(row[id]||0);
  var it=fxList().filter(function(x){return x.id===id;})[0];
  return Number(it&&it.par!=null?it.par:0);
}
function fxActual(r,id){
  if(r.fixtureActual&&r.fixtureActual[id]!=null&&String(r.fixtureActual[id])!=="")
    return Number(r.fixtureActual[id]||0);
  return Math.max(0,fxExpected(r.type,id)-Number((r.fixtureMiss||{})[id]||0));
}
function fxShort(r,id){return Math.max(0,fxExpected(r.type,id)-fxActual(r,id));}
fixtureMiss=function(r){return fxList().reduce(function(n,it){return n+fxShort(r,it.id);},0);};
function staffEditor(){
  var people=(db.users||[]).map(function(u){
    return "<div class=card><b>"+u.name+"</b> · "+roleName(u.role)+" · "+(u.site||"")+"<br><input data-en='"+u.id+"' value='"+u.name+"'>"+roleSel("er-"+u.id,u.role)+locSel("es-"+u.id,u.site)+"<input data-pinfor='"+u.id+"' placeholder='New PIN'><input data-ew='"+u.id+"' value='"+digits(u.whatsapp||"")+"' placeholder='WhatsApp'><br><button class='btn saveU' data-id='"+u.id+"'>Save</button> <button class='btn bad delU' data-id='"+u.id+"'>Remove</button></div>";
  }).join("");
  return "<h1>Staff</h1>"+people+"<div class=card><h3>Add staff</h3><input id=sn placeholder='Name'>"+roleSel("sr","housekeeper")+locSel("ss","Ikeja")+"<input id=sp placeholder='PIN'><button class=btn id=addStaff>Save staff</button></div>";
}
viewFixtures=function(){
  var types=roomTypes();
  var rows=fxList().map(function(it){
    var cells=types.map(function(t){
      return "<p><b>"+t+"</b> — expected <input class=fxpt type=number min=0 data-type='"+t+"' data-item='"+it.id+"' value='"+fxExpected(t,it.id)+"'></p>";
    }).join("");
    return "<div class=card><h3>"+it.name+"</h3>"+cells+"<button class='btn saveFxPar' data-id='"+it.id+"'>Save "+it.name+" by room type</button></div>";
  }).join("");
  return "<h1>Fixture expected by room type</h1><div class=ok>Set how many of each item belong in Deluxe King, Executive King and Standard. Housekeeper then enters the actual count in that room.</div>"+rows+"<div class=card><h3>Add fixture</h3><input id=fxname placeholder='e.g. Wine glass'><input id=fxpar type=number min=0 value=1><button class=btn id=addFx>Save fixture</button></div>";
};
var _vsPrev=viewStaff;
viewStaff=function(){
  if(user&&user.role==="superadmin")return viewFixtures()+staffEditor();
  return _vsPrev();
};
laundryBox=function(r){
  var can=user&&user.role==="housekeeper"&&r.hk===user.id&&r.job;
  var dailyItems=(typeof catalog==="function"?catalog():[]).filter(function(it){return it.cat==="Toiletries"||it.cat==="Towels"||it.cat==="Linen";});
  var fx=fxList().map(function(it){
    var exp=fxExpected(r.type,it.id),short=fxShort(r,it.id);
    var shown=r.fixtureActual&&r.fixtureActual[it.id]!=null?r.fixtureActual[it.id]:"";
    var inp=can?"<input class=fa type=number min=0 data-item='"+it.id+"' value='"+shown+"' placeholder='Actual in this room'>":"<span class=qty>"+(shown===""?"not counted":("actual "+shown))+"</span>";
    return "<p><b>"+it.name+"</b><br>This room is <b>"+(r.type||"no type")+"</b> so expected is <b>"+exp+"</b>"+(short?(" · <b>"+short+" missing</b>"):" · complete")+"<br>"+inp+"</p>";
  }).join("");
  var daily=dailyItems.map(function(it){var n=Number((r.missing||{})[it.id]||0);return "<div class=row><span>"+it.name+" · "+it.cat+"</span>"+(can?"<input class=q type=number min=0 data-item='"+it.id+"' value='"+(n||"")+"'>":"<span class=qty>"+n+"</span>")+"</div>";}).join("");
  return "<div class=card><h3>Fixtures · "+(r.type||"set a room type")+"</h3>"+fx+"</div><div class=card><h3>Toiletries, towels and linen</h3>"+daily+(can?"<button class=btn id=lrep>Save counts</button>":"")+"</div>";
};
var _b2=bind;
bind=function(){
  _b2();
  document.querySelectorAll(".saveFxPar").forEach(function(b){
    b.onclick=function(){
      if(!user||user.role!=="superadmin")return;
      var id=b.getAttribute("data-id");
      if(!db.fxPar)db.fxPar={};
      document.querySelectorAll(".fxpt[data-item='"+id+"']").forEach(function(inp){
        var t=inp.getAttribute("data-type");
        if(!db.fxPar[t])db.fxPar[t]={};
        var n=parseInt(inp.value,10);
        db.fxPar[t][id]=n>=0?n:0;
      });
      save();alert("Saved expected by room type.");draw();
    };
  });
  var addFx=document.getElementById("addFx");
  if(addFx)addFx.onclick=function(){
    if(!user||user.role!=="superadmin")return;
    var name=(document.getElementById("fxname").value||"").trim();
    var par=parseInt(document.getElementById("fxpar").value,10)||1;
    if(!name){alert("Enter fixture name");return;}
    db.fixtures.push({id:"fx"+Date.now(),name:name,par:par});
    save();draw();
  };
  var lrep=document.getElementById("lrep");
  if(lrep){
    var prevL=lrep.onclick;
    lrep.onclick=function(){
      if(!user||user.role!=="housekeeper")return;
      var r=db.rooms.filter(function(x){return x.id===roomId;})[0];
      if(!r)return;
      var act={};
      document.querySelectorAll(".fa").forEach(function(inp){
        if(inp.value==="")return;
        act[inp.getAttribute("data-item")]=parseInt(inp.value,10)||0;
      });
      r.fixtureActual=act;
      var miss={};
      fxList().forEach(function(it){var sh=fxShort(r,it.id);if(sh>0)miss[it.id]=sh;});
      r.fixtureMiss=miss;
      if(prevL)prevL();else{save();draw();}
    };
  }
};
try{draw();}catch(e){}
})();
