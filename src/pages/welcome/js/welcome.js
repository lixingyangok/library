
import {mySort, goToLounage, getDateDiff} from '../../../common/js/common-fn.js';

const child_process = require("child_process");
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const ffmpeg = createFFmpeg({ log: true });

const oPendingDataFn = {
    async getPendingList(){
        const aList = await fnInvoke('db', 'getMediaInfo', {
            finishedAt: null,
        });
        if (!aList) return;
        const {obj, arr} = this.sortThem(aList);
        this.setListOrder(arr);
        this.oPending = obj;
        this.aPending = arr;
        this.setPercent();
    },
    sortThem(aList){
        const obj = aList.reduce((oResult, cur)=>{
            oResult[cur.dir] ||= [];
            oResult[cur.dir].push(cur);
            return oResult;
        }, {});
        const arr = Object.entries(obj).map(([sKey, oVal]) => {
            mySort(oVal, 'name');
            const oFirst = oVal[0];
            return {
                name: sKey,
                nameShort: sKey.split('/').slice(-3).join('/'),
                len: oVal.length,
                oFirst,
                sRate: '',
                fPercent: 0,
            };
        });
        return {obj, arr};
    },
    // ▼排序
    setListOrder(arr){
        arr ||= this.aPending;
        const pendingOrder = ls('pendingOrder') || {};
        arr.sort((aa, bb)=>{
            const aNumber = pendingOrder[aa.name] || -1;
            const bNumber = pendingOrder[bb.name] || -1;
            return bNumber - aNumber;
        });
    },
    // ▼计算完成率
    async setPercent(){
        for(const cur of this.aPending) {
            const arr = await fnInvoke('db', 'getMediaInfo', {
                dir: cur.name,
            });
            const iTotal = arr.length;
            const iDone = iTotal - cur.len;
            const percentVal = (iDone / iTotal * 100).toFixed(1);
            cur.sRate = `${iDone}/${iTotal}`;
            cur.fPercent = percentVal * 1;
        }
    },
    // ▼置顶
    async putToTop(oTarget){
        // console.log('oTarget', oTarget.$dc());
        ls.transact('pendingOrder', obj => {
            return {
                ...obj,
                [oTarget.name]: new Date() * 1,
            };
        });
        this.setListOrder();
    },
};

const oRecordFn = {
    async getToday(){

    }
};

const oFn_recentList = {
    delFile(oTarget){
        console.log('oTarget', );
        console.log(oTarget.$dc());
        ls.transact('oRecent', (oOldData)=>{
            Reflect.deleteProperty(oOldData, oTarget.file);
        });
        this.updateTheRecent();
    },
    updateTheRecent(){
        const oRecent = ls.get('oRecent');
        const aList = Object.entries(oRecent).map(cur=>{
            return {
                file: cur[0],
                ...cur[1],
                sTime: getDateDiff(cur[1].iTime),
            };
        });
        aList.sort((aa,bb)=>{
            return aa.iTime - bb.iTime;
        });
        this.aRecent = aList;
    },
}


const oVisitFn = {
    // ▼访问目录
    goFolder(oTarget){
        // console.log('oTarget', oTarget.$dc());
        this.$router.push({
            path: '/shelf',
            query: {
                sPath: oTarget.name,
            },
        });
    },
    // ▼访问学习页
    goToLounge(oTarget){
        const {dir, name} = oTarget;
        const sPath = `${dir}/${name}`;
        // console.log('oTarget', oTarget.oFirst.$dc());
        goToLounage(sPath);
    },
};


export default {
    ...oPendingDataFn,
    ...oRecordFn,
    ...oVisitFn,
    ...oFn_recentList,
    // ▼给主进程送信
    logFn() {
        oRenderer.send('channel01', '张三');
    },
    async showFFmpeg() {
        // D:/English video/【34集全】 • 看动画学英语 Peter Pan《彼得潘》/1.Pete(Av415205386,P1).mp4
        const sFilePath = 'tube://a/?path=' + localStorage.getItem('sFilePath');
        console.log('ffmpeg\n', ffmpeg, fetchFile);
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
        // C:/Users/lixin/Desktop/移动鼠标.bat
        console.log('计时开始01', new Date().toLocaleString());
        const sBatPath = '移动鼠标.bat';
        const obj = {cwd: 'C:/Users/lixin/Desktop'};
        const This = this;
        setTimeout(()=>{
            console.log('计时开始02', new Date().toLocaleString());
            child_process.execFile(sBatPath, null, obj, function(error, stdout, stderr){
                if(error !== null){
                    console.log("exec error" + error)
                    return;
                }
                This.aLog.push('■■■移动鼠标成功');
                console.log("■■■移动鼠标成功");
                console.log('计时开始03', new Date().toLocaleString());
            });
        }, 72_000);
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