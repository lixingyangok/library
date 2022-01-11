/*
 * @Author: 李星阳
 * @Date: 2022-01-10 20:03:47
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-11 20:43:41
 * @Description: 
 */
const fs = require('fs');
const { ipcMain } = require('electron');


module.exports.makeChannels = function(toLog){
    // ▼接收一个测试消息
    ipcMain.on('channel01', (event, arg) => {
        toLog('主进程打印：\n', arg);
        // const sReturn = arg + '★返回';
        // toLog('■■■■■■■■■■■■■■■■■■■■■\n这个内容是主进程收信后返回的');
    });

    // ▼保存文本的方法
    ipcMain.on('fileSaver', function(event, oData) {
        // toLog('开始保存了');
        const {sSaveTo, aChannelData_} = oData;
        fs.writeFile(sSaveTo, aChannelData_, function(err) {
            // toLog('文件保存成功？', !err);
            event.reply('fileSaverReply', err);
        });
    });
};


// ▼将来用不上就删除
// ▼文本文件阅读器-废弃
// ipcMain.on('textReader', function(event, sPath) {
//     fs.readFile(sPath, "utf8", (err, data)=>{
//         const keyWords = 'Error: ENOENT: no such file or directory, open';
//         if (err && err.message.startsWith(keyWords)){
//             data = null; // null 有特殊含义，表示文件不存在
//         }
//         // console.log('2个方法', event.reply === event.sender.send); // false
//         // event.sender.send('textReaderReply', data, err); // 同样有效
//         event.reply('textReaderReply', data, err);
//     });
// });