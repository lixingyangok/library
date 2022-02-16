<!--
 * @Author: 李星阳
 * @Date: 2021-12-05 17:35:19
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-16 21:07:14
 * @Description: 
-->
<template>
    <div class="outer" >
        <section class="left" v-show="isShowLeft" >
            <iframe ref="oIframe"
                v-if="leftType=='pdf'"
                src="./static/pdf-viewer/web/viewer.html"
            ></iframe>
            <!--  -->
            <div class="txt-box" ref="oLeftTxtWrap" v-else="leftType == 'txt'">
                <!-- iShowUntil：{{iShowUntil}}<br/>
                oTopLineMatch?.iLeftLine：{{oTopLineMatch?.iLeftLine}}<br/>
                iWriting：{{iWriting}}<br/> -->
                <ul ref="oLeftTxt">
                    <!-- <li v-for="(curLine, idx) of aArticle" :key="idx"
                        :class="{'writing-line': idx == iWriting}"
                    >
                        <template v-if="idx == iWriting">
                            <template v-if="idx == oTopLineMatch?.iLeftLine">
                                {{
                                    curLine.slice(0, oTopLineMatch.iMatchStart)
                                }}<span class="just-wrote">{{
                                    curLine.slice(oTopLineMatch.iMatchStart, oTopLineMatch.iMatchEnd)
                                }}</span>{{
                                    curLine.slice(oTopLineMatch.iMatchEnd, iMatchStart)
                                }}
                            </template>
                            <template v-else>
                                {{curLine.slice(0, iMatchStart)}}
                            </template>
                            <em class="writing">{{curLine.slice(iMatchStart, iMatchEnd)}}</em>{{curLine.slice(iMatchEnd)}}
                        </template>
                        <template v-else-if="idx == oTopLineMatch?.iLeftLine">
                            {{
                                curLine.slice(0, oTopLineMatch.iMatchStart)
                            }}<span class="just-wrote">{{
                                curLine.slice(oTopLineMatch.iMatchStart, oTopLineMatch.iMatchEnd)
                            }}</span>{{
                                curLine.slice(oTopLineMatch.iMatchEnd)
                            }}
                        </template>
                        <template v-else>
                            {{curLine}}
                        </template>
                    </li> -->
                    <li>
                        {{'\n' + aArticle.slice(0, iShowUntil).join('\n')}}
                    </li>
                    <li v-if="iShowUntil > 0 && (aArticle[iShowUntil - 1].trim() == '' || iShowUntil + 1 < oTopLineMatch?.iLeftLine)"></li>
                    <template v-if="oTopLineMatch?.iLeftLine >= 0 && oTopLineMatch?.iLeftLine < iWriting">
                        <li>
                            {{
                                aArticle[oTopLineMatch.iLeftLine].slice(0, oTopLineMatch.iMatchStart)
                            }}<span class="just-wrote">{{
                                aArticle[oTopLineMatch.iLeftLine].slice(oTopLineMatch.iMatchStart, oTopLineMatch.iMatchEnd)
                            }}</span>{{
                                aArticle[oTopLineMatch.iLeftLine].slice(oTopLineMatch.iMatchEnd)
                            }}
                        </li>
                        <li v-if="oTopLineMatch?.iLeftLine + 1 != iWriting"></li>
                    </template>
                    <!-- ▼ writing-line ▼ -->
                    <li class="writing-line" v-if="iWriting >= 0" ref="oWritingLine" >
                        <template v-if="oTopLineMatch?.iLeftLine == iWriting">
                            {{
                                sWriting.slice(0, oTopLineMatch.iMatchStart)
                            }}<span class="just-wrote">{{
                                sWriting.slice(oTopLineMatch.iMatchStart, oTopLineMatch.iMatchEnd)
                            }}</span>{{
                                sWriting.slice(oTopLineMatch.iMatchEnd, iMatchStart)
                            }}
                        </template>
                        <template v-else>
                            {{sWriting.slice(0, iMatchStart)}}
                        </template>
                        <em class="writing">{{sWriting.slice(iMatchStart, iMatchEnd)}}</em>{{sWriting.slice(iMatchEnd)}}
                    </li>
                    <li v-if="iWriting >= 0">
                        {{aArticle.slice(iWriting + 1).join('\n')}}
                    </li>
                    <li v-else>
                        {{aArticle.slice(Math.max(iShowUntil, oTopLineMatch?.iLeftLine - 1)).join('\n')}}
                    </li>
                </ul>
            </div>
            <span class="handler"></span>
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
                ◆文件：{{(oMediaInfo.dir||'').split('/').slice(-3).join('/') + oMediaInfo.name}}&emsp;
                ◆时长：{{oMediaBuffer.sDuration_}}&emsp;
            </article>
            <article class="wave-below">
                <el-button-group size="small">
                    <el-button type="primary" @click="()=>oMyWave.toSaveTemp">
                        保存波形
                    </el-button>
                    <el-button type="primary" @click="saveMedia">
                        保存媒体
                    </el-button>
                </el-button-group>
                <el-button type="primary" size="small" @click="showMediaDialog()">
                    信息与列表
                </el-button>
                <el-button type="primary" size="small" @click="toCheckDict">
                    查字典
                </el-button>
                <el-button type="primary" size="small" @click="isShowNewWords = true">
                    单词表：{{aFullWords.length}}个
                </el-button>
                <el-button-group size="small">
                    <el-button type="primary"  @click="showLeftColumn">
                        {{isShowLeft ? '关闭': '显示'}}左侧
                    </el-button>
                    <el-button type="primary" @click="openPDF">
                        打开PDF
                    </el-button>
                    <el-button type="primary"
                        @click="() => oTxtInput.click()"
                    >
                        打开TXT
                    </el-button>
                </el-button-group>
                <el-button type="primary" size="small" @click="saveSrt">
                    保存为srt
                </el-button>
                <input type="file" ref="oTxtInput" accept="text/plain"
                    @change="getFile" v-show="0"
                />
            </article>
            <!-- ▼输入 -->
            <div class="type-box" v-if="aLineArr[iCurLineIdx]">
                <ul class="history-ul" :style="{'--max': iHisMax}">
                    <li v-for="(cur, idx) of aHistory" :key="idx"
                        :class="{cur: idx==iCurStep}"
                    ></li>
                </ul>
                <div class="textarea" :key="iCurLineIdx">
                    <template v-for="word of splitSentence(aLineArr[iCurLineIdx].text)">
                        <span v-if="word.sClassName" :class="word.sClassName">
                            {{word.word}}
                        </span>
                        <template v-else>{{word}}</template>
                    </template>
                </div>
                <textarea ref="oTextArea"
                    class="textarea textarea-real"
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
            <!-- ▼字幕大列表 -->
            <article class="last-part" ref="oSententWrap"
                @scroll="lineScroll"
            >
                <ul class="sentence-wrap" ref="oSententList" 
                    :style="{
                        '--height': `${iLineHeight}px`,
                        '--width': `${String(aLineArr.length || 0).length}em`,
                        'height': `calc(${aLineArr.length + 10} * var(--height))`,
                        'padding-top': `calc(${iShowStart} * var(--height))`,
                    }"
                >
                    <li v-for="(cur, idx) of aLineForShow" :key="cur.start"
                        class="one-line" :class="{cur: iCurLineIdx == cur.ii}"
                        @click="goLine(cur.ii, null, true)"
                    >
                        <i className="idx">{{cur.ii+1}}</i>
                        <time className="time">
                            {{cur.start_}} - {{cur.end_}}
                        </time>
                        <p class="text" :class="{changed: checkIfChanged(cur)}">
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
                <ul class="one-type-word-ul">
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
                    :style="{'--idx-width': `${String(aSiblings.length).length}em`}"
                    @click="visitSibling(cur)"
                >
                    <i class="idx">{{idx+1}}</i>
                    <em class="file-name" >{{cur.name}}</em>
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
        // ▼上一行的匹配信息
        const oTopLineMatch = computed(() => {
            return oData.oRightToLeft[oData.iCurLineIdx - 1];
        });
        const sWriting = computed(() => {
            return oData.aArticle[oData.iWriting];
        });
        const iShowUntil = computed(() => {
            if (oTopLineMatch.value){
                if (oData.iWriting >= 0){
                    if (oTopLineMatch.value.iLeftLine == oData.iWriting){
                        return oTopLineMatch.value.iLeftLine;
                    }else if (oData.iWriting - oTopLineMatch.value.iLeftLine < 10){
                        return oTopLineMatch.value.iLeftLine - 0;
                    }
                    return oData.iWriting;
                }
                return oTopLineMatch.value.iLeftLine;
            }else if (oData.iWriting >= 0){
                return oData.iWriting;
            }
            return oData.aArticle.length;
        });
        return {
            ...toRefs(oData),
            ...fnAllKeydownFn(),
            aLineForShow,
            sWriting,
            oTopLineMatch,
            iShowUntil,
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

