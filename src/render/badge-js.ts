/**
 * Generate the self-executing JavaScript snippet that embeds and auto-refreshes
 * the /status.svg badge every 60 seconds.
 */
export function renderStatusJs(): string {
  return `(function(){
  var s = document.currentScript;
  if (!s) return;
  var base = s.src.replace(/\\/status\\.js(\\?.*)?$/, "");
  var qs = s.src.indexOf("?") >= 0 ? s.src.slice(s.src.indexOf("?")) : "";
  var img = document.createElement("img");
  img.alt = "STATION 电台状态";
  img.style.border = "0";
  img.style.verticalAlign = "middle";
  function refresh(){
    img.src = base + "/status.svg" + qs + (qs ? "&" : "?") + "t=" + Date.now();
  }
  refresh();
  s.parentNode.insertBefore(img, s);
  setInterval(refresh, 60000);
})();
`;
}
