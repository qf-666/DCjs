// Common通用解密插件 - 作为最后的备选方案
console.log("jsjiamiv5解密插件加载中...");

if(!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.jsjiamiv5 = {
    detect: function(code) {
        // 直接在原obfuscator.js中添加以下代码，放在原插件的detect和plugin函数中

// 在detect函数中添加这个条件
if (code.indexOf("jsjiami.com.v5") !== -1 || 
    code.indexOf("encode_version") !== -1 ||
    (code.indexOf("_0x") !== -1 && code.indexOf("\\x") !== -1 && code.indexOf("var _0x") !== -1)) {
    console.log("检测到JSJiami.com.v5混淆代码");
    return true;
}

// 在plugin函数中添加以下代码块
if (code.indexOf("jsjiami.com.v5") !== -1 || code.indexOf("encode_version") !== -1) {
    console.log("正在解密JSJiami.com.v5混淆代码");
    
    // 1. 解码十六进制和Unicode编码的字符串
    code = code.replace(/\\x([0-9a-fA-F]{2})/g, function(match, p1) {
        try {
            return String.fromCharCode(parseInt(p1, 16));
        } catch (e) {
            return match;
        }
    });
    
    code = code.replace(/\\u([0-9a-fA-F]{4})/g, function(match, p1) {
        try {
            return String.fromCharCode(parseInt(p1, 16));
        } catch (e) {
            return match;
        }
    });
    
    // 2. 寻找并替换字符串数组
    const stringArrayRegex = /var\s+(_0x[a-f0-9]{4,6})\s*=\s*\[((?:'[^']*'|"[^"]*")(?:\s*,\s*(?:'[^']*'|"[^"]*"))*)\]/g;
    
    let match;
    while ((match = stringArrayRegex.exec(code)) !== null) {
        try {
            const arrayName = match[1];
            const arrayContent = match[2];
            
            // 解析数组内容
            const stringsWithQuotes = arrayContent.split(',');
            const strings = [];
            
            for (let i = 0; i < stringsWithQuotes.length; i++) {
                let str = stringsWithQuotes[i].trim();
                // 移除引号
                if ((str.startsWith("'") && str.endsWith("'")) ||
                    (str.startsWith('"') && str.endsWith('"'))) {
                    str = str.substring(1, str.length - 1);
                }
                strings.push(str);
            }
            
            if (strings.length === 0) continue;
            
            console.log(`找到字符串数组: ${arrayName} (${strings.length}项)`);
            
            // 创建替换正则表达式
            const arrayAccessRegex = new RegExp(arrayName + '\\[(\\d+)\\]', 'g');
            
            // 替换数组访问
            code = code.replace(arrayAccessRegex, function(match, index) {
                const idx = parseInt(index);
                if (idx >= 0 && idx < strings.length) {
                    return "'" + strings[idx] + "'";
                }
                return match;
            });
        } catch (e) {
            console.error("处理字符串数组时出错:", e);
        }
    }
    
    // 3. 移除调试保护
    code = code.replace(/function\s+(_0x[a-f0-9]{4,6})\s*\(\s*\)\s*\{\s*debugger\s*;\s*\1\(\)\s*;\s*\}/g, 
                       "function $1() { /* 已移除调试保护 */ }");
    
    // 移除单独的debugger语句
    code = code.replace(/debugger\s*;/g, "/* 已移除调试器 */;");
    
    // 4. 移除自解密回调
    code = code.replace(/;\(function\(_0x[a-f0-9]{4,6},_0x[a-f0-9]{4,6}\)\{[^}]+}\);/g, '');
    
    // 5. 移除JSJiami特有的版本标记
    code = code.replace(/;\s*encode_version\s*=\s*['"]jsjiami\.com\.v5['"];?/g, '');
    
    // 6. 移除空语句
    code = code.replace(/;;/g, ';');
    
    console.log("JSJiami.com.v5代码处理完成");
    return code;
}

console.log("jsjiamiv5解密插件加载完成");