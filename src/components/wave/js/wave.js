import {reactive, ref, watch} from 'vue';
import {fileToBuffer} from '../../../common/js/pure-fn.js';

export default function(){
    const oDom = reactive({ // 从上到下，从外到内
        oWaveBar: null,
        oWaveWrap: null,
        oCanvasDom: null,
    });
    const oData = reactive({
        oMediaBuffer: {}, // 媒体的 buffer
        aPeaks: [],
        playing: false,
        iPerSecPx: 100,
        fPerSecPx: 0,
		iHeight: 0.3,
    });
    const oFn = {
        async audioBufferGetter(sPath){
            const oBuffer = await fetch(sPath).then(res => {
                // 8M-1小时的《爱情与金钱》 加载文件: 145.626953125 ms
                return res.blob();
            }).then(res=>{
                // 8M-1小时的《爱情与金钱》 转Blob: 46.30615234375 ms
                return fileToBuffer(res, true);
            }).catch(res=>{
                console.log('读取媒体buffer未成功\n', res);
            });
            if (!oBuffer) return;
            oData.oMediaBuffer = oBuffer;
            setCanvasWidth();
        },
        toInit(){

        },
    };
    watch(oDom, (oNew)=>{
        if (!oNew.oCanvasDom) return;
    });

    // ▼按收到的数据 => 绘制
    function toDraw(aPeaks) {
        aPeaks = aPeaks || oData.aPeaks;
        cleanCanvas();
        const { iHeight } = oData; // 波形高
        const {oCanvasDom} = oDom
        const fCanvasWidth = aPeaks.length / 2;
        const halfHeight = oCanvasDom.height / 2;
        const Context = oCanvasDom.getContext('2d');
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
        return oCanvasDom;
    }

    function setCanvasWidth(){
		const iWidth = oDom.oWaveWrap?.offsetWidth || 500;
		oDom.oCanvasDom.width = iWidth;
		const {aPeaks, fPerSecPx} = getPeaks(oData.oMediaBuffer, oData.iPerSecPx, 0, iWidth);
		if (!aPeaks) return;
		oData.fPerSecPx = fPerSecPx;
        toDraw(aPeaks);
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

    // ▼清空画布
	function cleanCanvas() {
		const Context = oDom.oCanvasDom.getContext('2d');
		Context.clearRect(0, 0, 5_000, 200);
	}
    return {
        oDom,
        oData,
        oFn,
    };
}



// ▼自定义指令
// const vSetVariable = (()=>{
//     const iCanvasTop = 18;
//     const iCanvasHeight = 110;
//     const oStyle = {
//         '--total-height': `140px`,
//         '--canvas-top': `${iCanvasTop}px`,
//         '--canvas-height': `${iCanvasHeight}px`,
//         '--waist-line': `${iCanvasTop + iCanvasHeight / 2}px`,
//     };
//     const oResult = {
//         mounted(el){
//             for(const [key, val] of Object.entries(oStyle)){
//                 el.style.setProperty(key, val);
//             }
//         },
//     };
//     return oResult;
// })();




