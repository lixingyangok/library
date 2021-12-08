
const { ipcRenderer } = require('electron');

export default {
    logFn(){
        // const v1 = ipcRenderer.sendSync('synchronous-message', 'ping1');
        // console.log(v1); // prints "pong"

        ipcRenderer.on('asynchronous-reply', (event, arg) => {
            console.log('渲染页收到回复：'); // prints "pong"
            console.log(arg); // prints "pong"
        });
        ipcRenderer.send('asynchronous-message', 'ping2');
    },
};

