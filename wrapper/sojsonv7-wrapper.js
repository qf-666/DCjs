console.log("🟢 SOJSON v5 数组插件加载中");

if (!window.DecodePlugins) window.DecodePlugins = {};

window.DecodePlugins.sojsonv5_array = {
  detect(code) {
    return typeof code === "string" && /var\s+[_$a-zA-Z][_$a-zA-Z0-9]*\s*=\s*\[\s*(?:'\\x[a-fA-F0-9]{2})/.test(code);
  },

  plugin(code) {
    try {
      const arrMatch = code.match(/var\s+([_$a-zA-Z][_$a-zA-Z0-9]*)\s*=\s*(\[[^\]]+\])/);
      if (!arrMatch) return `/* ❌ 未匹配到数组定义 */\n` + code;

      const [rawDef, varName, arrayRaw] = arrMatch;

      // 尝试还原数组（注意：不要执行不可信内容）
      let decodedArray;
      try {
        decodedArray = eval(arrayRaw); // 仅限可信内容
      } catch (e) {
        return `/* ❌ 数组 eval 失败：${e.message} */\n` + code;
      }

      // 解码函数（自动 utf-8、base64）
      function smartDecode(str) {
        try {
          const b64 = atob(str);
          return decodeURIComponent(escape(b64));
        } catch {
          return str;
        }
      }

      // 解码所有数组元素
      const decodedMap = decodedArray.map(s => smartDecode(s));

      // 替换类似 _0x1234[0x1a] 的调用
      const newCode = code.replace(
        new RegExp(`${varName}\$begin:math:display$(0x[\\\\da-fA-F]+)\\$end:math:display$`, "g"),
        (_, hex) => {
          const index = parseInt(hex, 16);
          const val = decodedMap[index];
          return val ? JSON.stringify(val) : '""';
        }
      ).replace(rawDef, `/* ✅ 数组 [${varName}] 已解码并移除 */`);

      return `/* ✅ 解密成功：sojsonv5_array 插件 (${new Date().toLocaleString()}) */\n\n` + newCode;

    } catch (err) {
      return `/* ❌ 解密失败：${err.message} */\n` + code;
    }
  }
};