import { getFolderKids } from '../../../common/js/fs-fn';
import {SubtitlesStr2Arr} from '../../../common/js/pure-fn.js';
import {getTubePath} from '../../../common/js/common-fn.js';


const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
// console.log('●\n', path.extname('aa.Txt'));

const fnAboutDB = {
    choseRoot(sCurRoot) {
        this.aPath = [sCurRoot];
    },
    // ▼查询所有媒体文件夹数据
    async getMediaHomesArr(){
        const aRes = await Promise.all([
            fnInvoke('db', 'getMediaHomes'),
            fnInvoke('db', 'getLineInfo'),
        ]);
        if (!aRes[0] && !aRes[1]) return;
        this.oMediaHomes = aRes[0].reduce((oResult, oCur)=>{
            oResult[oCur.dir] = oCur.count;
            return oResult;
        }, {});
        this.oLineMap = aRes[1].reduce((oResult, oCur)=>{
            oResult[oCur.hash] = oCur.count;
            return oResult;
        }, {});
    },
    // ▼弹出1级窗口-树
    showDialog(sPath){
        this.dialogVisible = true;
        this.aFolders = [];
        this.setTreeList(sPath);
    },
    // ▼插入1级窗口的树
    async setTreeList(sPath) {
        console.time('拿树');
        const obj = await getTree(sPath);
        console.timeEnd('拿树');
        if (!obj) return;
        const treeArr = [{
            label: sPath,
            sPath: obj.sPath,
            hasMedia: obj.hasMedia,
            children: treeObj2Arr(obj.children),
        }];
        this.aFolders = treeArr;
    },
    // ▼打开2级窗口————查询某个目录
    async checkFolder(oInfo){
        this.bMediaDialog = true;
        this.aFolderMedia = await getFolderKids(oInfo.sPath);
        for (const [idx, oMedia] of this.aFolderMedia.entries()) {
            if (idx % 3) this.getOneMediaInfoFromDB(oMedia);
            else await this.getOneMediaInfoFromDB(oMedia);
        }
    },
    // ▼查询【某1个媒体】在DB中的信息
    async getOneMediaInfoFromDB(oMedia){
        const hash = await fnInvoke('getHash', oMedia.sPath);
        const res = await fnInvoke('db', 'getMediaInfo', hash);
        oMedia.hash = hash;
        oMedia.iStatus = res ? 1 : 0;
    },
    // ▼将某个文件夹内的媒体逐个保存媒体到DB
    async saveOneByOne(){
        const allHasHash = this.aFolderMedia.every(cur=>cur.hash);
        if (this.aFolderMedia.length && !allHasHash) {
            return console.log('没有加载完');
        }
        let idx = -1;
        while (++idx < this.aFolderMedia.length){
            const oMedia = this.aFolderMedia[idx];
            if (!oMedia.hash) continue;
            if (!this.oLineMap[oMedia.hash]) {
                this.saveLines(oMedia);
            }
            if (oMedia.iStatus==1) return; // 不再重试保存
            const arr = oMedia.sPath.split('/');
            const oInfo = await fnInvoke('db', 'saveMediaInfo', {
                hash: oMedia.hash,
                name: arr.slice(-1)[0],
                dir: arr.slice(0, -1).join('/'),
            });
            if (!oInfo) throw '保存未成功';
            oMedia.iStatus = 1;
        }
        await this.getMediaHomesArr();
        this.setTreeList(this.aFolders[0].sPath);
    },
    async saveLines(oMedia){
        const {hash, srt} = oMedia;
        const res01 = await fetch(getTubePath(srt)).catch((err)=>{
            console.log('字幕不存在\n', err);
        });
        if (!res01) return; // 查字幕文件不成功
        const sSubtitles = await res01.text();
        const srtArr = SubtitlesStr2Arr(sSubtitles);
        if (!srtArr) return console.log('文本转为数据未成功\n');
        srtArr.forEach(cur => cur.hash = hash);
        const res = await fnInvoke('db', 'saveLine', srtArr);
        if (!res) return;
        this.oLineMap[hash] = 1;
    },
};

const oAboutTree = {
    // ▼处理用户变更目录
    getDirChildren() {
        const { setFileList } = this;
        console.log('路径变化了：加载目录');
        this.aTree.splice(this.aPath.length, Infinity);
        for (const [idx] of this.aPath.entries()) {
            const sPath = this.aPath.slice(0, idx + 1).join('/');
            const aItems = fs.readdirSync(sPath);
            if (!aItems) return;
            setFileList(idx, sPath, aItems);
        }
    },
    // ▼
    async setFileList(idx, sDir, aItems) {
        let [a01, a02, a03] = [[], [], []];
        const oSrtFiles = {};
        const aPromises = aItems.map(async (sItem, idx) => {
            const sCurPath = `${sDir}/${sItem}`;
            const oStat = await fsp.stat(sCurPath);;
            const isDirectory = oStat.isDirectory();
            const oItem = { sItem, isDirectory };
            if (isDirectory) {
                oItem.hasMedia = await findMedia(sCurPath);
                return a01.push(oItem);
            }
            const isMedia = await checkFile(sCurPath, oConfig.oMedia);
            if (isMedia) {
                oItem.isMedia = true;
                const sSrtFile = sCurPath.split('.').slice(0, -1).join('.') + '.srt';
                const oStat = fs.statSync(sSrtFile, { throwIfNoEntry: false });
                if (oStat) {
                    oItem.srt = sSrtFile;
                    oSrtFiles[sSrtFile] = true;
                }
                return a02.push(oItem);
            }
            await checkFile(sCurPath) && a03.push(oItem);
        });
        await Promise.all(aPromises);
        a03 = a03.filter(cur => {
            return !oSrtFiles[`${sDir}/${cur.sItem}`];
        });
        [a01, a02, a03].forEach(curArr => {
            curArr.sort((aa, bb)=>{
                const [a1, a2=0] = (aa?.sItem || '').match(/\d+/g) || [];
                const [b1, b2=0] = (bb?.sItem || '').match(/\d+/g) || [];
                if (a1 && b1) {
                    return (a1*999 + a2*1) - (b1*999 + b2*1);
                }
                return aa.sItem.localeCompare(bb.sItem);
            });
        });
        const arr = [...a01, ...a02, ...a03];
        this.aTree.splice(idx, 1, arr);
    },
    // ▼点击文件夹
    async ckickTree(i1, i2) {
        const {isDirectory, sItem} = this.aTree[i1][i2];
        if (isDirectory) {
            return this.aPath.splice(i1 + 1, Infinity, sItem);
        }
        const sFilePath = `${this.aPath.join('/')}/${sItem}`;
        const isMedia = await checkFile(sFilePath, oConfig.oMedia)
        if (!isMedia) return;
        this.goToLearn(sFilePath);
    },
    // ▼跳转到学习页
    goToLearn(sFilePath) {
        console.log(sFilePath);
        ls('sFilePath', sFilePath);
        this.$router.push({ name: 'studyLounge' });
    },
};

export default {
    ...fnAboutDB,
    ...oAboutTree,
};

async function checkFile(sFilePath, oFileType=oConfig.oFileType) {
    const sTail = path.extname(sFilePath).toLowerCase();
    if (!oFileType[sTail]) return;
    const oStat = await fsp.stat(sFilePath);
    return !oStat.isDirectory();
}

// ▼查询目录是否为【媒体文件夹】
async function findMedia(sPath, oTarget) {
    const oStat = await fsp.stat(sPath);
    if (!oStat.isDirectory()) return 0;
    let iSum = 0;
    const aDirKids = await fsp.readdir(sPath);
    const arr = aDirKids.map(async sCur=>{
        const isMedia = await checkFile(`${sPath}/${sCur}`, oConfig.oMedia);
        if (isMedia) iSum++;
    });
    await Promise.all(arr);
    // if (oTarget) oTarget.obj[oTarget.key] = iSum;
    return iSum;
}

async function getTree(sPath) {
    const oStat = await fsp.stat(sPath);
    if (!oStat.isDirectory()) return;
    const aDirKids = await fsp.readdir(sPath);
    if (!aDirKids.length) return;
    const children = {};
    const aPromises = [findMedia(sPath)].concat(
        aDirKids.map(async sCur => {
            const obj = await getTree(`${sPath}/${sCur}`);
            if (obj) children[sCur] = obj;
        })
    );
    const [hasMedia] = await Promise.all(aPromises);
    const iKeys = Object.keys(children).length;
    if (!hasMedia && !iKeys) return;
    return { hasMedia, children, sPath };
}

function treeObj2Arr(obj){
    if (!obj) return [];
    const arr = [];
    for (const [label, oInfo] of Object.entries(obj)){
        if (!oInfo) continue;
        const children = treeObj2Arr(oInfo.children).sort((aa,bb)=>{
            // const [a1, a2=0] = (aa?.label || '').match(/\d+/g) || [];
            // const [b1, b2=0] = (bb?.label || '').match(/\d+/g) || [];
            // if (a1 && b1) {
            //     return (a1*999 + a2*1) - (b1*999 + b2*1);
            // }
            return aa.label.localeCompare(bb.label);
        });
        arr.push({
            label,
            sPath: oInfo.sPath,
            hasMedia: oInfo.hasMedia,
            children,
        });
    }
    return arr;
}
