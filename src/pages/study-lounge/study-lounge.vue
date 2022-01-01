<!--
 * @Author: 李星阳
 * @Date: 2021-12-05 17:35:19
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-01 17:32:07
 * @Description: 
-->
<template>
    <div class="outer" >
        <section class="left" v-show="0">
            <h1>study-lounge</h1>
        </section>
        <!-- 左右分界 -->
        <section class="right">
            <video controls ref="oAudio" :src="sMediaSrc">
                <!-- <source :src="sMediaSrc"/> -->
            </video>
            <button @click="()=>toPlay()">
                播放
            </button>
            <button @click="()=>toPlay(true)" >
                播放50%
            </button>
            <article class="wave-bar"
                :style="{
                    '--canvas-top': `${iCanvasTop}px`,
                    '--canvas-height': `${iCanvasHeight}px`,
                    '--line-top': `${iCanvasTop + iCanvasHeight / 2}px`,
                }"
            >
                <div class="canvas-coat" ref="oCanvasCoat"
                    :style="{height: '140px' || `${iCanvasHeight + iCanvasTop}px`}"
                >
                    <canvas class="canvas" ref="oCanvasDom" 
                        :height="iCanvasHeight"
                        :style="{height: `${iCanvasHeight}px`}"
                    />
                    <div class="canvas-neighbor"
                        ref="oCanvasNeighbor"
                        @mousewheel="wheelOnWave"
                        @scroll="waveWrapScroll"
                    >
                        <!-- ▼刻度的容器 -->
                        <div :style="{width: `${(oBuffer.duration + 1) * fPerSecPx}px`}">
                            <ul class="scale">
                                <li v-for="(cur) of aShowingArr" :key="cur"
                                    :style="{left: `${cur * fPerSecPx}px`}"
                                >
                                    {{cur}}
                                </li>
                            </ul>
                            <ul class="region-ul" >
                                <li v-for="(cur, idx) of aShowingGaps" :key="idx" 
                                    :style="{
                                        left: `${cur.start * fPerSecPx}px`,
                                        width: `${(cur.end - cur.start) * fPerSecPx}px`,
                                    }"
                                ></li>
                            </ul>
                            <i ref="oPointer" class="pointer"
                                :class="playing ? 'playing': ''"
                            />
                        </div>
                    </div>
                </div>
            </article>
            <article class="wave-below" >oBuffer
                <br/>
                时长：{{oBuffer.sDuration_}}
            </article>
            <!--  -->
            <article>
                <br/><br/>
                <ul>
                    <li v-for="(cur,idx) of aLineArr" :key="idx">
                        {{cur.text}}
                    </li>
                </ul>
            </article>
        </section>
    </div>
</template>

<script>
import {computed} from 'vue';
import {f1} from './js/study-lounge.js';


export default {
    name: 'study-lounge',
    setup(){
        const oData = f1();
        const aShowingRegion = computed(() => {
            const oWaveWrap = oData.oCanvasNeighbor?.value;
            if (!oWaveWrap) return [0, 0];
            const fPerSecPx = oData.fPerSecPx.value;
            const iScrollLeft = oData.iScrollLeft.value;
            const offsetWidth = oWaveWrap.offsetWidth;
            let start = ~~(iScrollLeft / fPerSecPx - 1);
            const end = ~~((iScrollLeft + offsetWidth) / fPerSecPx + 1);
            return [Math.max(start, 0), end];
        });
        const aShowingArr = computed(() => {
            const arr = [];
            const [idxVal, end] = aShowingRegion.value;
            for(let idx = idxVal; idx<end; idx++ ) {
                arr.push(idx);
            }
            return arr;
        });
        const aShowingGaps = computed(() => {
            const {aLineArr=[], iCurLineIdx, fPerSecPx} = (oData);
            const myArr = [];
            let [nowSec, endSec] = aShowingRegion.value;
            for (let idx = 0, len = aLineArr.value.length; idx < len; idx++){
                const {end} = aLineArr.value[idx];
                const IsShow = end > nowSec || end > endSec;
                if (!IsShow) continue;
                myArr.push(aLineArr.value[idx]);
                if (end > endSec) break;
            }
            return myArr;
        });
        return {
            aShowingRegion,
            aShowingArr,
            aShowingGaps,
            ...oData,
        };
    },
};
</script>

<style scoped src="./style/study-lounge.scss" />

