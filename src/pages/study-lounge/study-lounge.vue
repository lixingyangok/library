<!--
 * @Author: 李星阳
 * @Date: 2021-12-05 17:35:19
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-11-05 09:48:34
 * @Description: 
-->
<template>
    <div class="outer">
        <section class="left" v-show="isShowLeft" >
            <!-- iframe 内有全局变量 window.pdfjsLib -->
            <iframe ref="oIframe" v-show="leftType=='pdf'"
                :src="sPdfViewer"
            ></iframe>
            <!--  -->
            <div class="txt-box" ref="oLeftTxtWrap" v-if="leftType == 'txt'">
                <div v-if="'测试' && 0">
                    aArticle.length：{{aArticle.length}}<br/>
                    iShowUntil：{{iShowUntil}}<br/>
                    oTopLineMatch?.iLeftLine：{{oTopLineMatch?.iLeftLine}}<br/>
                    iWriting：{{iWriting}}<br/>
                </div>
                <!-- ▼媒体信息 -->
                <div>
                    <h3>
                        <br/>{{oMediaInfo.dir}}/
                        <br/><em style="color: black; font-weight: bold;">{{oMediaInfo.name}}</em>
                    </h3>
                </div>
                <hr class="hr-line" />
                <!-- ▼文本 -->
                <ul ref="oLeftTxt" class="article-text">
                    <li name="▲当前行上方-1">
                        {{aArticle.slice(0, iShowUntil).join('\n')}}
                    </li>
                    <li name="▲当前行上方-2-空行"
                        v-if="(iShowUntil > 0) && (aArticle[iShowUntil - 1].trim() == '' || iShowUntil + 1 < oTopLineMatch?.iLeftLine)"
                    ></li>
                    <!-- v-if="oTopLineMatch?.iLeftLine >= 0 && (iWriting < 0 || (oTopLineMatch?.iLeftLine < iWriting))" -->
                    <template v-if="oTopLineMatch?.iLeftLine >= 0 && (iWriting < 0 || (iWriting - oTopLineMatch?.iLeftLine >= 1))" >
                        <li name="▲当前行上方-3">
                            {{
                                aArticle[oTopLineMatch.iLeftLine].slice(0, oTopLineMatch.iMatchStart)
                            }}<span class="just-wrote">{{
                                aArticle[oTopLineMatch.iLeftLine].slice(oTopLineMatch.iMatchStart, oTopLineMatch.iMatchEnd)
                            }}</span>{{
                                aArticle[oTopLineMatch.iLeftLine].slice(oTopLineMatch.iMatchEnd)
                            }}
                        </li>
                        <li name="▲当前行上方-4-空行"
                            v-if="oTopLineMatch?.iLeftLine + 1 != iWriting" 
                        >
                            {{aArticle.slice(oTopLineMatch?.iLeftLine + 1, iWriting).join('\n')}}
                        </li>
                    </template>
                    <!-- ▼ writing-line ▼ -->
                    <li name="▼当前行writing-line" class="writing-line" ref="oWritingLine" v-if="iWriting >= 0" >
                        <template v-if="oTopLineMatch?.iLeftLine == iWriting">
                            {{
                                sWriting.slice(0, oTopLineMatch.iMatchStart)
                            }}<span class="just-wrote">{{
                                sWriting.slice(oTopLineMatch.iMatchStart, oTopLineMatch.iMatchEnd)
                            }}</span>{{
                                sWriting.slice(oTopLineMatch.iMatchEnd, iMatchStart)
                            }}
                        </template>
                        <!-- ▲同一行的上一句话 -->
                        <template v-else>
                            {{sWriting.slice(0, iMatchStart)}}
                        </template>
                        <em class="writing">{{sWriting.slice(iMatchStart, iMatchEnd)}}</em>{{sWriting.slice(iMatchEnd)}}
                    </li>
                    <li name="▼当前行下方1" class="gray-part" v-if="iWriting >= 0">
                        {{aArticle.slice(iWriting + 1).join('\n')}}
                    </li>
                    <li name="▼当前行下方2" class="gray-part" v-else >
                        {{
                            aArticle.slice(
                                Math.max(iShowUntil + 1, (oTopLineMatch?.iLeftLine - 1) || 0)
                            ).join('\n')
                        }}
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
                @setTimeTube="setTime"
            />
            <article class="wave-below">
                ◆文件：{{(oMediaInfo.dir||'').split('/').slice(-2).join('/') + `/${oMediaInfo.name}`}}&emsp;
                ◆时长：{{oMediaBuffer.sDuration_}}&emsp;
                ◆完成于：{{oMediaInfo?.finishedAt?.toLocaleString() || '进行中'}}&emsp;
            </article>
            <TodayHistory ref="oTodayBar"/>
            <article class="wave-below">
                <el-dropdown split-button type="primary" size="small" @command="handleCommand" >
                    待定功能
                    <!-- <el-button type="primary" size="small">字幕&nbsp;<i class="fas fa-angle-down"/></el-button> -->
                    <template #dropdown size="small">
                        <el-dropdown-menu>
                            <el-dropdown-item command="导入Srt">导入Srt</el-dropdown-item>
                            <el-dropdown-item command="导出Srt">导出Srt</el-dropdown-item>
                            <el-dropdown-item command="导出Srt(补空行)">导出Srt(补空行)</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
                <el-button-group size="small">
                    <el-button type="primary" size="small" @click="showMediaDialog()">
                        信息与列表
                    </el-button>
                    <el-button type="primary" @click="visitNeighbor(-1)">
                        上一个
                    </el-button>
                    <el-button type="primary" @click="visitNeighbor(1)">
                        下一个
                    </el-button>
                </el-button-group>
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
                    <el-button type="primary" @click="openTxt">
                        打开TXT
                    </el-button>
                    <el-button type="primary" @click="showLeftArticle">
                        字幕置左
                    </el-button>
                </el-button-group>
                <el-button type="primary" size="small" @click="setAllEmpty">
                    所有行置空
                </el-button>
                <input type="file" ref="oTxtInput"
                    @change="getArticleFile" v-show="0"
                />
                <input type="file" ref="oSrtInput"
                    @change="importSrt" v-show="0"
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
                    <template v-for="word of splitSentence(oCurLine.text)">
                        <span v-if="word.sClassName" :class="word.sClassName">
                            {{word.word}}
                        </span>
                        <template v-else>{{word}}</template>
                    </template>
                    <div class="line-info" v-show="aProcess.some(cur=>cur.bLight)">
                        <span v-for="(cur, iCurIdx) of aProcess" :key="iCurIdx"
                            :class="{light: cur.bLight}"
                        >
                            {{cur.myVal}}<small>{{cur.sUnit}}</small>
                        </span>
                    </div>
                </div>
                <!-- ▲下层内容，▼上层输入框 -->
                <textarea ref="oTextArea" class="textarea textarea-real"
                    :class="{
                        'space-ahead': oCurLine.text.match(/\s{2,}|^\s/g),
                        'ten-times': (iCurLineIdx + 1) % 10 == 0,
                    }"
                    v-model="aLineArr[iCurLineIdx].text"
                    abckeydown.enter.prevent="() => previousAndNext(1)"
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
            <!-- ▲输入框 -->
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
                    <li v-for="(cur) of aLineForShow" :key="cur.ii"
                        class="one-line"
                        :class="{cur: iCurLineIdx == cur.ii, 'key-line': (cur.ii + 1) % 10 == 0}"
                        @click="goLine(cur.ii, null, true)"
                    >
                        <i className="idx">{{cur.ii+1}}</i>
                        <time className="time">{{cur.start_}} - {{cur.end_}}</time>
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
                    <small>{{oneList.length}}个</small>
                </h3>
                <ul class="one-type-word-ul">
                    <li class="word" v-for="(oneWord,i02) of oneList" :key="i02" >
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
        <el-dialog title="媒体信息" width="900px"
            v-model="isShowMediaInfo"
        >
            <el-descriptions title="" border :column="3">
                <el-descriptions-item label="当前文件" :span="3">
                    {{oMediaInfo.dir}}
                    <br/><em style="color: black; font-weight: bold;">{{oMediaInfo.name}}</em>
                </el-descriptions-item>
                <el-descriptions-item label="合计时长">{{oSiblingsInfo.sDurationSum}}</el-descriptions-item>
                <el-descriptions-item label="平均时长">{{oSiblingsInfo.sAvg}}</el-descriptions-item>
                <el-descriptions-item label="媒体ID">
                    {{oMediaInfo.id}}
                </el-descriptions-item>
                <el-descriptions-item label="进度信息">
                    {{aSiblings.filter(cur=>cur.done_).length}}/{{aSiblings.length}}
                </el-descriptions-item>
                <el-descriptions-item label="首次录入">
                    {{oSiblingsInfo.fistFillTime}} - {{oSiblingsInfo.fDaysAgo}}
                </el-descriptions-item>
            </el-descriptions>
            <div class="folder-btn-warp">
                <el-button size="small" type="text" @click="visitNeighbor(-1)">
                    上一个
                </el-button>
                <el-button size="small" type="text" @click="visitNeighbor(1)">
                    下一个
                </el-button>
            </div>
            <div class="siblings-list" v-for="(i01, i02) of 2" :key="i02">
                <el-table border123
                    :data="aSiblings.filter(cur => cur.done_ == !!i02)"
                >
                    <el-table-column prop="idx_" label="序号" width="60" />
                    <el-table-column prop="sItem" label="名称">
                        <template #default="scope">
                            <p class="file-name" :class="{'cur-file': scope.row?.infoAtDb?.hash == sHash}"
                                @click="visitSibling(scope.row)"
                            >
                                {{scope.row.sItem}}
                            </p>
                        </template>
                    </el-table-column>
                    <el-table-column prop="durationStr" label="时长" width="100" />
                    <el-table-column prop="finishedAt_" label="完成时间" width="160" />
                    <el-table-column label="操作" width="155">
                        <template #default="scope">
                            <el-button type="text" @click="visitSibling(scope.row)" >
                                跳转
                            </el-button>
                            <el-button type="text" @click="setItFinished(scope.row)" >
                                切换状态
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-dialog>
        <!-- ▼文本文件列表选择器 -->
        <el-dialog title="文本文件列表" width="700px"
            v-model="isShowFileList"
        >
            <ul class="txt-file-list" >
                <li v-for="(cur, idx) of aTxtFileList" :key="idx"
                    :class="{gap: idx && (cur.sTail != aTxtFileList[idx-1].sTail)}"
                    @click="chooseFile(cur)"
                >
                    {{cur.sFileName}}
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
import {registerKeydownFn, getTubePath} from '@/common/js/common-fn.js'
import dictionaryVue from '../dictionary/dictionary.vue';
import myInputing from './inputing.vue';
import TodayHistory from '@/components/today-history/today-history.vue';

export default {
    name: 'study-lounge',
    components: {
        MyWave,
        dictionaryVue,
        myInputing,
        TodayHistory,
    },
    setup(){
        const oData = mainPart();
        // ▼位于可见范围的字幕
        const aLineForShow = computed(() => {
            const {iShowStart} = oData;
            return oData.aLineArr.slice(iShowStart, iShowStart + 28).map((cur, idx)=>{
                cur.ii = idx + iShowStart;
                return cur;
            });
        });
        const sPdfViewer = computed(()=>{
            let sRoot = './static/pdf-viewer/web/viewer.html';
            if (oData.sReadingFile.toLowerCase().endsWith('.pdf')){
                sRoot += `?file=${getTubePath(oData.sReadingFile)}`;
            }
            return sRoot;
        });
        // ▼上一行(次)的匹配信息
        const oTopLineMatch = computed(() => {
            return oData.oRightToLeft[oData.iCurLineIdx - 1];
        });
        // "sWriting"
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
            sPdfViewer,
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

