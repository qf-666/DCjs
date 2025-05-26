// JSJiami.com.v5 混淆代码解密插件
console.log("改进的JSJiami.com.v5解密插件加载中...");

if(!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.jsjiamiv5 = {
    detect: function(code) {
        if (!code || typeof code !== 'string') return false;
        
        // 检查JSJiami v5特有的特征字符串
        if (code.indexOf("jsjiami.com.v5") !== -1 || 
            code.indexOf("encode_version") !== -1) {
            return true;
        }
        
        // 检查JSJiami常用的变量命名模式和特征
        if (/_0x[a-f0-9]{4,6}/.test(code) && 
            code.indexOf('\\x') !== -1 && 
            code.indexOf('var _0x') !== -1) {
            return true;
        }
        
        return false;
    },
    
    plugin: function(code) {
        try {
            if (!this.detect(code)) {
                return code;
            }
            
            console.log("开始处理JSJiami.com.v5混淆代码");
            let originalCode = code;
            
            // 1. 首先解码十六进制和Unicode编码的字符串
            code = this.decodeHexStrings(code);
            
            // 2. 处理字符串数组定义 - 特别针对您的示例优化
            code = this.decodeStringArrays(code);
            
            // 3. 处理JSJiami的主字符串数组
            code = this.decodeMainStringArrays(code);
            
            // 4. 移除自解密回调
            code = this.removeSelfDecrypt(code);
            
            // 5. 移除调试保护
            code = this.removeDebugProtection(code);
            
            // 6. 清理无用代码
            code = this.cleanupCode(code);
            
            // 检查代码是否有变化
            if (code === originalCode) {
                console.log("JSJiami.com.v5代码解密失败或无变化");
                // 尝试更简单的方法
                return this.simpleDecode(originalCode);
            }
            
            console.log("JSJiami.com.v5代码处理完成");
            return code;
        } catch (e) {
            console.error("JSJiami.com.v5解密错误:", e);
            return code; // 出错时返回原始代码
        }
    },
    
    // 解码十六进制和Unicode编码的字符串
    decodeHexStrings: function(code) {
        // 解码单个十六进制转义序列
        code = code.replace(/\\x([0-9a-fA-F]{2})/g, function(match, p1) {
            try {
                return String.fromCharCode(parseInt(p1, 16));
            } catch (e) {
                return match;
            }
        });
        
        // 解码Unicode转义序列
        code = code.replace(/\\u([0-9a-fA-F]{4})/g, function(match, p1) {
            try {
                return String.fromCharCode(parseInt(p1, 16));
            } catch (e) {
                return match;
            }
        });
        
        return code;
    },
    
    // 处理字符串数组定义
    decodeStringArrays: function(code) {
        // 寻找字符串数组定义，如 var _0x5b43=['abc','def',...]
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
                
                // 特别处理数组引用 - 针对示例中的样式
                const arrayNameRegex = new RegExp('= ' + arrayName + ';', 'g');
                code = code.replace(arrayNameRegex, "= [" + strings.map(s => "'" + s + "'").join(',') + "];");
            } catch (e) {
                console.error("处理字符串数组时出错:", e);
            }
        }
        
        return code;
    },
    
    // 处理JSJiami的主字符串数组
    decodeMainStringArrays: function(code) {
        // 处理直接赋值的字符串数组，如 _0x1230b8= ['KsO6w4nCsMOpW1sCRs...']
        const directArrayRegex = /(_0x[a-f0-9]{4,6})\s*=\s*\[((?:'[^']*'|"[^"]*")(?:\s*,\s*(?:'[^']*'|"[^"]*"))*)\]/g;
        
        let match;
        while ((match = directArrayRegex.exec(code)) !== null) {
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
                
                console.log(`找到主字符串数组: ${arrayName} (${strings.length}项)`);
                
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
                console.error("处理主字符串数组时出错:", e);
            }
        }
        
        return code;
    },
    
    // 移除自解密回调
    removeSelfDecrypt: function(code) {
        // 移除可能的自解密回调
        code = code.replace(/;\(function\(_0x[a-f0-9]{4,6},_0x[a-f0-9]{4,6}\)\{[^}]+}\);/g, '');
        return code;
    },
    
    // 移除调试保护
    removeDebugProtection: function(code) {
        // 移除无限调试器循环
        code = code.replace(/function\s+(_0x[a-f0-9]{4,6})\s*\(\s*\)\s*\{\s*debugger\s*;\s*\1\(\)\s*;\s*\}/g, 
                           "function $1() { /* 已移除调试保护 */ }");
        
        // 移除单独的debugger语句
        code = code.replace(/debugger\s*;/g, "/* 已移除调试器 */;");
        
        // 移除通过setInterval调用的调试保护
        code = code.replace(/setInterval\s*\(\s*function\s*\(\s*\)\s*\{\s*debugger\s*;\s*\}\s*,\s*\d+\s*\)\s*;/g, 
                           "/* 已移除调试保护 */;");
        
        return code;
    },
    
    // 清理无用代码
    cleanupCode: function(code) {
        // 移除JSJiami特有的版本标记
        code = code.replace(/;\s*encode_version\s*=\s*['"]jsjiami\.com\.v5['"];?/g, '');
        
        // 移除空语句
        code = code.replace(/;;/g, ';');
        
        return code;
    },
    
    // 最简单的解码尝试，专门针对截图中的代码样式
    simpleDecode: function(code) {
        console.log("尝试简单解码...");
        
        // 直接替换十六进制字符串
        code = this.decodeHexStrings(code);
        
        // 查找关键的JSJiami.v5数组模式
        const match = /(_0x[a-f0-9]+)=\[((?:'[^']+'|"[^"]+")(?:\s*,\s*(?:'[^']+'|"[^"]+"))*)\]/.exec(code);
        if (match) {
            const arrayName = match[1];
            const content = match[2];
            
            // 把这个字符串数组作为解密后的结果返回
            return content;
        }
        
        return code;
    }
};

console.log("改进的JSJiami.com.v5解密插件加载完成");