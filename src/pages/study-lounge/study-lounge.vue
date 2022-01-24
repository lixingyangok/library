<!--
 * @Author: 李星阳
 * @Date: 2021-12-05 17:35:19
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-24 01:12:54
 * @Description: 
-->
<template>
    <div class="outer" >
        <section class="left" v-show="0">
            <h1>study-lounge</h1>
        </section>
        <!-- 左右分界 -->
        <section class="right">
            <MyWave ref="oMyWave"
                :media-path="sMediaSrc"
                :a-line-arr="aLineArr"
                :i-cur-line-idx="iCurLineIdx"
                @pipe="listener"
            />
            <article class="wave-below" >
                <button @click="init" >
                    查媒体
                </button>
                <button @click="saveMedia" >
                    保存媒体
                </button>
            </article>
            <div class="type-box" v-if="aLineArr[iCurLineIdx]">
                <textarea ref="oTextArea"
                    v-model="aLineArr[iCurLineIdx].text"
                    @keydown.enter.prevent="()=>previousAndNext(1)"
                ></textarea>
            </div>
            <!-- <article class="last-part" >
                </article> -->
            <ul class="last-part sentence-wrap" ref="oSententList" >
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
        </section>
    </div>
</template>

<script>
import {toRefs} from 'vue';
import {mainPart} from './js/study-lounge.js';
import {getKeyDownFnMap, fnAllKeydownFn} from './js/key-down-fn.js';
import MyWave from '../../components/wave/wave.vue';
import {registerKeydownFn} from '../../common/js/common-fn.js'

export default {
    name: 'study-lounge',
    components: {
        MyWave,
    },
    setup(){
        const oData = mainPart();
        return {
            ...toRefs(oData),
            ...fnAllKeydownFn(),
        };
    },
    mounted(){
        // 此处 this === getCurrentInstance()
        const oFnList = getKeyDownFnMap(this, 'obj');
        registerKeydownFn(oFnList);
    },
};
</script>

<style scoped src="./style/study-lounge.scss"></style>
<style scoped src="./style/type-box.scss"></style>
<style scoped src="./style/line-list.scss"></style>

