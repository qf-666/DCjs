// AWSC混淆解密插件
console.log("AWSC解密插件加载中...");

if(!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.awsc = {
    detect: function(code) {
        if (!code || typeof code !== 'string') return false;
        
        // 检测AWSC特征 - 阿里安全AWSC特征
        return code.indexOf('AWSC') !== -1 && 
               code.indexOf('umidToken') !== -1;
    },
    
    plugin: function(code) {
        try {
            if (!this.detect(code)) {
                return code;
            }
            
            console.log("开始处理AWSC混淆代码");
            
            // 处理AWSC特定的混淆模式
            // 1. 解码十六进制字符串
            code = code.replace(/\\x([0-9A-Fa-f]{2})/g, function(match, p1) {
                try {
                    return String.fromCharCode(parseInt(p1, 16));
                } catch (e) {
                    return match;
                }
            });
            
            // 2. 处理Unicode转义序列
            code = code.replace(/\\u([0-9a-fA-F]{4})/g, function(match, grp) {
                return String.fromCharCode(parseInt(grp, 16));
            });
            
            // 3. 处理AWSC特定函数和变量
            var awscPatterns = [
                [/"umidToken"\s*:\s*"([^"]+)"/g, function(match, token) {
                    return match + " /* UMID令牌 */";
                }],
                [/"x_k"\s*:\s*"([^"]+)"/g, function(match, xk) {
                    return match + " /* 加密密钥 */";
                }]
            ];
            
            for (var i = 0; i < awscPatterns.length; i++) {
                var pattern = awscPatterns[i][0];
                var replacement = awscPatterns[i][1];
                code = code.replace(pattern, replacement);
            }
            
            console.log("AWSC代码处理完成");
            return code;
        } catch (e) {
            console.error("AWSC解密错误:", e);
            return code; // 出错时返回原始代码
        }
    }
};

console.log("AWSC解密插件加载完成");