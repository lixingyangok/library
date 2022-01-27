<!--
 * @Author: 李星阳
 * @Date: 2022-01-25 17:15:48
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-27 20:52:46
 * @Description: 
-->

<template>
    <div>
        <ul>
            <li v-for="(idx) of 4" :key="idx">
                <audio controls
                    :ref="el => setDom(el, idx - 1)"
                    :src="`./static/ring/market0${idx}.mp3`"
                ></audio>
            </li>
        </ul>
        音量：{{oData.fVolume}}
        <br/><br/>
        现在时间：<el-tag>{{oAlarm.sNow}}</el-tag><br/>
        上次/下次响铃：<el-tag>{{oAlarm.sLastAlarm}}  /  {{oAlarm.sAim}}</el-tag><br/>
        距离下次：<el-tag>{{oAlarm.sGap}}</el-tag><br/>
        <button @click="toBoom(1)" >
            测试
        </button>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, toRefs } from 'vue';
import { audioControl } from './js/alarm-clock.js';
const {oData, oFn, oAlarm} = audioControl();
const { setDom, refreshTime, toBoom } = oFn;
let timer = null;

onMounted(()=>{
    timer = refreshTime();
});
onBeforeUnmount(()=>{
    console.log('clearImmediate');
    clearInterval(timer);
});
</script>
