/*
 * @Author: 李星阳
 * @Date: 2022-01-22 19:31:55
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-07-30 12:54:41
 * @Description: 与文件夹/文件相关的方法（纯函数）
 */
// 本包将来可修改为，提供数据查询的包

import {mySort} from './common-fn.js';
import {secToStr} from './pure-fn.js';
const fsp = require('fs').promises;
const path = require('path');


// ▼查询：某文件夹内的媒体文件与配对的字幕文件
export async function getFolderKids(sPath){
    const oStat = await fsp.stat(sPath);
    if (!oStat.isDirectory()) return;
    const aKids = await fsp.readdir(sPath);
    const aResultArr = [];
    const aPromises = aKids.map(async sFile => {
        const sTail = path.extname(sFile).toLowerCase();
        if (!oConfig.oMedia[sTail]) return;
        const sCurFile = `${sPath}/${sFile}`;
        const oStat = await fsp.stat(sCurFile);
        if (oStat.isDirectory()) return;
        const oItem = {
            name: sFile,
            sPath: sCurFile,
            isMedia: true,
        };
        const spouse = sFile.split('.').slice(0, -1).join('.') + '.srt';
        if (aKids.includes(spouse)) oItem.srt = `${sPath}/${spouse}`;
        aResultArr.push(oItem);
    });
    await Promise.all(aPromises);
    mySort(aResultArr, 'name');
    // console.log('aResult\n', aResult.$dc());
    return aResultArr;
}

// ▲这上下2相邻的函数内容太相似▼

// ▼查询：某文件夹内的媒体文件与配对的字幕文件
export async function getFolderChildren(sPath){
    const oStat = await fsp.stat(sPath);
    if (!oStat.isDirectory()) return;
    const aItems = await fsp.readdir(sPath);
    let [a01, a02, a03] = [[], [], []];
    const oSrtFiles = {};
    const aPromises = aItems.map(async sItem => {
        const sCurPath = `${sPath}/${sItem}`;
        const oStat = await fsp.stat(sCurPath);
        const oItem = { 
            sItem,
            sPath: sCurPath,
            isDirectory: oStat.isDirectory(), 
            isMedia: false,
            hasMedia: false,
            infoAtDb: null,
            srt: null,
            bNameRight: false, // false 表示文件名与库中记录不一致
        };
        if (oItem.isDirectory) {
            oItem.hasMedia = await findMedia(sCurPath);
            return a01.push(oItem);
        }
        const sTail = path.extname(sCurPath).toLowerCase();
        oItem.isMedia = oConfig.oMedia[sTail];
        if (oItem.isMedia) {
            const spouse = sItem.split('.').slice(0, -1).join('.') + '.srt';
            oItem.srt = aItems.includes(spouse) && `${sPath}/${spouse}`;
            oSrtFiles[oItem.srt] = !!oItem.srt;
            return a02.push(oItem);
        }
        // await checkFile(sCurPath) && a03.push(oItem);
        a03.push(oItem);
    });
    await Promise.all(aPromises);
    a03 = a03.filter(cur => {
        return !oSrtFiles[`${sPath}/${cur.sItem}`];
    });
    [a01, a02, a03].forEach(curArr => mySort(curArr, 'sItem'));
    const arr = [...a01, ...a02, ...a03];
    return arr;
}

// ▼补充媒体的字幕信息
// export async function addMediaSrt(oItem){
//     const sSrtFile = oItem.sPath.split('.').slice(0, -1).join('.') + '.srt';
//     const oStat = await fsp.stat(sSrtFile).catch(()=>false);
//     if (oStat) oItem.srt = sSrtFile;
//     return oItem;
// }

export async function addAllMediaDbInfo(arr, oneByOne){
    if (!arr) return;
    for (const [idx, oMedia] of arr.entries()) {
        if (!oMedia.isMedia) continue;
        if ((idx % 3) && !oneByOne) AaddMediaInfoFromDB(oMedia);
        else await AaddMediaInfoFromDB(oMedia);
    }
}

// ▼查询【某1个媒体】在DB中的信息
export async function AaddMediaInfoFromDB(oMedia){
    const hash = await fnInvoke('getHash', oMedia.sPath);
    const res = await fnInvoke('db', 'getMediaInfo', {hash});
    oMedia.hash = hash;
    if (!res?.[0]) return;
    oMedia.infoAtDb = res[0];
    oMedia.bNameRight = oMedia.sPath == ( // 记录文件位置&名称是否与库中记录的一样
        `${res[0].dir}/${res[0].name}`
    );
}

// ▼查询是否为媒体文件
export async function checkFile(sFilePath, oFileType=oConfig.oFileType) {
    const sTail = path.extname(sFilePath).toLowerCase();
    if (!oFileType[sTail]) return;
    const oStat = await fsp.stat(sFilePath);
    return !oStat.isDirectory();
}

// ▼查询目录是否为【媒体文件夹】
export async function findMedia(sPath, oTarget) {
    const oStat = await fsp.stat(sPath);
    if (!oStat.isDirectory()) return 0;
    let iSum = 0;
    const aDirKids = await fsp.readdir(sPath);
    const arr = aDirKids.map(async sCur=>{
        const isMedia = await checkFile(`${sPath}/${sCur}`, oConfig.oMedia);
        if (isMedia) iSum++;
    });
    await Promise.all(arr);
    return iSum;
}

// 查询：某天/某几天 的学习数据
export async function getLearningHistory(){
    const [r01, r02] = await fnInvoke('db', 'doSql', `
        SELECT *,
            julianday('now', 'localtime') - julianday(createdAt, 'localtime') as gap
        FROM "line"
        where
            julianday('now') - julianday(date(createdAt, 'localtime')) < 1 or
            julianday('now') - julianday(date(filledAt, 'localtime')) < 1
    `);
    if (!r01) return;
    return r01;
}

// 查询：当天的学习数据
export async function getTodayHistory(){
    const arr = await getLearningHistory();
    if (!arr) return;
    const oResult = {
        iCreated: 0,
        sCrDuration: '',
        // -------------------
        iFilled: 0,
        iFilledWords: 0,
        sFiDuration: '',
    };
    let [iFiDuration, iCrDuration] = [0, 0];
    arr.forEach(cur => {
        const {filledAt, text, start, end} = cur;
        const sKey = filledAt ? 'iFilled' : 'iCreated';
        oResult[sKey]++;
        if (filledAt){
            oResult.iFilledWords += text.match(/\S+/g).length;
            iFiDuration += (end - start);
        }else{
            iCrDuration += (end - start);
        }
    });
    Object.assign(oResult, {
        sCrDuration: secToStr(iCrDuration).slice(0,8),
        sFiDuration: secToStr(iFiDuration).slice(0,8),
        iCrDuration: Number.parseInt(iCrDuration),
        iFiDuration: Number.parseInt(iFiDuration),
    });
    return oResult;
}
