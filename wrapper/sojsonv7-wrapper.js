console.log("🟢 SOJSON v7 网页插件加载中");

if (!window.DecodePlugins) window.DecodePlugins = {};

window.DecodePlugins.sojsonv7 = {
  detect(code) {
    return typeof code === "string" && (
      code.includes("jsjiami.com.v7") || code.includes("jsjiami.com.v5") ||
      /var\s+(_0x\w+)\s*=\s*\[\s*(?:'\\x[a-fA-F0-9]{2}'\s*,?)+\]/.test(code)
    );
  },

  plugin(code) {
    try {
      const arrMatch = code.match(/var\s+(_0x\w+)\s*=\s*(\[[^\]]+\])/);
      if (!arrMatch) return `/* ❌ 未匹配到混淆数组 */\n` + code;

      const [rawDef, varName, arrRaw] = arrMatch;
      const arr = eval(arrRaw); // 安全性考虑你可以手动替换为 decodeURIComponent 替换

      // 替换 _0x1230b8[0x1a]
      let newCode = code.replace(
        new RegExp(`${varName}\$begin:math:display$(0x[\\\\da-f]+)\\$end:math:display$`, "gi"),
        (_, hex) => {
          const idx = parseInt(hex, 16);
          const val = arr[idx];
          return val ? JSON.stringify(val) : '""';
        }
      );

      // 清除原始数组定义
      newCode = newCode.replace(rawDef, "/* 混淆数组已解码并移除 */");

      return `/* ✅ 解密成功：SOJSON v7 (${new Date().toLocaleString()}) */\n\n` + newCode;
    } catch (err) {
      return `/* ❌ 解密失败: ${err.message} */\n` + code;
    }
  }
};