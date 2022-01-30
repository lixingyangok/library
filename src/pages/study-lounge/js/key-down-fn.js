/*
 * @Author: 李星阳
 * @Date: 2021-02-19 16:35:07
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-30 17:03:35
 * @Description: 
 */
import { getCurrentInstance } from 'vue';
import {fixTime } from '../../../common/js/pure-fn.js';
import {figureOut} from './figure-out-region.js';
import {oAlphabet} from '../../../common/js/key-map.js';

const oAlphabetObj = Object.values(oAlphabet).reduce((result, cur)=>{
    result[cur] = true;
    return result;
}, {});
let iSearchingQ = 0;

export function getKeyDownFnMap(This, sType){
    const {oMyWave} = This;
    const withNothing = [
        {key: '`' , name: '播放后半句', fn: ()=>oMyWave.toPlay(true)},
        {key: 'Tab', name: '播放当前句', fn: ()=>oMyWave.toPlay()},
        {key: 'Prior', name: '上一句', fn: ()=>This.previousAndNext(-1)},
        {key: 'Next', name: '下一句', fn: ()=>This.previousAndNext(1)},
        {key: 'F1', name: '设定起点', fn: ()=>This.cutHere('start')},
        {key: 'F2', name: '设定终点', fn: ()=>This.cutHere('end')},
        {key: 'F3', name: '抛弃当前句', fn: ()=> This.giveUpThisOne()},
        {key: 'F4', name: '查字典', fn: ()=>This.searchWord()},
        {key: 'Escape', name: '取消播放', fn: ()=>oMyWave.playing=false}, // 停止播放
    ];
    const withCtrl = [
        {key: 'ctrl + d', name: '删除一行',  fn: () => This.toDel()},
        {key: 'ctrl + z', name: '撤销',  fn: ()=>This.setHistory(-1)},
        {key: 'ctrl + s', name: '保存到云',  fn: ()=>This.saveLines()}, 
        {key: 'ctrl + j', name: '合并上一句',  fn: ()=> This.putTogether(-1)}, 
        {key: 'ctrl + k', name: '合并下一句',  fn: ()=> This.putTogether(1)}, 
        {key: 'ctrl + Enter', name: '播放',  fn: ()=>oMyWave.toPlay()},
        {key: 'ctrl + shift + Enter', name: '播放',  fn: ()=>oMyWave.toPlay(true)},
        {key: 'ctrl + shift + z', name: '恢复',  fn: ()=>This.setHistory(1)},
        {key: 'ctrl + shift + c', name: '分割',  fn: () => split()},
    ];
    const withAlt = [
        // 修改选区
        {key: 'alt + ]', name: '扩选', fn: () => This.chooseMore()}, 
        {key: 'alt + u', name: '起点左移', fn: ()=>This.fixRegion('start', -0.07)}, 
        {key: 'alt + i', name: '起点右移', fn: ()=>This.fixRegion('start', 0.07)}, 
        {key: 'alt + n', name: '终点左移', fn: ()=>This.fixRegion('end', -0.07)}, 
        {key: 'alt + m', name: '终点右移', fn: ()=>This.fixRegion('end', 0.07)}, 
        // 选词
        {key: 'alt + a', name: '', fn: ()=>This.toInset(0)},
        {key: 'alt + s', name: '', fn: ()=>This.toInset(1)},
        {key: 'alt + d', name: '', fn: ()=>This.toInset(2)},
        {key: 'alt + f', name: '', fn: ()=>This.toInset(3)},
        // 未分类
        {key: 'alt + j', name: '', fn: ()=>This.previousAndNext(-1)},
        {key: 'alt + k', name: '', fn: ()=>This.previousAndNext(1)},
        {key: 'alt + l', name: '跳到最后一句', fn: ()=>This.goLastLine()},
        // alt + shift
        {key: 'alt + shift + j', name: '向【左】插入一句', fn: ()=>This.toInsert(-1) },
        {key: 'alt + shift + k', name: '向【右】插入一句', fn: ()=>This.toInsert(1) },
        {key: 'alt + shift + d', name: '保存单词到云', fn: () => This.saveWord()},
        {key: 'alt + shift + c', name: '查字典', fn: ()=>This.searchWord()},
    ];
    // ▼将来用于前端显示给用户
    // if(0) return [withNothing, withCtrl, withAlt];
    const aFullFn = [...withNothing, ...withCtrl, ...withAlt];
    if (sType==='obj') {
        return aFullFn.reduce((oResult, cur)=>{
            oResult[cur.key] = cur.fn;
            return oResult;
        }, {});
    }
    return aFullFn;
}

// ▼按键后的方法列表
export function fnAllKeydownFn(){
    const oInstance = getCurrentInstance();
    const This = oInstance.proxy;
    // ▼切换当前句子（上一句，下一句）
    function previousAndNext(iDirection) {
        const { oMediaBuffer, aLineArr, iCurLineIdx } = This; // iCurStep
        const iCurLineNew = iCurLineIdx + iDirection;
        if (iCurLineNew < 0) {
            return this.$message.warning('没有上一行');
        }
        This.iCurLineIdx = iCurLineNew;
        const oNewLine = (() => {
            if (aLineArr[iCurLineNew]) return false; //有数据，不新增
            if ((oMediaBuffer.duration - aLineArr[iCurLineIdx].end) < 0.1) {
                return null; //临近终点，不新增
            }
            const {end} = aLineArr[aLineArr.length-1];
            return figureOut(oMediaBuffer, end); // 要新增一行，返回下行数据
        })();
        if (oNewLine === null) {
            return this.$message.warning('后面没有了');
        }
        goLine(iCurLineNew, oNewLine, true);
    }
    // ▼跳至某行
    async function goLine(iAimLine, oNewLine, toRecord) {
        if (toRecord) recordHistory();
        if (typeof iAimLine === 'number') { // 观察：能不能进来？
            This.iCurLineIdx = iAimLine;
        }else{
            iAimLine = This.iCurLineIdx;
        }
        setLinePosition(iAimLine);
        if (!oNewLine) return;
        This.aLineArr.push(oNewLine);
    }
    // ▼跳行后定位
	function setLinePosition(iAimLine){
		const {oSententList} = This;
		const {scrollTop: sTop, offsetHeight: oHeight} = oSententList;
        const iLineHeight = 35; // 行高
		const abloveCurLine = iAimLine * iLineHeight; // 当前行以上高度
		oSententList.scrollTop = (()=>{
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
        console.log('fixRegion');
        const {aLineArr, iCurLineIdx} = This;
        const oOld = aLineArr[iCurLineIdx];
        const previous = aLineArr[iCurLineIdx - 1];
        const next = aLineArr[iCurLineIdx + 1];
        let fNewVal = oOld[sKey] + iDirection;
        if (fNewVal < 0) fNewVal = 0;
        if (previous && fNewVal < previous.end) {
            fNewVal = previous.end;
        }
        if (next && fNewVal > next.start) {
            fNewVal = next.start;
        }
        setTime(sKey, fNewVal);
    }
    // ▼设定时间。1参是类型，2参是秒数
    function setTime(sKey, fVal) {
		const {oCurLine} = This;
		const {start, end} = oCurLine;
		if (sKey === 'start' && fVal > end) { //起点在终点右侧
			oCurLine.start = end;
			oCurLine.end = fVal;
		} else if (sKey === 'end' && fVal < start) { // 终点在起点左侧
			oCurLine.start = fVal;
			oCurLine.end = start;
		} else {
			oCurLine[sKey] = fVal;
		}
		// fixTime(oCurLine);
        This.aLineArr[This.iCurLineIdx] = fixTime(oCurLine);
	}
    // ▼插入一句。 参数说明：-1=向左，1=向右
    function toInsert(iDirection) {
        const isToLeft = iDirection === -1;
        let {iCurLineIdx, aLineArr, oMediaBuffer:{duration}} = This;
        const { start, end } = aLineArr[iCurLineIdx]; //当前行
        if (start === 0) return; //0开头，不可向前插入
        const oAim = aLineArr[iCurLineIdx + iDirection] || {};
        const newIdx = isToLeft ? iCurLineIdx : iCurLineIdx + 1;
        const oNewLine = fixTime({
            start: isToLeft ? (oAim.end || 0) : end,
            end: (
                isToLeft
                ? start 
                : Math.min(oAim.start || end + 10, duration + 0.5)
            ),
        });
        if (oNewLine.start === oNewLine.end) return;
        aLineArr.splice(newIdx, 0, oNewLine);
        iCurLineIdx += isToLeft ? 0 : 1;
        This.iCurLineIdx = iCurLineIdx;
    }
    // ▼删除某行（当前行）
    function toDel() {
        let { iCurLineIdx, aLineArr } = This;
        if (aLineArr.length <= 1) return;
        aLineArr.splice(iCurLineIdx, 1);
        const iMax = aLineArr.length - 1;
        This.iCurLineIdx = Math.min(iMax, iCurLineIdx);
        goLine(This.iCurLineIdx);
        This.oMyWave.goOneLine(aLineArr[This.iCurLineIdx]);
    }
    // ▼到最后一行
    function goLastLine() {
        const { aLineArr, iCurLineIdx } = This;
        let idx = aLineArr.findIndex(cur => cur.text.length <= 1);
        if (idx === -1 || idx === iCurLineIdx) idx = aLineArr.length - 1;
        goLine(idx);
        document.querySelectorAll('textarea')[0].focus();
    }
    // ▼重新定位起点，终点
    function cutHere(sKey) {
        const {oAudio} = This.oMyWave;
        if (!oAudio) return;
        setTime(sKey, oAudio.currentTime);
    }
    // ▼扩选
    function chooseMore() {
        const {oMediaBuffer, oCurLine, iCurLineIdx} = This;
        const newEnd = figureOut(oMediaBuffer, oCurLine.end, 0.35).end;
        setTime('end', newEnd);
        goLine(iCurLineIdx);
    }
    // ▼合并, -1上一句，1下一句
    function putTogether(iType) {
        const {iCurLineIdx, aLineArr} = This;
        const isMergeNext = iType === 1;
        const oTarget = ({
            '-1': aLineArr[iCurLineIdx - 1], //合并上一条
            '1': aLineArr[iCurLineIdx + 1], //合并下一条
        }[iType]);
        if (!oTarget) return; //没有邻居不再执行
        const oCur = aLineArr[iCurLineIdx];
        oTarget.start = Math.min(oTarget.start, oCur.start);
        oTarget.end = Math.max(oTarget.end, oCur.end);
        oTarget.text = (() => {
            const aResult = [oTarget.text, oCur.text];
            if (isMergeNext) aResult.reverse();
            return aResult.join(' ').replace(/\s{2,}/g, ' ');
        })();
        fixTime(oTarget);
        aLineArr.splice(iCurLineIdx, 1);
        if (!isMergeNext) This.iCurLineIdx--;
        // this.setState({...obj, sCurLineTxt: aLineArr[iCurLineIdx].text});
    }
    // ▼一刀两段
    function split() {
        goLine();
        const { aLineArr } = This;
        const { selectionStart } = This.oTextArea;
        const { currentTime } = This.oMyWave.oAudio;
        const { iCurLineIdx, oCurLine } = This;
        const sCurLineTxt = oCurLine.v.text;
        const aNewItems = [
            fixTime({
                ...oCurLine,
                end: currentTime,
                text: sCurLineTxt.slice(0, selectionStart).trim(),
            }),
            fixTime({
                ...oCurLine,
                start: currentTime + 0.01,
                text: sCurLineTxt.slice(selectionStart).trim(),
            }),
        ];
        aLineArr.splice(iCurLineIdx, 1, ...aNewItems);
        this.saveHistory({ aLineArr, iCurLineIdx });
        this.setState({aLineArr, sCurLineTxt: aNewItems[0].text});
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
			return this.$message.error(sTips);
		}
        const res = await fnInvoke('db', 'saveOneNewWord', {
            word, mediaId: This.oMediaInfo.id,
        });
        if (!res) return this.$message.error('保存未成功');
        console.log('res\n', res);
        this.$message.success('保存成功');
        This.getNewWords();
	}
    let myTimer = null;
    // ▼处理用户输入
    function typed(ev){
        // console.log('内容有变\n', ev);
        // clearTimeout(myTimer);
        const Backspace = ev.inputType == "deleteContentBackward";
        // if (ev.data == ' ') console.log('空格结尾');
        if (!oAlphabetObj[ev.data] && !Backspace) return;
        const sText = ev.target.value; // 当前文字
        const idx = ev.target.selectionStart;
        const sLeft = (sText.slice(0, idx) || '').split(' ').pop().trim();
        This.sTyped = sLeft;
        console.log('左侧文本：', sLeft);
        if (!sLeft) return;
        This.aCandidate = [];
        myTimer = setTimeout(()=>{
            setCandidate(sLeft.toLowerCase(), ++iSearchingQ);
        }, 0);
    }
    // ▼查询候选词
    async function setCandidate(sWord, iCurQs){
        const aResult = [];
        for (const cur of This.aFullWords) {
            if (cur.toLowerCase().startsWith(sWord)) {
                aResult.push(cur);
            }
            if (aResult.length>3) break;
        }
        This.aCandidate = aResult;
        // console.time('查字典db'); // 耗时20-30ms
        const aWords = await fnInvoke('db', 'getCandidate', {
            sWord, limit: 9 - aResult.length,
        });
        // console.timeEnd('查字典db'); // 耗时20-30ms
        if (!aWords || iCurQs != iSearchingQ) return;
        This.aCandidate.push(...aWords);
    }
    // ▼插入选中的单词
    async function toInset(idx) {
        const {sTyped, aCandidate, oTextArea} = This;
        const theWord = (aCandidate[idx] || '').slice(sTyped.length);
        if (!theWord) return;
        const {text} = This.oCurLine;
        const cursorIdx = oTextArea.selectionStart; // 表示光标左有几个单词
        const left = text.slice(0, cursorIdx);
        const right = text.slice(cursorIdx);
        const newLeft = (left + theWord);
        This.oCurLine.text = (newLeft + right).trim();
        await This.$nextTick();
        oTextArea.selectionStart = newLeft.length;
        oTextArea.selectionEnd = newLeft.length;
    }
    // ▼抛弃当前行，或处理第一行
    function giveUpThisOne(start){
        start = start || This.oCurLine.end;
        const {oMediaBuffer} = This;
        const oNextLine = figureOut(oMediaBuffer, start); //返回下一行的数据
        This.aLineArr[This.iCurLineIdx] = oNextLine;
        // ▼尚需补充后续的定位功能
    }
    // ▼保存到数据库
    function saveLines(){

    }
    // ▼撤销-恢复
    function setHistory(iType) {
        const { length } = This.aHistory;
        const iCurStep = This.iCurStep + iType;
        console.log('前往：', iCurStep);
        if (iCurStep < 0 || iCurStep > length - 1) {
            const actionName = { '-1': '上', '1': '下' }[iType];
            return This.$message.error(`没有${actionName}一步数据，已经到头了`);
        }
        const oHistory = This.aHistory[iCurStep];
        This.iCurStep = iCurStep;
        This.aLineArr = JSON.parse(oHistory.sLineArr);
        This.iCurLineIdx = oHistory.iCurLineIdx;
        goLine(oHistory.iCurLineIdx, false);
    }
    // ▼保存一条历史记录
    function recordHistory(){
        This.iCurStep++;
        This.aHistory.push({
            sLineArr: JSON.stringify(This.aLineArr),
            iCurLineIdx: This.iCurLineIdx,
        });
        if (This.aHistory.length < 30) return;
        This.aHistory.shift();
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
        typed,
        toInset,
        giveUpThisOne,
        saveLines,
        setHistory,
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
            const {aWords, aNames} = this.state;
            const allWords = aWords.concat(aNames);
            if (!sTyped) return allWords;
            const aFiltered = [];
            // ▼遍历耗时 ≈ 0.0x 毫秒
            for (let idx = allWords.length; idx--;){
                if (allWords[idx].toLocaleLowerCase().startsWith(sTyped)){
                    aFiltered.push(allWords[idx]);
                    if (aFiltered.length===iMax) break; // 最多x个，再多也没法按数字键去选取
                }
            }
            return aFiltered;
        })();
        this.setState({aMatched});
        const isNeedReplenish = sTyped && aMatched.length < iMax;
        if (isNeedReplenish){
            this.typeingTimer = setTimeout(()=>{
                this.checkDict(sTyped, aMatched, iMax);
            }, 280);
        }
        console.timeEnd('本地查找★★');
    }
}

