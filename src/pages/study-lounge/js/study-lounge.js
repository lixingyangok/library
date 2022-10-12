// 
import {toRefs, reactive, computed, onMounted, getCurrentInstance} from 'vue';
import {SubtitlesStr2Arr, fixTime, copyString, downloadSrt, fileToStrings, getMediaDuration, secToStr} from '@/common/js/pure-fn.js';
import {figureOut} from './figure-out-region.js';
import {getTubePath, getDateDiff} from '@/common/js/common-fn.js';
import {getFolderChildren, addAllMediaDbInfo} from '@/common/js/fs-fn.js';
const fsp = require('fs').promises;

const dayjs = require("dayjs");
export function mainPart(){
	const oDom = reactive({
		oIframe: null,
		oMyWave: null, // 波
		oTextArea: null, // 输入框
		oSententList: null, // 字幕列表
		oSententWrap: null, // 字幕外套
		oTxtInput: null, // 故事文本的Input
		oSrtInput: null, // srt字幕的Input
		oLeftTxt: null, // 文本字幕的DOM容器
		oLeftTxtWrap: null, // 文本字幕的DOM容器
		oWritingLine: null,
		oTodayBar: null,
	});
	const oOperation = { // 编辑功能
		oIdStore: {}, // 查出来立即存在这
		aLineArr: [], // 所有行
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
		isShowFileList: false,
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
		aTxtFileList: [], // 文本类型的文件列表
		oSiblingsInfo: {}, // 当前媒体的邻居信息
		iHisMax: 30, // 最多历史记录数量
		iLineHeight: 35, // 行高xxPx
		isShowLeft: !!false,
		leftType: '', // pdf
		sReadingFile: '', // *.txt  *.pdf
		sArticle: '',
		aArticle: [],
		// iLeftTxtSize: 14, // 左侧文本字号
	});
	const oInstance = getCurrentInstance();
	// ▼当前行
	const oCurLine = computed(()=>{
		return oData.aLineArr[ oData.iCurLineIdx ];
	});
	// ▼ 抓捕字幕的正则表达式
	const reFullWords = computed(()=>{
		if (!oData.aFullWords.length) return;
		const arr = oData.aFullWords.concat().sort((aa, bb)=>{
			return bb.length - aa.length;
		});
		return new RegExp(`\\b(${arr.join('|')})`, 'gi'); // \\b
	});
	// ▼进度提示
	const aProcess = computed(()=>{
		const {oMediaInfo, iCurLineIdx, aLineArr} = oData;
		const iPreviousStart = aLineArr[iCurLineIdx-1]?.start;
		const {duration = 0} = oMediaInfo;
		if (duration <= 60 || iCurLineIdx <= 1) return [];
		const oMinute = {
			myVal: `${Number.parseInt(oCurLine.v.start / 60)}/${Number.parseInt(duration / 60)}`,
			sUnit: 'Min',
			bLight: Number.parseInt(oCurLine.v.start / 60) > Number.parseInt(iPreviousStart / 60),
		};
		const iCurPercent = (oCurLine.v.start / duration * 100).toFixed(1).split('.')[0] * 1; // 当前行进度
		const iPrevPercent = (iPreviousStart / duration * 100).toFixed(1).split('.')[0] * 1; // 上一行进度
		const oPercent = {
			myVal: iCurPercent,
			sUnit: `%`,
			bLight: (iCurPercent > iPrevPercent) && (iCurPercent % 10 === 0),
		};
		const oLine = {
			myVal: iCurLineIdx+1,
			sUnit: 'Row',
			bLight: (iCurLineIdx+1) % 10 === 0,
		};
		return [ oLine, oMinute, oPercent, ];
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
		oData.iCurLineIdx = 0;
		oData.aLineArr = [];
		oDom?.oMyWave?.cleanCanvas(true);
		const hash = await fnInvoke("getHash", ls('sFilePath'));
		if (!hash) throw '没有hash';
		const aRes = await fnInvoke('db', 'getMediaInfo', {hash});
		console.log('库中媒体信息\n', aRes[0]?.$dc());
		if (!aRes?.[0]) {
			return vm.$message.error('当前媒体未被收录');
		}
		oData.sHash = hash;
		oData.oMediaInfo = aRes[0];
		getLinesFromDB();
		await getNeighbors(); // 一定要 await 下方的方法才会正常运行
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
		oData.oIdStore = aRes.reduce((oResult, cur) => { // 保存所有id
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
		await vm.$nextTick();
		const {iLineNo=0, sTxtFile} = ls('oRecent')[ls('sFilePath')] || {};
		oInstance.proxy.goLine(iLineNo); // 没有目标行就跳到0行（防止纵向滚动条没回顶部）
		oData.sReadingFile || showFileAotuly(sTxtFile);
	}
	// ▼通过文本文件路径读取其中内容
	async function showFileAotuly(sTxtFile){
		if (!sTxtFile) return;
		oData.isShowLeft = true;
		const sTail = sTxtFile.split('.').pop().toLowerCase();
		const isPDF = sTail == 'pdf';
		oData.leftType = isPDF ? 'pdf' : 'txt';
		oData.sReadingFile = sTxtFile;
		if (isPDF) return;
		let fileTxt = await fsp.readFile(sTxtFile, 'utf8');
		const aArticle = (()=>{
			let aResult = [];
			if (sTail=='srt') {
				aResult = SubtitlesStr2Arr(fileTxt);
				aResult = aResult.map(cur => cur.text.trim()); //.filter(Boolean);
			}else{
				aResult = fileTxt.split('\n');
			}
			aResult = aResult.map(cur => cur.replace(/，\s{0,2}/g, ', '));
			return aResult;
		})();
		vm.$message.success(`取得文本 ${aArticle.length} 行`);
		oData.aArticle = Object.freeze(aArticle);

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
	// ▼取得【srt文件】的内容
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
		// console.log('收到了波形');
		oData.oMediaBuffer = oMediaBuffer;
		if (oData.iSubtitle != -1) return; // 有字幕则返回
		setFirstLine(); // 需要考虑，因为可能尚没查到字幕，不是没有字幕
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
		if (!res) vm.$message.error('删除单词未成功');
		vm.$message.success('已删除');
		getNewWords();
	}
	// ▼查询新词
	async function getNewWords(){
		const aRes = await fnInvoke('db', 'getWordsByMedia', {
			mediaId: [oData.oMediaInfo.id].concat(
				oData.aSiblings.map(cur => cur?.infoAtDb?.id),
			),
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
		console.log('打开邻居窗口');
		oData.isShowMediaInfo = true;
		setFolderInfo();
	}
	// ▼ 查询邻居文件列表
	async function getNeighbors(){
		let aList = await getFolderChildren(oData.oMediaInfo.dir);
		if (!aList) return;
		aList = aList.filter(cur => cur.isMedia);
		await addAllMediaDbInfo(aList, true);
		aList.forEach((cur, idx) => {
			const {finishedAt, id, durationStr} = cur.infoAtDb || {};
			cur.idx_ = idx + 1;
			cur.done_ = !!finishedAt;
			cur.durationStr = durationStr;
			cur.active_ = id == oData.oMediaInfo.id;
			if (cur.done_){ // YYYY-MM-DD HH:mm:ss
				cur.finishedAt_ = dayjs(finishedAt).format('YYYY-MM-DD HH:mm'); 
			}
		});
		oData.aSiblings = aList;
		recordMediaTimeInfo(); // 检查是否所有的文件都有媒体信息
	}
	// ▼统计文件夹音频时长
	async function setFolderInfo(){
		const {aSiblings} = oData;
		let aID = [];
		const fDurationSum = aSiblings.reduce((sum, cur) => {
			const {duration=0, id} = cur.infoAtDb || {};
			if (id) aID.push(id);
			return sum + duration;
		}, 0);
		const sAvg = fDurationSum / aSiblings.length;
		const oSiblingsInfo = {
			sDurationSum: secToStr(fDurationSum),
			sAvg: secToStr(sAvg),
			fistFillTime: 1,
			fDaysAgo: 0.5,
		};
		const [r01, r02] = await fnInvoke('db', 'doSql', `
			SELECT *, julianday('now', 'localtime') - julianday(filledAt, 'localtime') as daysAgo
			FROM "line"
			where mediaId in (${aID.join(',')}) and filledAt is not null
			ORDER BY filledAt ASC limit 5
		`);
		if (r01[0]){
			// console.log('第1次提交', r01);
			oSiblingsInfo.fistFillTime = dayjs(r01[0].filledAt).format('YYYY-MM-DD HH:mm');
			oSiblingsInfo.fDaysAgo = getDateDiff(new Date(r01[0].filledAt) *1);
		}
		oData.oSiblingsInfo = oSiblingsInfo;
	}
	// ▼跳转到邻居
	function visitSibling(oMedia){
		console.log('oMedia', oMedia.$dc());
		ls('sFilePath', oMedia.sPath);
		oData.sMediaSrc = getTubePath(oMedia.sPath);
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
	// ▼复制文本所在的位置路径
	function justCopy(){
		// console.log('oMediaInfo\n', oData.oMediaInfo.$dc());
		const dir = oData.oMediaInfo.dir.replaceAll('/', '\\');
		console.log(`开始复制文件夹路径 ${dir}`);
		const bCopy = copyString(dir);
		bCopy && vm.$message.success('已复制路径');
	}
	// ▼打开PDF
	function openPDF(){
		oData.isShowLeft = true;
		oData.leftType = 'pdf';
		justCopy();
		const {document: dcmt} = document.querySelector('iframe').contentWindow;
		const btn = dcmt.querySelector('#openFile');
		btn && btn.click();
	}
	// ▼打开文本
	async function openTxt(){
		oData.isShowFileList = true;
		const dir = oData.oMediaInfo.dir.replaceAll('/', '\\');
		let aItems = await fsp.readdir(dir);
		aItems = aItems.map(cur => {
			const sTail = cur.split('.').pop().toLowerCase();
			return {
				sTail,
				sFileName: cur,
				sFullPath: `${dir}/${cur}`.replaceAll('\\', '/'),
				bStay: ['pdf', 'srt', 'ass', 'txt'].includes(sTail),
			};
		}).filter(cur => {
			return cur.bStay;
		}).sort((aa, bb)=>{
			return aa.sTail.localeCompare(bb.sTail);
		});
		oData.aTxtFileList = aItems;
		console.log('aItems', aItems);
		// ▼旧的
		// oData.leftType = 'txt';
		// justCopy(); // 媒体文件更路径
		// oDom.oTxtInput.click(); 
	}
	// ▼ 打开 txt （在左侧显示）
	async function getArticleFile(ev){
		oData.isShowLeft = true;
		// oData.sArticle = ''; // 好像没用上
		const [oFile] = ev.target.files;
		const isSRT = oFile.path.slice(-4).toLocaleLowerCase() == '.srt';
		const fileTxt = await fileToStrings(oFile);
		if (!fileTxt) return;
		ev.target.value = '';
		// console.log('myLines', myLines);
		const aArticle = (()=>{
			let aResult = [];
			if (isSRT) {
				aResult = SubtitlesStr2Arr(fileTxt);
				aResult = aResult.map(cur => cur.text.trim()); //.filter(Boolean);
			}else{
				aResult = fileTxt.split('\n');
			}
			aResult = aResult.map(cur => cur.replace(/，\s{0,2}/g, ', '));
			return aResult
		})();
		vm.$message.success(`取得文本 ${aArticle.length} 行`);
		// oData.sArticle = fileTxt; // 好像没用上
		oData.aArticle = Object.freeze(aArticle);
	}
	// ▼ 字幕置左
	async function showLeftArticle(){
		oData.leftType = 'txt';
		oData.isShowLeft = true;
		const arr = oData.aLineArr.map(cur => {
			return cur.text.trim();
		});
		oData.aArticle = Object.freeze(arr);
	}
	// ▼ 导入 Srt 字幕
	async function importSrt(ev){
		const fileTxt = await fileToStrings(ev.target.files[0]);
		if (!fileTxt) return;
		ev.target.value = '';
		const arr = SubtitlesStr2Arr(fileTxt);
		if (!arr) return console.log('文本转为数据未成功\n');
		const sMsg = `解析到 ${arr.length} 行字幕，是否覆盖当前字幕？`;
		const isSure = await this.$confirm(sMsg, 'Warning', {
			confirmButtonText: '确认覆盖',
			cancelButtonText: '取消',
			type: 'warning',
		}).catch(()=>false);
		if (!isSure) return;
		oData.iCurLineIdx = 0;
		oData.aLineArr = arr;
	}
	// ▼设定某文件为已完成（将来再开发设为未完成功能？）
	async function setItFinished(oTarget){
		console.log('oTarget', oTarget.$dc());
		let {id, finishedAt} = oTarget.infoAtDb;
		finishedAt = finishedAt ? null : new Date();
		const res = await fnInvoke("db", 'updateMediaInfo', {
			id, finishedAt,
		});
		if (!res) return;
		vm.$message.success('状态变更成功');
		getNeighbors();
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
	function saveSrt(sType){
		const {dir, name} = oData.oMediaInfo;
		// console.log(`保存 ${sType}`, dir);
		const bCopy = copyString(dir);
		if (bCopy) vm.$message.success('已复制路径');
		const aName = name.split('.');
		if (aName.length > 1) aName.pop(); // 不需要后缀
		const sName = aName.join('.');
		const theArray = oData.aLineArr.$dc();
		if (sType == 'fill') {
			theArray.forEach((cur, idx)=>{
				cur.text ||= `Line No. ${idx+1}`; 
			});
		}
		downloadSrt(theArray, sName);
	}
	// ▼访问上/下一个文件
	function visitNeighbor(iType){
		console.log('iType', iType);
		for (const [idx, cur] of oData.aSiblings.entries()){
			if (!cur.active_) continue;
			const oAim = oData.aSiblings[idx + iType];
			if (oAim) {
				vm.$message.success('开始跳转');
				return visitSibling(oAim);;
			}
			break;
		}
		vm.$message.warning('没有上/下一个');
	}
	// ▼点击文本文件后打开文件的方法
	async function chooseFile(oTarget){
		// oData.isShowFileList = false; // 关闭窗口
		const {sFullPath} = oTarget;
		ls.transact('oRecent', (oldData) => {
            const old = oldData[ls.get('sFilePath')] || {
                startAt: new Date() * 1, // 记录开始时间
            };
            oldData[ls.get('sFilePath')] = {
                ...old,
				sTxtFile: sFullPath,
            };
        });
		showFileAotuly(sFullPath);
	}
	// 保存媒体时长信息
	async function recordMediaTimeInfo(){
		const aTarget = oData.aSiblings.filter(cur => !cur.durationStr);
		if (!aTarget.length) return;
		const sMsg = `发现有 ${aTarget.length} 个文件没有时长信息，是否补充？`;
		const isSure = await vm.$confirm(sMsg, 'Warning', {
			confirmButtonText: '确认',
			cancelButtonText: '取消',
			type: 'warning',
		}).catch(()=>false);
		if (!isSure) return;
		// oData.isShowMediaInfo = true;
		// await new Promise(f1 = setTimeout(f1, 600));
		for await(const [idx, cur] of aTarget.entries()) {
			const {sPath, infoAtDb} = cur;
			const oDuration = await getMediaDuration(getTubePath(sPath));
			await toRecordDiration(infoAtDb, oDuration);
			cur.durationStr = oDuration.sDuration;
			const sTips = `${sPath.split('/').pop()}：${oDuration.sDuration}`;
			vm.$message.success(sTips);
		}
	}
	// ▼如果数据库中没有记录音频的时长，此时应该将时长记录起来
	async function toRecordDiration(oMediaInfo, oDuration){
		const res = await fnInvoke("db", 'updateMediaInfo', {
			id: oMediaInfo.id,
			duration: oDuration.fDuration,
			durationStr: oDuration.sDuration,
		});
		return res;
	}
	const fnLib = {
		'保存波形': () => oDom?.oMyWave?.toSaveTemp(),
		'媒体入库': saveMedia,
		'导入Srt': () => oDom?.oSrtInput?.click(),
		'导出Srt': saveSrt,
		'导出Srt(补空行)': () => saveSrt('fill'),
	};
	// ▼ 处理菜单点击事件
	function handleCommand(command){
		console.log('指令：', command);
		fnLib[command]?.();
	}
	async function setAllEmpty(){
		const sMsg = `清空所有行的文本？`;
		const isSure = await vm.$confirm(sMsg, 'Warning', {
			confirmButtonText: '确认',
			cancelButtonText: '取消',
			type: 'warning',
		}).catch(()=>false);
		if (!isSure) return;
		const {aLineArr} = oData;
		aLineArr.forEach(cur=>{
			cur.text = '';
		});
	}
	// ============================================================================
	init();
	onMounted(()=>{
		// console.log('oDom', oDom.oMyWave);
	});
	const oFn = {
		chooseFile,
		init,
		setAllEmpty,
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
		getArticleFile,
		saveSrt,
		importSrt,
		setItFinished,
		visitNeighbor,
		handleCommand,
		openTxt,
		showLeftArticle,
	};
    return reactive({
        ...toRefs(oDom),
        ...toRefs(oData),
		...oFn,
		oCurLine,
		aProcess,
    });
};
