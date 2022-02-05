<!--
 * @Author: 李星阳
 * @Date: 2021-12-05 17:35:19
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-05 10:40:43
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
                @pipe="bufferReceiver"
            />
            <article class="wave-below">
                时长：{{oMediaBuffer.sDuration_}}&emsp;
                <button @click="oMyWave.toSaveTemp">
                    保存波形缓存
                </button>
                <button @click="showMediaDialog">
                    媒体信息
                </button>
                <button @click="saveMedia">
                    保存媒体
                </button>
                <button @click="toCheckDict">
                    查字典
                </button>
                <button @click="isShowNewWords = true">
                    单词表
                </button>
            </article>
            <div class="type-box" v-if="aLineArr[iCurLineIdx]">
                <ul class="history-ul" >
                    <li v-for="(cur, idx) of aHistory" :key="idx"
                        :class="{cur: idx==iCurStep}"
                    >
                        {{idx+1}}
                    </li>
                </ul>
                <textarea ref="oTextArea"
                    v-model="aLineArr[iCurLineIdx].text"
                    @keydown.enter.prevent="() => previousAndNext(1)"
                    @input="inputHandler"
                ></textarea>
                <!-- @keydown.backspace="typed" -->
                <ul class="candidate-list">
                    <li class="one-word"
                        v-for="(cur, idx) of sTyped ? aCandidate : aFullWords" :key="idx"
                    >
                        <template v-if="sTyped">
                            <i class="idx">{{idx+1}}</i>
                            <em class="left-word">{{sTyped}}</em>
                        </template>
                        <em v-else class="left-word">{{cur}}</em>
                        <template v-if="sTyped && (cur.length > sTyped.length)">
                            ·<span class="right-word">{{cur.slice(sTyped.length)}}</span>
                        </template>
                    </li>
                </ul>
            </div>
            <article class="last-part" @scroll="lineScroll" >
                <ul class="sentence-wrap" ref="oSententList" 
                    :style="{
                        '--height': '35px',
                        '--width': `${String(aLineArr.length || 0).length}em`,
                        'height': `calc(${aLineArr.length} * var(--height))`,
                        'padding-top': `calc(${iShowStart} * var(--height))`,
                    }"
                >
                    <li v-for="(cur, idx) of aLineForShow" :key="idx"
                        class="one-line" :class="{cur: iCurLineIdx == cur.ii}"
                        @click="goLine(cur.ii)"
                    >
                        <i className="idx">{{cur.ii+1}}</i>
                        <time className="time">
                            {{cur.start_}} - {{cur.end_}}
                        </time>
                        <p class="text" :class="{changed: cur.changed}">
                            <template v-for="word of splitSentence(cur.text, cur.ii)">
                                <span v-if="word.sClassName" :class="word.sClassName">
                                    {{word.word}}
                                </span>
                                <template v-else>{{word}}</template>
                            </template>
                        </p>
                    </li>
                </ul>
            </article>
        </section>
        <!-- ▼弹出窗口 -->
        <dictionaryVue :beDialog="true"
            v-model:dialogVisible="isShowDictionary"
            :word="sSearching"
        ></dictionaryVue>
        <!-- ▼单词表 -->
        <el-dialog title="单词表" v-model="isShowNewWords">
            <div class="one-box" 
                v-for="(oneList,i01) of aWordsList" :key="i01"
            >
                <h3 class="title">
                    ◆ {{['新词汇', '专有名词'][i01]}}
                </h3>
                <ul class="one-ul">
                    <li class="word"
                        v-for="(oneWord,i02) of oneList" :key="i02"
                    >
                        <span @click="changeWordType(oneWord)">
                            {{oneWord.word}}
                        </span>
                        <i class="fas fa-trash-alt fa-xs" 
                            @click="delOneWord(oneWord)"
                        />
                    </li>
                </ul>
            </div>
        </el-dialog>
        <!-- ▼媒体信息 -->
        <el-dialog title="媒体信息" width="600px"
            v-model="isShowMediaInfo"
        >
            文件位置：{{oMediaInfo.dir}}<br/>
            文件名称：{{oMediaInfo.name}}<br/>
            <br/>
            同级文件：
            <ul class="siblings-list" >
                <li v-for="(cur, idx) of aSiblings" :key="idx"
                    :class="{'cur-file': cur.hash==sHash}"
                    @click="visitSibling(cur)"
                >
                    {{idx+1}}、{{cur.name}}
                </li>
            </ul>
        </el-dialog>
    </div>
</template>

<script>
import {toRefs, computed} from 'vue';
import {mainPart} from './js/study-lounge.js';
import {getKeyDownFnMap, fnAllKeydownFn} from './js/key-down-fn.js';
import MyWave from '../../components/wave/wave.vue';
import {registerKeydownFn} from '../../common/js/common-fn.js'
import dictionaryVue from '../dictionary/dictionary.vue';
import myInputing from './inputing.vue';

export default {
    name: 'study-lounge',
    components: {
        MyWave,
        dictionaryVue,
        myInputing,
    },
    setup(){
        const oData = mainPart();
        const aLineForShow = computed(() => {
            const {iShowStart} = oData;
            return oData.aLineArr.slice(iShowStart, iShowStart + 22).map((cur, idx)=>{
                cur.ii = idx + iShowStart;
                return cur;
            });
        });
        return {
            ...toRefs(oData),
            ...fnAllKeydownFn(),
            aLineForShow,
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
<style scoped src="./style/dialog.scss"></style>

