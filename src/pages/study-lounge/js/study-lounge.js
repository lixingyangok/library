import {toRefs, reactive, computed} from 'vue';
import {SubtitlesStr2Arr} from '../../../common/js/pure-fn.js';
const ipcRenderer = require("electron").ipcRenderer;


const oData = reactive({
	sFilePath: '',
	sMediaSrc: '',
	sSubtitleSrc: '',
	aLineArr: [],
	iCurLineIdx: 0,
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
	function readSrtFile(event, sSubtitles){
		const arr = SubtitlesStr2Arr(sSubtitles);
		if (!arr) return console.log('查询字幕未成功');
		arr.forEach((cur, idx) => {
			cur.idx = idx;
		});
		oData.aLineArr.splice(0, Infinity, ...arr);
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
