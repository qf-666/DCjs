// JSJiami.com.v5 混淆代码解密插件
console.log("JSJiami.com.v5解密插件加载中...");

if(!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.jsjiamiV5 = {
    detect: function(code) {
        if (!code || typeof code !== 'string') return false;
        
        // 检查JSJiami v5特有的特征字符串
        const jsjiamiMarkers = [
            "jsjiami.com.v5",
            "encode_version",
            "jsjiam"
        ];
        
        for (let i = 0; i < jsjiamiMarkers.length; i++) {
            if (code.indexOf(jsjiamiMarkers[i]) !== -1) {
                return true;
            }
        }
        
        // 检查JSJiami常用的变量命名模式
        const patterns = [
            /_0x[a-f0-9]{4,6}/,  // 例如 _0x4a72b8
            /\{_0x[a-f0-9]{4,6}\(/,
            /var _0x[a-f0-9]{4,6}=/,
            /function _0x[a-f0-9]{4,6}\(/
        ];
        
        for (let i = 0; i < patterns.length; i++) {
            if (patterns[i].test(code)) {
                return true;
            }
        }
        
        // 检查JSJiami v5典型的加密方式
        if (code.indexOf('_0x') !== -1 && 
            code.indexOf(';var') !== -1 && 
            /\\x[0-9a-fA-F]{2}/.test(code) &&
            code.includes('return') && 
            code.includes('function')) {
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
            
            // 1. 首先解码十六进制和Unicode编码的字符串
            code = this.decodeHexStrings(code);
            
            // 2. 处理字符串数组
            code = this.decodeStringArrays(code);
            
            // 3. 尝试提取和解码主要的解码函数
            code = this.decodeMainFunctions(code);
            
            // 4. 处理自执行函数
            code = this.unwrapIIFE(code);
            
            // 5. 清理无用代码
            code = this.cleanupCode(code);
            
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
        
        // 处理字符串内的转义序列
        code = code.replace(/['"]\\x[0-9a-fA-F]{2}.*?['"]/g, function(match) {
            try {
                return eval(match);
            } catch (e) {
                return match;
            }
        });
        
        return code;
    },
    
    // 处理字符串数组
    decodeStringArrays: function(code) {
        // 寻找字符串数组定义，如 var _0x5b43=['abc','def',...]
        const stringArrayRegex = /var\s+(_0x[a-f0-9]{4,6})\s*=\s*\[((?:'[^']*'|"[^"]*")(?:\s*,\s*(?:'[^']*'|"[^"]*"))*)\]/g;
        
        let match;
        while ((match = stringArrayRegex.exec(code)) !== null) {
            try {
                const arrayName = match[1];
                const arrayContent = match[2];
                
                // 解析数组内容
                const strings = arrayContent.split(',').map(s => {
                    // 移除引号并解码转义序列
                    return s.trim().replace(/^['"]|['"]$/g, '');
                });
                
                if (strings.length === 0) continue;
                
                console.log(`找到字符串数组: ${arrayName} (${strings.length}项)`);
                
                // 创建替换正则表达式
                const arrayAccessRegex = new RegExp(arrayName + '\\[(\\d+)\\]', 'g');
                
                // 替换数组访问
                code = code.replace(arrayAccessRegex, function(match, index) {
                    const idx = parseInt(index);
                    if (idx >= 0 && idx < strings.length) {
                        return JSON.stringify(strings[idx]);
                    }
                    return match;
                });
                
                // 也处理与字符串数组相关的常见混淆模式
                const shuffleRegex = new RegExp(arrayName + '\\.push\\(' + arrayName + '\\.shift\\(\\)\\)', 'g');
                code = code.replace(shuffleRegex, '/* 数组重排序已移除 */');
            } catch (e) {
                console.error("处理字符串数组时出错:", e);
            }
        }
        
        return code;
    },
    
    // 尝试提取和解码主要的解码函数
    decodeMainFunctions: function(code) {
        // 查找JSJiami v5典型的主解码函数
        const mainFuncRegex = /function\s+(_0x[a-f0-9]{4,6})\s*\(\s*(_0x[a-f0-9]{4,6})\s*\)\s*\{/g;
        
        let match;
        while ((match = mainFuncRegex.exec(code)) !== null) {
            try {
                const functionName = match[1];
                const paramName = match[2];
                
                // 检查是否是字符串解码函数
                const funcPos = match.index;
                const nextChars = code.substring(funcPos, funcPos + 300);
                
                // 判断是否包含字符串处理特征
                if (nextChars.includes('return') && 
                    (nextChars.includes('shift') || 
                     nextChars.includes('split') || 
                     nextChars.includes('replace'))) {
                    
                    console.log(`找到可能的解码函数: ${functionName}`);
                    
                    // 查找这个函数的调用
                    const funcCallRegex = new RegExp(functionName + '\\(([^)]+)\\)', 'g');
                    let funcCalls = [];
                    let funcCallMatch;
                    
                    while ((funcCallMatch = funcCallRegex.exec(code)) !== null) {
                        try {
                            const argument = funcCallMatch[1].trim();
                            // 如果参数是字符串字面量，尝试解码
                            if ((argument.startsWith("'") && argument.endsWith("'")) || 
                                (argument.startsWith('"') && argument.endsWith('"'))) {
                                
                                // 我们无法真正执行解码函数，但可以在注释中标记这些位置
                                code = code.replace(funcCallMatch[0], `/* 解码函数调用 ${functionName} */ ${argument}`);
                            }
                        } catch (e) {
                            // 忽略单个调用的处理错误
                        }
                    }
                }
            } catch (e) {
                console.error("处理解码函数时出错:", e);
            }
        }
        
        return code;
    },
    
    // 处理自执行函数
    unwrapIIFE: function(code) {
        // 查找并尝试展开最外层的立即执行函数表达式(IIFE)
        const iifePattern = /\(function\s*\([^)]*\)\s*\{([\s\S]*)\}\s*\([^)]*\)\s*\)/;
        
        const match = iifePattern.exec(code);
        if (match && match[1]) {
            // 如果找到了IIFE，提取其内容
            console.log("尝试展开自执行函数");
            const content = match[1].trim();
            
            // 只有当内容看起来是完整的代码块时才替换
            if (content.length > 100 && 
                (content.includes(';') || content.includes('{'))) {
                return content;
            }
        }
        
        return code;
    },
    
    // 清理无用代码
    cleanupCode: function(code) {
        // 移除JSJiami特有的版本标记
        code = code.replace(/;\s*encode_version\s*=\s*['"]jsjiami\.com\.v5['"];?/g, '');
        
        // 移除可能的自解密回调
        code = code.replace(/;\(function\(_0x[a-f0-9]{4,6},_0x[a-f0-9]{4,6}\)\{[^}]+}\);/g, '');
        
        // 移除空语句
        code = code.replace(/;;/g, ';');
        
        // 在代码最后添加注释，标明解密工具
        code += "\n\n// 使用 JSJiami.com.v5 解密插件解密";
        
        return code;
    }
};

console.log("JSJiami.com.v5解密插件加载完成");