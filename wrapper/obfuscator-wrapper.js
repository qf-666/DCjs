/**
 * JavaScript-Obfuscator 混淆代码解密插件
 * 支持 javascript-obfuscator 工具混淆的代码
 * https://github.com/javascript-obfuscator/javascript-obfuscator
 */
const { parse } = require('@babel/parser');
const _generate = require('@babel/generator');
const generator = _generate.default;
const _traverse = require('@babel/traverse');
const traverse = _traverse.default;
const t = require('@babel/types');

/**
 * 检测是否为JavaScript-Obfuscator混淆代码
 * @param {string} code - 要检测的代码
 * @returns {boolean} - 是否为JavaScript-Obfuscator混淆代码
 */
function detect(code) {
    // 检查特征字符串和模式
    const patterns = [
        // 全局包装器特征
        /\(function\s*\(\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*,\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*\)\s*\{\s*return\s*function\s*\(\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*,\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*\)/,
        // 自调用函数特征
        /\(function\s*\([a-zA-Z$_][a-zA-Z0-9$_]*(?:\s*,\s*[a-zA-Z$_][a-zA-Z0-9$_]*)*\)\s*\{.*\}\((?:[a-zA-Z$_][a-zA-Z0-9$_]*|\d+|!!\[\]|![01]|true|false)(?:\s*,\s*(?:[a-zA-Z$_][a-zA-Z0-9$_]*|\d+|!!\[\]|![01]|true|false))*\)\)/,
        // 十六进制编码字符串
        /'\\x[0-9a-f]{2}'/i,
        // ASCII编码特征
        /String\.fromCharCode\(\d+(?:\s*,\s*\d+)*\)/,
        // 字符串数组特征
        /var\s+[a-zA-Z$_][a-zA-Z0-9$_]*\s*=\s*\[\s*(['"].*['"])(?:\s*,\s*(['"].*['"]))*\s*\]/,
        // 字符串分割特征
        /\.split\(['"]\\x0*['"]|['"]\|['"]\)/,
        // 常见的字符串解码函数
        /function\s+[a-zA-Z$_][a-zA-Z0-9$_]*\s*\(\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*(?:,\s*[a-zA-Z$_][a-zA-Z0-9$_]*)?\s*\)\s*{\s*(?:var|let|const)\s+[a-zA-Z$_][a-zA-Z0-9$_]*\s*=\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*\.split\(/,
        // 控制流平坦化特征
        /while\(true\)\s*\{\s*(?:var|let|const)\s+[a-zA-Z$_][a-zA-Z0-9$_]*\s*=\s*[a-zA-Z$_][a-zA-Z0-9$_]*\[[a-zA-Z$_][a-zA-Z0-9$_]*\+?\+?\](?:\s*\|\|\s*'')?;?\s*switch\s*\(\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*\)\s*\{/,
        // IIFE模式
        /\(function\(\){.*}\)\(\);/
    ];
    
    // 特定混淆关键词
    const keywords = [
        "_0x", 
        "String['fromCharCode']", 
        "\\x", 
        "0x",
        "\\\\w+",
        "atob\\(",
        "RegExp\\("
    ];
    
    // 检查代码中是否包含混淆关键词
    const keywordRegex = new RegExp(keywords.join("|"), "i");
    if (keywordRegex.test(code)) {
        return true;
    }
    
    // 检查代码中是否匹配混淆模式
    for (const pattern of patterns) {
        if (pattern.test(code)) {
            return true;
        }
    }
    
    // 额外检查：是否存在大量十六进制数字
    const hexCount = (code.match(/\\x[0-9a-f]{2}/gi) || []).length;
    if (hexCount > 10) {
        return true;
    }
    
    return false;
}

/**
 * 解码JavaScript-Obfuscator混淆代码
 * @param {string} code - 混淆的代码
 * @returns {string} - 解密后的代码
 */
function deobfuscate(code) {
    // 如果不是JavaScript-Obfuscator混淆代码，直接返回
    if (!detect(code)) {
        return code;
    }
    
    console.log("开始解密JavaScript-Obfuscator混淆...");
    
    // 解析AST
    let ast;
    try {
        ast = parse(code, { 
            errorRecovery: true,
            sourceType: "module",
            plugins: ["jsx", "typescript", "classProperties", "classPrivateProperties", "classPrivateMethods"]
        });
    } catch (e) {
        console.error(`无法解析代码: ${e.message}`);
        return addHelperComments(code);
    }
    
    // 应用转换步骤
    try {
        // 1. 删除调试保护
        removeDebugProtection(ast);
        
        // 2. 解码字符串数组
        decodeStringArrays(ast);
        
        // 3. 提取十六进制和Unicode编码的字符串
        decodeEncodedStrings(ast);
        
        // 4. 解除控制流平坦化
        unFlattenControlFlow(ast);
        
        // 5. 还原自执行函数
        restoreIIFE(ast);
        
        // 6. 还原对象成员
        restoreObjectProperties(ast);
        
        // 7. 还原ASCII字符编码
        decodeAsciiStrings(ast);
        
        // 8. 计算表达式
        evaluateExpressions(ast);
        
        // 9. 清理和格式化代码
        cleanupCode(ast);
        
        // 生成最终代码
        const deobfuscatedCode = generator(ast, {
            comments: true,
            jsescOption: { minimal: true }
        }).code;
        
        console.log("JavaScript-Obfuscator混淆解密完成");
        return deobfuscatedCode;
        
    } catch (e) {
        console.error(`解密过程中出错: ${e.message}`);
        
        // 尝试生成部分解密的代码
        try {
            const partialCode = generator(ast, { 
                jsescOption: { minimal: true } 
            }).code;
            return addHelperComments(partialCode, e.message);
        } catch (genError) {
            return addHelperComments(code, e.message);
        }
    }
}

/**
 * 删除调试保护
 * @param {Object} ast - AST树
 */
function removeDebugProtection(ast) {
    // 识别和删除无限调试器循环
    const debuggerVisitor = {
        FunctionDeclaration(path) {
            // 检查是否包含无限调试器循环
            const node = path.node;
            const body = node.body.body;
            
            if (body.length >= 2) {
                // 检查是否有 debugger 语句
                const hasDebugger = body.some(stmt => t.isDebuggerStatement(stmt));
                
                // 检查是否有自调用
                const hasSelfCall = body.some(stmt => {
                    if (t.isExpressionStatement(stmt) && 
                        t.isCallExpression(stmt.expression) && 
                        t.isIdentifier(stmt.expression.callee) && 
                        stmt.expression.callee.name === node.id.name) {
                        return true;
                    }
                    return false;
                });
                
                if (hasDebugger && hasSelfCall) {
                    console.log(`移除调试器保护函数: ${node.id.name}`);
                    path.remove();
                    return;
                }
            }
            
            // 检查是否为 setInterval 中的调试器函数
            const binding = path.scope.getBinding(node.id.name);
            if (binding && binding.referencePaths) {
                for (const ref of binding.referencePaths) {
                    if (ref.parentPath.isCallExpression() && 
                        ref.parentPath.parentPath.isCallExpression() &&
                        t.isIdentifier(ref.parentPath.parentPath.node.callee, { name: 'setInterval' })) {
                        console.log(`移除interval调试器: ${node.id.name}`);
                        ref.parentPath.parentPath.remove();
                        path.remove();
                        break;
                    }
                }
            }
        },
        
        // 移除单独的debugger语句
        DebuggerStatement(path) {
            path.remove();
        }
    };
    
    traverse(ast, debuggerVisitor);
}

/**
 * 解码字符串数组
 * @param {Object} ast - AST树
 */
function decodeStringArrays(ast) {
    // 查找字符串数组定义和引用
    let stringArrays = new Map();
    
    // 第一步：查找所有字符串数组
    traverse(ast, {
        VariableDeclarator(path) {
            const { id, init } = path.node;
            
            // 检查是否是数组定义
            if (t.isArrayExpression(init) && init.elements.length > 0) {
                // 检查数组元素是否都是字符串
                const allStrings = init.elements.every(el => 
                    t.isStringLiteral(el) || t.isTemplateLiteral(el) || t.isNullLiteral(el)
                );
                
                if (allStrings) {
                    const arrayName = id.name;
                    stringArrays.set(arrayName, {
                        elements: init.elements,
                        path: path
                    });
                }
            }
        }
    });
    
    // 第二步：处理字符串数组的访问和操作
    if (stringArrays.size > 0) {
        traverse(ast, {
            MemberExpression(path) {
                const { object, property } = path.node;
                
                // 检查是否是对字符串数组的访问
                if (t.isIdentifier(object) && stringArrays.has(object.name)) {
                    // 对数字索引进行解析
                    if (t.isNumericLiteral(property) || 
                        (t.isStringLiteral(property) && !isNaN(parseInt(property.value)))) {
                        const arrayInfo = stringArrays.get(object.name);
                        const index = t.isNumericLiteral(property) ? 
                            property.value : parseInt(property.value);
                        
                        // 替换为实际字符串
                        if (index < arrayInfo.elements.length && arrayInfo.elements[index]) {
                            path.replaceWith(arrayInfo.elements[index]);
                        }
                    }
                }
            },
            
            // 处理函数调用中的字符串数组访问
            CallExpression(path) {
                const { callee, arguments: args } = path.node;
                
                // 处理 array[index] 模式的函数调用
                if (t.isMemberExpression(callee) && 
                    t.isIdentifier(callee.object) && 
                    stringArrays.has(callee.object.name) &&
                    t.isNumericLiteral(callee.property)) {
                    
                    const arrayInfo = stringArrays.get(callee.object.name);
                    const index = callee.property.value;
                    
                    // 获取字符串值并作为函数调用
                    if (index < arrayInfo.elements.length && 
                        t.isStringLiteral(arrayInfo.elements[index])) {
                        const fnName = arrayInfo.elements[index].value;
                        
                        // 创建新的函数调用
                        path.replaceWith(
                            t.callExpression(
                                t.identifier(fnName),
                                args
                            )
                        );
                    }
                }
            }
        });
        
        // 第三步：移除未使用的字符串数组
        stringArrays.forEach((info, name) => {
            const binding = info.path.scope.getBinding(name);
            if (binding && binding.references === 0) {
                info.path.remove();
                console.log(`移除未使用的字符串数组: ${name}`);
            }
        });
    }
}

/**
 * 解码十六进制和Unicode编码的字符串
 * @param {Object} ast - AST树
 */
function decodeEncodedStrings(ast) {
    traverse(ast, {
        StringLiteral(path) {
            const { value } = path.node;
            
            // 处理十六进制编码的字符串
            if (value.includes('\\x')) {
                try {
                    // 解码十六进制转义
                    const decodedValue = eval(`"${value}"`);
                    path.replaceWith(t.stringLiteral(decodedValue));
                } catch (e) {
                    // 解码失败，保持原样
                }
            }
            
            // 处理Unicode编码的字符串
            if (value.includes('\\u')) {
                try {
                    const decodedValue = eval(`"${value}"`);
                    path.replaceWith(t.stringLiteral(decodedValue));
                } catch (e) {
                    // 解码失败，保持原样
                }
            }
        }
    });
}

/**
 * 解除控制流平坦化
 * @param {Object} ast - AST树
 */
function unFlattenControlFlow(ast) {
    // 处理while(true)结构的控制流平坦化
    const whileLoopVisitor = {
        WhileStatement(path) {
            const { test, body } = path.node;
            
            // 检查是否是 while(true) 结构
            if ((t.isBooleanLiteral(test) && test.value === true) || 
                (t.isNumericLiteral(test) && test.value === 1)) {
                
                // 查找switch语句
                if (t.isBlockStatement(body) && body.body.length >= 1) {
                    const firstStmt = body.body[0];
                    
                    if (t.isSwitchStatement(firstStmt)) {
                        // 控制流平坦化特征
                        const switchStmt = firstStmt;
                        
                        // 尝试寻找控制流变量和数组
                        let controlVar = null;
                        let controlArray = null;
                        
                        // 在while循环前查找控制变量
                        path.getAllPrevSiblings().forEach(sibling => {
                            if (sibling.isVariableDeclaration()) {
                                sibling.node.declarations.forEach(decl => {
                                    // 查找控制变量名称
                                    if (t.isIdentifier(decl.id) && 
                                        t.isMemberExpression(switchStmt.discriminant) &&
                                        t.isIdentifier(switchStmt.discriminant.property) &&
                                        decl.id.name === switchStmt.discriminant.property.name) {
                                        controlVar = decl;
                                    }
                                    
                                    // 查找控制数组
                                    if (t.isIdentifier(decl.id) && 
                                        t.isMemberExpression(switchStmt.discriminant) &&
                                        t.isIdentifier(switchStmt.discriminant.object) &&
                                        decl.id.name === switchStmt.discriminant.object.name) {
                                        controlArray = decl;
                                    }
                                });
                            }
                        });
                        
                        // 如果找到控制流结构，尝试重建原始代码
                        if (controlVar && switchStmt.cases.length > 0) {
                            // 重建代码流
                            let resultBody = [];
                            
                            // 处理case语句块
                            for (const caseStmt of switchStmt.cases) {
                                const consequent = caseStmt.consequent;
                                
                                // 过滤掉控制流操作，保留实际代码
                                for (const stmt of consequent) {
                                    if (!t.isContinueStatement(stmt) && 
                                        !t.isBreakStatement(stmt) && 
                                        !(t.isExpressionStatement(stmt) && 
                                          t.isAssignmentExpression(stmt.expression) && 
                                          t.isIdentifier(stmt.expression.left) && 
                                          stmt.expression.left.name === controlVar.id.name)) {
                                        resultBody.push(stmt);
                                    }
                                }
                            }
                            
                            // 使用重建的代码替换while循环
                            if (resultBody.length > 0) {
                                path.replaceWithMultiple(resultBody);
                                console.log("还原控制流平坦化成功");
                            }
                        }
                    }
                }
            }
        }
    };
    
    traverse(ast, whileLoopVisitor);
}

/**
 * 还原自执行函数
 * @param {Object} ast - AST树
 */
function restoreIIFE(ast) {
    // 查找并展开立即执行函数表达式(IIFE)
    traverse(ast, {
        CallExpression(path) {
            const { callee, arguments: args } = path.node;
            
            // 检查是否是IIFE
            if (t.isFunctionExpression(callee) && 
                callee.body.body.length > 0 && 
                args.length === 0) {
                
                // 提取函数体语句
                const statements = callee.body.body;
                
                // 检查最后一个语句是否为return语句
                const lastStmt = statements[statements.length - 1];
                
                if (t.isReturnStatement(lastStmt)) {
                    // 替换为返回值
                    path.replaceWith(lastStmt.argument);
                } else if (path.parentPath.isExpressionStatement()) {
                    // 替换为函数体语句
                    path.parentPath.replaceWithMultiple(statements);
                }
            }
        }
    });
}

/**
 * 还原对象成员
 * @param {Object} ast - AST树
 */
function restoreObjectProperties(ast) {
    // 将索引访问转换为点表示法
    traverse(ast, {
        MemberExpression(path) {
            const { object, property, computed } = path.node;
            
            // 检查是否是计算属性访问 obj['prop']
            if (computed && t.isStringLiteral(property)) {
                const propName = property.value;
                
                // 检查属性名是否是有效的标识符
                if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propName)) {
                    // 转换为点表示法
                    path.node.computed = false;
                    path.node.property = t.identifier(propName);
                }
            }
        }
    });
}

/**
 * 还原ASCII字符编码
 * @param {Object} ast - AST树
 */
function decodeAsciiStrings(ast) {
    // 解码String.fromCharCode调用
    traverse(ast, {
        CallExpression(path) {
            const { callee, arguments: args } = path.node;
            
            // 检查是否是String.fromCharCode调用
            if (t.isMemberExpression(callee) && 
                t.isIdentifier(callee.object, { name: 'String' }) && 
                t.isIdentifier(callee.property, { name: 'fromCharCode' })) {
                
                // 检查参数是否都是数字字面量
                const allNumbers = args.every(arg => t.isNumericLiteral(arg));
                
                if (allNumbers) {
                    // 提取字符码并转换为字符串
                    const charCodes = args.map(arg => arg.value);
                    const str = String.fromCharCode(...charCodes);
                    
                    // 替换为字符串字面量
                    path.replaceWith(t.stringLiteral(str));
                }
            }
        }
    });
}

/**
 * 计算表达式
 * @param {Object} ast - AST树
 */
function evaluateExpressions(ast) {
    // 计算常量表达式
    traverse(ast, {
        BinaryExpression(path) {
            const { left, right, operator } = path.node;
            
            // 只处理两个操作数都是字面量的情况
            if (t.isLiteral(left) && t.isLiteral(right)) {
                try {
                    // 计算表达式值
                    const result = evalBinaryExpression(left.value, right.value, operator);
                    if (result !== undefined) {
                        path.replaceWith(t.valueToNode(result));
                    }
                } catch (e) {
                    // 计算失败，保持原样
                }
            }
        },
        
        // 计算一元表达式
        UnaryExpression(path) {
            const { argument, operator } = path.node;
            
            if (t.isLiteral(argument)) {
                try {
                    let result;
                    
                    switch (operator) {
                        case '+':
                            result = +argument.value;
                            break;
                        case '-':
                            result = -argument.value;
                            break;
                        case '!':
                            result = !argument.value;
                            break;
                        case '~':
                            result = ~argument.value;
                            break;
                        case 'typeof':
                            result = typeof argument.value;
                            break;
                        default:
                            return;
                    }
                    
                    path.replaceWith(t.valueToNode(result));
                } catch (e) {
                    // 计算失败，保持原样
                }
            }
        }
    });
}

/**
 * 计算二元表达式的值
 * @param {*} left - 左操作数
 * @param {*} right - 右操作数
 * @param {string} operator - 操作符
 * @returns {*} - 计算结果
 */
function evalBinaryExpression(left, right, operator) {
    switch (operator) {
        case '+':
            return left + right;
        case '-':
            return left - right;
        case '*':
            return left * right;
        case '/':
            return left / right;
        case '%':
            return left % right;
        case '**':
            return left ** right;
        case '<<':
            return left << right;
        case '>>':
            return left >> right;
        case '>>>':
            return left >>> right;
        case '&':
            return left & right;
        case '|':
            return left | right;
        case '^':
            return left ^ right;
        case '==':
            return left == right;
        case '===':
            return left === right;
        case '!=':
            return left != right;
        case '!==':
            return left !== right;
        case '<':
            return left < right;
        case '<=':
            return left <= right;
        case '>':
            return left > right;
        case '>=':
            return left >= right;
        default:
            return undefined;
    }
}

/**
 * 清理和格式化代码
 * @param {Object} ast - AST树
 */
function cleanupCode(ast) {
    // 删除空语句
    traverse(ast, {
        EmptyStatement(path) {
            path.remove();
        }
    });
    
    // 删除未使用的变量
    traverse(ast, {
        VariableDeclarator(path) {
            const binding = path.scope.getBinding(path.node.id.name);
            
            // 检查变量是否被引用
            if (binding && binding.referenced === false) {
                // 如果是唯一的声明器，则移除整个声明
                if (path.parentPath.node.declarations.length === 1) {
                    path.parentPath.remove();
                } else {
                    // 否则只移除这个声明器
                    path.remove();
                }
            }
        }
    });
    
    // 分割序列表达式
    traverse(ast, {
        SequenceExpression(path) {
            // 不要分割for循环初始化器中的序列
            if (path.parent.type === 'ForStatement' && 
                (path.key === 'init' || path.key === 'update')) {
                return;
            }
            
            const expressions = path.node.expressions;
            
            // 处理不同的父上下文
            if (path.parent.type === 'ExpressionStatement') {
                // 替换为多个表达式语句
                const statements = expressions.map(exp => 
                    t.expressionStatement(exp)
                );
                path.parentPath.replaceWithMultiple(statements);
            } else {
                // 在其他上下文中，只保留最后一个表达式
                path.replaceWith(expressions[expressions.length - 1]);
            }
        }
    });
    
    // 标准化if语句
    traverse(ast, {
        IfStatement(path) {
            const consequent = path.get('consequent');
            const alternate = path.get('alternate');
            
            // 将单语句转换为代码块
            if (!consequent.isBlockStatement()) {
                consequent.replaceWith(t.blockStatement([consequent.node]));
            }
            
            if (alternate.node !== null && !alternate.isBlockStatement()) {
                alternate.replaceWith(t.blockStatement([alternate.node]));
            }
            
            // 移除空的else语句
            if (alternate.isBlockStatement() && alternate.node.body.length === 0) {
                alternate.remove();
                path.node.alternate = null;
            }
        }
    });
}

/**
 * 添加辅助注释
 * @param {string} code - 代码
 * @param {string} errorMsg - 错误信息
 * @returns {string} - 带注释的代码
 */
function addHelperComments(code, errorMsg = '') {
    // 添加注释帮助理解
    const helpText = `
/*
 * JavaScript-Obfuscator 解密插件辅助信息:
 * 
 * 1. 此代码可能由 javascript-obfuscator 工具混淆
 *    (https://github.com/javascript-obfuscator/javascript-obfuscator)
 * 
 * 2. 混淆特征:
 *    - 使用十六进制/Unicode字符串编码
 *    - 字符串数组存储和访问
 *    - 控制流平坦化(通过switch-case结构)
 *    - 自执行函数嵌套
 *    - 变量名混淆
 * 
 * 3. 解密过程中可能出现的问题:
 *    ${errorMsg ? '- ' + errorMsg : '- 复杂的混淆结构无法完全解除'}
 * 
 * 如果需要进一步解密，建议尝试:
 * 1. 手动识别和替换字符串数组
 * 2. 手动展开控制流结构
 * 3. 使用浏览器开发工具进行动态分析
 */

`;
    return helpText + code;
}

/**
 * 主函数，根据您的框架结构，使用CommonJS模块导出
 */
module.exports = function(code) {
    return deobfuscate(code);
};