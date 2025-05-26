// JSJiami.com.v5 混淆代码解密插件
const { parse } = require('@babel/parser');
const _generate = require('@babel/generator');
const generator = _generate.default;
const _traverse = require('@babel/traverse');
const traverse = _traverse.default;
const t = require('@babel/types');

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