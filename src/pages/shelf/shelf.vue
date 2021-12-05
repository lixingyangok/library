<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-05 19:02:38
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
        <!-- ▼宝库 -->
        <article class="directory-list" >
            <ul>
                <li v-for="(cur,idx) of aFolders" :key="idx" >
                    {{cur.sItem}}
                </li>
            </ul>
        </article>
    </section>
</template>

<script>
import getMethods from './js/shelf.js';

export default {
    name: "shelf",
    data(){
        return {
            aDisks: document.body.disks,
            aFolders: [],
            oConfig: window.oConfig,
        };
    },
    created(){
        this.getAllDirbyFilename(this.oConfig.aRoot[0]);
    },
    methods: {
        ...getMethods,
    },
};
</script>

<style src="./style/shelf.scss" lang="scss">
</style>


