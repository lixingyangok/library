import {toRefs, reactive, ref, onMounted} from 'vue';
import {fileToBuffer, SubtitlesStr2Arr} from '../../../common/js/pure-fn.js';
const ipcRenderer = require("electron").ipcRenderer;
import {MyWave} from './wave.js';
const fsPromises = require('fs').promises;

// const w01 = new MyWave(1,2,3);
// console.log('w01', w01);

const oCanvasDom = ref(null);
const oCanvasNeighbor = ref(null);
const oCanvasCoat = ref(null);
// ▲ dom
const oData = reactive({
	sMediaSrc: '',
	sSubtitleSrc: '',
	oBuffer: {}, // 媒体的 buffer
	aLines: [],
	...{ // 波形相关
		iHeight: 0.5,
		iCanvasHeight: 110,
		iCanvasTop: 18,
		iPerSecPx: 200,
		fPerSecPx: 0,
		iScrollLeft: 0,
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
		oData.aLines.splice(0, Infinity, ...aRes);
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
		// Context.fillStyle = '#0f0';
		// Context.fillRect(0, ~~halfHeight, 9999, 1);
		return oCanvas;
	}
	// ▼滚轮动了
	function wheelOnWave(ev) {
		// console.log('滚轮动了');
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
		const oDom = oCanvasNeighbor.value;
		const iOneStepLong = 350; // 步长
		const newVal = (() => {
			let oldVal = oDom.scrollLeft;
			if (deltaY >= 0) return oldVal - iOneStepLong;
			else return oldVal + iOneStepLong;
		})();
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
		// const newObj = {aPeaks};
		// if (fPerSecPx !== this.state.fPerSecPx) newObj.fPerSecPx = fPerSecPx;;
		// this.setState(newObj);
	}
	function setCanvasWidth(){
		const iWidth = oCanvasCoat.value.offsetWidth;
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
    return {
        ...toRefs(oData),
		...{ // dom
			oCanvasDom,
			oCanvasNeighbor,
			oCanvasCoat,
		},
		...{ // fn
			wheelOnWave,
			waveWrapScroll,
		},
    };
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