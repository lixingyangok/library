
const fs = require('fs');
var child_process = require("child_process");
const { ipcRenderer } = require('electron');
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
    runBat(){
        // const sBatPath = 'C:/Users/lixin/Desktop/关屏幕-知乎.bat';
        const sBatPath = '关屏幕-知乎.bat';
        const obj = {cwd: 'C:/Users/lixin/Desktop'};
        const {showScreen} = this;
        const This = this;
        This.aLog.push('■■■调用.bat文件');
        child_process.execFile(sBatPath, null, obj, function(error, stdout, stderr){
            if(error !== null){
                console.log("exec error\n" + error);
                return;
            }
            setTimeout(()=>{
                showScreen();
            }, 3 * 1000);
            This.aLog.push('■■■关屏幕成功');
            console.log("■■■关屏幕成功");
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
        });
    },
    showScreen(){
        const sBatPath = '移动鼠标.bat';
        const obj = {cwd: 'C:/Users/lixin/Desktop'};
        const This = this;
        child_process.execFile(sBatPath, null, obj, function(error, stdout, stderr){
            if(error !== null){
                console.log("exec error" + error)
                return;
            }
            This.aLog.push('■■■移动鼠标成功');
            console.log("■■■移动鼠标成功");
        });
    },
};


// ▼执行系统命令
// child_process.exec('mspaint', function(error, stdout, stderr){
//     if (error || stderr) {
//         console.error(`出错了\n: ${error || stderr}`);
//         return;
//     }
//     This.aLog.push('■■■ 显示画图');      
// });