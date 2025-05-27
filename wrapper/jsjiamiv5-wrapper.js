console.log("🔧 jsjiamiv5 插件启动...");

if (!window.DecodePlugins) window.DecodePlugins = {};

window.DecodePlugins.jsjiamiv5 = {
  detect(code) {
    return typeof code === "string" && (
      code.includes("jsjiami.com.v5") ||
      /var\s+__?0x[a-f\d]{4,}\s*=\s*\[/.test(code)
    );
  },

  plugin(code) {
    try {
      const arrMatch = code.match(/var\s+(__?0x[a-f\d]+)\s*=\s*(\[[\s\S]+?\]);/i);
      if (!arrMatch) return `/* ❌ 未匹配到混淆数组 */\n` + code;

      const varName = arrMatch[1];
      const arrayCode = arrMatch[2];

      let arr;
      try {
        arr = eval(arrayCode);
        if (!Array.isArray(arr)) throw new Error("混淆数组不是有效数组");
      } catch (e) {
        return `/* ❌ 混淆数组 eval 出错：${e.message} */\n` + code;
      }

      // 替换 varName[0x??] 为数组内容
      let replaced = code.replace(
        new RegExp(`${varName}\$begin:math:display$(0x[\\\\da-f]+)\\$end:math:display$`, "gi"),
        (_, hex) => {
          const index = parseInt(hex, 16);
          const val = arr[index];
          return val ? JSON.stringify(val) : '""';
        }
      );

      // 移除原始混淆数组定义
      replaced = replaced.replace(arrMatch[0], `/* ✅ 已移除混淆数组 ${varName} */`);

      return `/* ✅ 解密成功 jsjiami v5 (${new Date().toLocaleString()}) */\n\n` + replaced;

    } catch (err) {
      return `/* ❌ 解密插件错误: ${err.message} */\n` + code;
    }
  }
};