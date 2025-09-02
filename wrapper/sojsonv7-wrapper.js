// SOJSON v7 / jsjiami.com.v7 解密插件 - 进阶全功能版（可替换原插件）
console.log("SOJSON v7 解密插件(进阶)加载中...");

(function () {
  if (!window.DecodePlugins) window.DecodePlugins = {};

  // ---- 小工具：安全 Base64 与 RC4 多变体支持 ----
  const b64 = (()=>{
    // 某些壳用自定义字符表，这里优先用原生 atob，降级到纯JS
    const map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    function atobPoly(s) {
      s = String(s).replace(/=+$/, "");
      let bc = 0, bs, buffer, idx = 0, output = "";
      for (; (buffer = s.charAt(idx++)); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = map.indexOf(buffer);
      }
      return output;
    }
    const _atob = (typeof atob === "function") ? atob : atobPoly;
    return { atob: _atob };
  })();

  function rc4(data, key) {
    // 经典 RC4，兼容 v7 变体（key 可能是字符串或数值）
    key = String(key);
    const s = new Array(256);
    for (let i = 0; i < 256; i++) s[i] = i;
    let j = 0, x, res = "";
    for (let i = 0; i < 256; i++) {
      j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
      x = s[i]; s[i] = s[j]; s[j] = x;
    }
    let i = 0; j = 0;
    for (let y = 0; y < data.length; y++) {
      i = (i + 1) % 256;
      j = (j + s[i]) % 256;
      x = s[i]; s[i] = s[j]; s[j] = x;
      res += String.fromCharCode(data.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
    }
    return res;
  }

  // ---- 统一的 decode 调度：Base64 → UTF8，必要时 RC4 ----
  function decodeB64Utf8(str) {
    // v7 常见：先 atob，再 UTF-8 解码
    const bin = b64.atob(str);
    try {
      // TextDecoder 更稳；不支持时退化
      if (typeof TextDecoder !== "undefined") {
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
      }
    } catch (_) {}
    // 退化：粗略 UTF-8
    return decodeURIComponent(escape(bin));
  }

  // ---- 正则集合（尽量保守，避免误杀） ----
  const re = {
    // 1) 纯数组：var _0xabc=[ 'a','b',... ];
    arr_var: /(?:var|let|const)\s+(_0x[a-f0-9]{3,})\s*=\s*\[\s*([\s\S]*?)\s*]\s*;/i,

    // 2) 数组工厂函数：function _0xabc(){var _0xdef=[...]; return _0xdef;}
    arr_factory: /function\s+(_0x[a-f0-9]{3,})\s*\(\s*\)\s*\{\s*var\s+(_0x[a-f0-9]{3,})\s*=\s*\[\s*([\s\S]*?)\s*]\s*;[\s\S]*?return\s+\2\s*;?\s*\}/i,

    // 3) 旋转 IIFE： (function(a,b){ while(--b){ a.push(a.shift()); } })(_0xabc, 0x1a3)
    rotate_iife: /\(\s*function\s*\(\s*([a-zA-Z_$][\w$]*)\s*,\s*([a-zA-Z_$][\w$]*|\d+|0x[0-9a-f]+)\s*\)\s*\{\s*[\s\S]{0,150}?\}\s*\)\s*\(\s*(_0x[a-f0-9]{3,})\s*,\s*(\d+|0x[0-9a-f]+)\s*\)/i,

    // 4) 主解码函数（常见两参）：function _0x1fca(i, key){... return ...}
    main_decoder: /function\s+(_0x[a-f0-9]{3,})\s*\(\s*([a-zA-Z_$][\w$]*)\s*,\s*([a-zA-Z_$][\w$]*)\s*\)\s*\{[\s\S]*?return\s+([a-zA-Z_$][\w$]*)\s*;?\s*\}/i,

    // 5) 偏移写法：i = i - 0x18f 或 (i -= 0x18f)
    offset: /([a-zA-Z_$][\w$]*)\s*=\s*\1\s*-\s*(0x[0-9a-f]+|\d+)|([a-zA-Z_$][\w$]*)\s*-\=\s*(0x[0-9a-f]+|\d+)/i,

    // 6) 解码调用：_0x1fca(0x1a0, 'key') / _0x1fca(420, 'k')
    call2: /(_0x[a-f0-9]{3,})\s*\(\s*(0x[0-9a-f]+|\d+)\s*,\s*(['"])([\s\S]*?)\3\s*\)/ig,

    // 7) 仅索引到数组（少见，但保留）：_0xabc[123]
    arr_index: /(_0x[a-f0-9]{3,})\s*\[\s*(\d+)\s*\]/ig,

    // 8) 标记保留： encode_version
    enc_ver: /;\s*var\s+encode_version\s*=\s*['"]jsjiami\.com\.v7['"]\s*;?/i
  };

  // ---- 解析数组文字 → 真实数组（兼容多引号与空项） ----
  function parseArrayLiteral(listText) {
    // 安全解析：构造一个 Function 返回数组
    // 允许单/双/反引号，允许空位（, ,）
    // 同时去掉尾部注释与换行干扰
    const cleaned = "[" + listText.replace(/\/\*[\s\S]*?\*\//g, "")
                                  .replace(/\/\/[^\n\r]*/g, "") + "]";
    try {
      // eslint-disable-next-line no-new-func
      const arr = (new Function("return " + cleaned))();
      return Array.isArray(arr) ? arr.slice() : null;
    } catch (e) {
      return null;
    }
  }

  // ---- 应用旋转（与 IIFE 的 push/shift 等价） ----
  function rotateArray(arr, steps) {
    if (!Array.isArray(arr)) return arr;
    const n = arr.length;
    if (!n) return arr;
    // 常见是 (while (--b) { a.push(a.shift()); })
    const k = (Number(steps) >>> 0) % n;
    if (k === 0) return arr;
    // 左旋 k 次 == 等价于 arr = arr.slice(k).concat(arr.slice(0,k))
    return arr.slice(k).concat(arr.slice(0, k));
  }

  // ---- 统一替换：把字符串里的特殊字符做正则转义 ----
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  // ---- 主插件对象 ----
  window.DecodePlugins.sojsonv7 = {
    detect(code) {
      if (!code || typeof code !== "string") return false;
      // 1) 标志位（最稳）
      if (code.includes("jsjiami.com.v7")) return true;
      // 2) 常见模式：_0x.. 字符串数组 + 主解码函数
      if (/_0x[a-f0-9]{3,}\s*=\s*\[/.test(code) && re.main_decoder.test(code)) return true;
      // 3) 保险
      if (code.includes("function _0x") && code.includes("encode_version")) return true;
      return false;
    },

    plugin(code) {
      try {
        if (!this.detect(code)) return code;

        const original = code;
        console.log("开始处理 SOJSON v7");

        // ---- 1) 保护 encode_version（保持存在，不剪掉） ----
        let hasEncVer = re.enc_ver.test(code);
        if (!hasEncVer) {
          // 有些脚本用单行无分号，这里不强加，仅记录
          hasEncVer = false;
        }

        // ---- 2) 提取字符串数组（三种形态择优） ----
        let arrName = null, arrValues = null;

        // 2.a: 纯数组
        let m = code.match(re.arr_var);
        if (m) {
          arrName = m[1];
          arrValues = parseArrayLiteral(m[2]);
        }

        // 2.b: 工厂函数
        if (!arrValues) {
          const f = code.match(re.arr_factory);
          if (f) {
            arrName = f[2]; // 真正数组名是第二个捕获
            arrValues = parseArrayLiteral(f[3]);
          }
        }

        // 没拿到数组就先走后面流程（有的壳把数组延迟生成）
        if (!arrValues) arrValues = [];

        // ---- 3) 检测并应用数组旋转（若存在） ----
        const rot = code.match(re.rotate_iife);
        if (rot && arrName && rot[3] === arrName) {
          const steps = parseInt(rot[4], 16) || parseInt(rot[4], 10) || 0;
          if (Number.isFinite(steps) && arrValues.length) {
            arrValues = rotateArray(arrValues, steps);
          }
        }

        // ---- 4) 主解码函数 + 偏移 ----
        let decName = null, idxVar = null, keyVar = null, retVar = null, baseOffset = 0;
        const dm = code.match(re.main_decoder);
        if (dm) {
          decName = dm[1];   // _0x1f..
          idxVar = dm[2];    // 索引变量
          keyVar = dm[3];    // 密钥变量
          retVar = dm[4];    // return 的变量（有时用于缓存）
          // 尝试找偏移，以 decoder 定义块为范围更稳
          const defStart = dm.index;
          const defEnd = defStart + dm[0].length;
          const localDef = code.slice(defStart, defEnd);
          const om = localDef.match(re.offset);
          if (om) {
            const offHex = om[2] || om[4];
            baseOffset = offHex ? (offHex.startsWith("0x") ? parseInt(offHex, 16) : parseInt(offHex, 10)) : 0;
          }
        }

        // ---- 5) 解码调用替换（Base64+RC4 变体） ----
        // 准备一个安全 getter：根据"真实索引"拿字符串，必要时做 atob/rc4
        const cache = Object.create(null);

        function getRawByIndex(logicalIndex) {
          if (!arrValues || !arrValues.length) return null;
          if (logicalIndex < 0 || logicalIndex >= arrValues.length) return null;
          return arrValues[logicalIndex];
        }

        function decodeCall(indexLiteral, key) {
          // 计算真实数组索引：logical = literalIndex - baseOffset
          const idxNum = indexLiteral.startsWith("0x") ? parseInt(indexLiteral, 16) : parseInt(indexLiteral, 10);
          const logical = idxNum - (baseOffset || 0);
          const cacheKey = idxNum + "|" + String(key);
          if (cache[cacheKey] != null) return cache[cacheKey];

          const slot = getRawByIndex(logical);
          if (slot == null) return null;

          let out = slot;
          // 常见壳：数组里是 Base64 文本，解码后再 RC4(key)
          try {
            // 判断是否像 Base64：含 A-Za-z0-9+/=，且长度合规
            const looksB64 = /^[A-Za-z0-9+/=]+$/.test(out) && (out.length % 4 === 0);
            if (looksB64) {
              const bin = b64.atob(out);
              // 某些变体：直接可见字符串
              // 另一些变体：再 RC4(key) 得到明文
              // 先试 RC4(key) → UTF8；失败再直译 UTF8
              try {
                const rc = rc4(bin, key);
                out = (typeof TextDecoder !== "undefined")
                  ? new TextDecoder().decode(Uint8Array.from(rc, c => c.charCodeAt(0)))
                  : decodeURIComponent(escape(rc));
              } catch {
                out = decodeB64Utf8(out);
              }
            }
          } catch (_) {
            // 如果不是规范 Base64，保留原值
          }

          cache[cacheKey] = out;
          return out;
        }

        // 替换所有形式的 _0xDEC( idx, 'key' )
        if (decName) {
          code = code.replace(re.call2, (full, fn, idxLit, q, key) => {
            if (fn !== decName) return full;
            const str = decodeCall(idxLit, key);
            if (str == null) return full; // 解不出就保留
            // 安全包裹单引号
            return "'" + String(str).replace(/'/g, "\\'") + "'";
          });
        }

        // ---- 6) 兜底：直接数组下标替换（若还残留 _0xARR[123]） ----
        if (arrName && arrValues.length) {
          code = code.replace(re.arr_index, (full, aName, idxDec) => {
            if (aName !== arrName) return full;
            const i = parseInt(idxDec, 10);
            if (!Number.isFinite(i) || i < 0 || i >= arrValues.length) return full;
            const v = arrValues[i];
            if (typeof v !== "string") return full;
            return "'" + v.replace(/'/g, "\\'") + "'";
          });
        }

        // ---- 7) 解十六进制字符串（原版就有，保留+增强 robuste） ----
        code = code.replace(/(['"])\\x([0-9a-fA-F]{2})((?:\\x[0-9a-fA-F]{2})+?)\1/g, (m0, q, h1, rest) => {
          try {
            let out = String.fromCharCode(parseInt(h1, 16));
            for (const part of rest.split("\\x")) {
              if (!part) continue;
              out += String.fromCharCode(parseInt(part.slice(0, 2), 16));
            }
            return q + out + q;
          } catch { return m0; }
        });

        // ---- 8) 轻度清理（不动业务逻辑） ----
        // 去空行堆积
        code = code.replace(/\n{3,}/g, "\n\n");

        // 追加解密头（并确保 encode_version 行仍存在）
        const ts = new Date().toISOString();
        const header =
`/*
 * SOJSON v7 / jsjiami.com.v7 解密结果
 * time: ${ts}
 * 注意：仅替换字符串与去壳胶水，未改变业务逻辑；encode_version 保留。
 */
`;
        if (!re.enc_ver.test(code)) {
          // 如果原本就没有，尽量不强塞，避免触发奇怪检查；仅在有就保留。
          // do nothing
        }

        const out = header + "\n" + code;

        if (out === original) {
          console.log("未产生有效替换，可能命中少见变体（例如：延迟生成数组或动态 key）。已保留原文。");
          return out;
        }
        console.log("SOJSON v7 解密完成");
        return out;
      } catch (e) {
        console.error("SOJSON v7 解密异常：", e);
        return "/* 解密失败: " + (e && e.message || e) + " */\n\n" + code;
      }
    }
  };

  console.log("SOJSON v7 解密插件(进阶)加载完成");
})();