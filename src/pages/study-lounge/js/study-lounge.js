import {toRefs, reactive, ref, onMounted} from 'vue';
import {fileToBuffer, SubtitlesStr2Arr} from '../../../common/js/pure-fn.js';
// import {WaveMaker} from './wave.js';
const ipcRenderer = require("electron").ipcRenderer;

// const w01 = new WaveMaker(1,2,3);
// console.log('w01', w01);
// window.wv = w01;

const oCanvasDom = ref(null);
const oCanvasNeighbor = ref(null);
const oCanvasCoat = ref(null);
const oPointer = ref(null);
const oAudio = ref(null);
// ▲ dom
const oData = reactive({
	sMediaSrc: '',
	sSubtitleSrc: '',
	oBuffer: {}, // 媒体的 buffer
	aLineArr: [],
	iCurLineIdx: 0,
	...{ // 波形相关
		iHeight: 0.8,
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
	oData.sMediaSrc = 'tube://a/?path=' + sFilePath;
	oData.sSubtitleSrc = (()=>{
		const arr = sFilePath.split('.');
		arr[arr.length-1] = 'srt';
		return arr.join('.');
	})();
	ipcRenderer.send("getSubtitlesArr", oData.sSubtitleSrc);
	
	// ▼取得字幕数据
	function readSrtFile(event, sSubtitles){
		const aRes = SubtitlesStr2Arr(sSubtitles);
		if (!aRes) return;
		oData.aLineArr.splice(0, Infinity, ...aRes);
	}
	// ▲数据部分
	// ▼加载音频文件的 buffer 
    async function loadFile(){
        const oBuffer = await fetch(oData.sMediaSrc).then(res => {
            return res.blob();
        }).then(res=>{
            return fileToBuffer(res, true);
        }).catch(res=>{
            console.log('读取媒体buffer未成功\n', res);
        });
        return oBuffer;
    }

	// ▼按收到的数据 => 绘制
    function toDraw(aPeaks) {
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
			this.zoomWave(ev);
		} else if (altKey) {
			this.changeWaveHeigh(wheelDeltaY);
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
	// ▼滚动条动了
	function waveWrapScroll() {
		const {oBuffer, iPerSecPx} = oData;
		const {offsetWidth, scrollLeft} = oCanvasNeighbor.value;
		const {aPeaks, fPerSecPx} = getPeaks(
			oBuffer, iPerSecPx, scrollLeft, offsetWidth,
		);
		toDraw(aPeaks);
		oData.iScrollLeft = Math.max(0, scrollLeft);
		// const newObj = {aPeaks};
		// if (fPerSecPx !== this.state.fPerSecPx) newObj.fPerSecPx = fPerSecPx;;
		// this.setState(newObj);
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
		const { start, end } = oData.aLineArr[1];
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
			if (cTime < oData.aLineArr[1].end && oData.playing) {
				return style.left = `${cTime * oData.fPerSecPx}px`;
			}
			Audio.pause();
			clearInterval(oData.playing);
			oData.playing = false;
		}, ~~(1000 / 70)); //每秒执行次数70
		oData.playing = playing;
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
    return ({
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