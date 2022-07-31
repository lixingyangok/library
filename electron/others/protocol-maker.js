/*
 * @Author: 李星阳
 * @Date: 2022-01-10 20:23:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-07-31 09:26:07
 * @Description: 
 */
const fs = require('fs');
const urlib = require("url");
const { protocol } = require('electron');

// 官方文档：
// https://www.electronjs.org/docs/latest/api/protocol#protocolregisterhttpprotocolscheme-handler-completion

module.exports.protocolRegister = function(){
    // 本方法要在 app.whenReady 之前执行，只能执行一次
    const privileges = {
        standard: true,
        secure: true,
        bypassCSP: true,
        allowServiceWorkers: true,
        supportFetchAPI: true,
        corsEnabled: true,
    };
    protocol.registerSchemesAsPrivileged([
        { scheme: 'tube', privileges }, // 此项已被大范围应用，其它项似乎在停用中
        { scheme: 'tb02', privileges },
        { scheme: 'pipe', privileges },
        { scheme: 'filepipe', privileges },
        { scheme: 'filehttp', privileges },
        { scheme: 'filestream', privileges },
    ]);
};

module.exports.protocolFnSetter = function(){
    protocol.registerFileProtocol('tube', function (req, callback){
        var myobj = urlib.parse(req.url, true);
        var pathVal = myobj.query.path;
        // toLog('触发 registerFileProtocol 请求路径 ■■\n' + pathVal);
        callback({ path: pathVal });
    });
    // ▼以下都是停用的，
    protocol.registerFileProtocol('tb02', function (req, callback){
        const myobj = urlib.parse(req.url, true);
        const pathVal = 'D:/github/my-library/public/static/pdf-viewer/web/viewer.html';
        // const pathVal = "D:/天翼云盘同步盘/English dictation/小学生英文幽默故事.pdf"; //myobj.query.path;
        toLog('触发 registerFileProtocol 请求路径 ■■\n', myobj);
        callback({ path: pathVal });
    });
    // ▼无效（弹出 windowStore提示）
    protocol.registerBufferProtocol('pipe', (req, callback) => {
        const myobj = urlib.parse(req.url, true);
        toLog('触发 registerBufferProtocol', myobj);
        // const filePath = 'D:/天翼云盘同步盘/English dictation/小学生英文幽默故事.pdf';
        const filePath = 'D:/github/my-library/public/static/pdf-viewer/web/viewer.html';
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) return callback();
            // mimeType 值可以这样取得：getMimeType(filePath),
            callback({ data, mimeType: 'text/html' });
        });
    });
    // ▼无效（弹出 windowStore提示）
    protocol.registerFileProtocol('filepipe', function(req, callback, next){
        let fPath = req.url.substr(8+4);  // 截取file:///之后的内容，也就是我们需要的
        fPath = 'D:/github/my-library/public/static/pdf-viewer/web/viewer.html';
        const myobj = urlib.parse(req.url, true);
        // fPath = path.normalize(fPath);
        toLog('触发 registerFileProtocol', myobj, fPath);
        callback({
            // path: fPath,
            statusCode: 200,
            headers: {'content-type': 'text/html' },
            data: fs.createReadStream('D:/github/my-library/public/static/pdf-viewer/web/viewer.html'),
        });
        return true;
    });
    protocol.registerHttpProtocol('filehttp', function(req, callback, next){
        let fPath = req.url.substr(8+4);  // 截取file:///之后的内容，也就是我们需要的
        fPath = 'D:/github/my-library/public/static/pdf-viewer/web/viewer.html';
        const myobj = urlib.parse(req.url, true);
        // fPath = path.normalize(fPath);
        toLog('触发 registerHttpProtocol', myobj, fPath);
        callback({
            // path: fPath
            statusCode: 200,
            headers: {'content-type': 'text/html' },
            data: fs.createReadStream('D:/github/my-library/public/static/pdf-viewer/web/viewer.html'),
        });
        return true;
    });
    protocol.registerStreamProtocol('filestream', function(req, callback, next){
        callback({
            statusCode: 200,
            headers: {'content-type': 'text/html' },
            // data: createStream('<h5>Response</h5>'),
            data: fs.createReadStream('D:/github/my-library/public/static/pdf-viewer/web/viewer.html'),
            // 
        });
    });
};





