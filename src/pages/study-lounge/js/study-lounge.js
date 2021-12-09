import {toRefs, reactive, ref, onMounted} from 'vue';
import {fileToBuffer} from '../../../common/js/pure-fn.js';

export function f1(){
    const oCanvas = ref(null);
    const obj = reactive({
        sMediaSrc: '',
    });
    async function loadFile(){
        const sFilePath = 'tube://a/?path=' + localStorage.getItem('sFilePath');
        obj.sMediaSrc = sFilePath;
        const oFileBuffer = await fetch(sFilePath).then(res => {
            return res.blob();
        }).then(res=>{
            return fileToBuffer(res, true);
        }).catch(res=>{
            console.log('读取媒体buffer未成功\n', res);
        });
        if (!oFileBuffer) return;
        oFileBuffer.aChannelData_ = await (async ()=>{
			const theBlob = oFileBuffer.oChannelDataBlob_;
			if (!theBlob.arrayBuffer) return;
			const res = await theBlob.arrayBuffer();
			return new Int8Array(res);
		})();
        console.log('媒体blob\n', oFileBuffer);
        const {aPeaks, fPerSecPx} = getPeaks(oFileBuffer, 130);
        console.log('aPeaks', aPeaks);
        console.log('fPerSecPx', fPerSecPx);
        toDraw(aPeaks);
    }

	// buffer.sampleRate  // 采样率：浮点数，单位为 sample/s
	// buffer.length  // 采样帧率：整形
	// buffer.duration  // 时长(秒)：双精度型
	// buffer.numberOfChannels  // 通道数：整形
	// ▼计算波峰波谷（纯函数）
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
		const fPerSecPx = buffer.length / sampleSize / buffer.duration;
		return {aPeaks, fPerSecPx};
	}

    function toDraw(aPeaks_) {
		// this.cleanCanvas();
		// const { iHeight } = this.state; //波形高
		const iHeight = 0.4; //波形高
		const aPeaks = aPeaks_;
		const oCanvas = document.querySelectorAll('.canvas')[0];
		const Context = oCanvas.getContext('2d');
		const halfHeight = oCanvas.height / 2;
		const fCanvasWidth = aPeaks.length / 2;
		let idx = 0;
		Context.fillStyle = '#55c655';
		while (idx < fCanvasWidth) {
			const cur1 = aPeaks[idx * 2] * iHeight;
			const cur2 = aPeaks[idx * 2 + 1] * iHeight;
			Context.fillRect(idx, (halfHeight - cur1), 1, cur1 - cur2);
			idx++;
		}
		Context.fillStyle = '#0f0';
		Context.fillRect(0, ~~halfHeight, oCanvas.width, 1);
		return oCanvas;
	}
    onMounted(()=>{
        const canvas02 = document.querySelectorAll('.canvas')[0]
        console.log('oCanvas', oCanvas.value);
        console.log('oCanvas02', canvas02);
        loadFile();
    });
    // ▼返回
    return {
        ...toRefs(obj),
        loadFile,
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

