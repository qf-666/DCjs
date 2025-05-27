// SOJSON v7混淆解密插件 - 增强版
console.log("SOJSON v7解密插件(增强版)加载中...");

if(!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.sojsonv7 = {
    detect: function(code) {
        if (!code || typeof code !== 'string') return false;
        
        // 更精确地检测jsjiami.com.v7特征
        return code.indexOf('jsjiami.com.v7') !== -1 || 
               (code.indexOf('_0x') !== -1 && 
                code.indexOf('function _0x') !== -1 && 
                /var\s+(_0x[a-f0-9]+)\s*=\s*\[\s*((?:'[^']*'|"[^"]*"|`[^`]*`|\s*,\s*)*)\s*\]/.test(code));
    },
    
    plugin: function(code) {
        try {
            if (!this.detect(code)) {
                return code;
            }
            
            console.log("开始处理SOJSON v7加密代码");
            
            // 备份原始代码以检测是否有变化
            var originalCode = code;
            
            // 阶段1: 解码版本字符串和十六进制编码
            code = this.decodeHexStrings(code);
            
            // 阶段2: 提取字符串数组
            var stringArrayInfo = this.extractStringArray(code);
            
            // 阶段3: 定位并分析_0x46b1函数
            var _0x46b1Info = this.analyze_0x46b1Function(code);
            
            // 阶段4: 处理主解码函数(_0x1fca)
            var mainDecoderInfo = this.analyzeMainDecoder(code);
            
            // 阶段5: 基于获取的信息执行实际替换
            if (stringArrayInfo.array && stringArrayInfo.array.length > 0) {
                code = this.replaceStringArrayReferences(code, stringArrayInfo, _0x46b1Info);
            }
            
            // 阶段6: 进行更复杂的替换
            if (mainDecoderInfo.found) {
                code = this.replaceDecoderCalls(code, mainDecoderInfo, _0x46b1Info);
            }
            
            // 阶段7: 尝试处理控制流平坦化
            code = this.cleanControlFlow(code);
            
            // 阶段8: 移除反调试代码
            code = this.removeAntiDebugging(code);
            
            // 阶段9: 清理代码
            code = this.cleanCode(code);
            
            // 添加解密标记
            var timestamp = new Date().toLocaleString();
            code = "/*\n * SOJSON v7 (jsjiami.com.v7) 解密结果\n * 解密时间: " + timestamp + "\n */\n\n" + code;
            
            // 检测代码是否有变化
            if (code === originalCode) {
                console.log("SOJSON v7代码没有变化，可能需要更高级的解密方法");
                
                // 尝试最后的方法 - 添加辅助注释
                code = this.addHelperComments(code);
            } else {
                console.log("SOJSON v7代码解密成功");
            }
            
            return code;
        } catch (e) {
            console.error("SOJSON v7解密错误:", e);
            // 出错时返回带有错误信息的原始代码
            return "/* 解密过程中出错: " + e.message + " */\n\n" + code;
        }
    },
    
    // 解码十六进制字符串
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
    
    // 提取字符串数组
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
    
    // 分析 _0x46b1 函数
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
    
    // 分析主解码函数
    analyzeMainDecoder: function(code) {
        console.log("分析主解码函数...");
        var result = {
            found: false,
            name: null,
            pattern: null
        };
        
        // 查找解码函数，通常是 _0x1fca
        var decoderMatch = code.match(/function\s+(_0x[a-f0-9]+)\s*\(\s*(_0x[a-f0-9]+)\s*,\s*(_0x[a-f0-9]+)\s*\)\s*\{[\s\S]+?return\s+(?:_0x[a-f0-9]+);?\s*\}/);
        
        if (decoderMatch) {
            result.found = true;
            result.name = decoderMatch[1];
            result.pattern = decoderMatch[0];
            console.log("找到主解码函数: " + result.name);
        }
        
        return result;
    },
    
    // 替换字符串数组引用
    replaceStringArrayReferences: function(code, stringArrayInfo, _0x46b1Info) {
        console.log("替换字符串数组引用...");
        if (!stringArrayInfo.found || !stringArrayInfo.array || !_0x46b1Info.found) {
            return code;
        }
        
        var array = stringArrayInfo.array;
        var baseOffset = _0x46b1Info.baseOffset || 0x18f; // 默认偏移值
        var replacementCount = 0;
        
        // 替换直接数组引用，如 _0x46b1[0]
        for (var i = 0; i < array.length; i++) {
            if (typeof array[i] === 'string') {
                var pattern = new RegExp(stringArrayInfo.name + '\\s*\\[\\s*' + i + '\\s*\\]', 'g');
                var matches = code.match(pattern);
                if (matches) {
                    replacementCount += matches.length;
                }
                code = code.replace(pattern, "'" + array[i].replace(/'/g, "\\'") + "'");
            }
        }
        
        // 替换通过函数调用引用的数组项，如 _0x46b1(0x18f)
        var funcCallPattern = new RegExp(stringArrayInfo.name + '\\s*\\(\\s*(0x[a-f0-9]+)\\s*\\)', 'g');
        var match;
        
        while ((match = funcCallPattern.exec(code)) !== null) {
            try {
                var hexValue = match[1];
                var index = parseInt(hexValue, 16) - baseOffset;
                
                if (index >= 0 && index < array.length && typeof array[index] === 'string') {
                    var newValue = "'" + array[index].replace(/'/g, "\\'") + "'";
                    var fullMatch = match[0];
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
    
    // 替换解码函数调用
    replaceDecoderCalls: function(code, decoderInfo, _0x46b1Info) {
        console.log("替换解码函数调用...");
        if (!decoderInfo.found || !_0x46b1Info.found) {
            return code;
        }
        
        // 解码函数调用模式，如 _0x1fca(a, b)
        var decoderCallPattern = new RegExp(decoderInfo.name + '\\s*\\(\\s*([^,]+)\\s*,\\s*([^)]+)\\s*\\)', 'g');
        var match;
        var replacementCount = 0;
        
        while ((match = decoderCallPattern.exec(code)) !== null) {
            try {
                var fullMatch = match[0];
                var comment = " /* 解码函数: " + decoderInfo.name + "(" + match[1] + ", " + match[2] + ") */";
                code = code.replace(new RegExp(this.escapeRegExp(fullMatch), 'g'), fullMatch + comment);
                replacementCount++;
            } catch (e) {
                console.log("添加解码函数注释时出错:", e);
            }
        }
        
        console.log("添加了 " + replacementCount + " 个解码函数注释");
        return code;
    },
    
    // 清理控制流平坦化
    cleanControlFlow: function(code) {
        console.log("清理控制流平坦化...");
        var replacementCount = 0;
        
        // 处理 while-switch 模式
        var whileSwitchPattern = /while\s*\(\s*(?:!!(?:\[\])|true)\s*\)\s*\{\s*switch\s*\(\s*(_0x[a-f0-9]+)\s*\[\s*(_0x[a-f0-9]+)\s*\]\s*\)\s*\{([\s\S]+?)(?:break;[\s\S]*?)?\}\s*\}/g;
        
        code = code.replace(whileSwitchPattern, function(match, arrayName, indexName, switchBody) {
            replacementCount++;
            return `/* 控制流平坦化 - while-switch模式 */\n{\n${match}\n}`;
        });
        
        // 处理 for-switch 模式
        var forSwitchPattern = /for\s*\(\s*;\s*;\s*\)\s*\{\s*switch\s*\(\s*(_0x[a-f0-9]+)\s*\[\s*(_0x[a-f0-9]+)\s*\]\s*\)\s*\{([\s\S]+?)(?:break;[\s\S]*?)?\}\s*\}/g;
        
        code = code.replace(forSwitchPattern, function(match, arrayName, indexName, switchBody) {
            replacementCount++;
            return `/* 控制流平坦化 - for-switch模式 */\n{\n${match}\n}`;
        });
        
        if (replacementCount > 0) {
            console.log("处理了 " + replacementCount + " 个控制流平坦化结构");
        }
        
        return code;
    },
    
    // 移除反调试代码
    removeAntiDebugging: function(code) {
        console.log("移除反调试代码...");
        var replacementCount = 0;
        
        // 移除debugger语句
        var debuggerPattern = /debugger;?/g;
        var debuggerMatches = code.match(debuggerPattern) || [];
        replacementCount += debuggerMatches.length;
        code = code.replace(debuggerPattern, '/* debugger已移除 */');
        
        // 移除setInterval反调试模式
        var setIntervalPattern = /setInterval\s*\(\s*function\s*\(\s*\)\s*\{\s*(?:debugger|console\.clear\(\)[\s\S]*?)\s*\}\s*,\s*\d+\s*\)\s*;?/g;
        var setIntervalMatches = code.match(setIntervalPattern) || [];
        replacementCount += setIntervalMatches.length;
        code = code.replace(setIntervalPattern, '/* 反调试interval已移除 */');
        
        if (replacementCount > 0) {
            console.log("移除了 " + replacementCount + " 个反调试结构");
        }
        
        return code;
    },
    
    // 清理代码
    cleanCode: function(code) {
        console.log("清理和格式化代码...");
        // 移除多余的注释和空行
        code = code.replace(/\/\*\s*\*\//g, '');
        code = code.replace(/\n{3,}/g, '\n\n');
        
        // 移除空语句
        code = code.replace(/;\s*;/g, ';');
        
        // 标记可疑模式
        code = this.markSuspiciousPatterns(code);
        
        return code;
    },
    
    // 标记可疑模式
    markSuspiciousPatterns: function(code) {
        // 标记域名限制代码
        code = code.replace(
            /(location\s*\.\s*href|document\s*\.\s*domain)[\s\S]{0,50}(indexOf|===|==|!=|!==)/g,
            '/* 可能的域名限制: */ $&'
        );
        
        // 标记潜在的eval用法
        code = code.replace(
            /\beval\s*\(/g,
            '/* 注意 - eval用法: */ $&'
        );
        
        return code;
    },
    
    // 添加辅助注释
    addHelperComments: function(code) {
        // 如果无法进行实际解密，至少添加注释帮助理解
        var helpText = `
/*
 * SOJSON v7 / jsjiami.com.v7 代码结构分析:
 * 
 * 1. 首行通常定义了一个version_变量，指示混淆版本
 * 2. 存在一个主解码函数(如_0x1fca)，负责解密字符串
 * 3. 存在一个字符串数组生成函数(如_0x46b1)
 * 4. 索引偏移通常在0x18f左右
 * 5. 特征函数名: _0x46b1, _0x1fca, gsMCfG 等
 * 
 * 此文件未能成功解密，可能需要更高级的解密方法
 */

`;
        return helpText + code;
    },
    
    // 辅助函数：转义正则表达式特殊字符
    escapeRegExp: function(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};

// 创建用户界面
function createUI() {
    // 如果已经存在UI则不再创建
    if (document.getElementById('sojson-deobfuscator-ui')) {
        return;
    }
    
    // 创建浮动按钮
    var button = document.createElement('button');
    button.id = 'sojson-deobfuscator-ui';
    button.textContent = '🔓 SOJSON解密';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 15px;
        background-color: #4a6ee0;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    // 创建对话框
    var dialog = document.createElement('div');
    dialog.id = 'sojson-deobfuscator-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 800px;
        max-width: 90%;
        max-height: 90vh;
        background-color: white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border-radius: 8px;
        z-index: 10001;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: Arial, sans-serif;
    `;
    
    // 创建对话框头部
    var dialogHeader = document.createElement('div');
    dialogHeader.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background-color: #4a6ee0;
        color: white;
    `;
    dialogHeader.innerHTML = `
        <h2 style="margin: 0; font-size: 18px;">SOJSON v7 解密工具</h2>
        <button id="close-dialog-btn" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
    `;
    
    // 创建对话框内容
    var dialogContent = document.createElement('div');
    dialogContent.style.cssText = `
        padding: 15px;
        overflow-y: auto;
        flex-grow: 1;
    `;
    dialogContent.innerHTML = `
        <div style="margin-bottom: 15px;">
            <label for="input-code" style="display: block; margin-bottom: 5px; font-weight: bold;">混淆代码:</label>
            <textarea id="input-code" style="width: 100%; height: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; resize: vertical;"></textarea>
        </div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <button id="decrypt-btn" style="background-color: #4a6ee0; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">解密</button>
            <button id="clear-btn" style="background-color: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">清空</button>
            <button id="copy-btn" style="background-color: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">复制结果</button>
            <button id="download-btn" style="background-color: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">下载结果</button>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label for="output-code" style="display: block; margin-bottom: 5px; font-weight: bold;">解密结果:</label>
            <textarea id="output-code" style="width: 100%; height: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; resize: vertical;" readonly></textarea>
        </div>
        
        <div>
            <div style="font-weight: bold; margin-bottom: 5px;">日志:</div>
            <div id="log-container" style="height: 100px; overflow-y: auto; background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px;"></div>
        </div>
    `;
    
    // 组装对话框
    dialog.appendChild(dialogHeader);
    dialog.appendChild(dialogContent);
    
    // 添加到页面
    document.body.appendChild(button);
    document.body.appendChild(dialog);
    
    // 显示/隐藏对话框
    button.addEventListener('click', function() {
        dialog.style.display = 'flex';
    });
    
    // 关闭对话框
    document.getElementById('close-dialog-btn').addEventListener('click', function() {
        dialog.style.display = 'none';
    });
    
    // 日志函数
    function log(message, type = 'info') {
        var logContainer = document.getElementById('log-container');
        var logEntry = document.createElement('div');
        logEntry.style.color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'black';
        logEntry.textContent = message;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    // 解密按钮
    document.getElementById('decrypt-btn').addEventListener('click', function() {
        var inputCode = document.getElementById('input-code').value;
        var outputCode = document.getElementById('output-code');
        var logContainer = document.getElementById('log-container');
        
        // 清空日志
        logContainer.innerHTML = '';
        
        if (!inputCode.trim()) {
            log('请输入要解密的代码', 'error');
            return;
        }
        
        // 拦截控制台日志
        var originalConsoleLog = console.log;
        var originalConsoleError = console.error;
        
        console.log = function() {
            var args = Array.from(arguments).join(' ');
            log(args);
            originalConsoleLog.apply(console, arguments);
        };
        
        console.error = function() {
            var args = Array.from(arguments).join(' ');
            log(args, 'error');
            originalConsoleError.apply(console, arguments);
        };
        
        try {
            log('开始解密...', 'info');
            var result = window.DecodePlugins.sojsonv7.plugin(inputCode);
            outputCode.value = result;
            log('解密完成', 'success');
        } catch (e) {
            log('解密过程中出错: ' + e.message, 'error');
        } finally {
            // 恢复控制台函数
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
        var outputCode = document.getElementById('output-code');
        
        if (!outputCode.value.trim()) {
            log('没有内容可复制', 'error');
            return;
        }
        
        outputCode.select();
        document.execCommand('copy');
        log('已复制到剪贴板', 'success');
    });
    
    // 下载按钮
    document.getElementById('download-btn').addEventListener('click', function() {
        var outputCode = document.getElementById('output-code').value;
        
        if (!outputCode.trim()) {
            log('没有内容可下载', 'error');
            return;
        }
        
        var blob = new Blob([outputCode], {type: 'application/javascript'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'deobfuscated.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        log('文件已下载', 'success');
    });
    
    // 支持拖拽文件
    var inputCodeElement = document.getElementById('input-code');
    
    inputCodeElement.addEventListener('dragover', function(e) {
        e.preventDefault();
        inputCodeElement.style.borderColor = '#4a6ee0';
    });
    
    inputCodeElement.addEventListener('dragleave', function() {
        inputCodeElement.style.borderColor = '#ddd';
    });
    
    inputCodeElement.addEventListener('drop', function(e) {
        e.preventDefault();
        inputCodeElement.style.borderColor = '#ddd';
        
        if (e.dataTransfer.files.length > 0) {
            var file = e.dataTransfer.files[0];
            
            if (!file.name.endsWith('.js')) {
                log('请选择JavaScript文件(.js)', 'error');
                return;
            }
            
            var reader = new FileReader();
            reader.onload = function(e) {
                inputCodeElement.value = e.target.result;
                log('文件已加载: ' + file.name, 'success');
            };
            reader.onerror = function() {
                log('读取文件出错', 'error');
            };
            reader.readAsText(file);
        }
    });
}

// 页面加载完成后创建UI
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
} else {
    setTimeout(createUI, 100);
}

console.log("SOJSON v7解密插件(增强版)加