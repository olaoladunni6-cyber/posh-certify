(function(){
function boot(){
  if(!document.body){setTimeout(boot,40);return;}
  if(window.__tapFix)return;window.__tapFix=true;
  if(!document.getElementById("safePad")){
    var s=document.createElement("style");
    s.id="safePad";
    s.textContent="html,body,.wrap{padding-bottom:120px!important} nav,footer,.tabs,.tabbar,.dock{position:relative!important;bottom:auto!important;z-index:20} button,a{pointer-events:auto!important;touch-action:manipulation}";
    document.head.appendChild(s);
  }
}
boot();
})();
