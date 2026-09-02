(function(){
function boot(){
  if(!document.body){setTimeout(boot,40);return;}
  if(window.__tapFix2)return;window.__tapFix2=true;
  var old=document.getElementById("safePad");if(old)old.parentNode.removeChild(old);
  var s=document.createElement("style");
  s.id="safePad";
  s.textContent=".wrap{padding-bottom:88px!important}.dock{position:fixed!important;left:0!important;right:0!important;bottom:0!important;transform:none!important;width:100%!important;max-width:480px!important;z-index:80!important;pointer-events:auto!important;padding:10px 8px 28px!important;background:#fff!important}.dock button{min-height:44px;min-width:56px;pointer-events:auto!important;touch-action:manipulation}";
  document.head.appendChild(s);
}
boot();
})();
