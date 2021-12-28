<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-27 21:35:38
 * @Description: 
-->

<template>
    <section >
        <h1 class="welcome top-one" >
            十年大计
        </h1>
        <h1 class="welcome" >
            Welcome
            {{$store.state.userInfo.name}}
            <br/>
            <button @click="logFn" >
                给主进程送信
            </button>
            <br/>
            <button @click="showFFmpeg" >
                showFFmpeg
            </button>
            <br/>
            <button @click="runBat" >
                runBat01
            </button>
        </h1>
    </section>
    <ul>
        <li v-for="(cur,idx) of aLog" :key="idx" >
            {{cur}}
        </li>
    </ul>
</template>

<script>
import oMethods from './js/welcome.js';

export default {
    name: "welcome",
    data(){
        return {
            aRoot: [],
            aLog: [],
        };
    },
    created(){

    },
    methods: {
        ...oMethods,
    },
};

</script>

<style scoped src="./style/welcome.scss" lang="scss">
</style>