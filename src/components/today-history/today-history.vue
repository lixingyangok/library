<!--
 * @Author: 李星阳
 * @Date: 2022-04-15 18:02:43
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-04-15 18:58:15
 * @Description: 
-->
<template>
    <div class="today-bar" >
        今日成就：
        <span>录入行数：<em>{{oInfo.iFilled}}行</em></span>
        <span>录入时长：<em>{{oInfo.sFiDuration}}</em></span>
        <span>录入词汇：<em>{{oInfo.iFilledWords}}个</em></span>
        --&emsp;
        <span>创建行数：<em>{{oInfo.iCreated}}行</em></span>
        <span>创建时长：<em>{{oInfo.sCrDuration}}</em></span>
    </div>
</template>

<script setup>
import {reactive} from 'vue';
import {getTodayHistory} from '@/common/js/fs-fn.js';

let oInfo = reactive({});

async function init(){
    const oRes = await getTodayHistory();
    if (!oRes) return;
    // console.log('今天成就：', oRes.$dc());
    Object.assign(oInfo, oRes)
    // oInfo = oRes;
}
init();

//关键点 把 方法暴露给父组件
defineExpose({
    init,
});

</script>
<style lang="scss" src="./style/today-history.scss" scoped ></style>
