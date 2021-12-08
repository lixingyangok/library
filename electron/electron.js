/*
 * @Author: 李星阳
 * @Date: 2021-11-28 13:30:34
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-08 18:00:59
 * @Description: 
 */
// electron/electron.js
const path = require('path');
const { default: installExtension, VUEJS3_DEVTOOLS } = require('electron-devtools-installer');
const { app, BrowserWindow, protocol, ipcMain } = require('electron');
const exePath = path.dirname(app.getPath('exe'));
const isDev = process.env.IS_DEV == "true" ? true : false;
// ▼启动服务
// const http = require('http');
// const express = require('express');
// const expressApp = express();
// const cors = require('cors');
// const router = express.Router();


console.log('exe位置 ■■■■■■■■■■■■■■', exePath);
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function createWindow() {
    protocol.registerFileProtocol(
        'your-custom-protocol', fileHandler,
    );
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            webSecurity: false,
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true, // 值为true才能使用 require()
            contextIsolation: false, // 官网似乎说是默认false，但是这里必须设置contextIsolation
        },
    });
    // and load the index.html of the app.
    // win.loadFile("index.html");
    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../dist/index.html')}`
    );
    // Open the DevTools.
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

ipcMain.on('asynchronous-message', (event, arg) => {
    console.log('主进程收到了 ---', arg)
    const sReturn = arg + '★返回';
    console.log('主进程返回 ---', sReturn)
    event.reply('asynchronous-reply', sReturn);
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    installExtension(VUEJS3_DEVTOOLS).then((name) => {
        console.log(`Added Extension:  ${name}`);
    }).catch((err) => {
        console.log('An error occurred: ', err);
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


function fileHandler(req, callback){
    const path = req.url;
    console.log('收到请求路径 ■■■■■■■■■■■■■■■■■■■■\n', path);
    // Write some code to resolve path, calculate absolute path etc
    const isWrong = false;// Write some code here to check if you should return the file to renderer process
    // -6 is FILE_NOT_FOUND
    // https://source.chromium.org/chromium/chromium/src/+/master:net/base/net_error_list.h
    if(isWrong) return callback({ error: -6 });
    callback({ path });
}

// expressApp.use(cors());
// router.get('/file/:name', function (req, res) {
//     const filename = req.params.name;
//     console.log('filename ■■■■■■■■■■■■■■■■■■■■', filename);
//     res.sendFile(filename);
// });
// expressApp.use('/', router);
// http.createServer(expressApp).listen(8899);

//创建服务器
// http.createServer(function(request, response) {
//     console.log('请求来了★★★★★★★★★★★★★★★★★★★★');
//     console.log(request.url);
//     //解析请求，包括文件名
//     var pathname = 'D:/天翼云盘同步盘/English dictation/开言英语/A Party Invitation.mp3';
//     //从文件系统中都去请求的文件内容
//     fs.readFile(pathname, function(err, data) {
//         if(err) {
//             response.writeHead(404, {'Content-Type': 'text/html'});
//         } else {
//             response.writeHead(200,{'Content-Type': 'audio/mpeg'});
//             response.write(data);
//         }
//         //发送响应数据
//         response.end();
//     });
// }).listen(8899);

