/*
 * @Author: 李星阳
 * @Date: 2021-02-19 16:35:07
 * @LastEditors: 李星阳
 * @LastEditTime: 2023-04-09 20:56:13
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
let isSavingToDB = false; //保存事件防抖

export function getKeyDownFnMap(This, sType) {
    const { oMyWave } = This;
    function playAndCheck(iVal){
        oMyWave.toPlay(iVal);
        This.setLeftLine();
    }
    const withNothing = [
        { key: 'Prior', name: '上一句', fn: () => This.previousAndNext(-1) },
        { key: 'Next', name: '下一句', fn: () => This.previousAndNext(1) },
        { key: '\\', name: '上一句', fn: () => This.previousAndNext(-1) },
        { key: 'Enter', name: '下一句', fn: () => This.previousAndNext(1) },
        // ▲换行
        { key: '`', name: '播放后半句', fn: () => oMyWave.toPlay(true) },
        { key: 'Tab', name: '播放当前句', fn: () => playAndCheck() },
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
        { key: 'ctrl + s', name: '保存到DB', fn: () => This.saveLines() },
        { key: 'ctrl + j', name: '合并上一句', fn: () => This.putTogether(-1) },
        { key: 'ctrl + k', name: '合并下一句', fn: () => This.putTogether(1) },
        // { key: 'ctrl + Enter', name: '播放', fn: () => oMyWave.toPlay() }, // 将来开发此方法能打阅读标记
        // { key: 'ctrl + shift + Enter', name: '播放', fn: () => oMyWave.toPlay(true) },
        { key: 'ctrl + shift + z', name: '恢复', fn: () => This.setHistory(1) },
        { key: 'ctrl + shift + c', name: '分割', fn: () => This.split() }, // 一刀两段
    ];
    const withAlt = [
        // 修改选区
        { key: 'alt + ]', name: '扩选', fn: () => This.chooseMore() },
        { key: 'alt + c', name: '起点左移', fn: () => This.fixRegion('start', -0.07) },
        { key: 'alt + v', name: '起点右移', fn: () => This.fixRegion('start', 0.07) },
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
        { key: 'alt + u', name: '', fn: () => playAndCheck(-1) },
        { key: 'alt + i', name: '', fn: () => playAndCheck(1) },
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
        setLeftLine(); // ★去新一行之前定位
        if (oNewLine) This.aLineArr.push(oNewLine);
        const {iCurLineIdx: iOldLine} = This;
        iAimLine ??= iOldLine;
        This.iCurLineIdx = iAimLine;
        let isGoingUp = iAimLine < iOldLine;
        // let goOneStep = iAimLine - iOldLine == 1;
        // goOneStep && showAchievement(iOldLine, iAimLine);
        setLinePosition(iAimLine);
        setLeftLine(); // ★ 到新一行之后定位
        recordPlace(iAimLine)
        if (toRecord) recordHistory();
        if (isGoingUp) return; // 如果行号在变小 return
        let iCount = 0;
        for (const cur of This.aLineArr){
            This.checkIfChanged(cur) && iCount++;
            if (iCount <= 2) continue;
            return This.saveLines(); // 保存
        }
    }
    // ▼弹出提示（成就）
    // async function showAchievement(iOldLine, iAimLine){
    //     vm.$message(`${iOldLine} > ${iAimLine}`);
    // }
    // ▼记录当前文件进行到哪一行了
    async function recordPlace(iAimLine){ // 用异步方法防止阻断主进程
        // 考虑添加：1个延时与防抖
        const iAll = This.aLineArr.length;
        let {end, start_} = This.oCurLine;
        const {dir, name, duration, durationStr} = This.oMediaInfo;
        const fPercent = (()=>{
            let fResult = This.iCurLineIdx / iAll;
            if (duration) fResult = end / duration;
            return (fResult * 100).toFixed(2) * 1;
        })();
        start_ = start_.slice(0,-3).padStart(8,0);
        ls.transact('oRecent', (oldData) => {
            const old = oldData[ls.get('sFilePath')] || {
                startAt: new Date() * 1, // 记录开始时间
            };
            oldData[ls.get('sFilePath')] = {
                ...old,
                dir,
                name,
                iTime: new Date()* 1, // 或许 updatedAt 这个键名更好
                iLineNo: iAimLine,
                fPercent,
                durationStr, // sDuration_,
                sPosition: start_,
                iAll: This.aLineArr.length,
            };
        });
    }
    // ▼找到起始行号
    function getLeftStartIdx() {
        let {iCurLineIdx: idx, oRightToLeft} = This;
        const aKeys = Object.keys(oRightToLeft);
        if (!aKeys.length) return 0;
        while (idx--){
            if (!oRightToLeft[idx]) continue;
            const {iLeftLine} = oRightToLeft[idx];
            return iLeftLine; // 旧版：return Math.max(0, iLeftLine - 1);
        }
        return 0;
    }
    // ▼设定【左侧文本】的当前句位置
    async function setLeftLine(){
        const iLeftLines = This.aArticle.length;
        // TODO 可考虑删除 isShowLeft 然后用 leftType 的布尔性来替代
        const willDo = iLeftLines && This.isShowLeft && This.leftType == 'txt';
        if (!willDo) return;
        This.iWriting = -1;
        Reflect.deleteProperty(This.oRightToLeft, This.iCurLineIdx);
        const text = This.oCurLine.text.trim();
        if ((text.length || 0) <= 2) return;
        const aPieces = text.match(/\b[a-z0-9'-]+\b/ig); // 将当前句分割
        if (!aPieces) return;
        console.time('定位耗时');
        // ▼输入的上一行没有成功匹配时，会取到 -1 很不好
        const {iLeftLine = -1, iMatchEnd: iLastMatchEnd} = This.oTopLineMatch || {}; // 取得之前匹配到的位置信息
        // console.log("上次匹配：", (This.oTopLineMatch || {}).$dc());
        const oResult = (()=>{
            for (let idx = getLeftStartIdx(); idx < iLeftLines; idx++ ){
                const sLeftFull = This.aArticle[idx]; 
                // if (sLeftFull.includes("xxx")) debugger;
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
                return {
                    iWriting: idx,
                    iMatchStart,
                    iMatchEnd: iLastMatch,
                };
            }
        })();
        console.timeEnd('定位耗时');
        console.log(`定位行号: ${oResult?.iWriting ?? '没成功'} ---`);
        oResult && setLeftTxtTop(oResult);
    }
    // ▼跳转到目标行（将来补充动画效果）
    async function setLeftTxtTop(obj){
        Object.assign(This, obj);
        This.oRightToLeft[This.iCurLineIdx] = {
            ...obj, iLeftLine: obj.iWriting,
        };
        await This.$nextTick();
        if (!This.oWritingLine) return;
        This.oWritingLine.scrollIntoView();
        // console.log('This.oWritingLine', This.oWritingLine); // 当前行的 DOM 节点 .offsetTop 可得到到顶部的距离
        const maxVal = This.oLeftTxtWrap.scrollHeight - This.oLeftTxtWrap.offsetHeight;
        // console.log('不动？', This.oLeftTxtWrap.scrollTop == maxVal);
        if (This.oLeftTxtWrap.scrollTop == maxVal) return;
        This.oLeftTxtWrap.scrollTop -= 190;
        // scrollTo
        // window.scrollTo({ top: 0, behavior: "smooth" });
        // ▼ https://zhuanlan.zhihu.com/p/438652229
        // requestAnimationFrame //  是一个新兴的API，专门为执行动画而生，这个方法每秒会执行60次，其实这个60并不是固定值，和刷新率有关系；
    }
    // ▼跳行后定位下方的文本位置（oSententList => oSententWrap）
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
        let { iCurLineIdx, aLineArr, oMediaBuffer, oMediaBuffer: { duration } } = This;
        const { start, end } = aLineArr[iCurLineIdx]; // 当前行
        const isInsertToLeft = iDirection === -1; // true = 向左方间隙插入
        if (start === 0 && isInsertToLeft) return; // 0开头，不可向左插入
        const oAim = aLineArr[iCurLineIdx + iDirection] || {}; // 邻居
        if (!aLineArr[iCurLineIdx + iDirection]){ // 用于测试
            return alert('调试信息：没有左/右侧的邻居');
        }
        const newIdx = isInsertToLeft ? iCurLineIdx : iCurLineIdx + 1;
        const oNewLine = (()=>{
            const iStart = isInsertToLeft ? oAim.end : end;
            // const fLong = isInsertToLeft ? (start - oAim.end) : (oAim.start - end);
            return figureOut(oMediaBuffer, iStart); // , 0.3, fLong
        })();
        if (oNewLine.start === oNewLine.end) {
            return alert('插入取消，什么情况下会到达这里？');
        }
        const {start: nlStart, end: nlEnd} = oNewLine; // nl = newLine
        if (isInsertToLeft){
            if (nlEnd > start) oNewLine.end = start - 0.1;
            if (nlStart >= oNewLine.end) oNewLine.start = Math.max(oAim.end + 0.1, oNewLine.end - 1);
        }else{
            if (nlEnd > oAim.start) oNewLine.end = oAim.start - 0.1;
            if (nlStart >= oNewLine.end) oNewLine.start = Math.max(end + 0.1, oNewLine.end - 1);
        }
        aLineArr.splice(newIdx, 0, oNewLine);
        if (!isInsertToLeft) This.iCurLineIdx++;
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
        const isIntoNext = iType === 1;
        const oCur = aLineArr[iCurLineIdx]; // 当前自己行（将被销毁
        const oTarget = ({
            '-1': aLineArr[iCurLineIdx - 1], // 要并入到上一条
            '1': aLineArr[iCurLineIdx + 1], // 要并入到下一条
        }[iType]);
        if (!oTarget) return; //没有邻居不再执行
        oTarget.start = Math.min(oTarget.start, oCur.start);
        oTarget.end = Math.max(oTarget.end, oCur.end);
        oTarget.text = (() => {
            const aResult = [oTarget.text];
            aResult[isIntoNext ? 'unshift' : 'push'](oCur.text);
            return aResult.join(' ').replace(/\s{2,}/g, ' ').trim();
        })();
        fixTime(oTarget);
        if (oCur.id >= 0) This.deletedSet.add(oCur.id); // 销毁自己
        aLineArr.splice(iCurLineIdx, 1);
        if (!isIntoNext) This.iCurLineIdx--;
        recordHistory();
    }
    // ▼一刀两断 - 1刀2断
    function split() {
        // goLine(); // 出错了：切2断的时候常弹出保存提示，不妥（停用测试于2022.07.23 18:3:2 星期六）
        const { aLineArr, iCurLineIdx, oCurLine, oMediaBuffer } = This;
        const { selectionStart } = This.oTextArea;
        const { currentTime } = This.oMyWave.oAudio;
        const { text, start, end} = oCurLine;
        const fLeftEndAt = aLineArr[iCurLineIdx -1]?.end || (start - 0.3);
        const fRightStartAt = aLineArr[iCurLineIdx +1]?.start || end;
        // const iGap01 = currentTime - start;
        // const fNextStart = aLineArr[iCurLineIdx+1]?.start;
        // const fRightLine = fNextStart ? fNextStart + 1 : end + 5;
        // const iGap02 = fRightLine - currentTime;
        const aNewItems = [
            fixTime({
                ...oCurLine,
                start: figureOut(oMediaBuffer, fLeftEndAt).start,
                end: currentTime,
                text: text.slice(0, selectionStart).trim(),
            }),
            fixTime({
                ...figureOut(oMediaBuffer, currentTime - 0.2), // , end-currentTime*0.6 // , 0.2, iGap02 + 2 
                text: text.slice(selectionStart).trim(),
            }),
        ];
        aNewItems[1].start = Math.max(aNewItems[1].start, currentTime);
        aNewItems[1].end = Math.min(aNewItems[1].end, fRightStartAt);
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
        const isLetter = ev.data?.match(/[a-z]/i);
        // console.log('输入了 =', ev.data);
        const iTimes = isLetter ? 800 : 0; // 如果输入了非字母，立即匹配左侧字幕
        inputTimer = setTimeout(()=>{
            recordHistory();
            setLeftLine();
        }, iTimes);
        // if (!oAlphabetObj[ev.data] && !Backspace) return;
        if (!isLetter && !Backspace) return;
        const sText = ev.target.value; // 当前文字
        const idx = ev.target.selectionStart; // 光标位置
        // const sLeft = (sText.slice(0, idx) || '').split(' ').pop().trim();
        const sLeft = ((sText.slice(0, idx) || '').match(/[a-z]+/ig) || ['']).pop();
        This.sTyped = sLeft;
        // console.log('左侧文本：', sLeft);
        if (!sLeft) return;
        This.aCandidate = [];
        const sLeftLower = sLeft.toLowerCase();
        setCandidate(sLeftLower);
        candidateTimer = setTimeout(() => {
            setCandidate(sLeftLower, ++iSearchingQ);
        }, 600);
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
        // console.log('候选词：', aResult.$dc());
        This.aCandidate = aResult;
        if (typeof iCurQs != 'number') return;
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
        if (isSavingToDB) return; // 防抖
        const toSaveArr = [];
        This.aLineArr.forEach(cur => {
            This.deletedSet.delete(cur.id); // 防止误删
            if (!This.checkIfChanged(cur)) return; // 没变动不删除
            ['start', 'end'].forEach(key => {
                cur[key] = Number.parseFloat(cur[key].toFixed(2));
            });
            toSaveArr.push({ ...cur, mediaId: This.oMediaInfo.id });
        });
        const toDelArr = [...This.deletedSet];
        if (!toSaveArr.length && !toDelArr.length) {
            return This.$message.warning(`没有修改，无法保存`);
        }
        isSavingToDB = true;
        const [res0, res1] = await fnInvoke('db', 'updateLine', {
            toSaveArr, toDelArr,
        });
        // console.log('保存了字幕\n', toSaveArr, toDelArr);
        const sTips = `成功：修改 ${res0.length} 条，删除 ${res1} 条`;
        This.$message.success(sTips);
        This.deletedSet.clear();
        This.oTodayBar.init();
        await This.getLinesFromDB(); // 异步加载新字幕
        isSavingToDB = false;
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
        setTime,
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
}

// SELECT * 
// FROM "line" 
// where id = 100718
// start 69.1400000000001
// sqlite 拆分字符，字符分列，分割字符
// length(substr(start, instr(start, '.') + 1)) > 2
// substr(start, 0, instr(start, '.')),
// substr(start, instr(start, '.') + 1)
// length(substr(start, instr(start, '.') + 1)) as len,

