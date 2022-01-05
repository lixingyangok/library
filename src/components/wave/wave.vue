<!--
 * @Author: 李星阳
 * @Date: 2022-01-03 10:09:58
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-05 20:56:13
 * @Description: 
-->
<template>
    <article class="my-wave-bar" ref="oMyWaveBar">
        <canvas class="canvas" ref="oCanvasDom"/>
        <!-- ▲画布 -->
        <!-- ▼横长条的视口 -->
        <section class="viewport" ref="oViewport"
            @mousewheel="wheelOnWave"
            @scroll="waveWrapScroll"
        >
            <div ref="oLongBar"
                :style="{width: `${(oMediaBuffer.duration + 1) * fPerSecPx}px`}"
            >
                <ul class="scale-ul">
                    <li v-for="(cur) of aShowingArr" :key="cur"
                        class="one-second"
                        :class="cur%10==0 ? 'ten-times': ''"
                        :style="{left: `${cur * fPerSecPx}px`}"
                    >
                        <b className="mark"/>
                        <span>
                            {{~~(cur/60)}}'{{cur%60}}
                        </span>
                    </li>
                </ul>
                <ul class="region-ul">
                    <li v-for="(cur, idx) of aShowingGaps" :key="idx" 
                        class="region"
                        :class="cur.idx === iCurLineIdx ? 'cur' : ''"
                        :style="{
                            left: `${cur.start * fPerSecPx}px`,
                            width: `${(cur.end - cur.start) * fPerSecPx}px`,
                        }"
                    >
                        <i class="idx">{{cur.idx+1}}</i>
                    </li>
                </ul>
                <i ref="oPointer" class="pointer"
                    :class="'playing' ? 'playing': ''"
                />
            </div>
        </section>
    </article>
</template>
<!--  -->
<script>
import { toRefs, computed } from 'vue';
import w01, {} from './js/wave.js';

export default {
    name: 'my-wave-bar',
    props: {
        mediaPath: String,
        aLineArr: {
            type: Array,
            default: ()=>[],
        },
    },
    setup(props){
        console.log('波形组件接参\n', props.$dc());
        const {oDom, oFn, oData} = w01();
        oFn.audioBufferGetter(props.mediaPath);
        // ▼视口范围，起点秒&终点秒
        const aShowingRegion = computed(() => {
            const iWidth = window.innerWidth;
            const start = ~~(oData.iScrollLeft / oData.fPerSecPx) - 1;
            const end = ~~((oData.iScrollLeft + iWidth) / oData.fPerSecPx);
            return [Math.max(start, 0), end];
        });
        const aShowingArr = computed(() => {
            const arr = [];
            const [iLeftSec, iRightSec] = aShowingRegion.value;
            for(let idx = iLeftSec; idx < iRightSec; idx++ ) {
                arr.push(idx);
            }
            return arr;
        });
        const aShowingGaps = computed(() => {
            const myArr = [];
            const [iLeftSec, iRightSec] = aShowingRegion.value;
            const {length} = props.aLineArr;
            for (let idx = 0; idx < length; idx++){
                const {end} = props.aLineArr[idx];
                const IsShow = end > iLeftSec || end > iRightSec; // 此处正确无误
                if (!IsShow) continue;
                myArr.push(props.aLineArr[idx]);
                if (end > iRightSec) break;
            }
            return myArr;
        });
        return {
            ...toRefs(oDom),
            ...toRefs(oData),
            ...oFn,
            aShowingGaps,
            aShowingArr,
        };
    },
};
</script>
<style scoped src="./style/wave.scss"></style>