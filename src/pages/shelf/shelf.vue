<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-22 12:20:40
 * @Description: 
-->

<template>
    <section class="outer" >
        <h2>{{aDisks}}</h2>
        <ul>
            <li v-for="(cur, idx) of oConfig.aRoot" :key="idx"
                @click="choseRoot(cur)"
            >
                {{cur}}
            </li>
        </ul>
        <br/>
        <h2>当前浏览：{{aPath.join('/')}}</h2>
        <br/>
        <!-- ▼宝库 -->
        <article class="directory-list" >
            <ul v-for="(aColumn, i1) of aTree" :key="i1">
                <li v-for="(cur, i2) of aColumn" :key="i2"
                    @click="ckickTree(i1, i2, cur)"
                    :class="{active: cur.sItem == aPath[i1+1]}"
                >
                    <i v-if="cur.isDirectory"
                        class="folder-mark fas fa-folder"
                        :class="{'has-media': cur.hasMedia}"
                    />
                    <i v-else-if="cur.isMedia" class="fas fa-circle"
                        :class="cur.srt ? '' : 'no-match'"
                    />
                    {{cur.sItem}}
                </li>
            </ul>
        </article>
    </section>
</template>

<script>
import oMethods from './js/shelf.js';

export default {
    name: "shelf",
    data(){
        return {
            aDisks: document.body.disks,
            oConfig: window.oConfig,
            aPath: [window.oConfig.aRoot[0]],
            aTree: [],
        };
    },
    mounted(){
        setTimeout(()=>{
            this.test01()
        }, 999);
    },
    watch: {
        aPath: {
            deep: true,
            immediate: true,
            handler(aNewVal){
                this.getDirChildren();
            },
        },
    },
    methods: {
        ...oMethods,
    },
};
</script>

<style scoped src="./style/shelf.scss" lang="scss">
</style>


