<!--
 * @Author: 李星阳
 * @Date: 2022-01-03 10:09:58
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-07 20:50:11
 * @Description: 
-->
<template>
    <audio controls ref="oAudio"
        v-show="0" :src="mediaPath"
    ></audio>
    <article class="my-wave-bar" ref="oMyWaveBar"
        :class="sWaveBarClassName"
    >
        <canvas class="canvas" ref="oCanvasDom"/>
        <!-- ▲画布 -->
        <!-- ▼横长条的视口 -->
        <section class="viewport" ref="oViewport"
            @mousewheel="wheelOnWave"
            @scroll="waveWrapScroll"
        >
            <div class="long-bar" ref="oLongBar"
                :style="{width: `${(oMediaBuffer.duration + 0.6) * fPerSecPx}px`}"
            >
                <ul class="scale-ul">
                    <li v-for="(cur) of aGapMarks" :key="cur" v-show="cur"
                        class="one-second" :class="cur % 10 == 0 ? 'ten-times' : ''"
                        :style="{left: `${cur * fPerSecPx}px`}"
                    >
                        <b className="mark"/>
                        <span>{{~~(cur/60)}}'{{cur%60}}</span>
                    </li>
                </ul>
                <ul class="region-ul">
                    <li v-for="(cur, idx) of aGapRegions" :key="idx" 
                        class="region" :class="cur.idx === iCurLineIdx ? 'cur' : ''"
                        :style="{
                            left: `${cur.start * fPerSecPx}px`,
                            width: `${(cur.end - cur.start) * fPerSecPx}px`,
                        }"
                    >
                        <i class="idx">{{cur.idx+1}}</i>
                    </li>
                </ul>
                <i ref="oPointer" class="pointer" v-show="playing" />
            </div>
        </section>
    </article>
</template>


<script>
import { toRefs, computed } from 'vue';
import w01, {getKeyDownFnMap} from './js/wave.js';
import {registerKeydownFn} from '../../common/js/common-fn.js'

export default {
    name: 'my-wave-bar',
    props: {
        mediaPath: String,
        aLineArr: {
            type: Array,
            default: ()=>[],
        },
        iCurLineIdx: {
            type: Number,
            default: 0,
        },
    },
    // ▼ 与 props 类似
    // ▼ 声明当前组件<example/>可以在行间定义的属性
    emits: ['pipe'],
    setup(props){
        const {oDom, oFn, oData} = w01();
        // ▼视口范围 [起点秒，终点秒]
        const aGapSeconds = computed(() => {
            const iWidth = window.innerWidth;
            const start = ~~(oData.iScrollLeft / oData.fPerSecPx);
            const end = ~~((oData.iScrollLeft + iWidth) / oData.fPerSecPx);
            return [Math.max(start, 0), end];
        });
        const aGapMarks = computed(() => {
            const [iLeftSec, iRightSec] = aGapSeconds.v;
            const arr = [];
            for(let idx = iLeftSec; idx < iRightSec; idx++ ) {
                arr.push(idx);
            }
            return arr;
        });
        const aGapRegions = computed(() => {
            const [iLeftSec, iRightSec] = aGapSeconds.v;
            if (!iRightSec) return [];
            const myArr = [];
            const {length} = props.aLineArr;
            for (let idx = 0; idx < length; idx++){
                const {end} = props.aLineArr[idx];
                const IsShow = end > iLeftSec || end > iRightSec; // 此处正确无误
                if (!IsShow) continue;
                props.aLineArr[idx].idx = idx;
                myArr.push(props.aLineArr[idx]);
                if (end > iRightSec) break;
            }
            return myArr;
        });
        return {
            ...toRefs(oDom),
            ...toRefs(oData),
            ...oFn,
            aGapRegions,
            aGapMarks,
        };
    },
    mounted(){
        // 此处 this === getCurrentInstance()
        const oFnList = getKeyDownFnMap(this, 'obj');
        registerKeydownFn(oFnList);
    },
};
</script>

<style scoped src="./style/wave.scss"></style>