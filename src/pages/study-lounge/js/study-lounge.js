import {toRefs, reactive, computed, onMounted} from 'vue';
import {SubtitlesStr2Arr, fixTime} from '../../../common/js/pure-fn.js';
import {figureOut} from './figure-out-region.js';

const ipcRenderer = require("electron").ipcRenderer;

const oDom = reactive({
	oMyWave: null,
	oSententList: null,
});
const oData = reactive({
	sFilePath: '',
	sMediaSrc: '',
	sSubtitleSrc: '',
	aLineArr: [],
	iCurLineIdx: 0,
	oMediaBuffer: {},
	testNumber: 123,
	iSubtitle: 0, // -1=查不到字幕，1=有字幕
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
		if (err) {
			oData.iSubtitle = -1; //
			return console.log('字幕文件不存在\n');
		}
		const arr = SubtitlesStr2Arr(sSubtitles);
		if (!arr) return console.log('文本转为数据未成功\n');
		oData.iSubtitle = 1;
		oData.aLineArr = arr; //.splice(0, Infinity, ...arr);
	}
	// ▼插入一个空行
	function setFirstLine(){
		const oFirst = figureOut(oData.oMediaBuffer, 0, 30);
		oData.aLineArr = [oFirst];
	}
	
	function listener(o1){
		// console.log('o1\n', o1);
		oData.oMediaBuffer = o1;
		if (oData.iSubtitle >= 0) return; // 有字幕则返回
		setFirstLine();
	}
	// ============================================================================
	ipcRenderer._events.getSubtitlesArrReply = readSrtFile;
	ipcRenderer.send("getSubtitlesArr", oData.sSubtitleSrc);
	onMounted(()=>{
		// console.log('oDom', oDom.oMyWave);
	});
    return reactive({
        ...toRefs(oDom),
        ...toRefs(oData),
		...{
			listener,
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
