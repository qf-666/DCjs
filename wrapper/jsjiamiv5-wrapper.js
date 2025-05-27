/*  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃   Decode‑JS 插件：jsjiamiv5   ┃
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ */
if (!window.DecodePlugins) window.DecodePlugins = {};

window.DecodePlugins.jsjiamiv5 = {
  name : "jsjiami v5 one‑shot",
  /* ── 1. 检测 ─────────────────── */
  detect(code){
    return typeof code==="string" &&
           code.includes("jsjiami.com.v5") &&
           /__0x[a-f\d]{4,}\s*=\s*\[/.test(code);
  },

  /* ── 2. 主解密 ───────────────── */
  plugin(code){
    /* ❶ 把 ", __0x123= [...]" 或 "var __0x123=[...]" 都抓出来 */
    const arrRE = /(?:^|[;,])\s*(?<name>__?0x[a-f\d]+)\s*=\s*(?<arr>\[[\s\S]*?\])/i;
    const m = code.match(arrRE);
    if(!m || !m.groups) return "/* ❌ jsjiami v5：混淆数组没找到 */\n"+code;

    const arrName = m.groups.name;
    const arrLiteral = m.groups.arr;

    /* ❷ 安全 eval（不污染全局）并把  \xNN  转成正常字符 */
    let arr;
    try{
      arr = (new Function("return "+arrLiteral))()
              .map(s=>s.replace(/\\x([0-9a-fA-F]{2})/g,
                   (_,h)=>String.fromCharCode(parseInt(h,16))));
    }catch(e){
      return `/* ❌ jsjiami v5：数组解析失败 → ${e.message} */\n`+code;
    }

    /* ❸ 替换所有  arrName[0x??]  调用 */
    let out = code.replace(
      new RegExp(`${arrName}\$begin:math:display$(0x[\\\\da-f]+)\\$end:math:display$`,"gi"),
      (_,hex)=> JSON.stringify(arr[parseInt(hex,16)] ?? "")
    );

    /* ❹ 移除原数组（首个声明即可） */
    out = out.replace(m[0], `/* ✅ ${arrName} 已解码并移除 */`);

    return `/* ✅ jsjiami v5 解密完成 (${new Date().toLocaleString()}) */\n\n`+out;
  }
};