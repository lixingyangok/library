import {reactive, getCurrentInstance, watch, computed} from 'vue';
import {fileToBuffer} from '../../../common/js/pure-fn.js';

export default function(){
    const oDom = reactive({ // 从上到下，从外到内
        // oMyWaveBar: null, // 最外层
        oCanvasDom: null, // canvas画布
        oViewport: null, // 视口
        oLongBar: null, // 视口内的横长条
        oAudio: null,
        oPointer: null,
    });
    const oData = reactive({
        oMediaBuffer: {}, // 媒体的 buffer
        aPeaks: [],
        playing: false,
        iPerSecPx: 100,
        fPerSecPx: 0,
		iHeight: 0.3,
        iScrollLeft: 0,
        drawing: false,
    });
    const oInstance = getCurrentInstance();
    const oCurLine = computed(()=>{
        return oInstance.props.aLineArr[
            oInstance.props.iCurLineIdx
        ];
    });
    // console.log('oInstance\n', oInstance);
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
            setCanvasWidthAndDraw();
        },
        // ▼滚轮动了
        wheelOnWave(ev) {
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
        },
        // ▼滚动条动后调用
        waveWrapScroll() {
            const {oMediaBuffer, iPerSecPx} = oData;
            const {offsetWidth, scrollLeft} = oDom.oViewport;
            const {aPeaks, fPerSecPx} = getPeaks(
                oMediaBuffer, iPerSecPx, scrollLeft, offsetWidth,
            );
            toDraw(aPeaks);
            oData.iScrollLeft = Math.max(0, scrollLeft);
            oData.fPerSecPx = fPerSecPx;
        },
        toPlay,
    };
    // ▲外部方法 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    // ▼私有方法 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    // ▼使Dom滚动条横向滚动
	function scrollToFn(deltaY) {
		const iOneStepLong = 350; // 步长
        const {oViewport, oLongBar} = oDom;
		const iMax = oLongBar.offsetWidth - oViewport.offsetWidth;
		let newVal = (() => {
			let oldVal = oViewport.scrollLeft;
			if (deltaY >= 0) return oldVal - iOneStepLong;
			else return oldVal + iOneStepLong;
		})();
		if (newVal < 0) newVal = 0;
		if (newVal > iMax) newVal = iMax;
		oData.iScrollLeft = newVal;
		oViewport.scrollTo(newVal, 0);
	}
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
    // ▼设宽并绘制
    function setCanvasWidthAndDraw(){
        const iWidth = oDom.oViewport?.offsetWidth || 500;
		oDom.oCanvasDom.width = iWidth;
        if (!oData.oMediaBuffer.duration) return;
		const {aPeaks, fPerSecPx} = getPeaks(oData.oMediaBuffer, oData.iPerSecPx, 0, iWidth);
		if (!aPeaks) return;
        toDraw(aPeaks);
		oData.fPerSecPx = fPerSecPx;
		oData.aPeaks = aPeaks;
	}
    // ▼清空画布
	function cleanCanvas() {
		const Context = oDom.oCanvasDom.getContext('2d');
		Context.clearRect(0, 0, 5_000, 200);
	}
    // ▼播放
	function toPlay(isFromHalf=false) {
		clearInterval(oData.playing); //把之前播放的关闭
		const { start, end } = oCurLine.value;
		const long = end - start;
		const { style } = oDom.oPointer; 
		const fStartTime = start + long * (isFromHalf ? 0.4 : 0);
		style.left = `${fStartTime * oData.fPerSecPx}px`;
		oDom.oAudio.currentTime = fStartTime;
		oDom.oAudio.play();
		const playing = setInterval(() => {
			const { currentTime: cTime } = oDom.oAudio;
			const {end} = oCurLine.value;
			if (cTime < end && oData.playing) {
				return style.left = `${~~(cTime * oData.fPerSecPx)}px`;
			}
			oDom.oAudio.pause();
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
    function zoomWave(ev){
		if (oData.drawing) return; //防抖
		const {iPerSecPx: perSecPxOld, oBuffer} = oData;
		const {deltaY, clientX = window.innerWidth / 2} = ev;
		const [min, max, iStep] = [35, 250, 20]; //每秒最小/大宽度（px），缩放步幅
		// ▼说明：小到头了就不要再缩小了，大到头了也就要放大了
		if (deltaY > 0 ? perSecPxOld <= min : perSecPxOld >= max){
			oData.drawing = false;
			return;
		}
		console.log('开始缩放');
		const {parentElement:{offsetLeft}, children:[markBar]} = oDom.oViewport;
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
		oDom.oViewport.scrollLeft = iNewLeftPx; // 在此触发了缩放
		if (iNewLeftPx <= 0) {
			console.log('小于0 =', iNewLeftPx);
			waveWrapScroll();
		}
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
    // =============================================================
    // ▼特殊方法和最终返回内容 ========================================
    watch(oDom, (oNew)=>{
        if (!oNew.oViewport) return;
        const myObserver = new ResizeObserver(entryArr => {
            setCanvasWidthAndDraw();
            const {width} = entryArr[0].contentRect;
            if (0) console.log('大小位置', width);
        });
        myObserver.observe(oNew.oViewport);
    });
    return {
        oDom,
        oData,
        oFn,
    };
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
    return {aPeaks, fPerSecPx};
}


// ▼自定义指令（字母V开头）
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

