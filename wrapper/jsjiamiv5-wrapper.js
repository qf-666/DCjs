// 极简JSJiami插件
module.exports = function(code) {
    console.log("JSJiami插件被调用了!");
    
    // 仅进行最基础的解码测试
    code = code.replace(/\\x([0-9a-fA-F]{2})/g, function(match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
    });
    
    code = code.replace(/encode_version\s*=\s*['"]jsjiami\.com\.v5['"];?/g, '// 已检测到JSJiami.v5');
    
    return code;
};