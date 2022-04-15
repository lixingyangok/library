<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-04-15 15:52:27
 * @Description: 
-->

<template>
    <section class="welcome-page" >
        <h1 class="big-title" >
            十年大计-{{$store.state.userInfo.name}}
        </h1>
        <p>
            待办：句子的时间精确到小数后2位即可，
        </p>
        <!-- ▲大标题 -->
        <!-- ▼进行中 -->
        <section class="first-list" >
            <el-table :data="aPending" stripe border>
                <el-table-column label="文件夹">
                    <template #default="scope">
                        <p class="folder-name">{{scope.row.nameShort}} </p>
                        <p class="the-first">{{scope.row.oFirst.name}} </p>
                    </template>
                </el-table-column>
                <el-table-column prop="sRate" label="完成率1" width="100"/>
                <el-table-column prop="fPercent" label="完成率2" width="230" >
                    <template #default="scope">
                        <el-progress :percentage="scope.row.fPercent" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="190">
                    <template #default="scope">
                        <el-button type="text" @click="goToLounge(scope.row)" >
                            继续学习
                        </el-button>
                        <el-button type="text" @click="goFolder(scope.row)" >
                            访问目录
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
        this.getToday();
    },
    methods: {
        ...oMethods,
    },
};

</script>

<style scoped src="./style/welcome.scss" lang="scss">
</style>