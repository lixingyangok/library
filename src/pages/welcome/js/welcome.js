
const { ipcRenderer } = require('electron');
const fs = require('fs');
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const ffmpeg = createFFmpeg({ log: true });


export default {
    // ▼给主进程送信
    logFn() {
        ipcRenderer.send('asynchronous-message', '这个内容来自 welcome 页');
    },
    async showFFmpeg() {
        // D:/English video/【34集全】 • 看动画学英语 Peter Pan《彼得潘》/1.Pete(Av415205386,P1).mp4
        const sFilePath = 'tube://a/?path=' + localStorage.getItem('sFilePath');
        console.log('ffmpeg\n', ffmpeg);
        // await ffmpeg.load();
        // ffmpeg.FS(
        //     'writeFile',
        //     'test.avi',
        //     await fetchFile('./test.avi'),
        // );
        // await ffmpeg.run('-i', 'test.avi', 'test.mp4');
        // await fs.promises.writeFile(
        //     './test.mp4',
        //     ffmpeg.FS('readFile', 'test.mp4')
        // );
        // process.exit(0);
    },
};

