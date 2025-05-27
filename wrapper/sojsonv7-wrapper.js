// SOJSON v5/v7 通用解密插件
console.log("SOJSON v5/v7 通用解密插件加载中...");

if(!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.sojson = {
    detect: function(code) {
        if (!code || typeof code !== 'string') return false;
        
        // 检测jsjiami.com.v5或v7特征
        return code.indexOf('jsjiami.com.v5') !== -1 || 
               code.indexOf('jsjiami.com.v7') !== -1 || 
               (code.indexOf('_0x') !== -1 && 
                code.indexOf('function _0x') !== -1);
    },
    
    detectVersion: function(code) {
        if (code.indexOf('jsjiami.com.v5') !== -1) {
            return 5;
        } else if (code.indexOf('jsjiami.com.v7') !== -1) {
            return 7;
        } else if (code.indexOf('_0x') !== -1 && code.indexOf('function _0x') !== -1) {
            // 尝试猜测版本
            if (code.indexOf('encode_version') !== -1) {
                return 5;
            } else {
                return 7;
            }
        }
        return 0;
    },
    
    plugin: function(code) {
        try {
            if (!this.detect(code)) {
                return code;
            }
            
            var version = this.detectVersion(code);
            console.log("检测到SOJSON v" + version + "加密代码");
            
            // 备份原始代码以检测是否有变化
            var originalCode = code;
            
            if (version === 5) {
                code = this.decodeV5(code);
            } else {
                code = this.decodeV7(code);
            }
            
            // 检测代码是否有变化
            if (code === originalCode) {
                console.log("SOJSON代码没有变化，可能需要更高级的解密方法");
                code = this.addHelperComments(code, version);
            } else {
                console.log("SOJSON代码解密成功");
            }
            
            // 添加解密标记
            var timestamp = new Date().toLocaleString();
            code = "/*\n * SOJSON v" + version + " 解密结果\n * 解密时间: " + timestamp + "\n */\n\n" + code;
            
            return code;
        } catch (e) {
            console.error("SOJSON解密错误:", e);
            // 出错时返回原始代码
            return code;
        }
    },
    
    // 解密v5版本代码
    decodeV5: function(code) {
        console.log("开始解密SOJSON v5代码...");
        
        // 1. 处理十六进制字符串
        code = this.decodeHexStrings(code);
        
        // 2. 处理encode_version
        code = code.replace(/var\s+encode_version\s*=\s*['"]jsjiami\.com\.v5['"]/g, 
            "var encode_version = 'jsjiami.com.v5' /* 已处理 */");
        
        // 3. 尝试提取并替换字符串数组
        var stringArrayInfo = this.extractStringArrayV5(code);
        if (stringArrayInfo.array && stringArrayInfo.array.length > 0) {
            code = this.replaceStringArrayReferencesV5(code, stringArrayInfo);
        }
        
        // 4. 清理代码
        code = this.cleanCode(code);
        
        return code;
    },
    
    // 解密v7版本代码
    decodeV7: function(code) {
        console.log("开始解密SOJSON v7代码...");
        
        // 1. 解码十六进制字符串
        code = this.decodeHexStrings(code);
        
        // 2. 提取字符串数组
        var stringArrayInfo = this.extractStringArrayV7(code);
        
        // 3. 定位并分析_0x46b1函数
        var _0x46b1Info = this.analyze_0x46b1Function(code);
        
        // 4. 替换字符串引用
        if (stringArrayInfo.array && stringArrayInfo.array.length > 0) {
            code = this.replaceStringArrayReferencesV7(code, stringArrayInfo, _0x46b1Info);
        }
        
        // 5. 清理代码
        code = this.cleanCode(code);
        
        return code;
    },
    
    // 解码十六进制字符串（通用）
    decodeHexStrings: function(code) {
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
    
    // 提取v5版本的字符串数组
    extractStringArrayV5: function(code) {
        var result = {
            found: false,
            varName: null,
            array: null
        };
        
        // 寻找类似 var _0x1230b8 = [...] 的模式
        var arrayMatch = code.match(/var\s+(_0x[a-f0-9]+)\s*=\s*\[((?:'[^']*'|"[^"]*"|`[^`]*`|\s*,\s*)*)\]/);
        
        if (arrayMatch) {
            result.found = true;
            result.varName = arrayMatch[1]; // 变量名，如 _0x1230b8
            
            try {
                var arrayStr = "[" + arrayMatch[2] + "]";
                // 安全地求值数组字符串
                var array = new Function("return " + arrayStr)();
                result.array = array;
                console.log("成功提取v5字符串数组，包含 " + array.length + " 项");
            } catch (e) {
                console.log("提取v5字符串数组失败:", e);
            }
        }
        
        return result;
    },
    
    // 替换v5版本字符串数组引用
    replaceStringArrayReferencesV5: function(code, stringArrayInfo) {
        if (!stringArrayInfo.found || !stringArrayInfo.array) {
            return code;
        }
        
        var array = stringArrayInfo.array;
        var varName = stringArrayInfo.varName;
        
        // 替换直接数组引用，如 _0x1230b8[0]
        for (var i = 0; i < array.length; i++) {
            if (typeof array[i] === 'string') {
                var pattern = new RegExp(varName + '\\s*\\[\\s*' + i + '\\s*\\]', 'g');
                code = code.replace(pattern, "'" + array[i].replace(/'/g, "\\'") + "'");
            }
        }
        
        return code;
    },
    
    // 提取v7版本的字符串数组
    extractStringArrayV7: function(code) {
        var result = {
            found: false,
            name: null,
            array: null
        };
        
        // 正则表达式以查找定义数组的地方
        var arrayMatch = code.match(/function\s+(_0x[a-f0-9]+)\s*\(\s*\)\s*\{\s*var\s+(_0x[a-f0-9]+)\s*=\s*\[\s*((?:'[^']*'|"[^"]*"|`[^`]*`|\s*,\s*)*)\s*\]/);
        
        if (arrayMatch) {
            result.found = true;
            result.name = arrayMatch[1]; // 函数名，通常是 _0x46b1
            
            try {
                var arrayStr = "[" + arrayMatch[3] + "]";
                // 安全地求值数组字符串
                var array = new Function("return " + arrayStr)();
                result.array = array;
                console.log("成功提取v7字符串数组，包含 " + array.length + " 项");
            } catch (e) {
                console.log("提取v7字符串数组失败:", e);
            }
        }
        
        return result;
    },
    
    // 分析 _0x46b1 函数 (v7版本)
    analyze_0x46b1Function: function(code) {
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
            }
        }
        
        return result;
    },
    
    // 替换v7版本字符串数组引用
    replaceStringArrayReferencesV7: function(code, stringArrayInfo, _0x46b1Info) {
        if (!stringArrayInfo.found || !stringArrayInfo.array || !_0x46b1Info.found) {
            return code;
        }
        
        var array = stringArrayInfo.array;
        var baseOffset = _0x46b1Info.baseOffset || 0x18f; // 默认偏移值
        
        // 替换直接数组引用，如 _0x46b1[0]
        for (var i = 0; i < array.length; i++) {
            if (typeof array[i] === 'string') {
                var pattern = new RegExp(stringArrayInfo.name + '\\s*\\[\\s*' + i + '\\s*\\]', 'g');
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
                }
            } catch (e) {
                console.log("替换函数调用时出错:", e);
            }
        }
        
        return code;
    },
    
    // 清理代码
    cleanCode: function(code) {
        // 移除多余的注释和空行
        code = code.replace(/\/\*\s*\*\//g, '');
        code = code.replace(/\n{3,}/g, '\n\n');
        
        return code;
    },
    
    // 添加辅助注释
    addHelperComments: function(code, version) {
        // 如果无法进行实际解密，至少添加注释帮助理解
        var helpText = '';
        
        if (version === 5) {
            helpText = `
/*
 * SOJSON v5 / jsjiami.com.v5 代码结构分析:
 * 
 * 1. 通常包含 encode_version = 'jsjiami.com.v5' 标记
 * 2. 通常有一个字符串数组，如 var _0x1230b8 = [...]
 * 3. 使用 _0x1230b8[index] 引用字符串
 * 
 * 此文件未能完全解密，可能需要更高级的解密方法
 */
`;
        } else {
            helpText = `
/*
 * SOJSON v7 / jsjiami.com.v7 代码结构分析:
 * 
 * 1. 首行通常定义了一个version_变量，指示混淆版本
 * 2. 存在一个主解码函数(如_0x1fca)，负责解密字符串
 * 3. 存在一个字符串数组生成函数(如_0x46b1)
 * 4. 索引偏移通常在0x18f左右
 * 
 * 此文件未能完全解密，可能需要更高级的解密方法
 */
`;
        }
        
        return helpText + code;
    },
    
    // 辅助函数：转义正则表达式特殊字符
    escapeRegExp: function(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};

// 创建最简单的UI
(function() {
    try {
        // 简单的按钮
        var btn = document.createElement('button');
        btn.textContent = '解密SOJSON';
        btn.style.position = 'fixed';
        btn.style.bottom = '10px';
        btn.style.right = '10px';
        btn.style.zIndex = '9999';
        btn.style.backgroundColor = '#4285f4';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.padding = '8px 12px';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        
        // 添加按钮到页面
        document.body.appendChild(btn);
        
        // 点击按钮显示输入框
        btn.onclick = function() {
            var code = prompt('请粘贴需要解密的SOJSON v5/v7代码:');
            if (code) {
                try {
                    var result = window.DecodePlugins.sojson.plugin(code);
                    var resultWindow = window.open('', '_blank');
                    resultWindow.document.write('<pre>' + result.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>');
                    resultWindow.document.title = 'SOJSON解密结果';
                    alert('解密完成，结果已在新窗口中打开');
                } catch (e) {
                    alert('解密出错: ' + e.message);
                }
            }
        };
    } catch (e) {
        console.error("创建UI失败:", e);
        // UI创建失败时，添加全局函数
        window.decodeSojson = function(code) {
            return window.DecodePlugins.sojson.plugin(code);
        };
        console.log("已添加全局函数 decodeSojson() 可以直接在控制台调用");
    }
})();

console.log("SOJSON v5/v7 通用解密插件加载完成");