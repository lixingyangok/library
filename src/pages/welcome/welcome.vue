<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-04-14 10:02:27
 * @Description: 
-->

<template>
    <section class="welcome-page" >
        <h1 class="top-one" >
            十年大计-{{$store.state.userInfo.name}}
        </h1>
        <section class="first-list" >
            <el-table :data="aPending" stripe border>
                <el-table-column prop="nameShort" label="文件夹" />
                <el-table-column prop="len" label="数量" width="90" />
                <el-table-column label="操作" width="130">
                    <template #default="scope">
                        <el-button type="text" @click="goFolder(scope.row)" >
                            跳转
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </section>
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
            oPending: {},
            aPending: [],
        };
    },
    created(){
        this.getPendingList();
    },
    methods: {
        ...oMethods,
    },
};

</script>

<style scoped src="./style/welcome.scss" lang="scss">
</style>