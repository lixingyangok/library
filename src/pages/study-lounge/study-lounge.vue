<!--
 * @Author: 李星阳
 * @Date: 2021-12-05 17:35:19
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-09 12:47:11
 * @Description: 
-->
<template>
    <div class="outer" >
        <section class="left" v-show="0">
            <h1>study-lounge</h1>
        </section>
        <!-- 左右分界 -->
        <section class="right">
            <br/><br/>
            <MyWave ref="oMyWave"
                :media-path="sMediaSrc"
                :a-line-arr="aLineArr"
                :i-cur-line-idx="iCurLineIdx"
                @pipe="listener"
            />
            <article class="wave-below" >
                
            </article>
            <div class="type-box" v-if="aLineArr[iCurLineIdx]">
                <p>
                    <input v-model="testNumber" >
                </p>
                <textarea v-model="aLineArr[iCurLineIdx].text">
                    
                </textarea>
                <textarea v-if="0"></textarea>
            </div>
            <article>
                <br/><br/>
                <ul class="sentence-wrap" >
                    <li v-for="(cur,idx) of aLineArr" :key="idx"
                        class="one-line" :class="iCurLineIdx == idx ? 'cur' : ''"
                        :style="{'--width': `${String(aLineArr.length || 0).length}em`}"
                        @click="goLine(idx)"
                    >
                        <i className="idx">{{idx + 1}}</i>
                        <span className="time">
                            <em>{{cur.start_}}</em><i>-</i><em>{{cur.end_}}</em>
                        </span>
                        <p>
                            {{cur.text}}
                        </p>
                    </li>
                </ul>
            </article>
        </section>
    </div>
</template>

<script>
import {toRefs} from 'vue';
import {f1} from './js/study-lounge.js';
import {registerKeydownFn, fnAllKeydownFn} from './js/key-down-fn.js';
import MyWave from '../../components/wave/wave.vue';

export default {
    name: 'study-lounge',
    components: {
        MyWave,
    },
    setup(){
        const oData = f1();
        const oResult = {
            ...toRefs(oData),
            ...fnAllKeydownFn(),
        };
        return oResult;
    },
    mounted(){
        registerKeydownFn();
    },
};
</script>

<style scoped src="./style/study-lounge.scss"></style>
<style scoped src="./style/type-box.scss"></style>
<style scoped src="./style/line-list.scss"></style>

