/*
 * @Author: 李星阳
 * @Date: 2022-01-22 19:31:55
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-22 20:40:32
 * @Description: 与文件夹/文件相关的方法（纯函数）
 */

const fs = require('fs');
const fsp = require('fs').promises;

export async function getFolderKids(sPath){
    const oStat = await fsp.stat(sPath);//.isDirectory();
    if (!oStat.isDirectory()) return;
    const aKids = await fsp.readdir(sPath);
    const oKids = aKids.reduce((oResult, sCur)=>{
        oResult[sCur] = {};
        return oResult;
    }, {});
    const aPromises = Object.entries(oKids).map(async (cur, idx) => {
        const [sFile, oItem] = cur;
        const sCurFile = `${sPath}/${sFile}`;
        const oStat = await fsp.stat(sCurFile);
        if (oStat.isDirectory()) return;
        const bMedia = oConfig.aMedia.some(sTail => {
            return sCurFile.toLowerCase().endsWith(sTail);
        });
        if (!bMedia) return;
        oItem.sPath = sCurFile;
        const spouse = sFile.split('.').slice(0, -1).join('.') + '.srt';
        if (oKids[spouse]) oItem.srt = `${sPath}/${spouse}`;
    });
    await Promise.all(aPromises);
    console.log('oKids\n', oKids.$dc());
}





