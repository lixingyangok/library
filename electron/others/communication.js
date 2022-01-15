/*
 * @Author: 李星阳
 * @Date: 2022-01-10 20:03:47
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-15 21:08:12
 * @Description: 
 */
const fs = require('fs').promises;
const { ipcMain } = require('electron');
const hasher = require('hash-wasm');


module.exports.makeChannels = function(toLog){
    // ▼接收一个测试消息
    ipcMain.on('channel01', (event, arg) => {
        toLog('收到窗口内容：\n', arg);
    });

    // ▼保存文本的方法
    ipcMain.on('fileSaver', async function(event, oData) {
        const {sSaveTo, aChannelData_} = oData;
        const err = await fs.writeFile(sSaveTo, aChannelData_).catch(
            err => err,
        );
        event.reply('fileSaverReply', err);
    });

    // ▼计算文件指纹
    ipcMain.on('getHash', async function(event, sPath) {
        const oState = await fs.stat(sPath);
        toLog('文件信息', oState);
        // console.time('读取Buffer');
        const oBuffer = await fs.readFile(sPath).catch(err=>{
            toLog('读文件出错\n', err);
        });
        if (!oBuffer) return;
        // console.timeEnd('读取Buffer');
        // console.time('计算指纹');
        const sHash = await hasher.xxhash64(oBuffer); // 56MB 一共耗时 60ms
        // console.timeEnd('计算指纹');
        event.reply('getHashReply', sHash);
    });
};

// const sPath = "D:/English video/迷失02/Lost.S02EP01.BluRay.iPad.720p.AAC.X264-CHDPAD.mp4";
// const sPath = "D:/English video/短片/Shadowing Step by Step.mp4";
// const sPath = "D:/English video/电影/AL塔：战斗天使.BD1280高清中字版.mp4";
// const sPath = "D:/English video/短片/老外：怎么可能快速学英语？！ - 1.字幕版.mp4";


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