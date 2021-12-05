import {reactive, toRefs} from 'vue';
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
    getAllDirbyFilename(dir) {
        // const fn = this.getAllDirbyFilename;
        let aItems = fs.readdirSync(dir); // 该文件夹下的所有文件名称 (文件夹 + 文件)
        var a1 = [];
        var a2 = [];
        aItems.forEach(sItem => {
            const filePath = dir + '/' + sItem; // 当前文件 | 文件夹的路径
            let isDirectory;
            try {
                isDirectory = fs.statSync(filePath).isDirectory();
                if (isDirectory) {
                    a1.push(sItem);
                } else if (this.checkFile(filePath)) {
                    a2.push(sItem);
                } else {
                    return;
                }
            } catch (err) {
                console.log('判断是否为文件夹出错：\n', err);
            }
        });
        this.aFolders = a1;
        this.aFiles = a2;
    },
};

export default function () {
    return { ...fn01 };
};

export function shelfFn01() {
    console.log('书架页 setup ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■');
    let aDisks = reactive(document.body.disks);
    const addOne = ()=>{
        console.log('addOne 执行了●●●●●●●●');
        aDisks.push(aDisks.length + 1);
    };
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
        addOne,
    }));
}

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

