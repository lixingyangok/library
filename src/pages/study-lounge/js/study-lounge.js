import {toRefs, reactive, computed, onMounted} from 'vue';
import {SubtitlesStr2Arr, fixTime} from '../../../common/js/pure-fn.js';
import {figureOut} from './figure-out-region.js';
import {getTubePath} from '../../../common/js/common-fn.js';


export function mainPart(){
	const oDom = reactive({
		oMyWave: null, // 波
		oTextArea: null, // 输入框
		oSententList: null, // 字幕列表
	});
	const oData = reactive({
		sMediaSrc: getTubePath(ls('sFilePath')),
		aLineArr: [],
		iCurLineIdx: 0,
		oMediaBuffer: {},
		iSubtitle: 0, // 0=默认，-1=查不到字幕，1=有字幕
		sHash: '',
		isShowDictionary: false,
	});
	const oCurLine = computed(()=>{
		return oData.aLineArr[ oData.iCurLineIdx ];
	});
	const sSubtitleSrc = (()=>{ // 字幕文件位置（todo 用tube管道取
		const arr = oData.sMediaSrc.split('.');
		arr[arr.length-1] = 'srt';
		return arr.join('.');
	})();
	// ▲数据====================================================================================
	// ▼方法====================================================================================
	async function init(){
		const sHash = await fnInvoke("getHash", ls('sFilePath'));
		if (!sHash) throw '没有hash';
		oData.sHash = sHash;
		getLinesFromDB(sHash);
		getNewWords(sHash);
		const res = await fnInvoke('db', 'getMediaInfo', sHash);
		console.log('媒体\n', res);
		// 如果DB中的位置信息不正确，需要弹出窗口提示更新
	}
	// ▼查询库中的字幕
	async function getLinesFromDB(sHash){
		const aRes = await fnInvoke('db', 'getLineByHash', sHash);
		if (!aRes) return;
		oData.iSubtitle = 1;
		oData.aLineArr = fixTime(aRes);
		// console.log('字幕\n', aRes);
	}
	// ▼保存1个媒体信息
	async function saveMedia(){
		const arr = ls('sFilePath').split('/');
		const obj = {
			hash: oData.sHash,
			name: arr.slice(-1)[0],
			dir: arr.slice(0, -1).join('/'),
		};
		const oInfo = await fnInvoke('db', 'saveMediaInfo', obj);
		if (!oInfo) throw '保存未成功';
		console.log('已经保存', oInfo);
	}
	// ▼取得【字幕文件】的数据
	async function getSrtFile(){
		const res01 = await fetch(sSubtitleSrc).catch((err)=>{
			oData.iSubtitle = -1; // -1 表示文件不存在
		});
		if (!res01) return; // 查字幕文件不成功
		const sSubtitles = await res01.text();
		const arr = SubtitlesStr2Arr(sSubtitles);
		if (!arr) return console.log('文本转为数据未成功\n');
		oData.iSubtitle = 1;
		oData.aLineArr = arr;
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
		if (oData.iSubtitle != -1) return; // 有字幕则返回
		setFirstLine();
	}
	function toCheckDict(){
		oData.isShowDictionary = true;
	}
	// ▼查询新词
	async function getNewWords(hash){
		const res = await fnInvoke('db', 'getWordsByHash', {
			hash,
		});
		if (!res) return;
		console.log('本集新词', res);
	}
	// ============================================================================
	init();
	onMounted(()=>{
		// console.log('oDom', oDom.oMyWave);
	});
    return reactive({
        ...toRefs(oDom),
        ...toRefs(oData),
		oCurLine,
		...{
			init,
			listener,
			saveMedia,
			toCheckDict,
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
