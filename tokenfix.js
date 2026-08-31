(function(){
function boot(){
if(typeof viewStaff!=="function"){setTimeout(boot,80);return;}
if(window.__tokenFix)return;window.__tokenFix=true;
function box(){
  if(typeof cloudBox==="function")return cloudBox();
  var on=!!localStorage.getItem("posh-gh-token");
  return "<div class=card><h3>Shared hotel</h3><p>"+(on?"Token is saved on this phone.":"Paste the GitHub token so this phone can publish and refresh.")+"</p><input id=ghTok type=password placeholder='GitHub token'><p><button type=button class=btn id=saveTok>Save token</button> <button type=button class=btn id=pullCloud>Refresh from shared list</button> <button type=button class=btn id=pushCloud>Publish this device now</button></p></div>";
}
var prev=viewStaff;
viewStaff=function(){return box()+prev.apply(this,arguments);};
try{draw();}catch(e){}
}
boot();
})();
