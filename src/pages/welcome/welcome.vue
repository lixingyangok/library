<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-04 00:26:40
 * @Description: 
-->

<template>
    <section class="welcome-page" >
        <h1 class="top-one" >
            十年大计-{{$store.state.userInfo.name}}
        </h1>
        <div class="welcome" >
            <button @click="logFn" >
                给主进程送信
            </button>
            <button @click="showFFmpeg" >
                showFFmpeg
            </button>
            <button @click="runBat" >
                runBat01
            </button>
            <button @click="showScreen" >
                定时唤醒
            </button>
        </div>
        <h4>
            本周新增：xxxx句
        </h4>
        <h4>
            本周录入：xxxx句
        </h4>
        <myInputing/>
    </section>
    <ul>
        <li v-for="(cur,idx) of aLog" :key="idx" >
            {{cur}}
        </li>
    </ul>
</template>

<script>
import oMethods from './js/welcome.js';
import myInputing from '../study-lounge/inputing.vue';

export default {
    name: "welcome",
    components:{
        myInputing,
    },
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