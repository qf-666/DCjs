<<<<<<< main
// Common通用解密插件 - 作为最后的备选方案
console.log("Common解密插件加载中...");
=======
// JSJiami.com.v5 混淆代码解密插件
const { parse } = require('@babel/parser');
const _generate = require('@babel/generator');
const generator = _generate.default;
const _traverse = require('@babel/traverse');
const traverse = _traverse.default;
const t = require('@babel/types');
>>>>>>> origin/main

/**
 * 检测是否为JSJiami v5混淆代码
 * @param {string} code - 要检测的代码
 * @returns {boolean} - 是否为JSJiami v5混淆代码
 */
function detect(code) {
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

<<<<<<< main
window.DecodePlugins.common = {
    detect: function(code) {
        // 通用插件总是返回true，因为它是最后的备选方案
        return true;
    },
=======
/**
 * 解码JSJiami v5混淆代码
 * @param {string} code - 混淆的代码
 * @returns {string} - 解密后的代码
 */
function deobfuscate(code) {
    try {
        // 首先解码字符串中的十六进制和Unicode编码
        code = decodeHexStrings(code);
        
        // 解析AST
        let ast;
        try {
            ast = parse(code, { 
                errorRecovery: true,
                sourceType: "module",
                plugins: ["jsx", "typescript", "classProperties"]
            });
        } catch (e) {
            console.error(`解析代码时出错: ${e.message}`);
            // 如果解析失败，返回部分解码的代码
            return code;
        }
        
        // 处理字符串数组
        decodeStringArrays(ast);
        
        // 清理调试保护
        removeDebugProtection(ast);
        
        // 清理无用代码
        cleanupCode(ast);
        
        // 生成代码
        const result = generator(ast, {
            comments: false,
            jsescOption: { minimal: true }
        }).code;
        
        // 移除JSJiami特有的版本标记
        return result.replace(/;\s*encode_version\s*=\s*['"]jsjiami\.com\.v5['"];?/g, '');
    } catch (e) {
        console.error(`解密过程中出错: ${e.message}`);
        return code; // 出错时返回部分解码的代码
    }
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
>>>>>>> origin/main
    
    // 解码Unicode转义序列
    code = code.replace(/\\u([0-9a-fA-F]{4})/g, function(match, p1) {
        try {
<<<<<<< main
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
=======
            return String.fromCharCode(parseInt(p1, 16));
        } catch (e) {
            return match;
>>>>>>> origin/main
        }
    });
    
<<<<<<< main
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
=======
    return code;
}

/**
 * 处理字符串数组
 * @param {Object} ast - AST树
 */
function decodeStringArrays(ast) {
    // 收集字符串数组定义
    const stringArrays = new Map();
    
    traverse(ast, {
        VariableDeclarator(path) {
            const { id, init } = path.node;
            
            // 检查是否是数组定义 var _0x1234 = ['a', 'b', 'c', ...];
            if (t.isIdentifier(id) && 
                t.isArrayExpression(init) && 
                id.name.startsWith('_0x') && 
                init.elements.length > 0) {
                
                // 确保所有元素都是字符串字面量
                const allStrings = init.elements.every(el => 
                    t.isStringLiteral(el) || t.isNullLiteral(el) || el === null
                );
                
                if (allStrings) {
                    // 收集数组元素
                    const elements = init.elements.map(el => 
                        el && t.isStringLiteral(el) ? el.value : null
                    );
                    
                    stringArrays.set(id.name, {
                        elements,
                        path
                    });
                    
                    console.log(`找到字符串数组: ${id.name} (${elements.length}项)`);
                }
            }
        }
    });
    
    // 替换字符串数组引用
    if (stringArrays.size > 0) {
        traverse(ast, {
            MemberExpression(path) {
                if (path.node.computed && 
                    t.isIdentifier(path.node.object) && 
                    stringArrays.has(path.node.object.name)) {
                    
                    const arrayName = path.node.object.name;
                    const array = stringArrays.get(arrayName);
                    
                    // 检查属性是否是数字字面量
                    if (t.isNumericLiteral(path.node.property)) {
                        const index = path.node.property.value;
                        if (index >= 0 && index < array.elements.length && array.elements[index] !== null) {
                            // 替换为字符串字面量
                            path.replaceWith(t.stringLiteral(array.elements[index]));
                        }
                    }
                }
            }
        });
        
        // 查找并处理字符串数组的移位操作
        traverse(ast, {
            CallExpression(path) {
                if (t.isMemberExpression(path.node.callee) && 
                    t.isIdentifier(path.node.callee.property, { name: 'push' }) &&
                    t.isIdentifier(path.node.callee.object) && 
                    stringArrays.has(path.node.callee.object.name)) {
                    
                    // 检查是否是数组移位操作 _0x1234.push(_0x1234.shift());
                    if (path.node.arguments.length === 1 && 
                        t.isCallExpression(path.node.arguments[0]) && 
                        t.isMemberExpression(path.node.arguments[0].callee) && 
                        t.isIdentifier(path.node.arguments[0].callee.property, { name: 'shift' }) &&
                        t.isIdentifier(path.node.arguments[0].callee.object) && 
                        path.node.arguments[0].callee.object.name === path.node.callee.object.name) {
                        
                        // 找到了移位操作，移除它
                        if (path.parentPath.isExpressionStatement()) {
                            path.parentPath.remove();
                        } else {
                            path.remove();
                        }
                    }
                }
            }
        });
        
        // 移除未使用的字符串数组
        for (const [name, info] of stringArrays) {
            const binding = info.path.scope.getBinding(name);
            if (binding && binding.referenced === false) {
                info.path.remove();
            }
        }
    }
}

/**
 * 移除调试保护
 * @param {Object} ast - AST树
 */
function removeDebugProtection(ast) {
    // 移除无限调试器循环
    traverse(ast, {
        FunctionDeclaration(path) {
            const { id, body } = path.node;
            if (!id || !t.isIdentifier(id)) return;
            
            const bodyStatements = body.body;
            
            // 检查是否包含 debugger 语句
            const hasDebugger = bodyStatements.some(stmt => t.isDebuggerStatement(stmt));
            
            if (hasDebugger) {
                // 检查是否有自调用
                const hasSelfCall = bodyStatements.some(stmt => {
                    if (t.isExpressionStatement(stmt) && 
                        t.isCallExpression(stmt.expression) && 
                        t.isIdentifier(stmt.expression.callee, { name: id.name })) {
                        return true;
                    }
                    return false;
                });
                
                if (hasSelfCall) {
                    console.log(`移除调试器保护函数: ${id.name}`);
                    path.remove();
                }
            }
        },
        
        // 移除单独的debugger语句
        DebuggerStatement(path) {
            path.remove();
        }
    });
}

/**
 * 清理无用代码
 * @param {Object} ast - AST树
 */
function cleanupCode(ast) {
    // 移除空语句
    traverse(ast, {
        EmptyStatement(path) {
            path.remove();
        }
    });
    
    // 移除未使用的变量
    traverse(ast, {
        VariableDeclarator(path) {
            const { id } = path.node;
            if (!t.isIdentifier(id)) return;
            
            const binding = path.scope.getBinding(id.name);
            if (binding && binding.referenced === false) {
                if (path.parentPath.node.declarations.length === 1) {
                    path.parentPath.remove();
                } else {
                    path.remove();
                }
            }
        }
    });
    
    // 尝试移除JSJiami特有的自解密回调
    traverse(ast, {
        ExpressionStatement(path) {
            if (t.isCallExpression(path.node.expression) && 
                t.isFunctionExpression(path.node.expression.callee) && 
                path.node.expression.arguments.length > 0) {
                
                const func = path.node.expression.callee;
                
                // 检查是否可能是JSJiami的自解密回调
                if (func.params.length === 2 && 
                    func.params.every(p => t.isIdentifier(p) && p.name.startsWith('_0x'))) {
                    
                    // 查看函数体中是否包含eval或类似操作
                    const funcBody = generator(func.body).code;
                    if (funcBody.includes('eval') || 
                        funcBody.includes('Function') || 
                        funcBody.includes('encode_version')) {
                        
                        console.log('移除JSJiami自解密回调');
                        path.remove();
                    }
                }
            }
        }
    });
}

/**
 * 主解密函数
 * @param {string} code - 混淆的代码
 * @returns {string} - 解密后的代码
 */
module.exports = function(code) {
    if (!code || typeof code !== 'string') {
        return code;
    }
    
    // 检测是否为JSJiami v5混淆代码
    if (!detect(code)) {
        return code;
    }
    
    console.log("开始解密JSJiami.com.v5混淆代码");
    
    try {
        const result = deobfuscate(code);
        console.log("JSJiami.com.v5解密完成");
        return result;
    } catch (e) {
        console.error(`JSJiami.com.v5解密失败: ${e.message}`);
        return code; // 出错时返回原始代码
    }
};
>>>>>>> origin/main
