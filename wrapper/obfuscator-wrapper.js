// JavaScript-Obfuscator 混淆代码解密插件
console.log("JavaScript-Obfuscator解密插件加载中...");

if(!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.obfuscator = {
    detect: function(code) {
        if (!code || typeof code !== 'string') return false;
        
        // 检查特征字符串和模式
        const patterns = [
            // 全局包装器特征
            /\(function\s*\(\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*,\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*\)\s*\{\s*return\s*function\s*\(\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*,\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*\)/,
            // 自调用函数特征
            /\(function\s*\([a-zA-Z$_][a-zA-Z0-9$_]*(?:\s*,\s*[a-zA-Z$_][a-zA-Z0-9$_]*)*\)\s*\{.*\}\((?:[a-zA-Z$_][a-zA-Z0-9$_]*|\d+|!!\[\]|![01]|true|false)(?:\s*,\s*(?:[a-zA-Z$_][a-zA-Z0-9$_]*|\d+|!!\[\]|![01]|true|false))*\)\)/,
            // 十六进制编码字符串
            /'\\x[0-9a-f]{2}'/i,
            // ASCII编码特征
            /String\.fromCharCode\(\d+(?:\s*,\s*\d+)*\)/,
            // 字符串数组特征
            /var\s+[a-zA-Z$_][a-zA-Z0-9$_]*\s*=\s*\[\s*(['"].*['"])(?:\s*,\s*(['"].*['"]))*\s*\]/,
            // 字符串分割特征
            /\.split\(['"]\\x0*['"]|['"]\|['"]\)/,
            // 控制流平坦化特征
            /while\(true\)\s*\{\s*(?:var|let|const)\s+[a-zA-Z$_][a-zA-Z0-9$_]*\s*=\s*[a-zA-Z$_][a-zA-Z0-9$_]*\[[a-zA-Z$_][a-zA-Z0-9$_]*\+?\+?\](?:\s*\|\|\s*'')?;?\s*switch\s*\(\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*\)\s*\{/
        ];
        
        // 特定混淆关键词
        const keywords = [
            "_0x", 
            "String['fromCharCode']", 
            "\\x", 
            "0x",
            "atob\\("
        ];
        
        // 检查代码中是否包含混淆关键词
        for (let i = 0; i < keywords.length; i++) {
            if (code.indexOf(keywords[i]) !== -1) {
                return true;
            }
        }
        
        // 检查代码中是否匹配混淆模式
        for (let i = 0; i < patterns.length; i++) {
            if (patterns[i].test(code)) {
                return true;
            }
        }
        
        // 额外检查：是否存在大量十六进制数字
        const hexMatches = code.match(/\\x[0-9a-f]{2}/gi);
        if (hexMatches && hexMatches.length > 10) {
            return true;
        }
        
        return false;
    },
    
    plugin: function(code) {
        try {
            if (!this.detect(code)) {
                return code;
            }
            
            console.log("开始处理JavaScript-Obfuscator混淆代码");
            
            // 处理字符串数组
            code = this.decodeStringArrays(code);
            
            // 解码十六进制和Unicode编码的字符串
            code = this.decodeEncodedStrings(code);
            
            // 还原ASCII字符编码
            code = this.decodeAsciiStrings(code);
            
            // 解除控制流平坦化
            code = this.unFlattenControlFlow(code);
            
            // 移除调试保护
            code = this.removeDebugProtection(code);
            
            console.log("JavaScript-Obfuscator代码处理完成");
            return code;
        } catch (e) {
            console.error("JavaScript-Obfuscator解密错误:", e);
            return code; // 出错时返回原始代码
        }
    },
    
    // 解码字符串数组的方法
    decodeStringArrays: function(code) {
        // 查找字符串数组定义
        const arrayDefRegex = /var\s+([a-zA-Z0-9_$]+)\s*=\s*\[\s*(['"].*?['"])(?:\s*,\s*(['"].*?['"]))*\s*\]/g;
        let match;
        
        while ((match = arrayDefRegex.exec(code)) !== null) {
            try {
                const arrayName = match[1];
                if (!arrayName) continue;
                
                // 提取数组内容
                const arrayContent = match[0].substring(match[0].indexOf('['), match[0].lastIndexOf(']') + 1);
                let array;
                
                try {
                    // 安全地解析数组
                    array = new Function('return ' + arrayContent)();
                } catch (e) {
                    continue;
                }
                
                if (!Array.isArray(array) || array.length === 0) continue;
                
                // 替换对数组的访问
                const accessRegex = new RegExp(arrayName + '\\[(\\d+)\\]', 'g');
                code = code.replace(accessRegex, function(match, index) {
                    const i = parseInt(index);
                    if (i >= 0 && i < array.length) {
                        return JSON.stringify(array[i]);
                    }
                    return match;
                });
                
                console.log(`替换字符串数组 ${arrayName}，共${array.length}项`);
            } catch (e) {
                console.error("处理字符串数组时出错:", e);
            }
        }
        
        return code;
    },
    
    // 解码十六进制和Unicode编码的字符串
    decodeEncodedStrings: function(code) {
        // 处理十六进制编码的字符串
        code = code.replace(/(['"])\\x([0-9a-f]{2})\\x([0-9a-f]{2})\\x([0-9a-f]{2})\\x([0-9a-f]{2})(['"])/gi, function(match, q1, h1, h2, h3, h4, q2) {
            try {
                const char1 = String.fromCharCode(parseInt(h1, 16));
                const char2 = String.fromCharCode(parseInt(h2, 16));
                const char3 = String.fromCharCode(parseInt(h3, 16));
                const char4 = String.fromCharCode(parseInt(h4, 16));
                return q1 + char1 + char2 + char3 + char4 + q2;
            } catch (e) {
                return match;
            }
        });
        
        // 处理单个十六进制字符
        code = code.replace(/(['"])\\x([0-9a-f]{2})(['"])/gi, function(match, q1, hex, q2) {
            try {
                const char = String.fromCharCode(parseInt(hex, 16));
                return q1 + char + q2;
            } catch (e) {
                return match;
            }
        });
        
        // 处理Unicode编码的字符串
        code = code.replace(/(['"])\\u([0-9a-f]{4})(['"])/gi, function(match, q1, hex, q2) {
            try {
                const char = String.fromCharCode(parseInt(hex, 16));
                return q1 + char + q2;
            } catch (e) {
                return match;
            }
        });
        
        // 字符串内的转义序列
        code = code.replace(/(['"]).*(\\x[0-9a-f]{2}).*(['"])/gi, function(match) {
            try {
                return JSON.parse(match);
            } catch (e) {
                return match;
            }
        });
        
        return code;
    },
    
    // 还原ASCII字符编码
    decodeAsciiStrings: function(code) {
        // 解码String.fromCharCode调用
        const charCodeRegex = /String\.fromCharCode\((\d+(?:\s*,\s*\d+)*)\)/g;
        
        code = code.replace(charCodeRegex, function(match, charCodes) {
            try {
                const codes = charCodes.split(',').map(x => parseInt(x.trim()));
                return JSON.stringify(String.fromCharCode.apply(null, codes));
            } catch (e) {
                return match;
            }
        });
        
        return code;
    },
    
    // 解除控制流平坦化
    unFlattenControlFlow: function(code) {
        // 识别控制流平坦化模式
        const flatteningPattern = /while\s*\(\s*(?:true|1)\s*\)\s*{\s*(?:var|let|const)\s+([a-zA-Z0-9_$]+)\s*=\s*([a-zA-Z0-9_$]+)\s*\[\s*([a-zA-Z0-9_$]+)\s*\];\s*switch\s*\(\s*\1\s*\)\s*{/g;
        
        let match;
        while ((match = flatteningPattern.exec(code)) !== null) {
            try {
                // 识别到了控制流平坦化，但是由于缺乏AST支持，
                // 在这个简化版本中，我们只能做有限的处理
                console.log("检测到控制流平坦化，但不能完全还原。建议使用AST分析工具。");
                
                // 尝试移除一些控制流相关的代码
                const varName = match[1];
                const arrayName = match[2];
                const indexName = match[3];
                
                // 这里是一个简化的替换，不能完全还原控制流
                const controlPattern = new RegExp(`var\\s+${indexName}\\s*=\\s*([^;]+);`);
                const arrayPattern = new RegExp(`var\\s+${arrayName}\\s*=\\s*\\[([^\\]]+)\\]`);
                
                const controlMatch = controlPattern.exec(code);
                const arrayMatch = arrayPattern.exec(code);
                
                if (controlMatch && arrayMatch) {
                    console.log(`找到控制流变量: ${indexName} 和数组: ${arrayName}`);
                }
            } catch (e) {
                console.error("处理控制流平坦化时出错:", e);
            }
        }
        
        return code;
    },
    
    // 移除调试保护
    removeDebugProtection: function(code) {
        // 移除无限调试器循环
        const debuggerPattern = /function\s+([a-zA-Z0-9_$]+)\s*\(\s*\)\s*{\s*(?:debugger|console\.clear\(\));\s*\1\(\);\s*}/g;
        code = code.replace(debuggerPattern, "function $1() { /* 已移除调试保护 */ }");
        
        // 移除setInterval调用的调试保护
        const intervalPattern = /setInterval\s*\(\s*function\s*\(\s*\)\s*{\s*(?:debugger|console\.clear\(\));\s*}\s*,\s*\d+\s*\)/g;
        code = code.replace(intervalPattern, "/* 已移除调试保护 */");
        
        // 移除简单的debugger语句
        code = code.replace(/debugger;/g, "/* 已移除调试器 */;");
        
        return code;
    }
};

console.log("JavaScript-Obfuscator解密插件加载完成");