/**
 * JSJiami.com.v5 混淆代码解密插件
 * 适用于JSJiami v5版本的混淆代码解密
 */

// 导出解密函数
module.exports = function(code) {
    // 如果不是JSJiami v5混淆代码，直接返回
    if (!code || typeof code !== 'string' || !isJSJiamiV5(code)) {
        return code;
    }
    
    console.log("开始解密JSJiami.com.v5混淆代码");
    
    try {
        // 1. 首先解码十六进制和Unicode编码的字符串
        code = decodeHexStrings(code);
        
        // 2. 处理字符串数组
        code = decodeStringArrays(code);
        
        // 3. 移除自解密回调
        code = removeSelfDecrypt(code);
        
        // 4. 清理无用代码
        code = cleanupCode(code);
        
        console.log("JSJiami.com.v5代码解密完成");
        return code;
    } catch (e) {
        console.error("JSJiami.com.v5解密错误:", e);
        return code; // 出错时返回原始代码
    }
};

/**
 * 检测是否为JSJiami v5混淆代码
 * @param {string} code - 要检测的代码
 * @returns {boolean} - 是否为JSJiami v5混淆代码
 */
function isJSJiamiV5(code) {
    // 检查JSJiami v5特有的特征字符串
    if (code.indexOf("jsjiami.com.v5") !== -1 || 
        code.indexOf("encode_version") !== -1) {
        return true;
    }
    
    // 检查JSJiami常用的变量命名模式
    if (/_0x[a-f0-9]{4,6}/.test(code) && 
        code.indexOf('\\x') !== -1 && 
        code.indexOf('var _0x') !== -1) {
        return true;
    }
    
    return false;
}

/**
 * 解码十六进制和Unicode编码的字符串
 * @param {string} code - 混淆的代码
 * @returns {string} - 解码后的代码
 */
function decodeHexStrings(code) {
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
}

/**
 * 处理字符串数组
 * @param {string} code - 混淆的代码
 * @returns {string} - 解码后的代码
 */
function decodeStringArrays(code) {
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
        } catch (e) {
            console.error("处理字符串数组时出错:", e);
        }
    }
    
    return code;
}

/**
 * 移除自解密回调
 * @param {string} code - 混淆的代码
 * @returns {string} - 处理后的代码
 */
function removeSelfDecrypt(code) {
    // 移除可能的自解密回调
    code = code.replace(/;\(function\(_0x[a-f0-9]{4,6},_0x[a-f0-9]{4,6}\)\{[^}]+}\);/g, '');
    return code;
}

/**
 * 清理无用代码
 * @param {string} code - 混淆的代码
 * @returns {string} - 清理后的代码
 */
function cleanupCode(code) {
    // 移除JSJiami特有的版本标记
    code = code.replace(/;\s*encode_version\s*=\s*['"]jsjiami\.com\.v5['"];?/g, '');
    
    // 移除空语句
    code = code.replace(/;;/g, ';');
    
    return code;
}