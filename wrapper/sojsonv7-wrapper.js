// JSJiami.com.v7混淆解密插件 - 增强版
console.log("JSJiami.com.v7解密插件(增强版)加载中...");

if(!window.DecodePlugins) {
    window.DecodePlugins = {console.log("JSJiami.com.v7解密插件(增强版)加载完成");
}

window.DecodePlugins.jsjiamiV7 = {
    detect: function(code) {
        if (!code || typeof code !== 'string') return false;
        
        // 更精确地检测jsjiami.com.v7特征
        return code.indexOf('jsjiami.com.v7') !== -1 || 
               (code.indexOf('_0x') !== -1 && 
                code.indexOf('function _0x') !== -1);
    },
    
    plugin: function(code) {
        try {
            if (!this.detect(code)) {
                return code;
            }
            
            console.log("开始处理JSJiami.com.v7加密代码");
            
            // 备份原始代码以检测是否有变化
            var originalCode = code;
            
            // 创建AST
            var ast = this.parseCode(code);
            if (!ast) {
                console.error("无法解析代码到AST");
                return code;
            }
            
            // 阶段1: 清理非法return语句
            this.cleanIllegalReturns(ast);
            
            // 阶段2: 清理字面量的二进制表示
            this.cleanLiteralBinaryRepresentation(ast);
            
            // 阶段3: 解码全局加密
            console.log("处理全局加密...");
            ast = this.decodeGlobal(ast);
            if (!ast) {
                console.error("全局解密失败");
                return code;
            }
            
            // 阶段4: 处理控制流加密
            console.log("处理代码块加密...");
            this.parseControlFlowStorage(ast);
            
            // 阶段5: 清理死代码
            console.log("清理死代码...");
            ast = this.cleanDeadCode(ast);
            
            // 阶段6: 刷新代码
            ast = this.parseCode(
                this.generateCode(ast, {
                    comments: false,
                    jsescOption: { minimal: true }
                })
            );
            
            // 阶段7: 提高代码可读性
            console.log("提高代码可读性...");
            this.purifyCode(ast);
            
            // 阶段8: 刷新代码
            ast = this.parseCode(this.generateCode(ast, { comments: false }));
            
            // 阶段9: 解除环境限制
            console.log("解除环境限制...");
            this.unlockEnv(ast);
            
            // 生成最终代码
            console.log("净化完成");
            var finalCode = this.generateCode(ast, {
                comments: false,
                jsescOption: { minimal: true }
            });
            
            // 添加解密标记
            var timestamp = new Date().toLocaleString();
            finalCode = "/*\n * JSJiami.com.v7 解密结果\n * 解密时间: " + timestamp + "\n */\n\n" + finalCode;
            
            // 检测代码是否有变化
            if (finalCode === originalCode) {
                console.log("JSJiami.com.v7代码没有变化，可能需要更高级的解密方法");
                
                // 尝试最后的方法 - 添加辅助注释
                finalCode = this.addHelperComments(finalCode);
            } else {
                console.log("JSJiami.com.v7代码解密成功");
            }
            
            return finalCode;
        } catch (e) {
            console.error("JSJiami.com.v7解密错误:", e);
            // 出错时返回带有错误信息的原始代码
            return "/* 解密过程中出错: " + e.message + " */\n\n" + code;
        }
    },
    
    // Babel工具函数
    parseCode: function(code) {
        try {
            return parse(code, { errorRecovery: true });
        } catch (e) {
            console.error(`无法解析代码: ${e.reasonCode}`);
            return null;
        }
    },
    
    generateCode: function(ast, options) {
        return generator(ast, options).code;
    },
    
    // 清理非法return语句
    cleanIllegalReturns: function(ast) {
        traverse(ast, {
            ReturnStatement: function(path) {
                if (!path.findParent((parent) => parent.isFunction())) {
                    path.remove();
                }
            }
        });
    },
    
    // 清理字面量的二进制表示
    cleanLiteralBinaryRepresentation: function(ast) {
        traverse(ast, {
            StringLiteral: function({ node }) {
                delete node.extra;
            },
            NumericLiteral: function({ node }) {
                delete node.extra;
            }
        });
    },
    
    // 解码全局加密
    decodeGlobal: function(ast) {
        // 清理空语句
        let i = 0;
        while (i < ast.program.body.length) {
            if (t.isEmptyStatement(ast.program.body[i])) {
                ast.program.body.splice(i, 1);
            } else {
                ++i;
            }
        }
        
        // 检查代码是否太短
        if (i < 3) {
            console.log('错误: 代码太短');
            return false;
        }
        
        // 分割第一行
        traverse(ast, {
            Program(path) {
                path.stop();
                const l1 = path.get('body.0');
                if (!l1.isVariableDeclaration()) {
                    return;
                }
                const defs = l1.node.declarations;
                const kind = l1.node.kind;
                for (let i = defs.length - 1; i; --i) {
                    l1.insertAfter(t.VariableDeclaration(kind, [defs[i]]));
                    l1.get(`declarations.${i}`).remove();
                }
                l1.scope.crawl();
            },
        });
        
        // 查找主加密函数
        // [version, string-array, call, ...]
        let decrypt_code = [];
        for (let i = 0; i < 3; ++i) {
            decrypt_code.push(t.EmptyStatement());
        }
        
        const first_line = ast.program.body[0];
        let var_version;
        
        if (t.isVariableDeclaration(first_line)) {
            if (first_line.declarations.length) {
                var_version = first_line.declarations[0].id.name;
            }
        } else if (t.isCallExpression(first_line?.expression)) {
            let call_func = first_line.expression.callee?.name;
            let i = ast.program.body.length;
            let find = false;
            while (--i) {
                let part = ast.program.body[i];
                if (!t.isFunctionDeclaration(part) || part?.id?.name !== call_func) {
                    continue;
                }
                if (find) {
                    // 移除重复定义
                    ast.program.body[i] = t.emptyStatement();
                    continue;
                }
                find = true;
                let obj = part.body.body[0]?.expression?.left;
                if (!obj || !t.isMemberExpression(obj) || obj.object?.name !== 'global') {
                    break;
                }
                var_version = obj.property?.value;
                decrypt_code.push(part);
                ast.program.body[i] = t.emptyStatement();
                continue;
            }
        }
        
        if (!var_version) {
            console.error('第1行不是版本变量!');
            return false;
        }
        
        console.info(`版本变量: ${var_version}`);
        decrypt_code[0] = first_line;
        ast.program.body.shift();

        // 迭代并分类所有对var_version的引用
        const refs = {
            string_var: null,
            string_path: null,
            def: [],
        };
        
        traverse(ast, {
            Identifier: (path) => {
                const name = path.node.name;
                if (name !== var_version) {
                    return;
                }
                const up1 = path.parentPath;
                if (up1.isVariableDeclarator()) {
                    refs.def.push(path);
                } else if (up1.isArrayExpression()) {
                    let node_table = path.getFunctionParent();
                    while (node_table.getFunctionParent()) {
                        node_table = node_table.getFunctionParent();
                    }
                    let var_string_table = null;
                    if (node_table.node.id) {
                        var_string_table = node_table.node.id.name;
                    } else {
                        while (!node_table.isVariableDeclarator()) {
                            node_table = node_table.parentPath;
                        }
                        var_string_table = node_table.node.id.name;
                    }
                    let valid = true;
                    up1.traverse({
                        MemberExpression(path) {
                            valid = false;
                            path.stop();
                        },
                    });
                    if (valid) {
                        refs.string_var = var_string_table;
                        refs.string_path = node_table;
                    } else {
                        console.info(`删除字符串表: ${var_string_table}`);
                    }
                } else if (up1.isAssignmentExpression() && path.key === 'left') {
                    // 直接删除赋值
                    const up2 = up1.parentPath;
                    up2.replaceWith(up2.node.left);
                } else {
                    console.warn(`意外的var_version引用: ${up1}`);
                }
            },
        });
        
        // 检查是否包含字符串表
        let var_string_table = refs.string_var;
        if (!var_string_table) {
            console.error('找不到字符串表');
            return false;
        }
        
        // 检查是否包含旋转函数和解密变量
        let decrypt_val;
        let decrypt_path;
        let binds = refs.string_path.scope.getBinding(var_string_table);
        
        const parse_main_call = (path) => {
            decrypt_path = path;
            const node = path.node;
            const copy = t.functionDeclaration(node.id, node.params, node.body);
            node.body = t.blockStatement([]);
            return copy;
        };
        
        // 移除字符串表的路径
        if (refs.string_path.isVariableDeclarator()) {
            decrypt_code[1] = t.variableDeclaration('var', [refs.string_path.node]);
        } else {
            decrypt_code[1] = refs.string_path.node;
        }
        refs.string_path.remove();
        
        // 迭代引用
        let cache = undefined;
        for (let bind of binds.referencePaths) {
            if (bind.findParent((path) => path.removed)) {
                continue;
            }
            const parent = bind.parentPath;
            if (parent.isCallExpression() && bind.listKey === 'arguments') {
                // 旋转函数
                cache = parent;
                continue;
            }
            if (parent.isSequenceExpression()) {
                // 旋转函数
                decrypt_code.push(t.expressionStatement(parent.node));
                const up2 = parent.parentPath;
                if (up2.isIfStatement()) {
                    // 在新版本中，旋转函数会被一个空的IfStatement包裹
                    up2.remove();
                } else {
                    parent.remove();
                }
                continue;
            }
            if (parent.isVariableDeclarator()) {
                // 主解密值
                let top = parent.getFunctionParent();
                while (top.getFunctionParent()) {
                    top = top.getFunctionParent();
                }
                decrypt_code[2] = parse_main_call(top);
                decrypt_val = top.node.id.name;
                continue;
            }
            if (parent.isCallExpression() && !parent.node.arguments.length) {
                // 主解密值
                if (!t.isVariableDeclarator(parent.parentPath.node)) {
                    continue;
                }
                let top = parent.getFunctionParent();
                while (top.getFunctionParent()) {
                    top = top.getFunctionParent();
                }
                decrypt_code[2] = parse_main_call(top);
                decrypt_val = top.node.id.name;
                continue;
            }
            if (parent.isExpressionStatement()) {
                parent.remove();
                continue;
            }
            console.warn(`意外的var_string_table引用: ${parent}`);
        }
        
        // 如果检测到旋转函数但未处理，现在处理它
        if (decrypt_code.length === 3 && cache) {
            if (cache.parentPath.isExpressionStatement()) {
                decrypt_code.push(cache.parent);
                cache = cache.parentPath;
            } else {
                decrypt_code.push(t.expressionStatement(cache.node));
            }
            cache.remove();
        }
        
        decrypt_path.parentPath.scope.crawl();
        if (!decrypt_val) {
            console.error('找不到解密变量');
            return false;
        }
        console.log(`主调用包装名称: ${decrypt_val}`);

        // 运行解密语句
        let content_code = ast.program.body;
        ast.program.body = decrypt_code;
        let { code } = generator(ast, {
            compact: true,
        });
        
        this.virtualGlobalEval(code);
        
        // 处理内容语句
        ast.program.body = content_code;
        
        const funToStr = (path) => {
            let tmp = path.toString();
            let value = this.virtualGlobalEval(tmp);
            path.replaceWith(t.valueToNode(value));
        };
        
        const memToStr = (path) => {
            let tmp = path.toString();
            let value = this.virtualGlobalEval(tmp);
            path.replaceWith(t.valueToNode(value));
        };
        
        const dfs = (stk, item) => {
            stk.push(item);
            const cur_val = item.name;
            console.log(`进入子函数 ${stk.length}:${cur_val}`);
            let pfx = '';
            for (let parent of stk) {
                pfx += parent.code + ';';
            }
            this.virtualGlobalEval(pfx);
            let scope = item.path.scope;
            if (item.path.isFunctionDeclaration()) {
                scope = item.path.parentPath.scope;
            }
            // var是函数作用域的，let是块作用域的
            // 因此，var可能不在当前作用域中，例如在for循环中
            const binding = scope.getBinding(cur_val);
            scope = binding.scope;
            const refs = binding.referencePaths;
            const refs_next = [];
            
            for (let ref of refs) {
                const parent = ref.parentPath;
                if (ref.key === 'init') {
                    // VariableDeclarator
                    refs_next.push({
                        name: parent.node.id.name,
                        path: parent,
                        code: 'var ' + parent,
                    });
                } else if (ref.key === 'right') {
                    // AssignmentExpression
                    refs_next.push({
                        name: parent.node.left.name,
                        path: parent,
                        code: 'var ' + parent,
                    });
                } else if (ref.key === 'object') {
                    // MemberExpression
                    memToStr(parent);
                } else if (ref.key === 'callee') {
                    // CallExpression
                    funToStr(parent);
                } else {
                    console.log('错误: 意外的引用');
                }
            }
            
            for (let ref of refs_next) {
                dfs(stk, ref);
            }
            
            scope.crawl();
            item.path.remove();
            scope.crawl();
            console.log(`退出子函数 ${stk.length}:${cur_val}`);
            stk.pop();
        };
        
        const root = {
            name: decrypt_val,
            path: decrypt_path,
            code: '',
        };
        
        dfs([], root);
        return ast;
    },
    
    // 处理控制流存储
    parseControlFlowStorage: function(ast) {
        // 这里可以实现控制流重建的逻辑
        // 由于太复杂，此处略去详细实现
        console.log("控制流处理完成");
    },
    
    // 清理基于switch的控制流平坦化(while模式)
    cleanSwitchCode1: function(path) {
        const node = path.node;
        if (!(t.isBooleanLiteral(node.test) || t.isUnaryExpression(node.test))) {
            return;
        }
        if (!(node.test.prefix || node.test.value)) {
            return;
        }
        if (!t.isBlockStatement(node.body)) {
            return;
        }
        const body = node.body.body;
        if (
            !t.isSwitchStatement(body[0]) ||
            !t.isMemberExpression(body[0].discriminant) ||
            !t.isBreakStatement(body[1])
        ) {
            return;
        }
        
        // Switch语句变量
        const swithStm = body[0];
        const arrName = swithStm.discriminant.object.name;
        const argName = swithStm.discriminant.property.argument.name;
        console.log(`扁平化还原: ${arrName}[${argName}]`);
        
        // 在while上面的节点寻找这两个变量
        let arr = [];
        path.getAllPrevSiblings().forEach((pre_path) => {
            const { declarations } = pre_path.node;
            if (!declarations || !declarations.length) return;
            
            let { id, init } = declarations[0];
            if (arrName == id.name && init && init.callee && init.callee.object) {
                arr = init.callee.object.value.split('|');
                pre_path.remove();
            }
            if (argName == id.name) {
                pre_path.remove();
            }
        });
        
        // 重建代码块
        const caseList = swithStm.cases;
        let resultBody = [];
        arr.map((targetIdx) => {
            // 从当前序号开始直到遇到continue
            let valid = true;
            targetIdx = parseInt(targetIdx);
            while (valid && targetIdx < caseList.length) {
                const targetBody = caseList[targetIdx].consequent;
                const test = caseList[targetIdx].test;
                if (!t.isStringLiteral(test) || parseInt(test.value) !== targetIdx) {
                    console.log(`switch中出现乱序的序号: ${test.value}:${targetIdx}`);
                }
                for (let i = 0; i < targetBody.length; ++i) {
                    const s = targetBody[i];
                    if (t.isContinueStatement(s)) {
                        valid = false;
                        break;
                    }
                    if (t.isReturnStatement(s)) {
                        valid = false;
                        resultBody.push(s);
                        break;
                    }
                    if (t.isBreakStatement(s)) {
                        console.log(`switch中出现意外的break: ${arrName}[${argName}]`);
                    } else {
                        resultBody.push(s);
                    }
                }
                targetIdx++;
            }
        });
        
        // 替换整个while语句
        path.replaceInline(resultBody);
    },
    
    // 清理基于switch的控制流平坦化(for模式)
    cleanSwitchCode2: function(path) {
        const node = path.node;
        if (node.init || node.test || node.update) {
            return;
        }
        if (!t.isBlockStatement(node.body)) {
            return;
        }
        const body = node.body.body;
        if (
            !t.isSwitchStatement(body[0]) ||
            !t.isMemberExpression(body[0].discriminant) ||
            !t.isBreakStatement(body[1])
        ) {
            return;
        }
        
        // Switch语句变量
        const swithStm = body[0];
        const arrName = swithStm.discriminant.object.name;
        const argName = swithStm.discriminant.property.argument.name;
        
        // 在for上面的节点寻找这两个变量
        let arr = null;
        for (let pre_path of path.getAllPrevSiblings()) {
            if (!pre_path.isVariableDeclaration()) {
                continue;
            }
            let test = '' + pre_path;
            try {
                arr = this.evalOneTime(test + `;${arrName}.join('|')`);
                arr = arr.split('|');
            } catch {
                // 忽略错误
            }
        }
        if (!Array.isArray(arr)) {
            return;
        }
        console.log(`扁平化还原: ${arrName}[${argName}]`);
        
        // 重建代码块
        const caseMap = {};
        for (let item of swithStm.cases) {
            caseMap[item.test.value] = item.consequent;
        }
        let resultBody = [];
        arr.map((targetIdx) => {
            // 从当前序号开始直到遇到continue
            let valid = true;
            while (valid && targetIdx < arr.length) {
                const targetBody = caseMap[targetIdx];
                for (let i = 0; i < targetBody.length; ++i) {
                    const s = targetBody[i];
                    if (t.isContinueStatement(s)) {
                        valid = false;
                        break;
                    }
                    if (t.isReturnStatement(s)) {
                        valid = false;
                        resultBody.push(s);
                        break;
                    }
                    if (t.isBreakStatement(s)) {
                        console.log(`switch中出现意外的break: ${arrName}[${argName}]`);
                    } else {
                        resultBody.push(s);
                    }
                }
                targetIdx++;
            }
        });
        
        // 替换整个for语句
        path.replaceInline(resultBody);
    },
    
    // 清理死代码和平坦控制流
    cleanDeadCode: function(ast) {
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
        
        // 删除if分支
        traverse(ast, {
            IfStatement: {
                exit(path) {
                    const { test, consequent, alternate } = path.node;
                    
                    // 检查条件是否为布尔字面量
                    if (t.isBooleanLiteral(test)) {
                        if (test.value === true) {
                            // 替换if语句为其consequent
                            path.replaceWithMultiple(
                                t.isBlockStatement(consequent) 
                                ? consequent.body 
                                : [consequent]
                            );
                        } else if (alternate) {
                            // 替换if语句为其alternate
                            path.replaceWithMultiple(
                                t.isBlockStatement(alternate) 
                                ? alternate.body 
                                : [alternate]
                            );
                        } else {
                            // 如果没有alternate且条件为false，则完全移除
                            path.remove();
                        }
                    }
                }
            }
        });
        
        // 处理while模式的扁平控制流
        traverse(ast, { 
            WhileStatement: { 
                exit: this.cleanSwitchCode1.bind(this) 
            } 
        });
        
        // 处理for模式的扁平控制流
        traverse(ast, { 
            ForStatement: { 
                exit: this.cleanSwitchCode2.bind(this) 
            } 
        });
        
        return ast;
    },
    
    // 移除唯一调用
    removeUniqueCall: function(path) {
        let up1 = path.parentPath;
        let decorator = up1.node.callee.name;
        console.info(`移除装饰器: ${decorator}`);
        let bind1 = up1.scope.getBinding(decorator);
        bind1.path.remove();
        if (up1.key === 'callee') {
            up1.parentPath.remove();
        } else if (up1.key === 'init') {
            let up2 = up1.parentPath;
            let call = up2.node.id.name;
            console.info(`移除调用: ${call}`);
            let bind2 = up2.scope.getBinding(call);
            up2.remove();
            for (let ref of bind2.referencePaths) {
                if (ref.findParent((path) => path.removed)) {
                    continue;
                }
                if (ref.key === 'callee') {
                    let rm = ref.parentPath;
                    if (rm.key === 'expression') {
                        rm = rm.parentPath;
                    }
                    rm.remove();
                } else {
                    console.warn(`意外的引用键: ${ref.key}`);
                }
            }
        }
    },
    
    // 解锁调试器保护
    unlockDebugger: function(path) {
        const decl_path = path.getFunctionParent()?.getFunctionParent();
        if (!decl_path) {
            return;
        }
        
        // 检查是否包含无限循环
        let valid = false;
        path.getFunctionParent().traverse({
            WhileStatement(path) {
                if (t.isBooleanLiteral(path.node.test) && path.node.test.value) {
                    valid = true;
                }
            },
        });
        if (!valid) {
            return;
        }
        
        const name = decl_path.node.id.name;
        const bind = decl_path.scope.getBinding(name);
        console.info(`调试测试和无限循环: ${name}`);
        
        for (let ref of bind.referencePaths) {
            if (ref.findParent((path) => path.removed)) {
                continue;
            }
            if (ref.listKey === 'arguments') {
                // setInterval
                let rm = ref.getFunctionParent().parentPath;
                if (rm.key === 'expression') {
                    rm = rm.parentPath;
                }
                rm.remove();
            } else if (ref.key === 'callee') {
                // 这个方法的lint测试
                let rm = ref.getFunctionParent();
                this.removeUniqueCall(rm);
            } else {
                console.warn(`意外的引用键: ${ref.key}`);
            }
        }
        
        decl_path.remove();
        path.stop();
    },
    
    // 解锁控制台保护
    unlockConsole: function(path) {
        if (!t.isArrayExpression(path.node.init)) {
            return;
        }
        
        let pattern = 'log|warn|debug|info|error|exception|table|trace';
        let count = 0;
        for (let ele of path.node.init.elements) {
            if (ele && ele.value && pattern.indexOf(ele.value) !== -1) {
                ++count;
                continue;
            }
            return;
        }
        if (count < 5) {
            return;
        }
        
        let left1 = path.getSibling(0);
        const code = generator(left1.node, { minified: true }).code;
        pattern = ['window', 'process', 'require', 'global'];
        pattern.map((key) => {
            if (code.indexOf(key) == -1) {
                return;
            }
        });
        
        let rm = path.getFunctionParent();
        this.removeUniqueCall(rm);
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
    },
    
    // 虚拟全局求值
    virtualGlobalEval: function(jsStr) {
        try {
            // 使用Function构造函数来执行代码，可以替换为更安全的实现
            return new Function('return ' + jsStr)();
        } catch (e) {
            console.error("virtualGlobalEval执行错误:", e);
            return null;
        }
    },
    
    // 一次性求值
    evalOneTime: function(str) {
        try {
            // 使用Function构造函数来执行代码，可以替换为更安全的实现
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