/*
 * @Author: 李星阳
 * @Date: 2021-12-04 14:52:15
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-06 16:45:44
 * @Description: 
 */

window.oConfig = (function(){
    const aMedia = [
        '.mp4',
        '.mp3', '.ogg', '.m4a',
    ];
    const aOthers = ['.srt', '.pdf'];
    return {
        aRoot: [
            'D:/天翼云盘同步盘/English dictation',
            'D:/English',
        ],
        aFileType: [...aMedia, ...aOthers],
        aMedia,
    };
})();



