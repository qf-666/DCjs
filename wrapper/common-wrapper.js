// JSJiami.com.v5混淆解密插件
console.log("JSJiami.com.v5解密插件加载中...");

if(!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.jsjiami = {
    detect: function(code) {
        if (!code || typeof code !== 'string') return false;
        
        // 检测JSJiami特征
        return code.indexOf('jsjiami.com.v5') !== -1 || 
               code.indexOf('encode_version') !== -1 || 
               (code.indexOf('_0x') !== -1 && code.indexOf('\\x') !== -1);
    },
    
    plugin: function(code) {
        try {
            if (!this.detect(code)) {
                return code;
            }
            
            console.log("开始处理JSJiami.com.v5混淆代码");
            
            // 解码十六进制字符串
            code = code.replace(/\\x([0-9A-Fa-f]{2})/g, function(match, p1) {
                try {
                    return String.fromCharCode(parseInt(p1, 16));
                } catch (e) {
                    return match;
                }
            });
            
            // 解码Unicode转义序列
            code = code.replace(/\\u([0-9a-fA-F]{4})/g, function(match, grp) {
                return String.fromCharCode(parseInt(grp, 16));
            });
            
            // 移除JSJiami标记
            code = code.replace(/;\s*encode_version\s*=\s*['"]jsjiami\.com\.v5['"];?/g, '');
            
            console.log("JSJiami.com.v5代码处理完成");
            return code;
        } catch (e) {
            console.error("JSJiami.com.v5解密错误:", e);
            return code; // 出错时返回原始代码
        }
    }
};

console.log("JSJiami.com.v5解密插件加载完成");