import {toRefs, reactive, computed, onMounted, onBeforeUnmount} from 'vue';
import {SubtitlesStr2Arr} from '../../../common/js/pure-fn.js';
import {figureOut} from './figure-out-region.js';
const {ipcRenderer} = require("electron");

export function f1(){
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
		iSubtitle: 0, // -1=查不到字幕，1=有字幕
	});
	const oCurLine = computed(()=>{
		return oData.aLineArr[ oData.iCurLineIdx ];
	});
	const sFilePath = localStorage.getItem('sFilePath');
	oData.sFilePath = sFilePath;
	oData.sMediaSrc = 'tube://a/?path=' + sFilePath;
	oData.sSubtitleSrc = (()=>{ // 字幕文件位置
		const arr = sFilePath.split('.');
		arr[arr.length-1] = 'srt';
		return arr.join('.');
	})();
	// ▲数据====================================================================================
	// ▼方法====================================================================================
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
	// ▼无字幕的情况下，插入一个空行
	function setFirstLine(){
		const oFirst = figureOut(oData.oMediaBuffer, 0, 20);
		oFirst.text = '默认行';
		oData.aLineArr = [oFirst];
	}
	// ▼接收波形数据
	function listener(oMediaBuffer){
		oData.oMediaBuffer = oMediaBuffer;
		if (oData.iSubtitle >= 0) return; // 有字幕则返回
		setFirstLine();
	}
	// ============================================================================
	ipcRenderer.send("textReader", oData.sSubtitleSrc);
	ipcRenderer.on("textReaderReply", readSrtFile);
	onBeforeUnmount(()=>{
		ipcRenderer.removeListener('textReaderReply', readSrtFile);
	});
	onMounted(()=>{
		// console.log('oDom', oDom.oMyWave);
	});
    return reactive({
        ...toRefs(oDom),
        ...toRefs(oData),
		oCurLine,
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
