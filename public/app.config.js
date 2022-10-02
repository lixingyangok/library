/*
 * @Author: 李星阳
 * @Date: 2021-12-04 14:52:15
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-10-01 10:59:53
 * @Description: 
 */

window.oConfig = (function(){
    const aMedia = [
        '.mp4', // 视频
        '.mp3', '.ogg', '.m4a', '.acc', '.aac', // 音频
    ];
    const aOthers = ['.srt', '.pdf'];
    const aFileType = aMedia.concat(aOthers);
    const oMedia = aMedia.reduce((oResult, sCur)=>{
        return {...oResult, [sCur]: true};
    }, {});
    const oFileType = aFileType.reduce((oResult, sCur)=>{
        return {...oResult, [sCur]: true};
    }, {});
    return {
        oMedia,
        oFileType,
        aRoot: [
            'D:/天翼云盘同步盘/English Story',
            'D:/天翼云盘同步盘/English dictation',
            'D:/English',
        ],
        sTempDir: 'D:/Program Files (gree)/my-library/temp-data/',
        equipment: 'home',
    };
})();



