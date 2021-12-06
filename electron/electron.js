/*
 * @Author: 李星阳
 * @Date: 2021-11-28 13:30:34
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-06 21:12:20
 * @Description: 
 */
// electron/electron.js
const { default: installExtension, VUEJS3_DEVTOOLS } = require('electron-devtools-installer');
const path = require('path');
const { app, BrowserWindow } = require('electron');
const isDev = process.env.IS_DEV == "true" ? true : false;

// ▼测试
var http=require('http');
var fs = require('fs');
var url = require('url');

// console.log('__dirname\n', __dirname);
var exePath = path.dirname(app.getPath('exe'));
console.log('exe位置：★★★★', exePath);

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
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


//创建服务器
http.createServer(function(request, response) {
    console.log('请求来了★★★★★★★★★★★★★★★★★★★★');
    console.log(request.url);
    //解析请求，包括文件名
    var pathname = 'D:/天翼云盘同步盘/English dictation/开言英语/A Party Invitation.mp3';
    //从文件系统中都去请求的文件内容
    fs.readFile(pathname, function(err, data) {
        if(err) {
            response.writeHead(404, {'Content-Type': 'text/html'});
        } else {
            response.writeHead(200,{'Content-Type': 'audio/mpeg'});
            response.write(data);
        }
        //发送响应数据
        response.end();
    });
}).listen(8899);