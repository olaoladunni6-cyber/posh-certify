(function(){
if(typeof db==="undefined")return;
if(!db.fxPar)db.fxPar={};
function roomTypes(){
  var t={};
  (db.rooms||[]).forEach(function(r){if(r.type)t[r.type]=1;});
  ["Deluxe King","Executive King","Standard"].forEach(function(x){t[x]=1;});
  return Object.keys(t);
}
function fxExpected(type,id){
  var row=(db.fxPar||{})[type]||{};
  if(row[id]!=null&&String(row[id])!=="")return Number(row[id]||0);
  var it=fixtureItems().filter(function(x){return x.id===id;})[0];
  return Number(it&&it.par!=null?it.par:0);
}
function fxActual(r,id){
  if(r.fixtureActual&&r.fixtureActual[id]!=null&&String(r.fixtureActual[id])!=="")
    return Number(r.fixtureActual[id]||0);
  var exp=fxExpected(r.type,id);
  var miss=Number((r.fixtureMiss||{})[id]||0);
  return Math.max(0,exp-miss);
}
function fxShort(r,id){return Math.max(0,fxExpected(r.type,id)-fxActual(r,id));}
fixtureMiss=function(r){
  return fixtureItems().reduce(function(n,it){return n+fxShort(r,it.id);},0);
};
viewFixtures=function(){
  if(!isSuper())return "";
  var types=roomTypes();
  var rows=fixtureItems().map(function(it){
    var cells=types.map(function(t){
      return "<p><b>"+t+"</b> — expected <input class=fxpt type=number min=0 data-type='"+t+"' data-item='"+it.id+"' value='"+fxExpected(t,it.id)+"'></p>";
    }).join("");
    return "<div class=card><h3>"+it.name+"</h3>"+cells+"<button class='btn saveFxPar' data-id='"+it.id+"'>Save "+it.name+" by room type</button></div>";
  }).join("");
  return "<h1>Fixture expected by room type</h1><div class=ok>Each item has a separate expected number for each room type. Save each item after you edit it.</div>"+rows+"<div class=card><h3>Add fixture</h3><input id=fxname placeholder='e.g. Wine glass'><input id=fxpar type=number min=0 value=1 placeholder='Default expected'><button class=btn id=addFx>Save fixture</button></div>";
};
laundryBox=function(r){
  var can=user&&user.role==="housekeeper"&&r.hk===user.id&&r.job;
  var fx=fixtureItems().map(function(it){
    var exp=fxExpected(r.type,it.id),short=fxShort(r,it.id);
    var shown=r.fixtureActual&&r.fixtureActual[it.id]!=null?r.fixtureActual[it.id]:"";
    var inp=can?"<input class=fa type=number min=0 data-item='"+it.id+"' value='"+shown+"' placeholder='Actual in this room'>":"<span class=qty>"+(shown===""?"not counted":("actual "+shown))+"</span>";
    return "<p><b>"+it.name+"</b><br>This room is <b>"+(r.type||"no type")+"</b> so expected is <b>"+exp+"</b>"+(short?(" · <b>"+short+" missing</b>"):" · complete")+"<br>"+inp+"</p>";
  }).join("");
  var daily=guestCountItems().map(function(it){var n=Number((r.missing||{})[it.id]||0);return "<div class=row><span>"+it.name+" · "+it.cat+"</span>"+(can?"<input class=q type=number min=0 data-item='"+it.id+"' value='"+(n||"")+"'>":"<span class=qty>"+n+"</span>")+"</div>";}).join("");
  return "<div class=card><h3>Fixtures · "+(r.type||"set a room type")+"</h3><p>Expected follows this room's type. Enter actual count in the room.</p>"+fx+"</div><div class=card><h3>Toiletries, towels and linen</h3>"+daily+(can?"<button class=btn id=lrep>Save counts</button>":"")+"</div>"+(fixtureMiss(r)?"<div class=warn>"+fixtureMiss(r)+" fixture piece(s) short.</div>":"");
};
var _vsF=viewStaff;
viewStaff=function(){
  if(isSuper())return viewFixtures()+_vsF();
  return _vsF();
};
var _b2=bind;
bind=function(){
  _b2();
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
      fixtureItems().forEach(function(it){var sh=fxShort(r,it.id);if(sh>0)miss[it.id]=sh;});
      r.fixtureMiss=miss;
      if(prevL)prevL();else{save();draw();}
    };
  }
  document.querySelectorAll(".saveFxPar").forEach(function(b){
    b.onclick=function(){
      if(!isSuper())return;
      var id=b.getAttribute("data-id");
      if(!db.fxPar)db.fxPar={};
      document.querySelectorAll(".fxpt[data-item='"+id+"']").forEach(function(inp){
        var t=inp.getAttribute("data-type");
        if(!db.fxPar[t])db.fxPar[t]={};
        var n=parseInt(inp.value,10);
        db.fxPar[t][id]=n>=0?n:0;
      });
      save();alert("Saved expected quantities by room type.");draw();
    };
  });
};
draw();
})();
