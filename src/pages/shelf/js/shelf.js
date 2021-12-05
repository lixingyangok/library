
const fs = require('fs');

const fn01 = {
    checkFile(sFilePath){
        for (let cur of window.oConfig.aFileType) {
            if (sFilePath.toLowerCase().endsWith(cur)) {
                return true;
            }
        }
    },
    getAllDirbyFilename(dir) {
        // const fn = this.getAllDirbyFilename;
        let files = fs.readdirSync(dir); // 该文件夹下的所有文件名称 (文件夹 + 文件)
        var a1 = [];
        var a2 = [];
        files.forEach(file => {
            const filePath = dir + '/' + file; // 当前文件 | 文件夹的路径
            let isDirectory;
            try{
                isDirectory = fs.statSync(filePath).isDirectory();
                if (isDirectory) {
                    a1.push(filePath);
                } else if (this.checkFile(filePath)) {
                    a2.push(filePath);
                }else{
                    return;
                }
            }catch(err){
                console.log('不是文件夹：', filePath);
                console.log('判断是否为文件夹出错：\n', err);
            }
        });
        this.aFolders.push(new Date().toString());
        this.aFolders.push(...a1);
    },
};

export default function() {
    return {...fn01};
};


