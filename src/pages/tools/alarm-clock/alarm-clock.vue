<!--
 * @Author: 李星阳
 * @Date: 2022-01-25 17:15:48
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-25 20:33:41
 * @Description: 
-->

<template>
    <div>
        <ul>
            <li v-for="(idx) of 4" :key="idx">
                <audio controls :ref="el=>setDom(el, idx)"
                    :src="`./static/ring/market0${idx}.mp3`"
                ></audio>
            </li>
        </ul>
        <input type="datetime-local" 
            v-model="timeVal"
        />
        {{timeVal}}
        <br/><br/>
        现在：{{sNow}}<br/>
        定时：{{alarmTime[0]}}:{{alarmTime[1]}}<br/>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, toRefs } from 'vue';
import { audioControl } from './js/alarm-clock.js';
const {oData, oFn} = audioControl();
const { sNow, timeVal, alarmTime } = toRefs(oData);
const { setDom, refreshTime } = oFn;
let timer = null;

onMounted(()=>{
    timer = refreshTime();
});

onBeforeUnmount(()=>{
    console.log('clearImmediate');
    clearImmediate(timer);
});
</script>