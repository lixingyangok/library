import {toRefs, reactive, computed} from 'vue';
import {SubtitlesStr2Arr} from '../../../common/js/pure-fn.js';
const ipcRenderer = require("electron").ipcRenderer;


const oData = reactive({
	sFilePath: '',
	sMediaSrc: '',
	sSubtitleSrc: '',
	aLineArr: [],
	iCurLineIdx: 0,
	testNumber: 123,
});

const oCurLine = computed(()=>{
	return oData.aLineArr[ oData.iCurLineIdx ];
});

// ▲数据
// ▼方法

export function f1(){
	const sFilePath = localStorage.getItem('sFilePath');
	oData.sFilePath = sFilePath;
	oData.sMediaSrc = 'tube://a/?path=' + sFilePath;
	oData.sSubtitleSrc = (()=>{
		const arr = sFilePath.split('.');
		arr[arr.length-1] = 'srt';
		return arr.join('.');
	})();
	oData.aLineArr.splice(0, Infinity);
	// ▼取得字幕数据
	function readSrtFile(event, sSubtitles, err){
		if (err && sSubtitles === null) {
			makeLineArr();
			return console.log('字幕文件不存在\n');
		}
		const arr = SubtitlesStr2Arr(sSubtitles);
		if (!arr) return console.log('文本转为数据未成功\n');
		arr.forEach((cur, idx) => {
			cur.idx = idx;
		});
		oData.aLineArr = arr; //.splice(0, Infinity, ...arr);
	}
	function makeLineArr(){
		
	}
	// ▼跳至某行
	async function goLine(iAimLine, oNewLine, doNotSave) {
		if (typeof iAimLine === 'number') { // 观察：能不能进来？
			oData.iCurLineIdx = iAimLine;
		}else{
			iAimLine = oData.iCurLineIdx;
		}
		// if (iAimLine % 2 && (!aLineArr[iAimLine] || isDifferent)) {
		// 	this.toSaveInDb();
		// }
		// if (oNewLine) {
		// 	oNewState.aLineArr.push(oNewLine);
		// 	oNewState.sCurLineTxt = oNewLine.text;
		// }else{
		// 	oNewState.sCurLineTxt = aLineArr[iAimLine].text;
		// }
		// if (!doNotSave) this.saveHistory(oNewState); // 有报错补上 dc_
		// this.setState(oNewState);
	}
    // ▼跳行后定位
	function setLinePosition(oLine, iAimLine){
        console.log("计算目标位置");
		const oSententList = this.oSententList.current;
		const {scrollTop: sTop, offsetHeight: oHeight} = oSententList;
		const abloveCurLine = iAimLine * iLineHeight; // 当前行以上高度
		oSententList.scrollTop = (()=>{
			if (abloveCurLine < sTop + iLineHeight) return abloveCurLine - iLineHeight;
			// ▲上方超出可视区，▼下方超出可视区（以下代码没能深刻理解）
			if (abloveCurLine > sTop + oHeight - iLineHeight * 2) {
				return abloveCurLine - oHeight + iLineHeight * 2;
			}
			return sTop;
		})();
	}
	// ============================================================================
	ipcRenderer.send("getSubtitlesArr", oData.sSubtitleSrc);
	ipcRenderer._events.getSubtitlesArrReply = readSrtFile;
    return reactive({
        ...toRefs(oData),
		...{
			goLine,
		},
    });
};

// const AC = new window.AudioContext();
// AC.decodeAudioData(uint8Buffer.buffer).then(audioBuf => {
//     const analyser = AC.createAnalyser();
//     const bs = AC.createBufferSource();
//     bs.buffer = audioBuf;
//     bs.connect(analyser);
//     analyser.connect(AC.destination);
//     bs.start();
// });
