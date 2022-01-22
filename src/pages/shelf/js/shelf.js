const fs = require('fs');


const fn01 = {
    choseRoot(sCurRoot){
        this.aPath = [sCurRoot];
    },
};

const oAboutTree = {
    // ▼处理用户变更目录
    getDirChildren() {
        const {setFileList} = this;
        console.log('路径变化了：加载目录');
        this.aTree.splice(this.aPath.length, Infinity);
        for (const [idx] of this.aPath.entries()){
            const sPath = this.aPath.slice(0, idx+1).join('/');
            const aItems = fs.readdirSync(sPath);
            if (!aItems) return;
            setFileList(idx, sPath, aItems);
        }
    },
    // ▼
    setFileList(idx, sDir, aItems){
        let [a01, a02, a03] = [[], [], []];
        const oSrtFiles = {};
        aItems.forEach((sItem, idx) => {
            const sCurPath = `${sDir}/${sItem}`;
            const isDirectory = fs.statSync(sCurPath).isDirectory();
            const oItem = { sItem, isDirectory };
            if (isDirectory) {
                oItem.hasMedia = findMedia(sCurPath);
                return a01.push(oItem);
            }
            const isMedia = checkFile(sCurPath, oConfig.aMedia);
            if (isMedia) {
                oItem.isMedia = true;
                const sSrtFile = sCurPath.split('.').slice(0, -1).join('.')+'.srt';
                const oStat = fs.statSync(sSrtFile, {throwIfNoEntry: false});
                if (oStat) {
                    oItem.srt = sSrtFile;
                    oSrtFiles[sSrtFile] = true;
                }
                return a02.push(oItem);
            }
            checkFile(sCurPath) && a03.push(oItem);
        });
        a03 = a03.filter(cur=>{
            return !oSrtFiles[`${sDir}/${cur.sItem}`];
        });
        const arr = [...a01, ...a02, ...a03];
        this.aTree.splice(idx, 1, arr);
    },
    // ▼点击文件夹
    ckickTree(i1, i2){
        const oAim = this.aTree[i1][i2];
        if (oAim.isDirectory){
            this.aPath.splice(i1 + 1, Infinity, oAim.sItem);
            return;
        }
        const isMedia = window.oConfig.aMedia.some(cur => {
            const sItem = oAim.sItem.toLowerCase();
            return sItem.endsWith(cur.toLowerCase());
        });
        if (!isMedia) return;
        const sFilePath = `${this.aPath.join('/')}/${oAim.sItem}`;
        this.goToLearn(sFilePath);
    },
    // ▼跳转到学习页
    goToLearn(sFilePath){
        console.log(sFilePath);
        localStorage.setItem('sFilePath', sFilePath);
        this.$router.push({name: 'studyLounge'});
    },
    // ▼
    test01(){
        const [sPath] = this.aPath;
        const obj = getTree(sPath);
        console.log('树\n', obj);
    }
};

function checkFile(sFilePath, aFileType) {
    const isDirectory = fs.statSync(sFilePath).isDirectory();
    if (isDirectory) return;
    aFileType = aFileType || oConfig.aFileType;
    for (const sCur of aFileType) {
        if (sFilePath.toLowerCase().endsWith(sCur)) {
            return true;
        }
    }
}

// ▼查询目录是否为【媒体文件夹】
function findMedia(sPath){
    const isDirectory = fs.statSync(sPath).isDirectory();
    if (!isDirectory) return 0;
    const aChildren = fs.readdirSync(sPath);
    const iResult = aChildren.reduce((iResult, sCur)=>{
        const iVal = ~~checkFile(`${sPath}/${sCur}`, oConfig.aMedia);
        return iResult + iVal;
    }, 0);
    return iResult;
}

function getTree(sPath){
    const isDirectory = fs.statSync(sPath).isDirectory();
    if (!isDirectory) return;
    const aChildren = fs.readdirSync(sPath);
    if (!aChildren.length) return;
    const hasMedia = findMedia(sPath);
    const children = aChildren.reduce((oResult, sCur)=>{
        const sThisChild = `${sPath}/${sCur}`;
        const isDirectory = fs.statSync(sThisChild).isDirectory();
        if (!isDirectory) return oResult;
        oResult = oResult || {};
        oResult[sCur] = getTree(sThisChild);
        return oResult;
    }, undefined);
    if (!hasMedia && !children) return;
    return {hasMedia, children};
}

export default {
    ...fn01,
    ...oAboutTree,
};

