<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-06 16:37:21
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
        <h2>{{aPath.join('/')}}</h2>
        <br/>
        <!-- ▼宝库 -->
        <article class="directory-list" >
            <ul v-for="(aColumn, i1) of aTree" :key="i1" >
                <li v-for="(cur, i2) of aColumn" :key="i2"
                    @click="ckickTree(i1, i2, cur)"
                >
                    {{cur.isDirectory ? '+' : ''}}{{cur.sItem}}
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
    created(){
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

<style src="./style/shelf.scss" lang="scss">
</style>


