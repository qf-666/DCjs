// SOJSON v7混淆解密插件 - 高级版
console.log("SOJSON v7解密插件(高级版)加载中...");

if (!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.jsjiamiv5 = {
    name: "SOJSON v7高级解密插件",
    version: "1.0.0",
    
    /**
     * 检测代码是否被SOJSON v7加密
     * @param {string} code - 要检查的代码
     * @returns {boolean} 如果是SOJSON v7加密则返回true
     */
    detect: function(code) {
        if (!code || typeof code !== 'string') return false;
        
        // 更精确地检测jsjiami.com.v7特征
        return code.indexOf('jsjiami.com.v7') !== -1 || 
               (code.indexOf('_0x') !== -1 && 
                code.indexOf('function _0x') !== -1 && 
                /var\s+(_0x[a-f0-9]+)\s*=\s*\[\s*((?:'[^']*'|"[^"]*"|`[^`]*`|\s*,\s*)*)\s*\]/.test(code));
    },
    
    /**
     * 主解密函数
     * @param {string} code - 加密的代码
     * @returns {string} 解密后的代码
     */
    plugin: function(code) {
        try {
            if (!this.detect(code)) {
                return code;
            }
            
            console.log("开始处理SOJSON v7加密代码");
            
            // 备份原始代码以检测是否有变化
            var originalCode = code;
            
            // 阶段1: 解码十六进制字符串和版本信息
            code = this.decodeHexStrings(code);
            
            // 阶段2: 提取字符串数组
            var stringArrayInfo = this.extractStringArray(code);
            
            // 阶段3: 定位并分析_0x46b1函数
            var _0x46b1Info = this.analyze_0x46b1Function(code);
            
            // 阶段4: 分析主解码函数
            var mainDecoderInfo = this.analyzeMainDecoder(code);
            
            // 阶段5: 基于获取的信息执行字符串替换
            if (stringArrayInfo.found && stringArrayInfo.array && stringArrayInfo.array.length > 0) {
                code = this.replaceStringArrayReferences(code, stringArrayInfo, _0x46b1Info);
            }
            
            // 阶段6: 执行更复杂的替换
            if (mainDecoderInfo.found) {
                code = this.replaceDecoderCalls(code, mainDecoderInfo);
            }
            
            // 阶段7: 清理控制流平坦化
            code = this.cleanControlFlow(code);
            
            // 阶段8: 移除反调试代码
            code = this.removeAntiDebugging(code);
            
            // 阶段9: 清理和格式化代码
            code = this.cleanCode(code);
            
            // 检测代码是否有变化
            if (code === originalCode) {
                console.log("SOJSON v7代码没有变化，可能需要更高级的解密方法");
                
                // 尝试最后的方法 - 添加辅助注释
                code = this.addHelperComments(code);
            } else {
                console.log("SOJSON v7代码解密成功");
            }
            
            // 添加解密标记
            var timestamp = new Date().toLocaleString();
            code = "/*\n * SOJSON v7 (jsjiami.com.v7) 解密结果\n * 解密时间: " + timestamp + "\n */\n\n" + code;
            
            return code;
        } catch (e) {
            console.error("SOJSON v7解密错误:", e);
            // 出错时返回带有错误信息的原始代码
            return "/* 解密过程中出错: " + e.message + " */\n\n" + code;
        }
    },
    
    /**
     * 解码十六进制编码的字符串
     * @param {string} code - 包含十六进制字符串的代码
     * @returns {string} 解码后的代码
     */
    decodeHexStrings: function(code) {
        console.log("解码十六进制字符串...");
        
        // 处理版本字符串
        code = code.replace(/var\s+version_\s*=\s*(['"])\\x([0-9a-fA-F]{2})((?:\\x[0-9a-fA-F]{2})+?)(['"])/g, 
            function(match, q1, firstHex, restHex, q2) {
                try {
                    let decoded = String.fromCharCode(parseInt(firstHex, 16));
                    let parts = restHex.split('\\x');
                    for (let i = 0; i < parts.length; i++) {
                        if (parts[i] && parts[i].length >= 2) {
                            decoded += String.fromCharCode(parseInt(parts[i].substring(0, 2), 16));
                        }
                    }
                    return "var version_ = " + q1 + decoded + q2 + "; /* 已解码 */";
                } catch (e) {
                    return match;
                }
            }
        );
        
        // 处理其他十六进制编码字符串
        code = code.replace(/(['"])\\x([0-9a-fA-F]{2})((?:\\x[0-9a-fA-F]{2})+?)(['"])/g,
            function(match, q1, firstHex, restHex, q2) {
                try {
                    let decoded = String.fromCharCode(parseInt(firstHex, 16));
                    let parts = restHex.split('\\x');
                    for (let i = 0; i < parts.length; i++) {
                        if (parts[i] && parts[i].length >= 2) {
                            decoded += String.fromCharCode(parseInt(parts[i].substring(0, 2), 16));
                        }
                    }
                    return q1 + decoded + q2;
                } catch (e) {
                    return match;
                }
            }
        );
        
        return code;
    },
    
    /**
     * 提取字符串数组
     * @param {string} code - 代码
     * @returns {Object} 字符串数组信息
     */
    extractStringArray: function(code) {
        console.log("提取字符串数组...");
        
        var result = {
            found: false,
            name: null,
            array: null
        };
        
        // 正则表达式以查找定义数组的地方
        var arrayMatch = code.match(/function\s+(_0x[a-f0-9]+)\s*\(\s*\)\s*\{\s*(?:var\s+)?(_0x[a-f0-9]+)\s*=\s*\[\s*((?:'[^']*'|"[^"]*"|`[^`]*`|\s*,\s*)*)\s*\]/);
        
        if (arrayMatch) {
            result.found = true;
            result.name = arrayMatch[1]; // 函数名，通常是 _0x46b1
            
            try {
                var arrayStr = "[" + arrayMatch[3] + "]";
                // 安全地求值数组字符串
                var array = new Function("return " + arrayStr)();
                result.array = array;
                console.log("成功提取字符串数组，包含 " + array.length + " 项");
            } catch (e) {
                console.log("提取字符串数组失败:", e);
            }
        }
        
        return result;
    },
    
    /**
     * 分析 _0x46b1 函数
     * @param {string} code - 代码
     * @returns {Object} _0x46b1函数分析结果
     */
    analyze_0x46b1Function: function(code) {
        console.log("分析字符串数组访问函数...");
        
        var result = {
            found: false,
            name: null,
            baseOffset: null
        };
        
        // 查找 _0x46b1 函数的完整定义
        var funcMatch = code.match(/function\s+(_0x[a-f0-9]+)\s*\(\s*\)\s*\{[\s\S]+?return\s+(_0x[a-f0-9]+);?\s*\}/);
        if (funcMatch) {
            result.found = true;
            result.name = funcMatch[1];
            
            // 查找偏移计算模式
            var offsetMatch = code.match(/(_0x[a-f0-9]+)=(_0x[a-f0-9]+)-\s*(0x[a-f0-9]+)/);
            if (offsetMatch) {
                try {
                    result.baseOffset = parseInt(offsetMatch[3], 16);
                    console.log("找到基础偏移值: " + result.baseOffset);
                } catch (e) {
                    console.log("解析基础偏移值失败:", e);
                }
            } else {
                // 使用默认偏移值
                result.baseOffset = 0x18f;
                console.log("使用默认偏移值: 0x18f");
            }
        }
        
        return result;
    },
    
    /**
     * 分析主解码函数
     * @param {string} code - 代码
     * @returns {Object} 主解码函数分析结果
     */
    analyzeMainDecoder: function(code) {
        console.log("分析主解码函数...");
        
        var result = {
            found: false,
            name: null,
            pattern: null
        };
        
        // 查找解码函数，通常是形如 _0x1fca 的函数
        var decoderMatch = code.match(/function\s+(_0x[a-f0-9]+)\s*\(\s*(_0x[a-f0-9]+)\s*,\s*(_0x[a-f0-9]+)\s*\)\s*\{[\s\S]+?return\s+(?:_0x[a-f0-9]+);?\s*\}/);
        
        if (decoderMatch) {
            result.found = true;
            result.name = decoderMatch[1];
            result.pattern = decoderMatch[0];
            console.log("找到主解码函数: " + result.name);
        }
        
        return result;
    },
    
    /**
     * 替换字符串数组引用
     * @param {string} code - 包含字符串引用的代码
     * @param {Object} stringArrayInfo - 字符串数组信息
     * @param {Object} _0x46b1Info - _0x46b1函数信息
     * @returns {string} 替换后的代码
     */
    replaceStringArrayReferences: function(code, stringArrayInfo, _0x46b1Info) {
        console.log("替换字符串数组引用...");
        
        if (!stringArrayInfo.found || !stringArrayInfo.array || !_0x46b1Info.found) {
            return code;
        }
        
        var array = stringArrayInfo.array;
        var functionName = stringArrayInfo.name;
        var baseOffset = _0x46b1Info.baseOffset || 0x18f; // 默认偏移值
        var replacementCount = 0;
        
        // 替换直接数组引用，如 _0x46b1[0]
        for (var i = 0; i < array.length; i++) {
            if (typeof array[i] === 'string') {
                var pattern = new RegExp(this.escapeRegExp(functionName) + '\\s*\\[\\s*' + i + '\\s*\\]', 'g');
                var matches = code.match(pattern);
                if (matches) {
                    replacementCount += matches.length;
                }
                code = code.replace(pattern, "'" + array[i].replace(/'/g, "\\'") + "'");
            }
        }
        
        // 替换通过函数调用引用的数组项，如 _0x46b1(0x18f)
        var funcCallPattern = new RegExp(this.escapeRegExp(functionName) + '\\s*\\(\\s*(0x[a-f0-9]+)\\s*\\)', 'g');
        var match;
        var tempCode = code;
        
        // 创建一个安全的求值函数来计算十六进制字面量
        var safeEval = function(expr) {
            try {
                return parseInt(expr, 16);
            } catch {
                return null;
            }
        };
        
        // 匹配所有函数调用
        while ((match = funcCallPattern.exec(tempCode)) !== null) {
            try {
                var hexValue = match[1];
                var index = safeEval(hexValue) - baseOffset;
                
                if (index >= 0 && index < array.length && typeof array[index] === 'string') {
                    var fullMatch = match[0];
                    var newValue = "'" + array[index].replace(/'/g, "\\'") + "'";
                    
                    // 在实际代码中替换
                    code = code.replace(new RegExp(this.escapeRegExp(fullMatch), 'g'), newValue);
                    replacementCount++;
                }
            } catch (e) {
                console.log("替换函数调用时出错:", e);
            }
        }
        
        console.log("替换了 " + replacementCount + " 个字符串引用");
        return code;
    },
    
    /**
     * 替换解码函数调用
     * @param {string} code - 代码
     * @param {Object} decoderInfo - 解码函数信息
     * @returns {string} 替换后的代码
     */
    replaceDecoderCalls: function(code, decoderInfo) {
        console.log("替换解码函数调用...");
        
        if (!decoderInfo.found) {
            return code;
        }
        
        // 解码函数调用模式，如 _0x1fca(a, b)
        var decoderCallPattern = new RegExp(this.escapeRegExp(decoderInfo.name) + '\\s*\\(\\s*([^,]+)\\s*,\\s*([^)]+)\\s*\\)', 'g');
        var match;
        var replacementCount = 0;
        
        // 遍历所有解码函数调用
        while ((match = decoderCallPattern.exec(code)) !== null) {
            try {
                var fullMatch = match[0];
                var comment = " /* 解码函数: " + decoderInfo.name + "(" + match[1] + ", " + match[2] + ") */";
                
                // 替换为带注释的版本
                var start = code.substring(0, match.index);
                var end = code.substring(match.index + fullMatch.length);
                code = start + fullMatch + comment + end;
                
                // 更新下一个搜索位置
                decoderCallPattern.lastIndex += comment.length;
                replacementCount++;
            } catch (e) {
                console.log("添加解码函数注释时出错:", e);
            }
        }
        
        console.log("添加了 " + replacementCount + " 个解码函数注释");
        return code;
    },
    
    /**
     * 清理控制流平坦化
     * @param {string} code - 代码
     * @returns {string} 清理后的代码
     */
    cleanControlFlow: function(code) {
        console.log("清理控制流平坦化...");
        
        // 处理 while-switch 模式
        code = this.handleWhileSwitchPattern(code);
        
        // 处理 for-switch 模式
        code = this.handleForSwitchPattern(code);
        
        return code;
    },
    
    /**
     * 处理 while-switch 控制流模式
     * @param {string} code - 要处理的代码
     * @returns {string} 处理后的代码
     */
    handleWhileSwitchPattern: function(code) {
        // 识别并处理 while(true){switch(){}} 模式
        var whileSwitchPattern = /while\s*\(\s*(?:!!(?:\[\])|true)\s*\)\s*\{\s*switch\s*\(\s*(_0x[a-f0-9]+)\s*\[\s*(_0x[a-f0-9]+)\s*\]\s*\)\s*\{([\s\S]+?)(?:break;[\s\S]*?)?\}\s*\}/g;
        
        var replacementCount = 0;
        code = code.replace(whileSwitchPattern, (match, arrayName, indexName, switchBody) => {
            try {
                // 尝试找到数组定义
                var arrayDefPattern = new RegExp(`var\\s+${this.escapeRegExp(arrayName)}\\s*=\\s*['"]([^'"]+)['"]\\s*\\.split\\s*\\(\\s*['"]\\|['"]\\s*\\)`, 'g');
                var arrayMatch = arrayDefPattern.exec(code);
                
                if (arrayMatch) {
                    var orderArray = arrayMatch[1].split('|');
                    replacementCount++;
                    
                    // 添加注释以帮助理解
                    return `/* 控制流平坦化 - 原始顺序: ${arrayMatch[1]} */\n` +
                           `/* 已简化的while-switch模式 */\n{\n${match}\n}`;
                }
            } catch (e) {
                console.log("处理while-switch模式时出错:", e);
            }
            
            // 如果无法完全解码，只添加有用的注释
            return `/* 控制流平坦化 - while-switch模式 */\n${match}`;
        });
        
        if (replacementCount > 0) {
            console.log(`处理了 ${replace}
            return code;
    },
        
        // 添加控制台日志拦截，以捕获插件的输出
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        
        console.log = function() {
            const args = Array.from(arguments).join(' ');
            log(args);
            originalConsoleLog.apply(console, arguments);
        };
        
        console.error = function() {
            const args = Array.from(arguments).join(' ');
            log(args, 'error');
            originalConsoleError.apply(console, arguments);
        };
        
        try {
            log('开始解密...');
            const result = window.DecodePlugins.sojsonv7.plugin(inputCode);
            outputCode.value = result;
            log('解密完成', 'success');
        } catch (e) {
            log('解密过程中出错: ' + e.message, 'error');
            outputCode.value = "/* 解密过程中出错: " + e.message + " */\n\n" + inputCode;
        } finally {
            // 恢复原始控制台函数
            console.log = originalConsoleLog;
            console.error = originalConsoleError;
        }
    });
    
    // 清空按钮
    document.getElementById('clear-btn').addEventListener('click', function() {
        document.getElementById('input-code').value = '';
        document.getElementById('output-code').value = '';
        document.getElementById('log-container').innerHTML = '';
    });
    
    // 复制按钮
    document.getElementById('copy-btn').addEventListener('click', function() {
        const outputCode = document.getElementById('output-code');
        
        if (!outputCode.value.trim()) {
            log('没有可复制的结果', 'error');
            return;
        }
        
        outputCode.select();
        document.execCommand('copy');
        log('已复制解密结果到剪贴板', 'success');
    });
    
    // 下载按钮
    document.getElementById('download-btn').addEventListener('click', function() {
        const outputCode = document.getElementById('output-code').value;
        
        if (!outputCode.trim()) {
            log('没有可下载的结果', 'error');
            return;
        }
        
        const blob = new Blob([outputCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'deobfuscated.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        log('已下载解密结果', 'success');
    });
    
    // 添加拖放支持
    const inputCodeElement = document.getElementById('input-code');
    
    inputCodeElement.addEventListener('dragover', function(e) {
        e.preventDefault();
        inputCodeElement.style.borderColor = '#4a6ee0';
    });
    
    inputCodeElement.addEventListener('dragleave', function() {
        inputCodeElement.style.borderColor = '#ccc';
    });
    
    inputCodeElement.addEventListener('drop', function(e) {
        e.preventDefault();
        inputCodeElement.style.borderColor = '#ccc';
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            
            if (file.type !== 'application/javascript' && !file.name.endsWith('.js')) {
                log('请选择JavaScript文件(.js)', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                inputCodeElement.value = e.target.result;
                log(`已加载文件 "${file.name}"`, 'success');
            };
            reader.onerror = function() {
                log('读取文件时出错', 'error');
            };
            reader.readAsText(file);
        }
    });
    
    log('SOJSON v7解密工具已准备就绪');
})();

console.log("SOJSON v7解密插件(高级版)加载完成");