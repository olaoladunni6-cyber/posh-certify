(function(){
function boot(){
if(typeof draw!=="function"){setTimeout(boot,80);return;}
if(window.__flickerFix)return;window.__flickerFix=true;
var last="";
function key(){return String((user&&user.id)||"out")+"|"+String((user&&user.role)||"")+"|"+String(roomId||"")+"|"+String(tab||"");}
function freezeBar(){
  var bars=document.querySelectorAll("#opsBar");
  for(var i=1;i<bars.length;i++){try{bars[i].parentNode.removeChild(bars[i]);}catch(e){}}
  var el=document.getElementById("opsBar");
  if(!el)return;
  el.style.background="#101512";
  el.style.color="#f3e6c5";
  var k=key();
  if(k===last)return;
  last=k;
}
var _d=draw;
draw=function(){
  var k=key();
  var skipBar=k===last;
  var out=_d.apply(this,arguments);
  try{freezeBar();}catch(e){}
  return out;
};
setInterval(function(){
  var bars=document.querySelectorAll("#opsBar");
  for(var i=1;i<bars.length;i++){try{bars[i].parentNode.removeChild(bars[i]);}catch(e){}}
},2000);
}
boot();
})();
