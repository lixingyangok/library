import {toRefs, reactive, computed, onMounted, getCurrentInstance} from 'vue';
import {SubtitlesStr2Arr, fixTime, copyString, downloadSrt, fileToStrings} from '../../../common/js/pure-fn.js';
import {figureOut} from './figure-out-region.js';
import {getTubePath} from '../../../common/js/common-fn.js';


export function mainPart(){
	const oDom = reactive({
		oIframe: null,
		oMyWave: null, // 波
		oTextArea: null, // 输入框
		oSententList: null, // 字幕列表
		oSententWrap: null, // 字幕外套
		oTxtInput: null, // 文本字幕的Input
		oLeftTxt: null, // 文本字幕的DOM容器
		oLeftTxtWrap: null, // 文本字幕的DOM容器
		oWritingLine: null,
	});
	const oOperation = { // 编辑功能
		oIdStore: {}, // 查出来立即存在这
		aLineArr: [],
		oAllLine: {}, // 查出来就保存上，备份
		iCurLineIdx: 0,
		aHistory: [{ sLineArr: '[]', iCurLineIdx: 0 }],
		iCurStep: 0,
		deletedSet: new Set(), // 已删除的行id.
		iWriting: -1,
		iMatchStart: 0,
		iMatchEnd: 0,
		oRightToLeft: {}, // 对照表
	};
	const oInputMethod = { // 输入法
		sTyped: '',
		aCandidate: [], // 计算所得的候选词
		aFullWords: [], // 所有词（候选词的缺省）
		aWordsList: [[], []], // 关键词，专有名词
		oKeyWord: {}, // 关键词
		oProperNoun: {}, // 专有名词
	};
	const visiableControl = { // 控制窗口显隐
		isShowDictionary: false,
		isShowNewWords: false,
		isShowMediaInfo: false,
	};
	const oData = reactive({
		...oOperation,
		...oInputMethod,
		...visiableControl,
		sMediaSrc: getTubePath(ls('sFilePath')),
		sHash: '',
		oMediaInfo: {}, // 库中媒体信息
		oMediaBuffer: {}, // 媒体的波形信息
		iSubtitle: 0, // 字幕状态：0=默认，-1=查不到字幕，1=有字幕
		sSearching: '', // 查字典
		iShowStart: 0,
		aSiblings: [], // 当前媒体的邻居文件
		iHisMax: 30, // 最多历史记录数量
		iLineHeight: 35, // 行高xxPx
		isShowLeft: !!false,
		leftType: '',
		sArticle: '',
		aArticle: [],
	});
	const oInstance = getCurrentInstance();
	// ▼当前行
	const oCurLine = computed(()=>{
		return oData.aLineArr[ oData.iCurLineIdx ];
	});
	// ▼ 抓捕字幕的正则表达式
	const reFullWords = computed(()=>{
		if (!oData.aFullWords.length) return;
		const arr = oData.aFullWords.concat().sort((aa,bb)=>{
			return bb.length - aa.length;
		});
		return new RegExp(`\\b(${arr.join('|')})`, 'gi'); // \\b
	});
	// ▼ 字幕文件位置（todo 用tube管道取
	const sSubtitleSrc = (()=>{
		const arr = oData.sMediaSrc.split('.');
		arr[arr.length-1] = 'srt';
		return arr.join('.');
	})();
	// ▲数据 ====================================================================================
	// ▼方法 ====================================================================================
	async function init(){
		oDom?.oMyWave?.cleanCanvas(true);
		oData.iCurLineIdx = 0;
		oData.aLineArr = [];
		await vm.$nextTick();
		const hash = await fnInvoke("getHash", ls('sFilePath'));
		if (!hash) throw '没有hash';
		const aRes = await fnInvoke('db', 'getMediaInfo', {hash});
		console.log('库中媒体信息\n', aRes[0]?.$dc());
		if (!aRes?.[0]) return;
		oData.sHash = hash;
		oData.oMediaInfo = aRes[0];
		getLinesFromDB();
		await getNeighbors();
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
		oData.iSubtitle = 1;
		oData.aLineArr = aLineArr; // 正式使用的数据
		oData.oAllLine = JSON.parse(sLineArr).reduce((oResult, cur)=>{
			oResult[cur.id] = cur;
			return oResult;
		}, {});
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
	// ▼接收子组件波形数据
	function bufferReceiver(oMediaBuffer){
		// console.log('收到波形');
		oData.oMediaBuffer = oMediaBuffer;
		if (oData.iSubtitle != -1) return; // 有字幕则返回
		// ▼需要考虑，因为可能尚没查到字幕，不是没有
		setFirstLine(); 
	}
	// ▼打开字典窗口
	function toCheckDict(){
		oData.isShowDictionary = true;
	}
	// ▼切换单词类型
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
	// ▼删除1个单词
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
			mediaId: [oData.oMediaInfo.id].concat(
				oData.aSiblings.map(cur=>cur.id),
			),
			// more: ****
		});
		if (!aRes) return;
		oData.aFullWords = aRes.map(cur => cur.word);
		oData.oProperNoun = {}; // 清空
		oData.oKeyWord = {}; // 清空
		oData.aWordsList = aRes.reduce((aResult, cur)=>{
			let iAimTo = 0;
			if (cur.type == 2) iAimTo = 1;
			aResult[iAimTo].push(cur);
			[oData.oKeyWord, oData.oProperNoun][iAimTo][
				cur.word.toLowerCase()
			] = true;
			return aResult;
		}, [[],[]]);
	}
	// ▼显示一批媒体信息
	async function showMediaDialog(){
		oData.isShowMediaInfo = true;
	}
	// ▼ 查询邻居文件列表
	async function getNeighbors(){
		const aRes = await fnInvoke('db', 'getMediaInfo', {
			dir: oData.oMediaInfo.dir
		});
		if (!aRes) return;
		oData.aSiblings = aRes;
	}
	// ▼跳转到邻居
	function visitSibling(oMedia){
		console.log('oMedia', oMedia.$dc());
		const sFilePath = `${oMedia.dir}/${oMedia.name}`;
		ls('sFilePath', sFilePath);
		oData.sMediaSrc = getTubePath(ls('sFilePath'));
		init();
	}
	// ▼切割句子
	function splitSentence(text, idx){
		if (!reFullWords.v) return [text];
		const aResult = [];
		let iLastEnd = 0;
		text.replace(reFullWords.v, (abc, sCurMach, iCurIdx) => {
			iCurIdx && aResult.push(text.slice(iLastEnd, iCurIdx));
			const sClassName = (
				oData.oKeyWord[sCurMach.toLowerCase()] ? 'red' : 'blue'
			);
			aResult.push({ sClassName, word: sCurMach });
			iLastEnd = iCurIdx + sCurMach.length;
		});
		if (!iLastEnd) return [text];
		if (iLastEnd < text.length){
			aResult.push(text.slice(iLastEnd));
		}
		return aResult;
	}
	// ▼字幕滚动
	function lineScroll(ev){
		oData.iShowStart = Math.floor(
			ev.target.scrollTop / oData.iLineHeight
		);
	}
	// ▼显示左侧
	function showLeftColumn(){
		oData.isShowLeft = !oData.isShowLeft;
	}
	// ▼打开PDF
	function openPDF(){
		console.log('oMediaInfo\n', oData.oMediaInfo.$dc());
		oData.isShowLeft = true;
		oData.leftType = 'pdf';
		const dir = oData.oMediaInfo.dir.replaceAll('/', '\\');
		const bCopy = copyString(dir);
		if (bCopy) vm.$message.success('已复制路径');
		const btn = oDom?.oIframe?.contentDocument?.querySelector('#openFile');
		if (!btn) return;
		btn.click();
	}
	// ▼打开txt
	async function getFile(ev){
		oData.leftType = 'txt';
		oData.sArticle = '';
		oData.isShowLeft = true;
		const fileTxt = await fileToStrings(ev.target.files[0]);
		if (!fileTxt) return;
		ev.target.value = '';
		const aArticle = Object.freeze(fileTxt.split('\n'));
		vm.$message.success(`取得文本 ${aArticle.length} 行`);
		oData.sArticle = fileTxt;
		oData.aArticle = aArticle;
	}
	// ▼查询是否修改过
	function checkIfChanged(oOneLine){
		if (!oOneLine.id) return true;
		const oOldOne = oData.oAllLine[oOneLine.id];
		return ['start', 'end', 'text'].some(key => {
			return oOneLine[key] != oOldOne[key];
		});
	}
	// ▼保存字幕文件
	function saveSrt(){
		console.log('保存');
		const {dir, name} = oData.oMediaInfo;
		const aName = name.split('.');
		aName[aName.length-1] = 'srt';
		const sName = aName.join('.');
		const bCopy = copyString(dir);
		if (bCopy) vm.$message.success('已复制路径');
		downloadSrt(oData.aLineArr, sName);
	}
	// ============================================================================
	init();
	onMounted(()=>{
		// console.log('oDom', oDom.oMyWave);
	});
	const oFn = {
		init,
		bufferReceiver,
		saveMedia,
		toCheckDict,
		changeWordType,
		delOneWord,
		getNewWords,
		getLinesFromDB,
		showMediaDialog,
		splitSentence,
		lineScroll,
		visitSibling,
		openPDF,
		showLeftColumn,
		checkIfChanged,
		getFile,
		saveSrt,
	};
    return reactive({
        ...toRefs(oDom),
        ...toRefs(oData),
		...oFn,
		oCurLine,
    });
};
