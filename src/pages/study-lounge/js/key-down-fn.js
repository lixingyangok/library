/*
 * @Author: 李星阳
 * @Date: 2021-02-19 16:35:07
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-16 21:06:41
 * @Description: 
 */
import { getCurrentInstance } from 'vue';
import { fixTime } from '../../../common/js/pure-fn.js';
import { figureOut } from './figure-out-region.js';
import { oAlphabet } from '../../../common/js/key-map.js';

const oAlphabetObj = Object.values(oAlphabet).reduce((result, cur) => {
    result[cur] = true;
    return result;
}, {});
let iSearchingQ = 0;

export function getKeyDownFnMap(This, sType) {
    const { oMyWave } = This;
    function playAndCheck(){
        oMyWave.toPlay();
        This.setLeftLine();
    }
    const withNothing = [
        { key: '`', name: '播放后半句', fn: () => oMyWave.toPlay(true) },
        { key: 'Tab', name: '播放当前句', fn: () => playAndCheck() },
        { key: 'Prior', name: '上一句', fn: () => This.previousAndNext(-1) },
        { key: 'Next', name: '下一句', fn: () => This.previousAndNext(1) },
        { key: 'F1', name: '设定起点', fn: () => This.cutHere('start') },
        { key: 'F2', name: '设定终点', fn: () => This.cutHere('end') },
        { key: 'F3', name: '抛弃当前句', fn: () => This.giveUpThisOne() },
        { key: 'F4', name: '查字典', fn: () => This.searchWord() },
        { key: 'Escape', name: '取消播放', fn: () => oMyWave.playing = false }, // 停止播放
    ];
    const withCtrl = [
        { key: 'ctrl + b', name: '显示左栏', fn: () => This.showLeftColumn() },
        { key: 'ctrl + d', name: '删除一行', fn: () => This.toDel() },
        { key: 'ctrl + z', name: '撤销', fn: () => This.setHistory(-1) },
        { key: 'ctrl + s', name: '保存到云', fn: () => This.saveLines() },
        { key: 'ctrl + j', name: '合并上一句', fn: () => This.putTogether(-1) },
        { key: 'ctrl + k', name: '合并下一句', fn: () => This.putTogether(1) },
        { key: 'ctrl + Enter', name: '播放', fn: () => oMyWave.toPlay() },
        { key: 'ctrl + shift + Enter', name: '播放', fn: () => oMyWave.toPlay(true) },
        { key: 'ctrl + shift + z', name: '恢复', fn: () => This.setHistory(1) },
        { key: 'ctrl + shift + c', name: '分割', fn: () => This.split() },
    ];
    const withAlt = [
        // 修改选区
        { key: 'alt + ]', name: '扩选', fn: () => This.chooseMore() },
        { key: 'alt + u', name: '起点左移', fn: () => This.fixRegion('start', -0.07) },
        { key: 'alt + i', name: '起点右移', fn: () => This.fixRegion('start', 0.07) },
        { key: 'alt + n', name: '终点左移', fn: () => This.fixRegion('end', -0.07) },
        { key: 'alt + m', name: '终点右移', fn: () => This.fixRegion('end', 0.07) },
        // 选词
        { key: 'alt + a', name: '', fn: () => This.toInset(0) },
        { key: 'alt + s', name: '', fn: () => This.toInset(1) },
        { key: 'alt + d', name: '', fn: () => This.toInset(2) },
        { key: 'alt + f', name: '', fn: () => This.toInset(3) },
        // 未分类
        { key: 'alt + j', name: '', fn: () => This.previousAndNext(-1) },
        { key: 'alt + k', name: '', fn: () => This.previousAndNext(1) },
        { key: 'alt + l', name: '跳到最后一句', fn: () => This.goLastLine() },
        // { key: 'alt + q', name: '左侧定位', fn: () => This.setLeftLine() },
        // alt + shift
        { key: 'alt + shift + j', name: '向【左】插入一句', fn: () => This.toInsert(-1) },
        { key: 'alt + shift + k', name: '向【右】插入一句', fn: () => This.toInsert(1) },
        { key: 'alt + shift + d', name: '保存单词到云', fn: () => This.saveWord() },
        { key: 'alt + shift + c', name: '查字典', fn: () => This.searchWord() },
    ];
    // ▼将来用于前端显示给用户
    // if(0) return [withNothing, withCtrl, withAlt];
    const aFullFn = [...withNothing, ...withCtrl, ...withAlt];
    if (sType === 'obj') {
        return aFullFn.reduce((oResult, cur) => {
            oResult[cur.key] = cur.fn;
            return oResult;
        }, {});
    }
    return aFullFn;
}

// ▼按键后的方法列表
export function fnAllKeydownFn() {
    const oInstance = getCurrentInstance();
    const This = oInstance.proxy;
    // ▼切换当前句子（上一句，下一句）
    function previousAndNext(iDirection) {
        const { oMediaBuffer, aLineArr, iCurLineIdx } = This;
        const iCurLineNew = iCurLineIdx + iDirection;
        if (iCurLineNew < 0) {
            return This.$message.warning('没有上一行');
        }
        const oNewLine = (() => {
            if (aLineArr[iCurLineNew]) return false; //有数据，不新增
            if ((oMediaBuffer.duration - aLineArr[iCurLineIdx].end) < 0.3) {
                return null; //临近终点，不新增
            }
            const { end } = aLineArr[aLineArr.length - 1];
            return figureOut(oMediaBuffer, end); // 要新增一行，返回下行数据
        })();
        if (oNewLine === null) {
            return This.$message.warning('后面没有了');
        }
        goLine(iCurLineNew, oNewLine, true);
    }
    // ▼跳至某行
    async function goLine(iAimLine, oNewLine, toRecord) {
        if (oNewLine) This.aLineArr.push(oNewLine);
        let goBack;
        if (iAimLine >= 0) {
            goBack = iAimLine < This.iCurLineIdx;
            This.iCurLineIdx = iAimLine;
        } else {
            iAimLine = This.iCurLineIdx;
        }
        setLinePosition(iAimLine);
        setLeftLine();
        if (toRecord) recordHistory();
        if (goBack) return; // 到来就建行，不保存
        let iCount = 0;
        for (const cur of This.aLineArr){
            This.checkIfChanged(cur) && iCount++;
            if (iCount <= 3) continue;
            return This.saveLines(); // 保存
        }
    }
    // ▼找到起始行号
    function getLeftStartIdx() {
        let {iCurLineIdx: idx, oRightToLeft} = This;
        const aKeys = Object.keys(oRightToLeft);
        if (!aKeys.length) return 0;
        while (idx--){
            if (!oRightToLeft[idx]) continue;
            const {iLeftLine} = oRightToLeft[idx];
            return Math.max(0, iLeftLine - 1);
        }
        return 0;
    }
    // ▼设定左侧位置
    async function setLeftLine(){
        const iLeftLines = This.aArticle.length;
        if (!iLeftLines) return;
        This.iWriting = -1;
        const text = This.oCurLine.text.trim();
        if (!text.length) return;
        const aPieces = text.match(/[a-z ']+/ig);
        if (!aPieces?.length) return;
        console.time('左侧句子定位');
        const {iLeftLine = -1, iMatchEnd: iLastMatchEnd} = This.oTopLineMatch || {};
        for (let idx = getLeftStartIdx(); idx < iLeftLines; idx++ ){
            const sLeftFull = This.aArticle[idx];
            // if (sLeftFull.includes('oomed!')) debugger;
            let iMatchStart = -1;
            let iLastMatch = idx == iLeftLine ? iLastMatchEnd : 0;
            const isInLine = aPieces.every(onePiece => {
                const sLeftPiece = sLeftFull.slice(iLastMatch);
                const oMatchInfo = sLeftPiece.match(new RegExp(onePiece.trim(), 'i'));
                if (!oMatchInfo) return;
                if (iMatchStart == -1) iMatchStart = oMatchInfo.index + (iLeftLine == idx ? iLastMatchEnd : 0);
                iLastMatch += oMatchInfo.index + onePiece.length;
                return true;
            });
            if (!isInLine) continue;
            console.timeEnd('左侧句子定位');
            console.log(`左侧句子定位到：${idx}`);
            return setLeftTxtTop({
                iWriting: idx,
                iMatchStart,
                iMatchEnd: iLastMatch,
            });
        }
        console.timeEnd('左侧句子定位');
        console.log(`左侧句子定位-没成功`);
    }
    // ▼跳转到目标行
    async function setLeftTxtTop( obj ){
        Object.assign(This, obj);
        This.oRightToLeft[This.iCurLineIdx] = {
            ...obj, iLeftLine: obj.iWriting,
        };
        console.log('当前句左行号：', obj.iWriting);
        // const {oLeftTxt, oLeftTxtWrap} = This;
        // const oLi = oLeftTxt.children[obj.iWriting];
        // const dom = document.querySelector('.writing-line');
        await This.$nextTick();
        if (!This.oWritingLine) return;
        This.oWritingLine.scrollIntoView();
        This.oLeftTxtWrap.scrollTop -= 190;
    }
    // ▼跳行后定位（oSententList => oSententWrap）
    function setLinePosition(iAimLine) {
        const { oSententWrap, iLineHeight } = This;
        const { scrollTop: sTop, offsetHeight: oHeight } = oSententWrap;
        const abloveCurLine = iAimLine * iLineHeight; // 当前行上方的高度
        oSententWrap.scrollTop = (() => {
            if (abloveCurLine < sTop + iLineHeight) {
                return abloveCurLine - iLineHeight;
            }
            // ▲上方超出可视区，▼下方超出可视区（以下代码没能深刻理解）
            if (abloveCurLine > sTop + oHeight - iLineHeight * 2) {
                return abloveCurLine - oHeight + iLineHeight * 2;
            }
            return sTop;
        })();
    }
    // ▼微调区域（1参可能是 start、end。2参是调整步幅
    function fixRegion(sKey, iDirection) {
        const { aLineArr, iCurLineIdx } = This;
        const oOld = aLineArr[iCurLineIdx];
        const previous = aLineArr[iCurLineIdx - 1];
        const next = aLineArr[iCurLineIdx + 1];
        let fNewVal = Math.max(0, oOld[sKey] + iDirection);
        if (previous && fNewVal < previous.end) {
            fNewVal = previous.end;
        }
        if (next && fNewVal > next.start) {
            fNewVal = next.start;
        }
        if (fNewVal > This.oMediaBuffer.duration + 0.5){
            return This.$message.error('超出太多了');
        }
        setTime(sKey, fNewVal);
        recordHistory();
    }
    // ▼设定时间。1参是类型，2参是秒数
    function setTime(sKey, fVal) {
        const { oCurLine } = This;
        const { start, end } = oCurLine;
        if (sKey === 'start' && fVal > end) { //起点在终点右侧
            oCurLine.start = end;
            oCurLine.end = fVal;
        } else if (sKey === 'end' && fVal < start) { // 终点在起点左侧
            oCurLine.start = fVal;
            oCurLine.end = start;
        } else {
            oCurLine[sKey] = fVal;
        }
        This.aLineArr[This.iCurLineIdx] = fixTime(oCurLine);
    }
    // ▼插入一句。 参数说明：-1=向左，1=向右
    function toInsert(iDirection) {
        let { iCurLineIdx, aLineArr, oMediaBuffer: { duration } } = This;
        const { start, end } = aLineArr[iCurLineIdx]; //当前行
        if (start === 0) return; //0开头，不可向前插入
        const isToLeft = iDirection === -1;
        const oAim = aLineArr[iCurLineIdx + iDirection] || {};
        const newIdx = isToLeft ? iCurLineIdx : iCurLineIdx + 1;
        const oNewLine = fixTime({
            start: isToLeft ? (oAim.end || 0) : end,
            end: (() => {
                if (isToLeft) return start;
                return Math.min(oAim.start || end + 10, duration + 0.5);
            })(),
        });
        if (oNewLine.start === oNewLine.end) return;
        aLineArr.splice(newIdx, 0, oNewLine);
        if (!isToLeft) This.iCurLineIdx++;
        recordHistory();
    }
    // ▼删除某行（当前行）
    function toDel() {
        let { iCurLineIdx, aLineArr } = This;
        if (aLineArr.length <= 1) {
            return This.$message.warning(`至少保留一行`);
        }
        const oDelAim = aLineArr[iCurLineIdx];
        if (oDelAim.id) {
            This.deletedSet.add(oDelAim.id);
        }
        aLineArr.splice(iCurLineIdx, 1);
        const iMax = aLineArr.length - 1;
        This.iCurLineIdx = Math.min(iMax, iCurLineIdx);
        goLine(This.iCurLineIdx);
        This.oMyWave.goOneLine(aLineArr[This.iCurLineIdx]);
        recordHistory();
    }
    // ▼到最后一行
    function goLastLine() {
        const { aLineArr, iCurLineIdx, oTextArea } = This;
        let idx = aLineArr.findIndex(cur => {
            return cur.text.length <= 1;
        });
        if (idx === -1 || idx === iCurLineIdx) idx = aLineArr.length - 1;
        goLine(idx);
        oTextArea.focus();
        recordHistory();
    }
    // ▼重新定位起点，终点
    function cutHere(sKey) {
        const { oAudio } = This.oMyWave;
        if (!oAudio) return;
        setTime(sKey, oAudio.currentTime);
        recordHistory();
    }
    // ▼扩选
    function chooseMore() {
        const { oMediaBuffer, oCurLine } = This;
        const newEnd = figureOut(oMediaBuffer, oCurLine.end, 0.35).end;
        setTime('end', newEnd);
        goLine();
        recordHistory();
    }
    // ▼合并, -1上一句，1下一句
    function putTogether(iType) {
        const { iCurLineIdx, aLineArr } = This;
        const isMergeNext = iType === 1;
        const oCur = aLineArr[iCurLineIdx]; // 当前自己行
        const oTarget = ({
            '-1': aLineArr[iCurLineIdx - 1], // 要贴付到上一条
            '1': aLineArr[iCurLineIdx + 1], // 要兼并下一条
        }[iType]);
        if (!oTarget) return; //没有邻居不再执行
        oTarget.start = Math.min(oTarget.start, oCur.start);
        oTarget.end = Math.max(oTarget.end, oCur.end);
        oTarget.text = (() => {
            const aResult = [oTarget.text, oCur.text];
            if (isMergeNext) aResult.reverse();
            return aResult.join(' ').replace(/\s{2,}/g, ' ');
        })();
        fixTime(oTarget);
        const {id} = isMergeNext ? oTarget : oCur;
        if (id >= 0) This.deletedSet.add(id);
        aLineArr.splice(iCurLineIdx, 1);
        if (!isMergeNext) This.iCurLineIdx--;
        recordHistory();
    }
    // ▼一刀两段
    function split() {
        goLine();
        const { aLineArr, iCurLineIdx, oCurLine } = This;
        const { selectionStart } = This.oTextArea;
        const { currentTime } = This.oMyWave.oAudio;
        const { text } = oCurLine;
        const aNewItems = [
            fixTime({
                ...oCurLine,
                end: currentTime,
                text: text.slice(0, selectionStart).trim(),
            }),
            fixTime({
                ...oCurLine,
                start: currentTime + 0.01,
                text: text.slice(selectionStart).trim(),
            }),
        ];
        Reflect.deleteProperty(aNewItems[1], 'id');
        aLineArr.splice(iCurLineIdx, 1, ...aNewItems);
        recordHistory();
    }
    // ▼搜索
    function searchWord() {
        const sKey = window.getSelection().toString().trim();
        if (!sKey) return;
        console.log('搜索：', sKey);
        This.sSearching = sKey;
        This.isShowDictionary = true;
    }
    // ▼保存生词
    async function saveWord() {
        const word = window.getSelection().toString().trim() || '';
        if (!word) return;
        const wordLow = word.toLowerCase();
        const bExist = This.aFullWords.some(cur => cur.toLowerCase() == wordLow);
        const lengthOK = word.length >= 2 && word.length <= 30;
        if (!lengthOK || bExist) {
            const sTips = `已经保存不可重复添加，或单词长度不在合法范围（2-30字母）`;
            return This.$message.error(sTips);
        }
        const res = await fnInvoke('db', 'saveOneNewWord', {
            word, mediaId: This.oMediaInfo.id,
        });
        if (!res) return This.$message.error('保存未成功');
        console.log('res\n', res);
        This.$message.success('保存成功');
        This.getNewWords();
    }
    let inputTimer = null;
    let candidateTimer = null;
    // ▼处理用户输入
    function inputHandler(ev) {
        clearTimeout(inputTimer);
        clearTimeout(candidateTimer);
        const Backspace = ev.inputType == "deleteContentBackward";
        const iTimes = ev.data == ' ' ? 0 : 1_200;
        inputTimer = setTimeout(()=>{
            recordHistory();
            setLeftLine();
        }, iTimes);
        if (!oAlphabetObj[ev.data] && !Backspace) return;
        const sText = ev.target.value; // 当前文字
        const idx = ev.target.selectionStart; // 光标位置
        // const sLeft = (sText.slice(0, idx) || '').split(' ').pop().trim();
        const sLeft = ((sText.slice(0, idx) || '').match(/[a-z]+/ig) || ['']).pop();
        This.sTyped = sLeft;
        // console.log('左侧文本：', sLeft);
        if (!sLeft) return;
        This.aCandidate = [];
        candidateTimer = setTimeout(() => {
            setCandidate(sLeft.toLowerCase(), ++iSearchingQ);
        }, 250);
    }
    // ▼查询候选词
    async function setCandidate(sWord, iCurQs) {
        const aResult = [];
        for (const cur of This.aFullWords) {
            if (cur.toLowerCase().startsWith(sWord)) {
                aResult.push(cur);
            }
            if (aResult.length >= 4) break;
        }
        This.aCandidate = aResult;
        const aWords = await fnInvoke('db', 'getCandidate', {
            sWord, limit: 9 - aResult.length,
        });
        if (!aWords || iCurQs != iSearchingQ) return;
        This.aCandidate.push(...aWords);
    }
    // ▼插入选中的单词
    async function toInset(idx) {
        const { sTyped, aCandidate, oTextArea } = This;
        const theWord = (aCandidate[idx] || '').slice(sTyped.length);
        if (!theWord) return;
        const { text } = This.oCurLine;
        const cursorIdx = oTextArea.selectionStart; // 表示光标左有几个单词
        const left = text.slice(0, cursorIdx);
        const right = text.slice(cursorIdx);
        const newLeft = (left + theWord);
        This.oCurLine.text = (newLeft + right).trim();
        recordHistory();
        await This.$nextTick();
        oTextArea.selectionStart = newLeft.length;
        oTextArea.selectionEnd = newLeft.length;
    }
    // ▼抛弃当前行，或处理第一行
    function giveUpThisOne(start) {
        start = start || This.oCurLine.end;
        const { oMediaBuffer } = This;
        const oNextLine = figureOut(oMediaBuffer, start); //返回下一行的数据
        This.aLineArr[This.iCurLineIdx] = {
            ...This.aLineArr[This.iCurLineIdx], // 保留旧的ID
            ...oNextLine,
        };
        recordHistory();
        This.oMyWave.goOneLine(oNextLine);
    }
    // ▼保存到数据库
    async function saveLines() {
        const toSaveArr = [];
        This.aLineArr.forEach(cur => {
            cur.id && This.deletedSet.delete(cur.id);
            if (!This.checkIfChanged(cur)) return;
            toSaveArr.push({ ...cur, mediaId: This.oMediaInfo.id });
        });
        const toDelArr = [...This.deletedSet];
        if (!toSaveArr.length && !toDelArr.length) {
            return This.$message.warning(`没有修改，无法保存`);
        }
        const [res0, res1] = await fnInvoke('db', 'updateLine', {
            toSaveArr, toDelArr,
        });
        This.getLinesFromDB();
        console.log('保存字幕\n', toSaveArr, toDelArr);
        // console.log('保存结果\n', res);
        const sTips = `成功：修改 ${res0.length} 条，删除 ${res1} 条`;
        This.$message.success(sTips);
        This.deletedSet.clear();
    }
    // ▼撤销-恢复
    function setHistory(iType) {
        const { length } = This.aHistory;
        const iCurStep = This.iCurStep + iType;
        console.log(`${iType == 1 ? 'Go' : 'Back'}To ->`, iCurStep);
        if (iCurStep < 0 || iCurStep > length - 1) {
            const actionName = ({
                '-1': '没有上一步的数据，无法撤销',
                '1': '已没有下一步的数据',
            }[iType]);
            return This.$message.error(actionName);
        }
        const oHistory = This.aHistory[iCurStep];
        const aLineArr = JSON.parse(oHistory.sLineArr);
        // const notSameLine = This.iCurStep != iCurStep;
        This.iCurStep = iCurStep;
        This.aLineArr = aLineArr;
        This.iCurLineIdx = oHistory.iCurLineIdx; // 置于最后一行
        This.oMyWave.goOneLine(This.oCurLine);
    }
    // ▼保存一条历史记录
    let isSaving = false;
    function recordHistory() {
        if (isSaving) return console.log('★保存历史-防抖成功★');
        isSaving = true;
        const sLineArr = JSON.stringify(This.aLineArr);
        This.aHistory.splice(This.iCurStep + 1, Infinity, {
            sLineArr,
            iCurLineIdx: This.iCurLineIdx,
        });
        This.iCurStep = Math.min(This.iCurStep + 1, This.iHisMax - 1);
        if (This.aHistory.length <= This.iHisMax) {
            return (isSaving = false);
        }
        This.aHistory.shift();
        isSaving = false;
    }
    // ▼最终返回
    return {
        previousAndNext,
        goLine,
        fixRegion,
        toInsert,
        toDel,
        goLastLine,
        cutHere,
        chooseMore,
        putTogether,
        split,
        searchWord,
        saveWord,
        inputHandler,
        toInset,
        giveUpThisOne,
        saveLines,
        setHistory,
        setLeftLine,
    };
}

// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// 以下是旧网站的方法

class keyDownFn {
    // ▼ 输入框文字改变
    valChanged(ev) {
        clearTimeout(this.typeingTimer);
        const sText = ev.target.value; // 当前文字
        if (/\n/.test(sText)) return this.previousAndNext(1, true);
        const idx = ev.target.selectionStart;
        const sLeft = sText.slice(0, idx);
        let sTyped = ''; // 单词开头（用于搜索的）
        if (sLeft.endsWith(' ')) { // 进入判断 sTyped 一定是空字符
            // 如果键入了【非】英文字母，【需要】生成新历史
            this.saveHistory({
                aLineArr: this.state.aLineArr,
                iCurLineIdx: this.state.iCurLineIdx,
                sCurLineTxt: sText,
            });
        } else {
            // 英文字母结尾，【不要】生成新历史
            const sRight = sText.slice(idx);
            const needToCheck = /\b[a-z]{1,20}$/i.test(sLeft) && /^(\s*|\s+.+)$/.test(sRight);
            if (needToCheck) sTyped = sLeft.match(/\b[a-z]+$/gi).pop();
        }
        this.setState({
            sTyped, sCurLineTxt: sText,
        });
        this.getMatchedWords(sTyped);
    }
    // ▼搜索匹配的单词
    getMatchedWords(sTyped = '') {
        console.time('本地查找★★');
        sTyped = sTyped.toLocaleLowerCase().trim();
        const iMax = 8;
        const aMatched = (() => {
            const { aWords, aNames } = this.state;
            const allWords = aWords.concat(aNames);
            if (!sTyped) return allWords;
            const aFiltered = [];
            // ▼遍历耗时 ≈ 0.0x 毫秒
            for (let idx = allWords.length; idx--;) {
                if (allWords[idx].toLocaleLowerCase().startsWith(sTyped)) {
                    aFiltered.push(allWords[idx]);
                    if (aFiltered.length === iMax) break; // 最多x个，再多也没法按数字键去选取
                }
            }
            return aFiltered;
        })();
        this.setState({ aMatched });
        const isNeedReplenish = sTyped && aMatched.length < iMax;
        if (isNeedReplenish) {
            this.typeingTimer = setTimeout(() => {
                this.checkDict(sTyped, aMatched, iMax);
            }, 280);
        }
        console.timeEnd('本地查找★★');
    }
}

