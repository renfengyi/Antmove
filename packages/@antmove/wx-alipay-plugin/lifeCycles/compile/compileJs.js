const fs = require('fs-extra');
const Config = require('../../config');
const customComponentPrefix = Config.library.customComponentPrefix;
const {
    behavourHandle,
    precessRelativePathOfCode,
    replaceCalleeHandleFn,
    commentBlock,
    requireModuleFn,
    ifProcessHandleFn,
    ConstructorHandle,
    prettierCode,
    processFnBodyHandleFn
} = require('@antmove/utils');

module.exports = function (fileInfo, ctx, originCode, apis) {
    originCode = behavourHandle(originCode);
    originCode = precessRelativePathOfCode(originCode, fileInfo.path, ctx.entry);
    
    let isMatchPlatformApi = originCode.match(/\bwx\.(\w+)/g);
    originCode = ifProcessHandleFn(originCode, {
        entry: 'wx',
        dist: 'my',
        code: 'wx.__target__'
    });       
    originCode = replaceCalleeHandleFn(originCode, 'wx', '_my', apis);
    Config.compile.wrapApis = Object.assign(Config.compile.wrapApis, apis);
    originCode = commentBlock(originCode);
    originCode = requireModuleFn(originCode, ctx);

    /**
     *  判断是否为 App()/Page()/Component()
     * */

    let componentWrapFnPath = customComponentPrefix + '/component/componentClass.js';
    let matchRet = (originCode.match(/\n*App\(/g) || originCode.match(/\n*Page\(/g) || originCode.match(/\n*Component\(/g));

    let apiPath = customComponentPrefix + '/api/index.js';
    let _compoentPath = componentWrapFnPath;
    let insertCode = '';

    if (matchRet) {
        insertCode += `const _conponentConstructorHandle = require('${_compoentPath}');\n`;
        originCode = ConstructorHandle(originCode);
    }

    if (isMatchPlatformApi || (fileInfo.parent && fileInfo.parent.tplInfo)) {
        insertCode += `const _my = require('${apiPath}')(my);
                `;
    }

    if (fileInfo.parent && fileInfo.parent.tplInfo) {
        
        fileInfo.parent.tplInfo.button &&
        fileInfo.parent.tplInfo.button
            .forEach(function (info) {
                if (info.type === 'button' && info.scope)
                    originCode = processFnBodyHandleFn(originCode, info);
            });
    }

    originCode = insertCode + originCode;
    originCode = prettierCode(originCode);
            
    fs.outputFileSync(fileInfo.dist, originCode);
};