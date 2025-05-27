console.log("🟢 SOJSON v5 Plugin 正在挂载...");

if (!window.DecodePlugins) {
  window.DecodePlugins = {};
}

window.DecodePlugins.sojsonv5_array = {
  detect: function(code) {
    return typeof code === "string"
      && code.indexOf("jsjiami.com.v5") !== -1
      && /var\s+[_$a-zA-Z][_$a-zA-Z0-9]*\s*=\s*\[\s*(?:'\\x[a-fA-F0-9]{2}'\s*,?)+\]/.test(code);
  },

  plugin: function(code) {
    try {
      var match = code.match(/var\s+([_$a-zA-Z][_$a-zA-Z0-9]*)\s*=\s*(\[[^\]]+\])/);
      if (!match) return "/* ❌ 未匹配到混淆数组 */\n" + code;

      var fullDef = match[0];
      var varName = match[1];
      var rawArr = match[2];

      var arr;
      try {
        arr = eval(rawArr); // ⚠️默认你只在可信网站执行
      } catch (e) {
        return "/* ❌ 数组解析失败: " + e.message + " */\n" + code;
      }

      var replacedCode = code.replace(
        new RegExp(varName + "\\[(0x[\\da-fA-F]+)\\]", "g"),
        function(_, hex) {
          var idx = parseInt(hex, 16);
          var val = arr[idx];
          return typeof val === "string" ? JSON.stringify(val) : '""';
        }
      );

      replacedCode = replacedCode.replace(fullDef, "/* ✅ 已解码并删除混淆数组 */");

      return "/* ✅ 解密成功：sojson v5 @ " + new Date().toLocaleString() + " */\n\n" + replacedCode;

    } catch (err) {
      return "/* ❌ 解密失败: " + err.message + " */\n" + code;
    }
  }
};