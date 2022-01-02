import {toRefs, reactive, ref, onMounted} from 'vue';
import {fileToBuffer, SubtitlesStr2Arr} from '../../../common/js/pure-fn.js';
// import {WaveMaker} from './wave.js';
const ipcRenderer = require("electron").ipcRenderer;

// const w01 = new WaveMaker(1,2,3);
// console.log('w01', w01);
// window.wv = w01;

const oCanvasDom = ref(null);
const oCanvasNeighbor = ref(null); // oWaveWrap
const oCanvasCoat = ref(null);
const oPointer = ref(null);
const oAudio = ref(null);
// ▲ dom
const oData = reactive({
	sFilePath: '',
	sMediaSrc: '',
	sSubtitleSrc: '',
	oBuffer: {}, // 媒体的 buffer
	aLineArr: [],
	iCurLineIdx: 0,
	aPeaks: [],
	drawing: false,
	...{ // 波形相关
		iHeight: 0.3,
		iCanvasHeight: 110,
		iCanvasTop: 18,
		iPerSecPx: 100,
		fPerSecPx: 0,
		iScrollLeft: 0,
		playing: false,
	},
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
	ipcRenderer.send("getSubtitlesArr", oData.sSubtitleSrc);
	
	// ▼取得字幕数据
	function readSrtFile(event, sSubtitles){
		const aRes = SubtitlesStr2Arr(sSubtitles);
		if (!aRes) {
			return console.log('查询字幕未成功');
		}
		oData.aLineArr.splice(0, Infinity, ...aRes);
	}
	// ▲数据部分
	// ▼加载音频文件的 buffer 
    async function loadFile(){
		console.time('加载文件');
        const oBuffer = await fetch(oData.sMediaSrc).then(res => {
			console.timeEnd('加载文件');
			console.time('转Blob');
            return res.blob();
        }).then(res=>{
			console.timeEnd('转Blob');
            return fileToBuffer(res, true);
        }).catch(res=>{
            console.log('读取媒体buffer未成功\n', res);
        });
		console.log('媒体buffer\n', oBuffer);
        return oBuffer;
    }

	// ▼按收到的数据 => 绘制
    function toDraw(aPeaks) {
		aPeaks = aPeaks || oData.aPeaks;
		cleanCanvas();
		const { iHeight } = oData; // 波形高
		const oCanvas = oCanvasDom.value;
		const fCanvasWidth = aPeaks.length / 2;
		const halfHeight = oCanvas.height / 2;
		const Context = oCanvas.getContext('2d');
		let idx = 0;
		Context.fillStyle = '#55c655';
		while (idx < fCanvasWidth) {
			const cur1 = aPeaks[idx * 2] * iHeight | 0;
			const cur2 = aPeaks[idx * 2 + 1] * iHeight | 0;
			if (cur1 % 1 > 0 || cur2 % 1 > 0) debugger;
			Context.fillRect(idx, (halfHeight - cur1), 1, cur1 - cur2);
			idx++;
		}
		oData.drawing = false;
		return oCanvas;
	}
	// ▼滚轮动了
	function wheelOnWave(ev) {
		ev.preventDefault();
		ev.stopPropagation();
		ev.returnValue = false;
		const {altKey, ctrlKey, shiftKey, wheelDeltaY, deltaY} = ev;
		if (0) console.log(shiftKey, deltaY);
		if (ctrlKey) {
			zoomWave(ev);
		} else if (altKey) {
			changeWaveHeigh(wheelDeltaY);
		} else {
			scrollToFn(wheelDeltaY);
		}
	}
	// ▼使Dom滚动条横向滚动
	function scrollToFn(deltaY) {
		const iOneStepLong = 350; // 步长
		const oDom = oCanvasNeighbor.value;
		const iMax = oDom.children[0].offsetWidth - oCanvasCoat.value.offsetWidth;
		console.log('iMax', iMax);
		let newVal = (() => {
			let oldVal = oDom.scrollLeft;
			if (deltaY >= 0) return oldVal - iOneStepLong;
			else return oldVal + iOneStepLong;
		})();
		if (newVal < 0) newVal = 0;
		if (newVal > iMax) newVal = iMax;
		oData.iScrollLeft = newVal;
		oDom.scrollTo(newVal, 0);
	}
	// ▼滚动条动后调用
	function waveWrapScroll() {
		const {oBuffer, iPerSecPx} = oData;
		const {offsetWidth, scrollLeft} = oCanvasNeighbor.value;
		const {aPeaks, fPerSecPx} = getPeaks(
			oBuffer, iPerSecPx, scrollLeft, offsetWidth,
		);
		toDraw(aPeaks);
		oData.iScrollLeft = Math.max(0, scrollLeft);
		oData.fPerSecPx = fPerSecPx;
	}
	function setCanvasWidth(){
		const iWidth = oCanvasCoat.value?.offsetWidth;
		if (!iWidth) return;
		oCanvasDom.value.width = iWidth;
		const {aPeaks, fPerSecPx} = getPeaks(oData.oBuffer, oData.iPerSecPx, 0, iWidth);
		if (!aPeaks) return;
		oData.fPerSecPx = fPerSecPx;
        toDraw(aPeaks);
	}

	// ▼清空画布
	function cleanCanvas() {
		const oCanvas = oCanvasDom.value;
		// const width = oCanvas.parentElement.offsetWidth;
		const Context = oCanvas.getContext('2d');
		// oCanvas.width = width;
		Context.clearRect(0, 0, 5_000, 200);
	}
	// ▼播放
	async function toPlay(isFromHalf) {
		clearInterval(oData.playing); //把之前播放的关闭再说
		const { fPerSecPx } = oData;
		const { start, end } = oData.aLineArr[oData.iCurLineIdx];
		const long = end - start;
		const Audio = oAudio.value;
		if (!Audio) return console.log('有没音频对象');
		const { style={} } = oPointer.value || {}; 
		const fStartTime = start + (isFromHalf ? long * 0.4 : 0);
		style.left = `${fStartTime * fPerSecPx}px`;
		Audio.currentTime = fStartTime;
		Audio.play && Audio.play();
		const playing = setInterval(() => {
			const { currentTime: cTime } = Audio;
			const oCur = oData.aLineArr[oData.iCurLineIdx]; 
			if (cTime < oCur.end && oData.playing) {
				return style.left = `${cTime * oData.fPerSecPx}px`;
			}
			Audio.pause();
			clearInterval(oData.playing);
			oData.playing = false;
		}, ~~(1000 / 70)); //每秒执行次数70
		oData.playing = playing;
	}
	function saveBlob(){
		// type: "application/zip"
		const text = JSON.stringify(oData.oBuffer);
		const blob = new Blob([text], {type: "application/json"});
		const downLink = Object.assign(document.createElement('a'), {
			download: 'fileName.blob',
			href: URL.createObjectURL(blob),
		});
		// document.body.appendChild(downLink); // 链接插入到页面
		downLink.click();
		// document.body.removeChild(downLink); // 移除下载链接
	}
	// 改变波形高度
	function changeWaveHeigh(deltaY) {
		let { iHeight } = oData;
		const [min, max, iStep] = [0.1, 3, 0.15];
		if (deltaY >= 0) iHeight += iStep;
		else iHeight -= iStep;
		if (iHeight < min) iHeight = min;
		if (iHeight > max) iHeight = max;
		oData.iHeight = iHeight;
		toDraw();
	}
	function zoomWave(ev){
		if (oData.drawing) return; //防抖
		const {iPerSecPx: perSecPxOld, oBuffer} = oData;
		const {deltaY, clientX = window.innerWidth / 2} = ev;
		const [min, max, iStep] = [35, 250, 20]; //每秒最小/大宽度（px），缩放步幅
		const oWaveWrap = oCanvasNeighbor.value;
		// ▼说明：小到头了就不要再缩小了，大到头了也就要放大了
		if (deltaY > 0 ? perSecPxOld <= min : perSecPxOld >= max){
			oData.drawing = false;
			return;
		}
		if (!oWaveWrap) {
			oData.drawing = false;
			return console.log('波形外套的dom没得到');
		}
		console.log('开始缩放');
		const {parentElement:{offsetLeft}, children:[markBar]} = oWaveWrap;
		const iPerSecPx = (() => { //新-每秒宽度
			const result = perSecPxOld + iStep * (deltaY <= 0 ? 1 : -1);
			if (result < min) return min;
			else if (result > max) return max;
			return result;
		})();
		const fPerSecPx = (()=>{ // 新-每秒宽度（精确）
			const sampleSize = ~~(oBuffer.sampleRate / iPerSecPx); // 每一份的点数 = 每秒采样率 / 每秒像素
			return oBuffer.length / sampleSize / oBuffer.duration; 
		})();
		markBar.style.width = fPerSecPx * oBuffer.duration + 'px';
		const iNewLeftPx = getPointSec({clientX}) * fPerSecPx - (clientX - offsetLeft);
		oPointer.value.style.left = `${oAudio.value.currentTime * fPerSecPx}px`;
		oData.iPerSecPx = iPerSecPx;
		oData.drawing = true;
		oWaveWrap.scrollLeft = iNewLeftPx; // 在此触发了缩放
		if (iNewLeftPx <= 0) {
			console.log('小于0 =', iNewLeftPx);
			waveWrapScroll();
		}
	}
	// ▼跳至某行
	async function goLine(iAimLine, oNewLine, doNotSave) {
		const {aLineArr, iCurLineIdx, sCurLineTxt=''} = this.state;
		const oNewState = {aLineArr, iCurLineIdx};
		if (typeof iAimLine === 'number') { // 观察：能不能进来？
			oNewState.iCurLineIdx = iAimLine;
		}else{
			iAimLine = iCurLineIdx;
		}
		const isDifferent = aLineArr[iCurLineIdx].text !== sCurLineTxt;
		if (isDifferent){
			aLineArr[iCurLineIdx].text = sCurLineTxt.trim(); // 旧的值，存起来
		}
		if (iAimLine % 2 && (!aLineArr[iAimLine] || isDifferent)) {
			this.toSaveInDb();
		}
		if (oNewLine) {
			oNewState.aLineArr.push(oNewLine);
			oNewState.sCurLineTxt = oNewLine.text;
		}else{
			oNewState.sCurLineTxt = aLineArr[iAimLine].text;
		}
		if (!doNotSave) this.saveHistory(oNewState); // 有报错补上 dc_
		this.setState(oNewState);
		this.setLinePosition(oNewLine || aLineArr[iAimLine], iAimLine);
	}
	// ▼得到点击处的秒数，收受一个事件对象
	function getPointSec({ clientX }) {
		const {scrollLeft, parentElement: {offsetLeft}} = oCanvasNeighbor.value;
		const iLeftPx = clientX - offsetLeft + scrollLeft; //鼠标距左边缘的px长度
		const iNowSec = iLeftPx / oData.fPerSecPx; //当前指向时间（秒）
		return iNowSec;
	}
	// ▼生命周期 & 方法调用 ==========================================================
	window.onresize = setCanvasWidth;
	ipcRenderer._events.getSubtitlesArrReply = readSrtFile;
	onMounted(async ()=>{
		const oBuffer = await loadFile();
		if (!oBuffer) return;
		oData.oBuffer = oBuffer;
		setCanvasWidth();
    });
    // ▼最终返回 ==========================================================
    return reactive({
        ...toRefs(oData),
		...{ // dom
			oCanvasDom,
			oCanvasNeighbor,
			oCanvasCoat,
			oPointer,
			oAudio,
		},
		...{ // fn
			wheelOnWave,
			waveWrapScroll,
			toPlay,
			saveBlob,
		},
    });
};

// buffer.sampleRate  // 采样率：浮点数，单位为 sample/s
// buffer.length  // 采样帧率：整形
// buffer.duration  // 时长(秒)：双精度型
// buffer.numberOfChannels  // 通道数：整形
// ▼ 按接收到的数据 => 计算波峰波谷（纯函数）
function getPeaks(buffer, iPerSecPx, left=0, iCanvasWidth=500) {
	const aChannel = buffer.aChannelData_ || buffer.getChannelData(0);
	const sampleSize = ~~(buffer.sampleRate / iPerSecPx); // 每一份的点数 = 每秒采样率 / 每秒像素
	const aPeaks = [];
	let idx = Math.round(left);
	const last = idx + iCanvasWidth;
	while (idx <= last) {
		let start = idx * sampleSize;
		const end = start + sampleSize;
		let min = 0;
		let max = 0;
		while (start < end) {
			const value = aChannel[start];
			if (value > max) max = value;
			else if (value < min) min = value;
			start++;
		}
		aPeaks.push(max, min);
		idx++;
	}
	// ▼返回浮点型的每秒宽度(px)
	const fPerSecPx = buffer.length / sampleSize / buffer.duration;
	oData.aPeaks.splice(0, Infinity, ...aPeaks);
	return {aPeaks, fPerSecPx};
}

// const AC = new window.AudioContext();
// AC.decodeAudioData(uint8Buffer.buffer).then(audioBuf => {
//     const analyser = AC.createAnalyser();
//     const bs = AC.createBufferSource();
//     bs.buffer = audioBuf;
//     bs.connect(analyser);
//     analyser.connect(AC.destination);
//     bs.start();
// });