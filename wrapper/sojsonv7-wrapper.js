console.log("🟢 SOJSON v5（数组还原）插件已挂载");

window.DecodePlugins ||= {};

window.DecodePlugins.sojsonv5_array = {
  // 判断是否是 sojsonv5 样式
  detect(code) {
    return typeof code === "string" &&
      code.includes("jsjiami.com.v5") &&
      /var\s+[_$a-zA-Z][_$a-zA-Z0-9]*\s*=\s*\[\s*(?:'\\x[a-fA-F0-9]{2})/.test(code);
  },

  // 插件主处理函数
  plugin(code) {
    try {
      // 获取混淆数组变量名及内容
      const match = code.match(/var\s+([_$a-zA-Z][_$a-zA-Z0-9]*)\s*=\s*(\[[^\]]+\])/);
      if (!match) return "/* ❌ 未识别混淆数组 */\n" + code;

      const [fullDef, varName, rawArr] = match;

      let arr;
      try {
        arr = eval(rawArr); // ⚠️仅限可信内容页面，否则需用 safer parse
      } catch (e) {
        return `/* ❌ 混淆数组解析失败：${e.message} */\n` + code;
      }

      // 替换变量调用：_0x1234[0x1a]
      let replacedCode = code.replace(
        new RegExp(`${varName}\$begin:math:display$(0x[\\\\da-fA-F]+)\\$end:math:display$`, "g"),
        (_, hex) => {
          const index = parseInt(hex, 16);
          const val = arr[index];
          return typeof val === "string" ? JSON.stringify(val) : '""';
        }
      );

      // 删除原始数组定义
      replacedCode = replacedCode.replace(fullDef, "/* ✅ 混淆数组已删除 */");

      return `/* ✅ 解密完成：sojsonv5_array @${new Date().toLocaleString()} */\n\n` + replacedCode;

    } catch (err) {
      return `/* ❌ 解密异常：${err.message} */\n` + code;
    }
  }
};