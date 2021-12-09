<!--
 * @Author: 李星阳
 * @Date: 2021-12-05 17:35:19
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-09 20:54:05
 * @Description: 
-->
<template>
    <div class="outer" >
        <section class="left" v-show="0">
            <h1>study-lounge</h1>
        </section>
        <!-- 左右分界 -->
        <section class="right">
            <br/><br/><br/>
            <video controls>
                <source :src="sMediaSrc"/>
            </video>
            <article class="wave-bar">
                <div class="canvas-coat">
                    <canvas class="canvas" ref="oCanvas" />
                </div>
            </article>
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

