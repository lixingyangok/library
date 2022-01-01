<!--
 * @Author: 李星阳
 * @Date: 2021-12-05 17:35:19
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-31 12:26:41
 * @Description: 
-->
<template>
    <div class="outer" >
        <section class="left" v-show="0">
            <h1>study-lounge</h1>
        </section>
        <!-- 左右分界 -->
        <section class="right">
            {{plusOne}}
            <br/><br/><br/>
            <video controls>
                <source :src="sMediaSrc"/>
            </video>
            <article class="wave-bar"
                :style="{
                    '--canvas-top': `${iCanvasTop}px`,
                    '--line-top': `${iCanvasTop + iCanvasHeight / 2}px`,
                }"
            >
                <div class="canvas-coat" ref="oCanvasCoat"
                    :style="{height: '140px' || `${iCanvasHeight + iCanvasTop}px`}"
                >
                    <canvas class="canvas" ref="oCanvasDom" 
                        :height="iCanvasHeight"
                    />
                    <div class="canvas-neighbor"
                        ref="oCanvasNeighbor"
                        @mousewheel="wheelOnWave"
                        @scroll="waveWrapScroll"
                    >
                        <!-- ▼刻度的容器 -->
                        <div :style="{width: `${oBuffer.duration * fPerSecPx}px`}">
                            <ul class="scale" >
                                <li v-for="(cur) of oBuffer.duration | 0" :key="cur"
                                    :style="{marginRight: `${fPerSecPx}px`}"
                                >
                                    {{cur}}
                                </li>
                            </ul>
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
                    <li v-for="(cur,idx) of aLines" :key="idx">
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
        const obj = f1();
        const plusOne = computed(() => {
            const oWaveWrap = obj.oCanvasNeighbor.value;
            if (!oWaveWrap) return [0, 0];
            const fPerSecPx = obj.fPerSecPx.value;
            const {iScrollLeft=0, offsetWidth = window.innerWidth} = obj;
            let start = ~~(iScrollLeft / fPerSecPx - 1);
            const end = ~~((iScrollLeft + offsetWidth) / fPerSecPx + 1);
            return [start > 0 ? start : 0, end];
        });

        return {
            plusOne,
            ...obj,
        };
    },
};
</script>

<style scoped src="./style/study-lounge.scss" />

