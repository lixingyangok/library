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
	const oOperation = { // 编辑功能
		aLineFromDB: [], // 查出来立即存在这
		oIdStore: {}, // 查出来立即存在这
		aLineArr: [],
		iCurLineIdx: 0,
		aHistory: [{ sLineArr: '[]', iCurLineIdx: 0 }],
		iCurStep: 0,
		deletedSet: new Set(), // 已删除的行id
	};
	const oInputMethod = { // 输入法
		sTyped: '',
		aFullWords: [],
		aWordsList: [[], []],
		aCandidate: [],
	};
	const oData = reactive({
		...oOperation,
		...oInputMethod,
		sMediaSrc: getTubePath(ls('sFilePath')),
		sHash: '',
		oMediaInfo: {}, // 库中媒体信息
		oMediaBuffer: {}, // 媒体文件
		iSubtitle: 0, // 字幕状态：0=默认，-1=查不到字幕，1=有字幕
		isShowDictionary: false,
		isShowNewWords: false,
		sSearching: '', // 查字典
	});
	const oCurLine = computed(()=>{
		return oData.aLineArr[ oData.iCurLineIdx ];
	});
	const sSubtitleSrc = (()=>{ // 字幕文件位置（todo 用tube管道取
		const arr = oData.sMediaSrc.split('.');
		arr[arr.length-1] = 'srt';
		return arr.join('.');
	})();
	// ▲数据 ====================================================================================
	// ▼方法 ====================================================================================
	async function init(){
		const sHash = await fnInvoke("getHash", ls('sFilePath'));
		if (!sHash) throw '没有hash';
		const oRes = await fnInvoke('db', 'getMediaInfo', sHash);
		if (!oRes) return;
		oData.sHash = sHash;
		oData.oMediaInfo = oRes;
		console.log('库中媒体信息\n', oRes);
		getLinesFromDB();
		getNewWords();
	}
	// ▼查询库中的字幕
	async function getLinesFromDB(){
		const aRes = await fnInvoke('db', 'getLineByMedia', oData.oMediaInfo.id);
		if (!aRes?.length) {
			if (oData.oMediaBuffer) setFirstLine();
			oData.iSubtitle = -1; // -1 表示文件不存在 
			return;
		}
		oData.oIdStore = aRes.reduce((oResult, cur)=>{ // 保存所有id
			oResult[cur.id] = true;
			return oResult;
		}, {});
		const aLineArr = fixTime(aRes);
		const sLineArr = JSON.stringify(aLineArr);
		oData.aHistory[0].sLineArr = sLineArr;
		oData.aLineFromDB = JSON.parse(sLineArr);
		oData.iSubtitle = 1;
		oData.aLineArr = aLineArr; // 正式使用的数据
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
		init();
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
		oData.aHistory[0].sLineArr = JSON.stringify([oFirst]);
	}
	// ▼接收波形数据
	function listener(oMediaBuffer){
		// console.log('收到波形');
		oData.oMediaBuffer = oMediaBuffer;
		if (oData.iSubtitle != -1) return; // 有字幕则返回
		// ▼需要考虑，因为可能尚没查到字幕，不是没有
		setFirstLine(); 
	}
	function toCheckDict(){
		oData.isShowDictionary = true;
	}
	async function changeWordType(oWord){
		console.log('单词', oWord.$dc());
		const res = await fnInvoke('db', 'switchWordType', {
			...oWord,
			mediaId: oData.oMediaInfo.id,
		});
		if (!res) return;
		console.log('修改反馈', res);
		getNewWords();
	}
	async function delOneWord(oWord){
		const res = await fnInvoke('db', 'delOneNewWord', {
			...oWord,
			mediaId: oData.oMediaInfo.id,
		});
		if (!res) this.$message.error('删除单词未成功');
		this.$message.success('已删除');
		getNewWords();
	}
	// ▼查询新词
	async function getNewWords(){
		const aRes = await fnInvoke('db', 'getWordsByMedia', {
			mediaId: oData.oMediaInfo.id,
			// more: ****
		});
		if (!aRes) return;
		oData.aFullWords = aRes.map(cur => cur.word);
		oData.aWordsList = aRes.reduce((aResult, cur)=>{
			let iAimTo = 0;
			if (cur.type == 2) iAimTo = 1;
			aResult[iAimTo].push(cur);
			return aResult;
		}, [[],[]]);
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
			changeWordType,
			delOneWord,
			getNewWords,
			getLinesFromDB,
		},
    });
};

