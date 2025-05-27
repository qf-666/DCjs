console.log("🟢 SOJSON v5 网页插件加载中");

if (!window.DecodePlugins) window.DecodePlugins = {};

window.DecodePlugins.jsjiamiv5 = {
  detect(code) {
    return typeof code === "string" && (
      code.includes("jsjiami.com.v5") ||
      /var\s+(_0x\w+)\s*=\s*\[\s*(?:'\\x[a-fA-F0-9]{2}'\s*,?\s*)+\]/.test(code)
    );
  },

  plugin(code) {
    try {
      const arrMatch = code.match(/var\s+(_0x\w+)\s*=\s*(\[[^\]]+\])/);
      if (!arrMatch) return `/* ❌ 未匹配到混淆数组 */\n` + code;

      const [rawDef, varName, arrRaw] = arrMatch;
      const arr = eval(arrRaw); // ⚠️ 若存在安全顾虑，可使用 safer 替代方式

      // 替换形如 _0x1230b8[0x1a] 的调用
      let newCode = code.replace(
        new RegExp(`${varName}\$begin:math:display$(0x[\\\\da-f]+)\\$end:math:display$`, "gi"),
        (_, hex) => {
          const idx = parseInt(hex, 16);
          return arr[idx] ? JSON.stringify(arr[idx]) : '""';
        }
      );

      // 清除混淆数组声明
      newCode = newCode.replace(rawDef, "/* 混淆数组已解码并移除 */");

      return `/* ✅ 解密成功：SOJSON v5 (${new Date().toLocaleString()}) */\n\n` + newCode;
    } catch (err) {
      return `/* ❌ 解密失败: ${err.message} */\n` + code;
    }
  }
};