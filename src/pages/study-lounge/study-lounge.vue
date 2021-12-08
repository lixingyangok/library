<!--
 * @Author: 李星阳
 * @Date: 2021-12-05 17:35:19
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-08 20:38:01
 * @Description: 
-->
<template>
    <div class="outer" >
        <section class="left" v-if="0">
            <h1>study-lounge</h1>
        </section>
        <!-- 左右分界 -->
        <section class="right" >
            <br/>
            <br/>
            <br/>
            <h1 @click="a++" >
                {{a}}
            </h1>
            <h1 @click="b++" >
                {{b}}
            </h1>
            <br/>
            <video width="320" height="240" controls>
                <source :src="sVideoSrc01"/>
            </video>
        </section>
    </div>
</template>

<script>
import {f1} from './js/study-lounge.js';

export default {
    name: 'study-lounge',
    setup(){
        const obj = f1();

        return {
            ...obj,
        };
    },
};
</script>

<style scoped src="./style/study-lounge.scss" />

