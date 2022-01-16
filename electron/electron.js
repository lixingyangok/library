/*
 * @Author: 李星阳
 * @Date: 2021-11-28 13:30:34
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-16 20:07:42
 * @Description: 
 */

// ▼库导入
const path = require('path');
const { app, BrowserWindow } = require('electron');
const { default: installExtension, VUEJS3_DEVTOOLS } = require('electron-devtools-installer');
// ▼自定义导入
const {makeChannels} = require('./others/communication.js');
const {protocolRegister, protocolFnSetter} = require('./others/protocol-maker.js');
const {db, initDataBase} = require('./database/init-db.js');
// ▼其它声明
const isDev = process.env.IS_DEV == "true" ? true : false;
const exePath = path.dirname(app.getPath('exe'));


// ▼其它
if (!exePath) console.log('exe位置 =', exePath);
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
global.toLog = ()=>null;
global.db = db;


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
    global.toLog = (...rest) => {
        mainWindow.webContents.send('logInBrower', ...rest);
    };
    // and load the index.html of the app.
    // win.loadFile("index.html");
    let sURL = `file://${path.join(__dirname, '../dist/index.html')}`;
    if (isDev) sURL = 'http://localhost:3000';
    mainWindow.loadURL(sURL);
    if (!isDev) return;
    mainWindow.webContents.openDevTools(); // Open the DevTools.
}

// ▼要放在 app.whenReady 之前执行，只能执行一次
protocolRegister();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // ▼创建窗口
    createWindow();
    makeChannels();
    protocolFnSetter();
    initDataBase();
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
        db.close();
    }
});


