/*
 * @Author: 李星阳
 * @Date: 2022-01-22 19:31:55
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-30 11:21:39
 * @Description: 与文件夹/文件相关的方法（纯函数）
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

// ▼查询：某文件夹内的媒体文件与配对的字幕
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
        };
        const spouse = sFile.split('.').slice(0, -1).join('.') + '.srt';
        if (aKids.includes(spouse)) oItem.srt = `${sPath}/${spouse}`;
        aResultArr.push(oItem);
    });
    await Promise.all(aPromises);
    // console.log('aResult\n', aResult.$dc());
    return aResultArr;
}







