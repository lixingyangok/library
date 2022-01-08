/*
 * @Author: 李星阳
 * @Date: 2021-11-28 13:30:34
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-08 19:08:33
 * @Description: 
 */
// electron/electron.js
const fs = require('fs');
const path = require('path');
const urlib = require("url");
const { default: installExtension, VUEJS3_DEVTOOLS } = require('electron-devtools-installer');
const {
    app, BrowserWindow, protocol, ipcMain,
} = require('electron');


const exePath = path.dirname(app.getPath('exe'));
const isDev = process.env.IS_DEV == "true" ? true : false;



console.log('■■■■■■■■■■■■■■■■\nexe位置 =', exePath);
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
let toLog = ()=>{};

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true, // 值为true才能使用 require()
            contextIsolation: false, // 官网似乎说是默认false，但是这里必须设置contextIsolation
        },
    });
    toLog = (...rest) => {
        mainWindow.webContents.send('asynchronous-reply', ...rest);
    };
    // and load the index.html of the app.
    // win.loadFile("index.html");
    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../dist/index.html')}`
    );
    
    if (!isDev) return;
    mainWindow.webContents.openDevTools(); // Open the DevTools.
}

ipcMain.on('asynchronous-message', (event, arg) => {
    toLog('主进程收信了：\n', arg);
    // const sReturn = arg + '★返回';
    // toLog('■■■■■■■■■■■■■■■■■■■■■\n这个内容是主进程收信后返回的');
    // event.reply('asynchronous-reply', sReturn);
});

// ▼设定一个通道用于接收窗口的来信
ipcMain.on('getSubtitlesArr', function(event, sPath) {
    fs.readFile(sPath, "utf8", (err, data)=>{
        const keyWords = 'Error: ENOENT: no such file or directory, open';
        if (err && err.message.startsWith(keyWords)){
            data = null; // null 有特殊含义，表示文件不存在
        }
        event.sender.send('getSubtitlesArrReply', data, err);
    });
});

// ▼要放在 app.whenReady 之前执行，只能执行一次
const privileges = { standard: true, secure: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true };
protocol.registerSchemesAsPrivileged([
    { scheme: 'tube', privileges },
    { scheme: 'pipe', privileges },
]);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
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
    
    // ▼创建窗口
    createWindow();
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    // ▼加载调试插件
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


