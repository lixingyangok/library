import {toRefs, reactive, ref, onMounted} from 'vue';
import {fileToBuffer} from '../../../common/js/pure-fn.js';

export function f1(){
	const sFilePath = 'tube://a/?path=' + localStorage.getItem('sFilePath');
    const oCanvas = ref(null);
    const oData = reactive({
		sMediaSrc: sFilePath,
		oFileBuffer: {}, // 媒体的 buffer
		fPerSecPx: 0,
    });
	// ▼加载音频文件的 buffer 
    async function loadFile(){
        const oBuffer = await fetch(sFilePath).then(res => {
            return res.blob();
        }).then(res=>{
            return fileToBuffer(res, true);
        }).catch(res=>{
            console.log('读取媒体buffer未成功\n', res);
        });
		if (!oBuffer) return;
		oData.oFileBuffer = oBuffer;
        return oBuffer;
    }

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
		iCanvasWidth = document.querySelectorAll('.canvas-coat')[0].offsetWidth;
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

	// ▼按收到的数据 => 绘制
    function toDraw(aPeaks_) {
		// this.cleanCanvas();
		// const { iHeight } = this.state; // 波形高
		const iHeight = 0.9; // 波形高
		const aPeaks = aPeaks_;
		const oCanvas = document.querySelectorAll('.canvas')[0];
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
		Context.fillStyle = '#0f0';
		Context.fillRect(0, ~~halfHeight, 9999, 1);
		return oCanvas;
	}
	function takeBufferToShow(){

	}
	function waveWrapScroll() {
		console.log('监听到滚动');
		// let {buffer, iPerSecPx} = this.state;
		// let {offsetWidth, scrollLeft} = this.oWaveWrap.current;
		// const {aPeaks, fPerSecPx} = this.getPeaks(
		// 	buffer, iPerSecPx, scrollLeft, offsetWidth,
		// );
		// this.toDraw(aPeaks);
		// const newObj = {aPeaks};
		// if (fPerSecPx !== this.state.fPerSecPx) newObj.fPerSecPx = fPerSecPx;;
		// this.setState(newObj);
	}
    onMounted(async ()=>{
		const isSuccess = await loadFile();
		if (!isSuccess) return;
		setCanvasWidth();
    });
	function setCanvasWidth(){
		const canvasCoat = document.querySelectorAll('.canvas-coat')[0];
        const canvas02 = canvasCoat.querySelectorAll('.canvas')[0];
		canvas02.width = `${canvasCoat.offsetWidth}`;
		const {aPeaks, fPerSecPx} = getPeaks(oData.oFileBuffer, 300);
		if (!aPeaks) return;
		oData.fPerSecPx = fPerSecPx;
        toDraw(aPeaks);
	}
	window.onresize = setCanvasWidth;

    // ▼返回
    return {
        ...toRefs(oData),
        loadFile,
		waveWrapScroll,
    };
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

