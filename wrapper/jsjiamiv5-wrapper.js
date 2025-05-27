window.DecodePlugins ??= {};

window.DecodePlugins.jsjiamiv5 = {
  name: "jsjiami v5 解密插件（修复版）",

  detect(code) {
    return code.includes("jsjiami.com.v5") && /__0x[a-f\d]{4,}\s*=\s*\[/.test(code);
  },

  plugin(code) {
    const arrayReg = /var\s+(?:\w+,\s*)?(?<arrName>__0x[a-f\d]+)\s*=\s*(?<arrValue>\[[\s\S]*?\]);/;
    const match = code.match(arrayReg);
    if (!match || !match.groups) {
      return "/* ❌ jsjiami v5 解密失败：未找到混淆数组 */\n" + code;
    }

    const arrName = match.groups.arrName;
    const rawArr = match.groups.arrValue;

    let arr;
    try {
      arr = eval(rawArr).map(str => {
        try {
          // 解码 \x 格式为正常字符串
          return decodeURIComponent(escape(str));
        } catch {
          return str;
        }
      });
    } catch (e) {
      return `/* ❌ jsjiami v5 解密失败：数组无法 eval(${e.message}) */\n` + code;
    }

    // 替换所有 __0xNNNN[0x??] 调用
    let replaced = code.replace(
      new RegExp(`${arrName}\$begin:math:display$(0x[\\\\da-f]+)\\$end:math:display$`, "gi"),
      (_, hex) => {
        const idx = parseInt(hex, 16);
        return JSON.stringify(arr[idx] ?? "");
      }
    );

    // 移除数组定义
    replaced = replaced.replace(arrayReg, `/* ✅ jsjiami v5 混淆数组 ${arrName} 已解密移除 */`);

    // 标记版本解密成功
    replaced = `/* ✅ 解密成功，使用 jsjiami v5 插件 */\n\n` + replaced;

    return replaced;
  }
};