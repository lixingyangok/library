<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-04 15:15:24
 * @Description: 
-->

<template>
    <section class="outer" >
        <h1>
            welcome
        </h1>
        <ul>
            <li v-for="(cur,idx) of aRoot" :key="idx" 
                @click="getAllDirbyFilename(cur)"
            >
                {{cur}}
            </li>
        </ul>
    </section>
</template>

<script>
const exec = require('child_process').exec; 
const fs = require('fs');

export default {
    name: "welcome",
    data(){
        return {
            aRoot: [],
        };
    },
    created(){
        exec('wmic logicaldisk get name', (error, stdout, stderr) => { 
            if (error) { 
                return console.error(`出错了: ${error}`);
            }
            const arr = stdout.match(/\S+/g).slice(1);
            this.aRoot = arr;
            // console.log('系统分区：', arr);
        });
        this.getAllDirbyFilename('D:/天翼云盘同步盘/English dictation');
        // this.getAllDirbyFilename('D:/软件shortcut');
    },
    methods: {
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
            let resultArr = [];
            var a1 = [];
            var a2 = [];
            files.forEach(file => {
                const filePath = dir + '/' + file; // 当前文件 | 文件夹的路径
                let isDirectory;
                try{
                    isDirectory = fs.statSync(filePath).isDirectory();
                    if (isDirectory) {
                        a1.push(filePath);
                    }
                    else if (this.checkFile(filePath)) {
                        a2.push(filePath);
                    }
                }catch(err){
                    if (0) console.log('err', err);
                    console.log('----出错：', filePath);
                }
                // if (isDirectory) resultArr.push(...fn(filePath));
            });
            console.log(a1);
            console.log(a2);
            return resultArr;
        },
    },
};

</script>

<style src="./style/shelf.scss" lang="scss">
</style>