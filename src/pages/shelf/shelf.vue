oConfig.sRoot<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-05 17:49:10
 * @Description: 
-->

<template>
    <section class="outer" >
        <h2>{{aDisks}}</h2>
        <ul>
            <li v-for="(cur,idx) of oConfig.aRoot" :key="idx">
                {{cur}}
            </li>
        </ul>
        <br/>
        <ul>
            <li v-for="(cur,idx) of aFolders" :key="idx" >
                {{cur}}
            </li>
        </ul>
        <br/><br/>
        <ul>
            <li v-for="(cur,idx) of aFiles" :key="idx" >
                {{cur}}
            </li>
        </ul>
    </section>
</template>

<script>
import getMethods, {shelfFn01} from './js/shelf.js';

export default {
    name: "shelf",
    setup(){
        const p01 = shelfFn01();
        return {
            ...p01,
        };
    },
    data(){
        return {
            aRoot: ['●●', '■■'],
            aFolders: [],
            aFiles: [],
            aTest: ['test old val'],
            oConfig: window.oConfig,
        };
    },
    created(){
        // 
        this.getAllDirbyFilename(this.oConfig.aRoot[0]);
        this.aTest = ['test new val'];
    },
    methods: {
        ...getMethods(),
        changeArr(arr){
            console.log('旧值：', this.aRoot.$dc());
            this.aRoot.splice(0, Infinity, ...arr);
            // this.aRoot = arr;
            console.log('赋值后：', this.aRoot.$dc());
            console.log('赋值目标', this.aRoot);
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



</script>

<style src="./style/shelf.scss" lang="scss">
</style>

