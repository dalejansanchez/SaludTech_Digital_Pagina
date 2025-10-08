// Script de diagnóstico que muestra errores JS en pantalla para facilitar debugging local
(function(){
  function ensureStyles(){
    if (document.getElementById('debug-style')) return;
    const s = document.createElement('style');
    s.id = 'debug-style';
    s.textContent = `
      #debug-overlay{position:fixed;left:10px;right:10px;bottom:10px;padding:12px;background:rgba(0,0,0,0.85);color:#fff;font-family:monospace;z-index:99999;border-radius:6px;max-height:40vh;overflow:auto}
      #debug-overlay h4{margin:0 0 6px 0;font-size:14px}
      #debug-overlay pre{white-space:pre-wrap;color:#ffd}
      #debug-overlay .close{position:absolute;right:8px;top:6px;cursor:pointer;color:#fff}
    `;
    document.head.appendChild(s);
  }

  function showError(msg){
    ensureStyles();
    let el = document.getElementById('debug-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'debug-overlay';
      el.innerHTML = '<span class="close">[cerrar]</span><h4>Error en la página (diagnóstico)</h4><pre id="debug-pre"></pre>';
      document.body.appendChild(el);
      el.querySelector('.close').addEventListener('click', ()=> el.remove());
    }
    const pre = document.getElementById('debug-pre');
    pre.textContent += '\n' + msg + '\n---------\n';
    // also log to console
    console.error('[debug-overlay]', msg);
  }

  window.addEventListener('error', function(e){
    try{ showError((e && e.message ? e.message : 'Error') + '\n' + (e.error && e.error.stack ? e.error.stack : (e.filename? e.filename+':'+e.lineno : '')) ); }catch(_){ }
  });
  window.addEventListener('unhandledrejection', function(ev){
    try{ showError('UnhandledRejection: ' + (ev.reason && ev.reason.stack ? ev.reason.stack : String(ev.reason)) ); }catch(_){ }
  });

  // expose helper
  window.debugShow = showError;
})();
