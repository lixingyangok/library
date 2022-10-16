<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-10-09 21:09:23
 * @Description: 
-->

<template>
    <section class="welcome-page">
        <h1 class="big-title" >
            十年一剑&emsp;&emsp;
            <ruby>34<rt>2022</rt></ruby>
            <ruby>35<rt>2023</rt></ruby>
            <ruby>36<rt>2024</rt></ruby>
            <ruby>37<rt>2025</rt></ruby>
            <ruby>38<rt>2026</rt></ruby>
            <ruby>39<rt>2027</rt></ruby>
            <ruby>40<rt>2028</rt></ruby>
        </h1>
        <div>
            <br/>
            <button>打卡</button>
        </div>
        <!-- ▲大标题 -->
        <div class="first-list" >
            <el-table :data="aRecent" stripe border style="width: 100%;">
                <el-table-column label="文件">
                    <template #default="scope">
                        <p class="folder-name">{{scope.row.name}}</p>
                        <p class="the-first">{{scope.row.dir}}</p>
                    </template>
                </el-table-column>
                <el-table-column prop="sTime" label="时间" width="120"></el-table-column>
                <el-table-column prop="iLineNo" label="位置" width="165">
                    <template #default="scope">
                        {{scope.row.iLineNo}}/{{scope.row.iAll}}<br/>
                        {{scope.row.sPosition}}/{{scope.row.durationStr}}
                    </template>
                </el-table-column>
                <el-table-column prop="fPercent" label="进度" width="250" >
                    <template #default="scope">
                        <el-progress :percentage="scope.row.fPercent" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                    <template #default="scope">
                        <el-button type="text" @click="goToLounge(scope.row)" >
                            推进
                        </el-button>
                        <el-button type="text" @click="delFile(scope.row)" >
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        <TodayHistory/>
        <section>
            <div class="box1" ref="box1"></div>
        </section>
        <!-- ▼进行中 -->
        <section class="first-list" >
            <el-table :data="aPending" stripe border style="width: 100%;">
                <el-table-column label="文件夹">
                    <template #default="scope">
                        <p class="folder-name">{{scope.row.nameShort}} </p>
                        <p class="the-first">{{scope.row.oFirst.name}} </p>
                    </template>
                </el-table-column>
                <el-table-column prop="sRate" label="完成率1" width="100"/>
                <el-table-column prop="fPercent" label="完成率2" width="250" >
                    <template #default="scope">
                        <el-progress :percentage="scope.row.fPercent" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="220">
                    <template #default="scope">
                        <el-button type="text" @click="goToLounge(scope.row.oFirst)" >
                            推进
                        </el-button>
                        <el-button type="text" @click="goFolder(scope.row)" >
                            访问目录
                        </el-button>
                        <el-button type="text" @click="putToTop(scope.row)" >
                            置顶
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </section>
        <!--  -->
        <div class="btn-bar" >
            <button @click="$root.f5()" >
                刷新
            </button>
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
            &emsp;Store值：{{$store.state.userInfo.name}}
        </div>
        <myInputing/>
        <div class="two-columns" >
            <div>
                <em>待办：</em>
                <br/>导入的字幕也应控制把时间信息精确到2位小数
                <br/>页面调整：添加计划页，与计划进度页
                <br/>BUG：人为将波形滚动之后被触发的事件有阻挠效果
                <br/>补充鼠标断句功能
                <em>首页：</em>
                <br/>本周新增：xxxx句
                <br/>本周录入：xxxx句
                <br/>页面调整：首页是数据页（成就页），添加起床打卡功能
                <br/>首页：显示日期（日历）数据
                <br/>首页：显示倒计时，年剩余，月剩余，周剩余，天剩余，
                <br/>首页功能：整个词儿（随机词汇）
                <em>已经完成：</em>
                <br/>句子的时间精确到小数后2位即可✔
            </div>
            <div>
                <em>长期计划：</em>
                <br/>格式转化功能（转为ogg）
                <br/>推至首页功能，待听写，待阅读
                <br/>开发【计划】功能？？？
                <em>长期计划：</em>
                <br/>为媒体文件变化了怎么办？记录更新 hash 值的功能
                <br/>媒体文件夹更名了怎么办？处理媒体的位置变更后的错乱（文件夹更名）
            </div>
        </div>
    </section>
    <br/>
    <br/>
    <br/>
    <ul>
        <li v-for="(cur,idx) of aLog" :key="idx" >
            {{cur}}
        </li>
    </ul>
</template>

<script>
import oMethods from './js/welcome.js';
import myInputing from '../study-lounge/inputing.vue';
import TodayHistory from '@/components/today-history/today-history.vue';
import * as echarts from 'echarts';

export default {
    name: "welcome",
    components: {
        myInputing,
        TodayHistory,
    },
    data(){
        return {
            aRoot: [],
            aLog: [],
            oPending: {},
            aPending: [],
            aRecent: [],
        };
    },
    created(){
        this.getPendingList();
        this.updateTheRecent();
    },
    mounted(){
        this.showChart();
    },  
    methods: {
        ...oMethods,
        showChart(){
            const oBox1 = this.$refs.box1;
            var myChart = echarts.init(oBox1); // 基于准备好的dom，初始化echarts实例
            const oData = {
                title: {
                    text: 'ECharts 入门示例'
                },
                tooltip: {},
                xAxis: {
                    data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
                },
                yAxis: {},
                series: [
                    {
                        name: '销量',
                        type: 'bar',
                        data: [5, 20, 36, 10, 10, 20]
                    }
                ],
            };
            myChart.setOption(oData); // 绘制图表
        },
    },
};

</script>

<style scoped src="./style/welcome.scss" lang="scss">
</style>
