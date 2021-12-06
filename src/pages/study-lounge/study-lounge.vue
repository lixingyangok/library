<!--
 * @Author: 李星阳
 * @Date: 2021-12-05 17:35:19
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-06 21:01:33
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
            <br/>
            <h1 @click="a++" >
                {{a}}
            </h1>
            <h1 @click="b++" >
                {{b}}
            </h1>
            
            <audio width="320" height="240" controls
                :src="sVideoSrc01"
                
            >
            </audio>
            <br/>
            <audio width="320" height="240" controls>
                <source :src="sVideoSrc02"/>
            </audio>
            <br/>
            <audio width="320" height="240" controls>
                <source :src="sVideoSrc03"/>
            </audio>
        </section>
    </div>
</template>

<script>
import {f1} from './js/study-lounge.js';

export default {
    name: 'study-lounge',
    setup(){
        const obj = f1();
        obj.loadFile();
        return {
            ...obj,
        };
    },
};
</script>

<style scoped src="./style/study-lounge.scss" />

