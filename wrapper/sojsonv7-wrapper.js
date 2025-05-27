console.log("SOJSON v7解密插件(增强版-Web)加载中...");

if (!window.DecodePlugins) {
    window.DecodePlugins = {};
}

window.DecodePlugins.sojsonv7 = {
    detect(code) {
        return (
            typeof code === 'string' &&
            (code.includes('jsjiami.com.v7') ||
             code.includes('jsjiami.com.v5') ||
             (code.includes('_0x') && code.includes('function _0x')))
        );
    },

    plugin(code) {
        try {
            if (!this.detect(code)) return code;

            console.log("SOJSON v7检测成功，开始解密...");

            const arrayInfo = this.extractHexArray(code);
            if (!arrayInfo.found) {
                console.warn("未找到混淆数组，跳过还原。");
                return code;
            }

            const { name, array, raw } = arrayInfo;

            // 替换函数调用（如 _0x123(0x1a) => 对应的解码值）
            const replacedCode = code.replace(
                new RegExp(name + `\$begin:math:text$(0x[0-9a-fA-F]+)\\$end:math:text$`, 'g'),
                (_, hex) => {
                    const index = parseInt(hex, 16);
                    return JSON.stringify(array[index] || '');
                }
            );

            // 可选：去除原始数组定义和函数
            const cleaned = replacedCode.replace(raw, '/* 字符串数组已解密并替换 */');

            return `/* 解密成功: SOJSON v7 - ${new Date().toLocaleString()} */\n\n` + cleaned;

        } catch (e) {
            return `/* 解密错误: ${e.message} */\n\n` + code;
        }
    },

    extractHexArray(code) {
        const result = {
            found: false,
            name: null,
            array: [],
            raw: ''
        };

        // 尝试匹配数组函数（_0x123=function(){...;var _0x456=['\x61\x62',...]; return _0x456; })
        const match = code.match(/var\s+(\w+)\s*=\s*\[\s*((?:'\\x[a-fA-F0-9]+'(?:\s*,\s*)?)*)\s*\]/);
        if (!match) return result;

        const nameMatch = code.match(/function\s+(\w+)\s*\(\w+\)\s*\{\s*return\s+\1\[\w+\];?\s*\}/);
        const name = nameMatch ? nameMatch[1] : null;

        const rawArrayString = match[2];
        const array = rawArrayString.split(/,\s*/).map(s => {
            try {
                return decodeURIComponent(s.trim().slice(1, -1).replace(/\\x/g, '%'));
            } catch (e) {
                return s;
            }
        });

        result.found = true;
        result.name = name || match[1];
        result.array = array;
        result.raw = match[0];
        return result;
    }
};