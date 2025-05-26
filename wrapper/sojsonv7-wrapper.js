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
                code.indexOf('_0x46b1') !== -1);
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
            
            // 阶段7: 清理代码
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
                console.log("成功提取字符串数组，包含 " + array.length + " 项");
            } catch (e) {
                console.log("提取字符串数组失败:", e);
            }
        }
        
        return result;
    },
    
    // 分析 _0x46b1 函数
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
            }
        }
        
        return result;
    },
    
    // 分析主解码函数
    analyzeMainDecoder: function(code) {
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
        
        // eslint-disable-next-line no-cond-assign
        while (match = funcCallPattern.exec(code)) {
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
    
    // 替换解码函数调用
    replaceDecoderCalls: function(code, decoderInfo, _0x46b1Info) {
        if (!decoderInfo.found || !_0x46b1Info.found) {
            return code;
        }
        
        // 解码函数调用模式，如 _0x1fca(a, b)
        var decoderCallPattern = new RegExp(decoderInfo.name + '\\s*\\(\\s*([^,]+)\\s*,\\s*([^)]+)\\s*\\)', 'g');
        var match;
        
        // eslint-disable-next-line no-cond-assign
        while (match = decoderCallPattern.exec(code)) {
            try {
                var fullMatch = match[0];
                var comment = " /* 解码函数: " + decoderInfo.name + "(" + match[1] + ", " + match[2] + ") */";
                code = code.replace(new RegExp(this.escapeRegExp(fullMatch), 'g'), fullMatch + comment);
            } catch (e) {
                console.log("添加解码函数注释时出错:", e);
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

console.log("SOJSON v7解密插件(增强版)加载完成");