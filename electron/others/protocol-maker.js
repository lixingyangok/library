/*
 * @Author: 李星阳
 * @Date: 2022-01-10 20:23:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-10 20:32:34
 * @Description: 
 */
const fs = require('fs');
const urlib = require("url");
const {
    protocol,
} = require('electron');


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
        { scheme: 'tube', privileges },
        { scheme: 'pipe', privileges },
    ]);
};


module.exports.protocolFnSetter = function(toLog){
    protocol.registerFileProtocol('tube', function (req, callback){
        var myobj = urlib.parse(req.url, true);
        var pathVal = myobj.query.path;
        // toLog('触发 registerFileProtocol 请求路径 ■■\n' + pathVal);
        callback({ path: pathVal });
    });
    protocol.interceptBufferProtocol('pipe', (request, callback) => {
        toLog('触发 interceptBufferProtocol');
        const filePath = 'D:/天翼云盘同步盘/English dictation/NCEE/2019年高考(上海II卷)英语听力真题 短对话.mp3';
        fs.readFile(filePath, (err, data) => {
            if (err) return callback();
            // mimeType 值可以这样取得：getMimeType(filePath),
            callback({ data, mimeType: 'audio/mpeg' });
        });
    });
};





