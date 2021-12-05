<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-05 09:07:32
 * @Description: 
-->

<template>
    <section class="outer" >
        <p @click="showArr" >
            {{aDisks}}<br/>
            
        </p>
        {{aTest}}<br/>
        <button @click="addOne" >
            addOne
        </button>
        <br/>
        <ul>
            <li v-for="(cur,idx) of aFolders" :key="idx" >
                {{cur}}
            </li>
        </ul>
    </section>
</template>

<script>
import getMethods from './js/shelf.js';
const {exec} = require('child_process'); 

export default {
    name: "shelf",
    setup(){
        
    },
    data(){
        return {
            aRoot: ['●●', '■■'],
            aDisks: ['aaa', 'bbb'],
            aFolders: [],
            aTest: [1,2,3],
        };
    },
    created(){
        console.log('书架页：created ★★★★★★★★★★');
        console.log('旧值001：', this.aRoot.$dc());
        // this.getRoot();
        this.setDisks();
        this.getAllDirbyFilename('d:/天翼云盘同步盘/English dictation');
        this.aTest = [4,5,6];
        // setTimeout(()=>{
        //     console.log('延时赋值');
        //     this.aTest = [7, 8, 9];
        // }, 2* 1000);
    },
    methods: {
        ...getMethods(),
        showArr(){
            console.log('旧值：', this.aDisks.$dc());
        },
        addOne(){
            console.log('旧值：', this.aRoot.$dc());
            this.aRoot.push(123);
        },
        changeArr(arr){
            console.log('旧值：', this.aRoot.$dc());
            this.aRoot.splice(0, Infinity, ...arr);
            // this.aRoot = arr;
            console.log('赋值后：', this.aRoot.$dc());
            console.log('赋值目标', this.aRoot);
        },
        async setDisks(){
            const arr = await getDiskList();
            console.log('盘符：', arr.$dc());
            this.aDisks.splice(0, Infinity, ...arr);
            this.aRoot= [111,222];
            this.aFolders= [888, 999];
            this.aTest = [7, 8, 9];
        },
        getRoot(){
            const this_ = this;
            const {changeArr} = this;
            this_.changeArr([new Date().toString(), new Date().toString()])
            exec('wmic logicaldisk get name', function(error, stdout, stderr){
                if (error || stderr) {
                    if (error) console.error(`出错了: ${error}`);
                    console.error(`系统命令出错: ${error}`);
                    return;
                }
                console.log('系统分区查询到：', stdout.split(/\s+/g));
                const arr = stdout.match(/\S+/g).slice(1);
                changeArr(arr);
            });
        },

    },
};

function getDiskList(){
    let fnResolve;
    let fnReject;
    const oPromise = new Promise((f1, f2)=>{
        fnResolve = f1;
        fnReject = f2;
    });
    exec('wmic logicaldisk get name', function(error, stdout, stderr){
        if (error || stderr) {
            if (error) console.error(`出错了: ${error}`);
            console.error(`系统命令出错: ${error}`);
            return fnReject(error || stderr);
        }
        console.log('系统分区查询到：', stdout.split(/\s+/g));
        const arr = stdout.match(/\S+/g).slice(1);
        fnResolve(arr);
    });
    return oPromise;
}

</script>

<style src="./style/shelf.scss" lang="scss">
</style>

