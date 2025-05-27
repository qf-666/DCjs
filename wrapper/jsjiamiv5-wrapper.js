console.log("🟢 SOJSON v5 网页插件加载中");

if (!window.DecodePlugins) window.DecodePlugins = {};

window.DecodePlugins.jsjiamiv5 = {
  detect(code) {
    return typeof code === "string" && (
      code.includes("jsjiami.com.v5") ||
      /var\s+(__?0x[a-f\d]+)\s*=\s*\[\s*(?:'\\x[a-fA-F0-9]{2}'\s*,?\s*)+\]/.test(code)
    );
  },

  plugin(code) {
    try {
      const arrMatch = code.match(/var\s+(__?0x[a-f\d]+)\s*=\s*(\[[^\]]+\])/);
      if (!arrMatch) return `/* ❌ 未匹配到混淆数组 */\n` + code;

      const [rawDef, varName, arrRaw] = arrMatch;

      // 提取字符串数组并解析 \xNN
      const matches = arrRaw.match(/'(\\x[a-fA-F0-9]{2})+'/g);
      if (!matches) return `/* ❌ 无法解析数组内容 */\n` + code;

      const arr = matches.map(str => 
        str
          .replace(/^'/, '').replace(/'$/, '')
          .replace(/\\x([a-fA-F0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      );

      // 替换数组调用
      let newCode = code.replace(
        new RegExp(`${varName}\$begin:math:display$(0x[\\\\da-f]+)\\$end:math:display$`, "gi"),
        (_, hex) => {
          const idx = parseInt(hex, 16);
          return arr[idx] ? JSON.stringify(arr[idx]) : '""';
        }
      );

      // 移除数组定义
      newCode = newCode.replace(rawDef, "/* 混淆数组已解码并移除 */");

      return `/* ✅ 解密成功：jsjiami v5 (${new Date().toLocaleString()}) */\n\n` + newCode;
    } catch (e) {
      return `/* ❌ 解密失败: ${e.message} */\n` + code;
    }
  }
};