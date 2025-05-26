// JSJiami v5 定制解密插件 - 针对特定样本
console.log("JSJiami v5 定制解密插件加载中...");

if (!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.jsjiami_v5 = {
    detect: function(code) {
        if (!code || typeof code !== 'string') return false;
        
        // 检测JSJiami v5特征
        return code.indexOf('jsjiami.com.v5') !== -1 || 
               (code.indexOf('__0x') !== -1 && code.indexOf('encode_version') !== -1);
    },
    
    plugin: function(code) {
        try {
            if (!this.detect(code)) {
                return code;
            }
            
            console.log("开始处理JSJiami v5混淆代码");
            
            // 保存原始代码备份
            var originalCode = code;
            
            // 1. 提取加密数组
            var arrayMatch = code.match(/var\s+(__0x[a-zA-Z0-9]+)\s*=\s*(\[(?:'[^']*'|"[^"]*"|\s*,\s*)*\])/);
            if (!arrayMatch) {
                console.log("未找到主加密数组，尝试其他模式");
                return originalCode;
            }
            
            var arrayName = arrayMatch[1];
            var arrayCode = arrayMatch[2];
            
            // 2. 提取并分析解密函数
            var decryptFuncMatch = code.match(/var\s+(_0x[a-zA-Z0-9]+)\s*=\s*function\s*\(_0x[a-zA-Z0-9]+,\s*_0x[a-zA-Z0-9]+\)\s*\{[\s\S]*?return\s+_0x[a-zA-Z0-9]+;?\s*\}/);
            if (!decryptFuncMatch) {
                console.log("未找到解密函数");
                return originalCode;
            }
            
            var decryptFuncName = decryptFuncMatch[1];
            
            // 3. 提取rc4函数
            var rc4FuncMatch = code.match(/_0x[a-zA-Z0-9]+\['rc4'\]\s*=\s*function\s*\(_0x[a-zA-Z0-9]+,\s*_0x[a-zA-Z0-9]+\)\s*\{[\s\S]*?return\s+_0x[a-zA-Z0-9]+;?\s*\}/);
            
            // 4. 创建一个可执行的环境来模拟解密
            var deobfuscationEnv = `
                // 定义加密数组
                var ${arrayName} = ${arrayCode};
                
                // 模拟解密函数
                ${decryptFuncMatch[0]}
                
                // 添加rc4函数如果存在
                ${rc4FuncMatch ? rc4FuncMatch[0] : ''}
                
                // 导出解密函数
                window.jsjiamiDecrypt = ${decryptFuncName};
            `;
            
            // 5. 在沙盒中执行解密环境
            // 注意：在实际环境中，这可能需要更安全的方式执行
            try {
                // 这里简化处理，实际中可能需要更复杂的沙盒
                eval(deobfuscationEnv);
            } catch (e) {
                console.error("执行解密环境时出错:", e);
                return originalCode;
            }
            
            // 6. 提取并替换加密字符串引用
            var decryptedCode = code;
            
            // 正则表达式匹配加密字符串引用
            var stringRefPattern = new RegExp(decryptFuncName + '\\(\\s*([\'"])([0-9a-fA-F]+)\\1\\s*,\\s*([\'"])([^\'"]*)\\3\\s*\\)', 'g');
            
            // 收集所有匹配项，以避免多次替换可能导致的问题
            var matches = [];
            var match;
            
            while ((match = stringRefPattern.exec(code)) !== null) {
                matches.push({
                    fullMatch: match[0],
                    index: match[2],
                    key: match[4]
                });
            }
            
            // 从后向前替换，以避免位置偏移问题
            matches.sort(function(a, b) {
                return code.indexOf(b.fullMatch) - code.indexOf(a.fullMatch);
            });
            
            for (var i = 0; i < matches.length; i++) {
                var m = matches[i];
                try {
                    // 调用解密函数获取实际字符串
                    var decrypted = window.jsjiamiDecrypt(m.index, m.key);
                    decryptedCode = decryptedCode.replace(m.fullMatch, JSON.stringify(decrypted));
                } catch (e) {
                    console.error("解密字符串时出错:", e);
                }
            }
            
            // 7. 处理rc4加密部分
            if (rc4FuncMatch) {
                var rc4Pattern = /_0x[a-zA-Z0-9]+\['rc4'\]\(_0x[a-zA-Z0-9]+,\s*(['"])([^'"]+)\1\)/g;
                decryptedCode = decryptedCode.replace(rc4Pattern, function(match, quote, key) {
                    return match + " /* RC4加密，密钥:" + key + " */";
                });
            }
            
            // 8. 清理自执行函数和编码标记
            decryptedCode = decryptedCode.replace(/;\(function\(_0x[a-zA-Z0-9]+,\s*_0x[a-zA-Z0-9]+,\s*_0x[a-zA-Z0-9]+\)\{[\s\S]*?encode_version\s*=\s*['"]jsjiami\.com\.v5['"];\s*\}\)\(window\);/g, "// JSJiami自执行函数已移除");
            
            // 9. 格式化代码（可选）
            // 这里可以添加代码格式化逻辑
            
            console.log("JSJiami v5代码处理完成");
            return decryptedCode;
        } catch (e) {
            console.error("JSJiami v5解密错误:", e);
            return code; // 出错时返回原始代码
        }
    }
};

// 添加一个完整的RC4实现，以备需要
window.DecodePlugins.jsjiami_v5.rc4 = function(data, key) {
    var s = [];
    var j = 0;
    var x;
    var res = '';
    
    for (var i = 0; i < 256; i++) {
        s[i] = i;
    }
    
    for (i = 0; i < 256; i++) {
        j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
        x = s[i];
        s[i] = s[j];
        s[j] = x;
    }
    
    i = 0;
    j = 0;
    
    for (var y = 0; y < data.length; y++) {
        i = (i + 1) % 256;
        j = (j + s[i]) % 256;
        x = s[i];
        s[i] = s[j];
        s[j] = x;
        res += String.fromCharCode(data.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
    }
    
    return res;
};

console.log("JSJiami v5解密插件加载完成");