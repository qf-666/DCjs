// JSJiami v5 混淆解密插件
console.log("JSJiami v5 解密插件加载中...");

if (!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.jsjiamiv5 = {
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
            
            // 1. 处理基础转义序列
            code = this.decodeEscapeSequences(code);
            
            // 2. 提取字符串数组
            var arrayMatches = this.extractStringArrays(code);
            if (arrayMatches.length === 0) {
                console.log("未找到字符串数组");
            } else {
                console.log("找到 " + arrayMatches.length + " 个字符串数组");
                
                // 3. 替换字符串引用
                code = this.replaceStringArrayReferences(code, arrayMatches);
            }
            
            // 4. 处理RC4加密部分
            code = this.processRC4Parts(code);
            
            // 5. 移除自执行函数
            code = this.removeEncodingWrapper(code);
            
            // 6. 解析常量函数
            code = this.inlineConstantFunctions(code);
            
            // 7. 添加注释标记关键部分
            code = this.addComments(code);
            
            console.log("JSJiami v5代码处理完成");
            return code;
        } catch (e) {
            console.error("JSJiami v5解密错误:", e);
            return code; // 出错时返回原始代码
        }
    },
    
    // 解码Unicode和十六进制转义序列
    decodeEscapeSequences: function(code) {
        // 处理十六进制转义序列
        code = code.replace(/\\x([0-9A-Fa-f]{2})/g, function(match, p1) {
            try {
                return String.fromCharCode(parseInt(p1, 16));
            } catch (e) {
                return match;
            }
        });
        
        // 处理Unicode转义序列
        code = code.replace(/\\u([0-9a-fA-F]{4})/g, function(match, grp) {
            try {
                return String.fromCharCode(parseInt(grp, 16));
            } catch (e) {
                return match;
            }
        });
        
        return code;
    },
    
    // 提取所有字符串数组
    extractStringArrays: function(code) {
        var result = [];
        
        // 匹配形如 var __0x12345 = ['string1', 'string2', ...]; 的模式
        var arrayRegex = /var\s+(__0x[a-zA-Z0-9]+|_0x[a-zA-Z0-9]+)\s*=\s*\[((?:'[^']*'|"[^"]*"|(?:\s*,\s*))+)\]/g;
        var match;
        
        while ((match = arrayRegex.exec(code)) !== null) {
            var arrayName = match[1];
            var arrayContent = match[2];
            
            // 解析数组内容
            var strings = [];
            var elementRegex = /(['"])((?:\\.|[^\\])*?)\1/g;
            var elementMatch;
            
            while ((elementMatch = elementRegex.exec(arrayContent)) !== null) {
                strings.push(elementMatch[2]);
            }
            
            result.push({
                name: arrayName,
                array: strings
            });
        }
        
        return result;
    },
    
    // 替换字符串数组引用
    replaceStringArrayReferences: function(code, arrayMatches) {
        if (arrayMatches.length === 0) return code;
        
        // 遍历每个数组
        for (var i = 0; i < arrayMatches.length; i++) {
            var arrayMatch = arrayMatches[i];
            var arrayName = arrayMatch.name;
            var strings = arrayMatch.array;
            
            // 查找形如 arrayName[123] 的引用
            var refRegex = new RegExp(arrayName + '\\[(\\d+)\\]', 'g');
            code = code.replace(refRegex, function(match, index) {
                var idx = parseInt(index, 10);
                if (idx >= 0 && idx < strings.length) {
                    return "'" + strings[idx] + "'";
                }
                return match;
            });
            
            // 查找形如 _0x1234('0x1', 'abcd') 的解密函数调用
            var funcRegex = /_0x[a-zA-Z0-9]+\(\s*(['"])([0-9a-fA-F]+)\1\s*,\s*(['"])([^'"]*)\3\s*\)/g;
            code = code.replace(funcRegex, function(match, quote1, hexIndex, quote3, key) {
                try {
                    // 尝试将十六进制索引转换为十进制
                    var idx = parseInt(hexIndex, 16);
                    if (idx >= 0 && idx < strings.length) {
                        // 这里简化处理，实际上JSJiami可能使用更复杂的解密
                        // 通常会涉及RC4或其他算法
                        return "'" + strings[idx] + "'";
                    }
                } catch (e) {
                    console.error("转换索引时出错:", e);
                }
                return match;
            });
        }
        
        return code;
    },
    
    // 处理RC4加密部分
    processRC4Parts: function(code) {
        // 查找RC4函数定义
        var rc4Match = code.match(/['"]rc4['"]\s*:\s*function\s*\([^)]*\)\s*\{[\s\S]*?return[^}]*\}/);
        if (rc4Match) {
            console.log("检测到RC4加密函数");
            
            // 标记RC4加密调用
            code = code.replace(/(_0x[a-zA-Z0-9]+)\s*=\s*_0x[a-zA-Z0-9]+\['rc4'\]\(([^,]+),\s*(['"])([^'"]*)\3\)/g,
                function(match, varName, data, quote, key) {
                    return match + " /* RC4加密数据，密钥:" + key + " */";
                }
            );
        }
        
        return code;
    },
    
    // 移除自执行函数
    removeEncodingWrapper: function(code) {
        return code.replace(/;\(function\([^)]*\)\s*\{[\s\S]*?encode_version\s*=\s*['"]jsjiami\.com\.v5['"];\s*\}\)\(window\);/g, 
            "// JSJiami外层包装已移除");
    },
    
    // 内联常量函数
    inlineConstantFunctions: function(code) {
        // 查找形如 function _0x12345() { return 'constant'; } 的函数
        var constFuncRegex = /function\s+(_0x[a-zA-Z0-9]+)\s*\(\)\s*\{\s*return\s+(['"])([^'"]*)\2\s*;\s*\}/g;
        
        // 收集所有常量函数
        var constFuncs = {};
        var match;
        
        while ((match = constFuncRegex.exec(code)) !== null) {
            var funcName = match[1];
            var constant = match[3];
            constFuncs[funcName] = constant;
        }
        
        // 替换所有常量函数调用
        for (var funcName in constFuncs) {
            if (constFuncs.hasOwnProperty(funcName)) {
                var constant = constFuncs[funcName];
                var callRegex = new RegExp(funcName + '\\(\\)', 'g');
                code = code.replace(callRegex, "'" + constant + "'");
            }
        }
        
        return code;
    },
    
    // 添加注释标记关键部分
    addComments: function(code) {
        // 标记JSJiami特有部分
        var patterns = [
            [/var\s+(_0x[a-zA-Z0-9]+)\s*=\s*function\s*\([^)]*\)\s*\{[\s\S]*?return\s+[^}]*\}/g, 
             function(match, funcName) {
                return "/* JSJiami字符串解密函数 */ " + match;
             }],
            [/_0x[a-zA-Z0-9]+\['initialized'\]/g, "/* JSJiami初始化标志 */"],
            [/_0x[a-zA-Z0-9]+\['data'\]/g, "/* JSJiami缓存数据 */"],
            [/_0x[a-zA-Z0-9]+\['once'\]/g, "/* JSJiami一次性标志 */"]
        ];
        
        for (var i = 0; i < patterns.length; i++) {
            var pattern = patterns[i];
            if (typeof pattern[1] === 'string') {
                code = code.replace(pattern[0], pattern[1] + " $&");
            } else if (typeof pattern[1] === 'function') {
                code = code.replace(pattern[0], pattern[1]);
            }
        }
        
        return code;
    }
};

console.log("JSJiami v5解密插件加载完成");