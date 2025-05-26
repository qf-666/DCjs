// Common通用解密插件 - 作为最后的备选方案
console.log("Common解密插件加载中...");

if(!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.common = {
    detect: function(code) {
        // 通用插件总是返回true，因为它是最后的备选方案
        return true;
    },
    
    plugin: function(code) {
        try {
            console.log("开始通用代码处理");
            
            // 如果代码长度太短，直接返回
            if (!code || code.length < 50) {
                return code;
            }
            
            // 1. 处理基本编码和转义
            code = this.decodeBasicEncodings(code);
            
            // 2. 移除死代码和无用注释
            code = this.removeDeadCode(code);
            
            // 3. 尝试简化常见的混淆模式
            code = this.simplifyCommonPatterns(code);
            
            console.log("通用代码处理完成");
            return code;
        } catch (e) {
            console.error("通用解密错误:", e);
            return code; // 出错时返回原始代码
        }
    },
    
    // 解码基本编码和转义序列
    decodeBasicEncodings: function(code) {
        var result = code;
        
        // 解码十六进制字符串
        result = result.replace(/\\x([0-9A-Fa-f]{2})/g, function(match, p1) {
            try {
                return String.fromCharCode(parseInt(p1, 16));
            } catch (e) {
                return match;
            }
        });
        
        // 解码Unicode转义序列
        result = result.replace(/\\u([0-9a-fA-F]{4})/g, function(match, grp) {
            try {
                return String.fromCharCode(parseInt(grp, 16));
            } catch (e) {
                return match;
            }
        });
        
        // 处理字符串连接
        result = result.replace(/(['"])([^'"]*)\1\s*\+\s*(['"])([^'"]*)\3/g, function(match, q1, s1, q3, s2) {
            return q1 + s1 + s2 + q1;
        });
        
        return result;
    },
    
    // 移除死代码和无用注释
    removeDeadCode: function(code) {
        var result = code;
        
        // 移除典型的混淆注释
        result = result.replace(/\/\*(?:.|\n)*?\*\//g, '');
        
        // 移除空函数
        result = result.replace(/function\s+(_0x[a-f0-9]+)\s*\(\)\s*\{\s*\}/g, '');
        
        return result;
    },
    
    // 简化常见混淆模式
    simplifyCommonPatterns: function(code) {
        var result = code;
        
        // 替换永真条件
        result = result.replace(/if\s*\(true\)\s*\{([\s\S]*?)\}\s*else\s*\{[\s\S]*?\}/g, '$1');
        
        // 替换永假条件
        result = result.replace(/if\s*\(false\)\s*\{[\s\S]*?\}\s*else\s*\{([\s\S]*?)\}/g, '$1');
        
        // 简化数组索引
        result = result.replace(/\[\s*(['"])([^'"]*)\1\s*\]/g, '.$2');
        
        return result;
    }
};

console.log("Common解密插件加载完成");