import {reactive, toRefs} from 'vue';
import { readdir } from 'fs/promises';
const fs = require('fs');
const {exec} = require('child_process'); 

const fn01 = {
    checkFile(sFilePath) {
        for (let cur of window.oConfig.aFileType) {
            if (sFilePath.toLowerCase().endsWith(cur)) {
                return true;
            }
        }
    },
    async getAllDirbyFilename(sDir) {
        const aItems = await readdir(sDir); // 该文件夹下的所有文件名称 (文件夹 + 文件)
        const [a1, a2] = [[], []];
        aItems.forEach(sItem => {
            const sCurPath = sDir + '/' + sItem;
            try {
                const isDirectory = fs.statSync(sCurPath).isDirectory();
                const obj = { sItem, isDirectory };
                if (isDirectory) {
                    a1.push(obj);
                } else if (this.checkFile(sCurPath)) {
                    a2.push(obj);
                }
            } catch (err) {
                console.log('判断是否为文件夹出错：\n', err);
            }
        });
        this.aFolders = [...a1, ...a2];
    },
};

export default {
    ...fn01,
};

// ▼暂时弃用 ---------------------------------------------------

function getDiskList(){
    let fnResolve;
    let fnReject;
    const oPromise = new Promise((f1, f2)=>{
        fnResolve = f1;
        fnReject = f2;
    });
    exec('wmic logicaldisk get name', function(error, stdout, stderr){
        if (error || stderr) {
            if (error) console.error(`出错了: ${error}`);
            console.error(`系统命令出错: ${error}`);
            return fnReject(error || stderr);
        }
        console.log('系统分区：', stdout.split(/\s+/g));
        const arr = stdout.match(/\S+/g).slice(1);
        fnResolve(arr);
    });
    return oPromise;
}

function shelfFn01() {
    console.log('书架页 setup ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■');
    let aDisks = reactive(document.body.disks);
    const setDisks = async ()=>{
        console.log('开始 setDisks');
        const a1 = Math.random() > 0.5 ? ['成功'] : false;
        if (a1){
            console.log('免 await 预计【成功++】');
        }else{
            console.log('预计【失败】');
        }
        const arr = a1 || await getDiskList().catch(err=>{
            console.log('没有盘符：', err);
        });
        console.log('等到盘符：', arr.$dc());
        // aDisks.splice(0, Infinity, ...arr);
        new Promise(f1=>{
            setTimeout(()=>{
                console.log('1秒之后');
                f1();
            }, 1000)
        }).then(res=>{
            aDisks.splice(0, Infinity, ...['1钞之后']);
        });
        // aDisks = [44,55];
        // aDisks.splice(0, Infinity, ...arr);
    };
    return toRefs(reactive({
        aDisks, 
        setDisks,
    }));
}

const aa = {
    changeArr(arr){
        console.log('旧值：', this.aRoot.$dc());
        this.aRoot.splice(0, Infinity, ...arr);
        // this.aRoot = arr;
        console.log('赋值后：', this.aRoot.$dc());
        console.log('赋值目标', this.aRoot);
    },
    getRoot(){
        const this_ = this;
        const {changeArr} = this;
        this_.changeArr([new Date().toString(), new Date().toString()])
        exec('wmic logicaldisk get name', function(error, stdout, stderr){
            if (error || stderr) {
                if (error) console.error(`出错了: ${error}`);
                console.error(`系统命令出错: ${error}`);
                return;
            }
            console.log('系统分区查询到：', stdout.split(/\s+/g));
            const arr = stdout.match(/\S+/g).slice(1);
            changeArr(arr);
        });
    },
};
