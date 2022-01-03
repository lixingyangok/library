<!--
 * @Author: 李星阳
 * @Date: 2022-01-03 10:09:58
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-03 21:02:08
 * @Description: 
-->
<template>
    <article class="my-wave-bar" ref="oWaveBar">
        <canvas class="canvas" ref="oCanvasDom"/>
        <!-- ▼舞台▼ -->
        <div class="wave-wrap" ref="oWaveWrap" >
            <div class="canvas-neighbor"
                ref="oCanvasNeighbor"
            >
                <!-- @mousewheel="wheelOnWave"
                @scroll="waveWrapScroll" -->
                <div :style="{width: '9999px' || '${(oBuffer.duration + 1) * fPerSecPx}px'}">
                    <ul class="scale">
                        <!-- <li v-for="(cur) of aShowingArr" :key="cur"
                            class="one-second"
                            :class="cur%10==0 ? 'ten-times': ''"
                            :style="{left: `${cur * fPerSecPx}px`}"
                        >
                            <b className="mark"/>
                            <span>
                                {{~~(cur/60)}}'{{cur%60}}
                            </span>
                        </li> -->
                    </ul>
                    <ul class="region-ul">
                        <!-- <li v-for="(cur, idx) of aShowingGaps" :key="idx" 
                            class="region"
                            :class="cur.idx === iCurLineIdx ? 'cur' : ''"
                            :style="{
                                left: `${cur.start * fPerSecPx}px`,
                                width: `${(cur.end - cur.start) * fPerSecPx}px`,
                            }"
                        >
                            <i class="idx">{{cur.idx+1}}</i>
                        </li> -->
                    </ul>
                    <i ref="oPointer" class="pointer"
                        :class="'playing' ? 'playing': ''"
                    />
                </div>
            </div>
        </div>
    </article>
    
    <p @click="aa+='-1'" >
        {{aa}}
    </p>
</template>
<!--  -->
<script>
import { toRefs } from 'vue';
import w01, {} from './js/wave.js';

export default {
    name: 'my-wave',
    props: {
        mediaPath: String,
    },
    setup(props){
        const {oDom, oFn, oData} = w01();
        oFn.audioBufferGetter(props.mediaPath);
        return {
            ...toRefs(oDom),
            ...toRefs(oData),
        };
    },
};

// import {toRefs} from 'vue';
// import w01, {} from './js/wave.js';

// const props = defineProps({
//     mediaPath: String,
// });
// // console.log('props\n', props.mediaPath);

// const {oDom, oFn, oData} = w01();
// const {oWaveBar} = toRefs(oDom);

// oFn.audioBufferGetter(props.mediaPath);
</script>
<script setup>


</script>

<style scoped src="./style/wave.scss"></style>