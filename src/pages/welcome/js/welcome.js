
const { ipcRenderer } = require('electron');

export default {
    // ▼给主进程送信
    logFn(){
        ipcRenderer.send('asynchronous-message', '这个内容来自 welcome 页');
    },
};

