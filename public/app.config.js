/*
 * @Author: 李星阳
 * @Date: 2021-12-04 14:52:15
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-15 21:11:15
 * @Description: 
 */

window.oConfig = (function(){
    const aMedia = [
        '.mp4',
        '.mp3', '.ogg', '.m4a',
    ];
    const aOthers = ['.srt', '.pdf'];
    return {
        aMedia,
        aFileType: [...aMedia, ...aOthers],
        aRoot: [
            'D:/天翼云盘同步盘/English dictation',
            'D:/English',
        ],
        sTempDir: 'D:/Program Files (gree)/my-library/temp-data/',
        equipment: 'home',
    };
})();



