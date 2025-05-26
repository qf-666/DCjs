/**
 * JSJiami.com.v7 混淆代码解密插件
 * 支持 JSJiami v7 系列混淆
 */
import { parse } from '@babel/parser'
import _generate from '@babel/generator'
const generator = _generate.default
import _traverse from '@babel/traverse'
const traverse = _traverse.default
import * as t from '@babel/types'

// 匹配特征选项
const optGenMin = {
  comments: false,
  minified: true,
  jsescOption: { minimal: true },
}

export default {
    // 插件名称
    name: "JSJiami.com.v7解密插件",
    
    // 插件版本
    version: "1.0.0",
    
    // 检测是否为JSJiami混淆代码
    detect: function(code) {
        // 检查特征字符串
        if (code.includes("jsjiami.com.v7") || 
            code.includes("var _0x") || 
            code.includes("['版本号']")) {
            return true;
        }
        
        // 检查特征函数模式
        if (/function _0x[a-f0-9]{4}\(\)/.test(code) &&
            /var _0x[a-f0-9]{4}=\(function\(\)/.test(code)) {
            return true;
        }
        
        return false;
    },
    
    // 主插件函数
    plugin: function(code) {
        console.log("开始解密JSJiami混淆...");
        
        // 解析AST
        let ast;
        try {
            ast = parse(code, { errorRecovery: true });
        } catch (e) {
            console.error(`无法解析代码: ${e.reasonCode}`);
            return this.addHelperComments(code);
        }
        
        // 清理二进制显示内容
        traverse(ast, {
            StringLiteral: ({ node }) => {
                delete node.extra;
            },
            NumericLiteral: ({ node }) => {
                delete node.extra;
            },
        });
        
        // 删除非法return语句
        this.removeIllegalReturn(ast);
        
        // 处理全局字符串解密
        if (!this.decodeStringArray(ast)) {
            console.warn("字符串数组解密失败，尝试其他方法...");
            // 尝试简单的字符串数组解密
            this.simpleStringArrayDecode(ast);
        }
        
        // 解除控制流平坦化
        this.restoreControlFlow(ast);
        
        // 解除环境限制
        this.unlockEnv(ast);
        
        // 净化代码以提高可读性
        this.purifyCode(ast);
        
        // 删除未使用的变量
        this.removeUnusedVars(ast);
        
        // 生成代码
        try {
            const deobfuscatedCode = generator(ast, { 
                jsescOption: { minimal: true } 
            }).code;
            
            console.log("JSJiami混淆解密完成");
            return deobfuscatedCode;
        } catch (e) {
            console.error(`生成代码时出错: ${e.message}`);
            return this.addHelperComments(code);
        }
    },
    
    // 删除非法return语句
    removeIllegalReturn: function(ast) {
        function visitor(path) {
            const parent = path.getFunctionParent();
            if (parent && t.isProgram(parent.parent)) {
                path.replaceWith(t.expressionStatement(path.node.argument || t.identifier('undefined')));
            }
        }
        
        traverse(ast, {
            ReturnStatement: visitor
        });
    },
    
    // 解码字符串数组
    decodeStringArray: function(ast) {
        // 尝试查找字符串数组定义
        let stringArrayInfo = this.findStringArray(ast);
        
        if (!stringArrayInfo.stringArrayName) {
            console.error("无法找到字符串数组!");
            return false;
        }
        
        console.log(`找到字符串数组: ${stringArrayInfo.stringArrayName}`);
        
        // 尝试执行字符串解密函数
        try {
            this.virtualGlobalEval(stringArrayInfo.stringArrayCodes.join(';'));
        } catch (e) {
            console.error(`字符串数组解密失败: ${e.message}`);
            return false;
        }
        
        // 递归替换所有解密函数调用
        for (let item of stringArrayInfo.stringArrayCalls) {
            this.replaceStringCalls([], item);
        }
        
        return true;
    },
    
    // 查找字符串数组
    findStringArray: function(ast) {
        // 按照JSJiami v7的特征尝试找到字符串数组
        let result = {
            version: 7,
            stringArrayName: null,
            stringArrayCodes: [],
            stringArrayCalls: []
        };
        
        // 查找模式1：直接寻找主字符串数组函数
        function findMainStringArrayFunction(path) {
            if (path.getFunctionParent()) {
                return;
            }
            
            if (!t.isIdentifier(path.node.id) || 
                path.node.params.length || 
                !t.isBlockStatement(path.node.body)) {
                return;
            }
            
            const body = path.node.body.body;
            if (body.length < 2 || body.length > 3) {
                return;
            }
            
            // 检查函数体特征
            try {
                // 第一个语句通常是定义字符串数组
                if (!t.isVariableDeclaration(body[0]) ||
                    body[0].declarations.length != 1 ||
                    !t.isArrayExpression(body[0].declarations[0].init)) {
                    return;
                }
                
                const arrayName = body[0].declarations[0].id.name;
                const funcName = path.node.id.name;
                
                // 判断是否是字符串数组函数
                const code = generator(path.node, optGenMin).code;
                if (!code.includes("return") || !code.includes(arrayName)) {
                    return;
                }
                
                // 找到了可能的字符串数组函数
                result.stringArrayName = funcName;
                result.stringArrayCodes.push(generator(path.node, optGenMin).code);
                
                // 查找解密函数
                const binding = path.scope.getBinding(funcName);
                if (binding && binding.referencePaths) {
                    for (let ref of binding.referencePaths) {
                        if (ref.findParent(p => p.removed)) {
                            continue;
                        }
                        
                        if (ref.parentPath.isCallExpression() && 
                            ref.key === 'callee') {
                            // 找到解密函数
                            let decodePath = ref.getFunctionParent();
                            if (decodePath && decodePath.node.id) {
                                const decodeName = decodePath.node.id.name;
                                result.stringArrayCodes.push(generator(decodePath.node, optGenMin).code);
                                result.stringArrayCalls.push({
                                    name: decodeName,
                                    path: decodePath
                                });
                            }
                        }
                    }
                }
                
                path.stop();
                path.remove();
            } catch (e) {
                return;
            }
        }
        
        traverse(ast, { FunctionDeclaration: findMainStringArrayFunction });
        
        // 如果找不到主函数，尝试查找直接的字符串数组
        if (!result.stringArrayName) {
            function findStringArrayDirect(path) {
                if (path.getFunctionParent()) {
                    return;
                }
                
                const init = path.get('init');
                if (!init.isArrayExpression()) {
                    return;
                }
                
                // 确保数组元素都是字符串
                const elements = init.node.elements;
                if (!elements.length || !elements.every(el => t.isStringLiteral(el))) {
                    return;
                }
                
                const arrayName = path.node.id.name;
                
                // 查找相关的解码函数
                const binding = path.scope.getBinding(arrayName);
                if (binding && binding.referencePaths) {
                    let validRefs = true;
                    let decodeFunctions = [];
                    
                    for (let ref of binding.referencePaths) {
                        if (ref.parentPath.isMemberExpression() && 
                            ref.key === 'object') {
                            // 找到可能的解码函数
                            const decodePath = ref.getFunctionParent();
                            if (decodePath && decodePath.node.id) {
                                decodeFunctions.push({
                                    name: decodePath.node.id.name,
                                    path: decodePath
                                });
                            } else {
                                validRefs = false;
                            }
                        } else {
                            validRefs = false;
                        }
                    }
                    
                    if (validRefs && decodeFunctions.length) {
                        result.stringArrayName = arrayName;
                        result.stringArrayCodes.push(
                            generator(t.variableDeclaration('var', [path.node]), optGenMin).code
                        );
                        
                        for (let func of decodeFunctions) {
                            result.stringArrayCodes.push(
                                generator(func.path.node, optGenMin).code
                            );
                            result.stringArrayCalls.push(func);
                        }
                        
                        path.stop();
                        path.remove();
                    }
                }
            }
            
            traverse(ast, { VariableDeclarator: findStringArrayDirect });
        }
        
        return result;
    },
    
    // 替换字符串调用
    replaceStringCalls: function(stack, item) {
        stack.push(item);
        const currentName = item.name;
        console.log(`进入子函数 ${stack.length}:${currentName}`);
        
        // 构建执行环境
        let codePrefix = '';
        for (let parent of stack) {
            codePrefix += parent.code + ';';
        }
        this.virtualGlobalEval(codePrefix);
        
        // 查找所有引用并替换
        let scope = item.path.scope;
        if (item.path.isFunctionDeclaration()) {
            scope = item.path.parentPath.scope;
        }
        
        const binding = scope.getBinding(currentName);
        binding.scope.crawl();
        
        const refs = binding.referencePaths;
        const nextRefs = [];
        
        for (let ref of refs) {
            const parent = ref.parentPath;
            if (ref.key === 'callee') {
                // CallExpression
                let callExpression = parent.toString();
                try {
                    // 尝试直接执行调用并替换为字符串
                    let result = this.virtualGlobalEval(callExpression);
                    console.log(`替换: ${callExpression} -> ${result}`);
                    parent.replaceWith(t.stringLiteral(result));
                } catch (e) {
                    // 执行失败，可能是更复杂的嵌套函数
                    console.log(`子函数调用: ${callExpression}`);
                    const child = this.getChildFunction(parent);
                    if (child) {
                        nextRefs.push(child);
                    }
                }
            } else if (ref.key === 'init' || ref.key === 'right') {
                // 变量声明或赋值
                let nextName = '';
                let nextPath = null;
                let code = '';
                
                if (ref.key === 'init') {
                    // VariableDeclarator
                    nextName = ref.parent.id.name;
                    nextPath = ref.parentPath;
                    code = 'var ' + nextPath.toString();
                } else {
                    // AssignmentExpression
                    nextName = ref.parent.left.name;
                    nextPath = ref.parentPath;
                    code = 'var ' + nextPath.toString();
                }
                
                nextRefs.push({
                    name: nextName,
                    path: nextPath,
                    code: code
                });
            }
        }
        
        // 递归处理所有子引用
        for (let ref of nextRefs) {
            this.replaceStringCalls(stack, ref);
        }
        
        binding.scope.crawl();
        console.log(`退出子函数 ${stack.length}:${currentName}`);
        stack.pop();
        
        // 处理完成后移除函数
        if (!item.path.parentPath.isCallExpression()) {
            item.path.remove();
            binding.scope.crawl();
            return;
        }
        
        // 处理赋值表达式中的特殊情况
        item.path.replaceWith(t.identifier(currentName));
        item.path = binding.path;
        binding.scope.crawl();
        this.replaceStringCalls(stack, item);
    },
    
    // 获取子函数信息
    getChildFunction: function(path) {
        if (path.key !== 'argument' || !path.parentPath.isReturnStatement()) {
            console.error(`意外的链式调用: ${path}`);
            return null;
        }
        
        const func = path.getFunctionParent();
        let name = func.node.id?.name;
        let root;
        let code;
        
        if (name) {
            // 函数声明
            root = func;
            code = generator(root.node, optGenMin).code;
        } else {
            // 函数表达式
            root = func.parentPath;
            code = generator(t.variableDeclaration('var', [root.node]), optGenMin).code;
            name = root.node.id.name;
        }
        
        return {
            name: name,
            path: root,
            code: code
        };
    },
    
    // 简单的字符串数组解密
    simpleStringArrayDecode: function(ast) {
        const visitor = {
            VariableDeclarator(path) {
                const name = path.node.id.name;
                if (!path.get('init').isArrayExpression()) {
                    return;
                }
                
                const elements = path.node.init.elements;
                for (const element of elements) {
                    if (!t.isLiteral(element)) {
                        return;
                    }
                }
                
                const bind = path.scope.getBinding(name);
                if (!bind.constant) {
                    return;
                }
                
                let validReferences = true;
                for (const ref of bind.referencePaths) {
                    if (!ref.parentPath.isMemberExpression() || 
                        ref.key !== 'object' || 
                        ref.parentPath.key === 'left' || 
                        !t.isNumericLiteral(ref.parent.property)) {
                        validReferences = false;
                        break;
                    }
                }
                
                if (!validReferences) {
                    return;
                }
                
                console.log(`提取字符串数组: ${name}`);
                for (const ref of bind.referencePaths) {
                    const index = ref.parent.property.value;
                    if (index < elements.length) {
                        ref.parentPath.replaceWith(elements[index]);
                    }
                }
                
                bind.scope.crawl();
                path.remove();
            }
        };
        
        traverse(ast, visitor);
    },
    
    // 还原控制流平坦化
    restoreControlFlow: function(ast) {
        // 查找控制流平坦化模式并还原
        function cleanFlattenedControlFlow(path) {
            const node = path.node;
            
            // 检查是否为控制流平坦化的while循环
            let valid = false;
            if (t.isBooleanLiteral(node.test) && node.test.value) {
                valid = true;
            }
            if (t.isArrayExpression(node.test) && node.test.elements.length === 0) {
                valid = true;
            }
            if (!valid) {
                return;
            }
            
            if (!t.isBlockStatement(node.body)) {
                return;
            }
            
            const body = node.body.body;
            if (body.length < 2 || 
                !t.isSwitchStatement(body[0]) || 
                !t.isMemberExpression(body[0].discriminant)) {
                return;
            }
            
            // 获取switch语句的控制变量
            const switchStmt = body[0];
            let arrayName, indexName;
            
            try {
                arrayName = switchStmt.discriminant.object.name;
                indexName = switchStmt.discriminant.property.argument?.name;
                
                if (!arrayName || !indexName) {
                    return;
                }
            } catch (e) {
                return;
            }
            
            // 查找控制数组和索引变量定义
            let controlArray = [];
            let removePaths = [];
            
            path.getAllPrevSiblings().forEach((prePath) => {
                if (!prePath.isVariableDeclaration()) {
                    return;
                }
                
                for (let i = 0; i < prePath.node.declarations.length; i++) {
                    const declaration = prePath.get(`declarations.${i}`);
                    const { id, init } = declaration.node;
                    
                    if (arrayName === id.name) {
                        // 找到控制数组
                        if (t.isCallExpression(init) && 
                            t.isMemberExpression(init.callee) && 
                            t.isStringLiteral(init.callee.object)) {
                            controlArray = init.callee.object.value.split('|');
                            removePaths.push(declaration);
                        }
                    }
                    
                    if (indexName === id.name) {
                        // 找到索引变量
                        if (t.isLiteral(init)) {
                            removePaths.push(declaration);
                        }
                    }
                }
            });
            
            if (removePaths.length !== 2 || !controlArray.length) {
                return;
            }
            
            // 移除控制变量定义
            removePaths.forEach(path => path.remove());
            console.log(`还原控制流平坦化: ${arrayName}[${indexName}]`);
            
            // 重建控制流
            const caseList = switchStmt.cases;
            let resultBody = [];
            
            // 按照控制数组顺序执行case语句
            controlArray.forEach(targetIndex => {
                let continueLoop = true;
                let idx = parseInt(targetIndex);
                
                while (continueLoop && idx < caseList.length) {
                    const currentCase = caseList[idx];
                    const test = currentCase.test;
                    const consequence = currentCase.consequent;
                    
                    // 验证case标签是否与预期一致
                    if (!t.isStringLiteral(test) || parseInt(test.value) !== idx) {
                        console.log(`控制流中的乱序标签: ${test.value}:${idx}`);
                    }
                    
                    // 处理case语句体
                    for (let i = 0; i < consequence.length; i++) {
                        const stmt = consequence[i];
                        
                        if (t.isContinueStatement(stmt)) {
                            // continue语句表示转到下一个控制流索引
                            continueLoop = false;
                            break;
                        } else if (t.isReturnStatement(stmt)) {
                            // return语句终止控制流
                            continueLoop = false;
                            resultBody.push(stmt);
                            break;
                        } else if (t.isBreakStatement(stmt)) {
                            console.log(`控制流中意外的break语句: ${arrayName}[${indexName}]`);
                        } else {
                            // 添加正常语句到结果
                            resultBody.push(stmt);
                        }
                    }
                    
                    idx++;
                }
            });
            
            // 用重建的代码块替换原while语句
            path.replaceWithMultiple(resultBody);
        }
        
        traverse(ast, {
            WhileStatement: { exit: cleanFlattenedControlFlow }
        });
        
        // 处理for循环形式的控制流平坦化
        function cleanForLoopFlattening(path) {
            const node = path.node;
            
            // 检查是否为控制流平坦化的for循环
            if (!t.isBlockStatement(node.body) || 
                !node.init || 
                !node.test || 
                !node.update) {
                return;
            }
            
            const body = node.body.body;
            if (body.length < 1 || !t.isSwitchStatement(body[0])) {
                return;
            }
            
            // 获取switch语句的控制变量
            const switchStmt = body[0];
            if (!t.isMemberExpression(switchStmt.discriminant)) {
                return;
            }
            
            let arrayName, indexName;
            
            try {
                arrayName = switchStmt.discriminant.object.name;
                indexName = node.init.declarations[0]?.id.name;
                
                if (!arrayName || !indexName || 
                    switchStmt.discriminant.property.name !== indexName) {
                    return;
                }
            } catch (e) {
                return;
            }
            
            // 查找控制数组定义
            let controlArray = [];
            let arrayPath = null;
            
            path.getAllPrevSiblings().forEach((prePath) => {
                if (!prePath.isVariableDeclaration()) {
                    return;
                }
                
                for (let i = 0; i < prePath.node.declarations.length; i++) {
                    const declaration = prePath.get(`declarations.${i}`);
                    const { id, init } = declaration.node;
                    
                    if (arrayName === id.name && t.isArrayExpression(init)) {
                        // 尝试解析控制数组
                        try {
                            controlArray = init.elements.map(el => {
                                if (t.isNumericLiteral(el)) {
                                    return el.value.toString();
                                } else if (t.isStringLiteral(el)) {
                                    return el.value;
                                }
                                return null;
                            }).filter(x => x !== null);
                            
                            arrayPath = declaration;
                        } catch (e) {
                            return;
                        }
                    }
                }
            });
            
            if (!arrayPath || !controlArray.length) {
                return;
            }
            
            // 移除控制数组定义
            arrayPath.remove();
            console.log(`还原For循环控制流平坦化: ${arrayName}[${indexName}]`);
            
            // 重建控制流（类似while循环处理）
            const caseList = switchStmt.cases;
            let resultBody = [];
            
            // 按照控制数组顺序执行case语句
            controlArray.forEach(targetIndex => {
                let idx = parseInt(targetIndex);
                if (isNaN(idx) || idx >= caseList.length) {
                    return;
                }
                
                const currentCase = caseList[idx];
                const consequence = currentCase.consequent;
                
                // 处理case语句体
                for (let i = 0; i < consequence.length; i++) {
                    const stmt = consequence[i];
                    
                    if (t.isContinueStatement(stmt)) {
                        // 忽略continue语句
                        continue;
                    } else if (t.isBreakStatement(stmt)) {
                        // 忽略break语句
                        continue;
                    } else {
                        // 添加正常语句到结果
                        resultBody.push(stmt);
                    }
                }
            });
            
            // 用重建的代码块替换原for循环
            path.replaceWithMultiple(resultBody);
        }
        
        traverse(ast, {
            ForStatement: { exit: cleanForLoopFlattening }
        });
    },
    
    // 解除调试器保护
    unlockDebugger: function(path) {
        if (path.findParent((up) => up.removed)) {
            return;
        }
        
        let rm = path.getFunctionParent();
        this.removeUniqueCall(rm);
    },
    
    // 解除控制台输出保护
    unlockConsole: function(path) {
        if (path.findParent((up) => up.removed)) {
            return;
        }
        
        const node = path.node;
        if (!t.isObjectPattern(node.id)) {
            return;
        }
        
        const props = node.id.properties;
        if (props.length < 4) {
            return;
        }
        
        const check = ['log', 'warn', 'info', 'error'];
        const actual = props.map(p => p.key.name || p.key.value);
        
        if (check.every(c => actual.includes(c))) {
            let rm = path.getFunctionParent();
            this.removeUniqueCall(rm);
        }
    },
    
    // 解锁lint保护
    unlockLint: function(path) {
        if (path.findParent((up) => up.removed)) {
            return;
        }
        if (path.node.value !== '(((.+)+)+)+$') {
            return;
        }
        
        let rm = path.getFunctionParent();
        this.removeUniqueCall(rm);
    },
    
    // 解锁域名锁定保护
    unlockDomainLock: function(path) {
        const array_list = [
            '[7,116,5,101,3,117,0,100]',
            '[5,110,0,100]',
            '[7,110,0,108]',
            '[7,101,0,104]',
        ];
        
        const checkArray = (node) => {
            const trim = node.split(' ').join('');
            for (let i = 0; i < 4; ++i) {
                if (array_list[i] == trim) {
                    return i + 1;
                }
            }
            return 0;
        };
        
        if (path.findParent((up) => up.removed)) {
            return;
        }
        
        let mask = 1 << checkArray('' + path);
        if (mask == 1) {
            return;
        }
        
        let rm = path.getFunctionParent();
        rm.traverse({
            ArrayExpression: (item) => {
                mask = mask | (1 << checkArray('' + item));
            },
        });
        
        if (mask & 0b11110) {
            console.log('发现域名锁定');
            this.removeUniqueCall(rm);
        }
    },
    
    // 解锁环境限制
    unlockEnv: function(ast) {
        // 删除`禁止调试器`函数
        traverse(ast, { 
            DebuggerStatement: this.unlockDebugger.bind(this)
        });
        
        // 删除`禁止控制台输出`函数
        traverse(ast, { 
            VariableDeclarator: this.unlockConsole.bind(this)
        });
        
        // 删除`禁止换行`函数
        traverse(ast, { 
            StringLiteral: this.unlockLint.bind(this)
        });
        
        // 删除`安全域名`函数
        traverse(ast, { 
            ArrayExpression: this.unlockDomainLock.bind(this)
        });
    },
    
    // 移除唯一调用
    removeUniqueCall: function(path) {
        if (!path || path.removed) {
            return;
        }
        
        // 获取函数名或变量名
        let funcName = null;
        if (path.isFunctionDeclaration()) {
            funcName = path.node.id.name;
        } else if (path.isVariableDeclarator()) {
            funcName = path.node.id.name;
        } else {
            return;
        }
        
        if (!funcName) {
            return;
        }
        
        // 检查引用
        const binding = path.scope.getBinding(funcName);
        if (!binding) {
            return;
        }
        
        // 删除所有调用
        for (let ref of binding.referencePaths) {
            if (ref.key === 'callee') {
                const callPath = ref.parentPath;
                if (callPath.parentPath.isExpressionStatement()) {
                    callPath.parentPath.remove();
                } else {
                    callPath.remove();
                }
            }
        }
        
        // 删除函数定义
        path.remove();
        console.log(`已移除保护函数: ${funcName}`);
    },
    
    // 净化简单函数(转换为表达式)
    purifyFunction: function(path) {
        const left = path.get('left');
        const right = path.get('right');
        if (!left.isIdentifier() || !right.isFunctionExpression()) {
            return;
        }
        
        const name = left.node.name;
        const params = right.node.params;
        if (params.length !== 2) {
            return;
        }
        
        const name1 = params[0].name;
        const name2 = params[1].name;
        if (right.node.body.body.length !== 1) {
            return;
        }
        
        let retStmt = right.node.body.body[0];
        if (!t.isReturnStatement(retStmt)) {
            return;
        }
        
        if (!t.isBinaryExpression(retStmt.argument, { operator: '+' })) {
            return;
        }
        
        if (
            retStmt.argument.left?.name !== name1 ||
            retStmt.argument.right?.name !== name2
        ) {
            return;
        }
        
        const fnPath = path.getFunctionParent() || path.scope.path;
        fnPath.traverse({
            CallExpression: (subPath) => {
                const node = subPath.node.callee;
                if (!t.isIdentifier(node, { name: name })) {
                    return;
                }
                let args = subPath.node.arguments;
                subPath.replaceWith(t.binaryExpression('+', args[0], args[1]));
            },
        });
        
        path.remove();
        console.log(`简化字符串连接函数: ${name}`);
    },
    
    // 格式化成员表达式(将数组表示法转换为点表示法)
    formatMember: function(path) {
        // _0x19882c['removeCookie']['toString']() -> _0x19882c.removeCookie.toString()
        let curNode = path.node;
        if (!t.isStringLiteral(curNode.property)) {
            return;
        }
        if (curNode.computed === undefined || !curNode.computed === true) {
            return;
        }
        if (!/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(curNode.property.value)) {
            return;
        }
        curNode.property = t.identifier(curNode.property.value);
        curNode.computed = false;
    },
    
    // 净化代码以提高可读性
    purifyCode: function(ast) {
        // 简化字符串连接函数
        traverse(ast, { 
            AssignmentExpression: this.purifyFunction.bind(this)
        });
        
        // 计算常量表达式
        traverse(ast, {
            BinaryExpression(path) {
                const { left, right, operator } = path.node;
                
                // 只处理两个操作数都是字面量的情况
                if (t.isLiteral(left) && t.isLiteral(right)) {
                    let result;
                    
                    // 处理不同的操作符
                    switch (operator) {
                        case '+':
                            result = left.value + right.value;
                            break;
                        case '-':
                            result = left.value - right.value;
                            break;
                        case '*':
                            result = left.value * right.value;
                            break;
                        case '/':
                            result = left.value / right.value;
                            break;
                        // 其他操作符
                        default:
                            return;
                    }
                    
                    path.replaceWith(t.valueToNode(result));
                }
            }
        });
        
        // 将数组表示法替换为点表示法
        traverse(ast, { 
            MemberExpression: this.formatMember.bind(this)
        });
        
        // 分割序列表达式
        traverse(ast, {
            SequenceExpression(path) {
                // 不要分割for循环初始化器中的序列
                if (path.parent.type === 'ForStatement' && path.key === 'init') {
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
        
        // 删除空语句
        traverse(ast, {
            EmptyStatement: (path) => {
                path.remove();
            },
        });
        
        // 标准化if语句
        traverse(ast, {
            IfStatement: (path) => {
                const consequent = path.get('consequent');
                const alternate = path.get('alternate');
                
                // 将单语句转换为代码块
                if (!consequent.isBlockStatement()) {
                    consequent.replaceWith(t.blockStatement([consequent.node]));
                }
                
                if (alternate.node !== null && !alternate.isBlockStatement()) {
                    alternate.replaceWith(t.blockStatement([alternate.node]));
                }
                
                // 简化空的if语句
                if (consequent.node.body.length === 0) {
                    if (alternate.node === null) {
                        path.replaceWith(path.get('test').node);
                    } else {
                        consequent.replaceWith(alternate.node);
                        alternate.remove();
                        path.node.alternate = null;
                        path.get('test').replaceWith(
                            t.unaryExpression('!', path.get('test').node, true)
                        );
                    }
                }
                
                // 移除空的else语句
                if (alternate.isBlockStatement() && alternate.node.body.length === 0) {
                    alternate.remove();
                    path.node.alternate = null;
                }
            }
        });
    },
    
    // 删除未使用的变量
    removeUnusedVars: function(ast) {
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
    },
    
    // 虚拟全局求值
    virtualGlobalEval: function(jsStr) {
        try {
            // 这里应该使用您的框架中的virtualGlobalEval函数
            // 为了与您的代码集成，我们假设该函数已经存在
            return new Function('return ' + jsStr)();
        } catch (e) {
            console.error("virtualGlobalEval执行错误:", e);
            return null;
        }
    },
    
    // 一次性求值
    evalOneTime: function(str) {
        try {
            return new Function('return ' + str)();
        } catch (e) {
            console.error("evalOneTime执行错误:", e);
            return null;
        }
    },
    
    // 添加辅助注释
    addHelperComments: function(code) {
        // 如果无法进行实际解密，至少添加注释帮助理解
        var helpText = `
/*
 * JSJiami.com.v7 代码结构分析:
 * 
 * 1. 首行通常定义了一个version_变量，指示混淆版本
 * 2. 存在一个主解码函数(如_0x1fca)，负责解密字符串
 * 3. 存在一个字符串数组生成函数(如_0x46b1)
 * 4. 索引偏移通常在0x18f左右
 * 5. 特征函数名: _0x46b1, _0x1fca, 等
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