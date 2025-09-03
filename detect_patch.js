
/*! detect_patch.js — drop-in detector & UI binder (no codebase changes needed)
 * How to use: place this file next to index.html and include at the very end:
 * <script src="./detect_patch.js"></script>
 */
(function(){
  // --- Light-weight detectors ---
  function detectType(code){
    const s = (code || '').slice(0, 60000);
    const hits = [];
    try{
      if (/^\x1f\x8b\x08/.test(s) || /\x78[\x01\x9C\xDA]/.test(s)) hits.push("zlib");
      if (/^\x42\x5a\x68/.test(s)) hits.push("bz2");
      if (/^\xfd7zXZ\x00/.test(s)) hits.push("lzma");
      if (/ﾟωﾟﾉ|（ﾟДﾟ）|｀； ﾟдﾟ/.test(s)) hits.push("aaencode");
      if (/[\[\]\(\)\!\+]{120,}/.test(s) || /^\s*(\(\!!\[]|\+!\[]|\[\]\+!\[])/.test(s)) hits.push("jsfuck");
      if (/JJEncode|ﾟΘ|_\$/.test(s)) hits.push("jjencode");
      if (/jsjiami\.com/.test(s)) hits.push(/v7|jsjiami\.v7/.test(s) ? "jsjiami_v7" : "jsjiami_v6");
      if (/sojson/.test(s)) hits.push(/v7/.test(s) ? "sojson_v7" : "sojson_v6");
      if (/\b_0x[0-9a-f]{3,}\b/.test(s)) hits.push("obfuscator");
      if (/aliyun|awsc|AntiDebug|hexcase/.test(s)) hits.push("awsc");
      if (/\b(document|window|navigator|location|Image|CanvasRenderingContext2D|requestAnimationFrame|performance\.now)\b/.test(s)) hits.push("browser_semantics");
    }catch(_){}
    const type = choosePrimary(hits) || "auto";
    let conf = hits.length ? 80 : 60;
    if (/v7/.test(type)) conf += 10;
    conf = Math.max(50, Math.min(95, conf));
    return { type, confidence: conf, features: hits, detail: hits.length?`命中: ${hits.join(', ')}`:'未明显命中特征' };
  }
  function choosePrimary(arr){
    if (!arr || !arr.length) return null;
    const order = ["jsjiami_v7","sojson_v7","jsjiami_v6","sojson_v6","obfuscator","jjencode","jsfuck","zlib","bz2","lzma","awsc","aaencode","browser_semantics"];
    for (const k of order) if (arr.includes(k)) return k;
    return arr[0];
  }
  function showDetectUI(r){
    const typeEl   = document.getElementById('det-type');
    const confEl   = document.getElementById('det-confidence');
    const matchEl  = document.getElementById('det-matches');
    const detailEl = document.getElementById('det-detail');
    if (typeEl)   typeEl.textContent   = r.type || 'auto';
    if (confEl)   confEl.textContent   = (typeof r.confidence==='number'? r.confidence + '%' : '-');
    if (matchEl)  matchEl.textContent  = (r.features && r.features.length) ? r.features.length : 0;
    if (detailEl) detailEl.textContent = r.detail || '-';
  }
  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(null,a), ms); }; }

  // --- Bind after DOM is ready ---
  function bind(){
    const input = document.getElementById('input-editor');
    const btn   = document.getElementById('decrypt-btn');
    const fin   = document.getElementById('file-input');
    const drop  = document.getElementById('file-drop-area');
    const urlBtn= document.getElementById('url-fetch-btn');
    const urlIn = document.getElementById('url-input');

    // 1) Input typing
    if (input){
      const refresh = debounce(()=>{
        const r = detectType(input.value || '');
        showDetectUI(r);
      }, 200);
      input.addEventListener('input', refresh);
      input.addEventListener('change', refresh);
    }

    // 2) Before decrypt click
    if (btn && input){
      btn.addEventListener('click', ()=>{
        const r = detectType(input.value || '');
        showDetectUI(r);
      }, { capture: true });
    }

    // 3) File input (read once and detect)
    function readFileAndDetect(file){
      const reader = new FileReader();
      reader.onload = (e)=>{
        const txt = String(e.target.result || '');
        const r = detectType(txt);
        showDetectUI(r);
      };
      reader.readAsText(file);
    }
    if (fin){
      fin.addEventListener('change', ()=>{
        if (fin.files && fin.files[0]) readFileAndDetect(fin.files[0]);
      });
    }
    if (drop){
      drop.addEventListener('drop', (e)=>{
        try{
          const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
          if (f) readFileAndDetect(f);
        }catch(_){}
      });
    }

    // 4) URL fetch (do a light parallel fetch to detect)
    if (urlBtn && urlIn){
      urlBtn.addEventListener('click', async ()=>{
        try{
          const u = (urlIn.value || '').trim();
          if (!u) return;
          const resp = await fetch(u, { method: 'GET' });
          if (!resp.ok) return;
          const txt = await resp.text();
          const r = detectType(txt);
          showDetectUI(r);
        }catch(_){}
      }, { capture: true });
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(bind, 0);
  }else{
    document.addEventListener('DOMContentLoaded', bind);
  }
})();
