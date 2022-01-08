import {reactive, getCurrentInstance, watch, computed, onMounted} from 'vue';
import {fileToBuffer, getPeaks, getChannelArr} from '../../../common/js/pure-fn.js';

export default function(){
    let aPeaksData = []; // 波形数据
    const oDom = reactive({ // 从上到下，从外到内
        // oMyWaveBar: null, // 最外层
        oCanvasDom: null, // canvas画布
        oViewport: null, // 视口
        oLongBar: null, // 视口内的横长条
        oAudio: null,
        oPointer: null,
    });
    const oData = reactive({
        oMediaBuffer: {}, // 媒体buffer，疑似需要向上提交以便显示时长等信息
        playing: false,
        iPerSecPx: 90,
        fPerSecPx: 0,
		iHeight: 0.4,
        iScrollLeft: 0,
        drawing: false,
        sWaveBarClassName: '',
    });
    const oInstance = getCurrentInstance();
    const oCurLine = computed(()=>{
        return oInstance.props.aLineArr[
            oInstance.props.iCurLineIdx
        ];
    });
    // console.log('oInstance\n', oInstance);
    const sLeft = 'tube://a/?path=';
    const sBlobPath = sLeft + 'D:/Program Files (gree)/my-library/temp-data/fileName.blob';
    console.time('本地blob的arr');
    fetch(sBlobPath).then(res => {
        return getChannelArr(res.blob());
    }).then(res=>{
        console.timeEnd('本地blob的arr');
        if(1) console.log('本地blob的arr', res);
    });
    const oFn = {
        init(){
            
        },
        async audioBufferGetter(sPath){
            const oMediaBuffer = await fetch(sPath).then(res => {
                return res.blob();
            }).then(res=>{
                return fileToBuffer(res, true);
            }).catch(res=>{
                console.log('读取媒体buffer未成功\n', res);
            });
            if (!oMediaBuffer) return;
            oData.oMediaBuffer = oMediaBuffer;
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
            aPeaksData = aPeaks;
            oData.fPerSecPx = fPerSecPx;
            oData.iScrollLeft = Math.max(0, scrollLeft);
            toDraw();
        },
        toPlay,
        saveBlob,
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
    function toDraw() {
        cleanCanvas();
        const { iHeight } = oData; // 波形高
        const {oCanvasDom} = oDom
        const fCanvasWidth = aPeaksData.length / 2;
        const halfHeight = oCanvasDom.height / 2;
        const Context = oCanvasDom.getContext('2d');
        let idx = 0;
        Context.fillStyle = '#55c655';
        while (idx < fCanvasWidth) {
            const cur1 = aPeaksData[idx * 2] * iHeight | 0;
            const cur2 = aPeaksData[idx * 2 + 1] * iHeight | 0;
            if (cur1 % 1 > 0 || cur2 % 1 > 0) debugger;
            // ▼参数依次为：x, y, with, height
            Context.fillRect(idx, (halfHeight - cur1), 1, cur1 - cur2);
            idx++;
        }
        oData.drawing = false;
        return oCanvasDom;
    }
    // ▼设宽并绘制
    function setCanvasWidthAndDraw(){
        const {length} = Object.keys(oData.oMediaBuffer);
        const iWidth = oDom.oViewport?.offsetWidth;
        if (!length || !iWidth) return;
		oDom.oCanvasDom.width = iWidth;
		const {aPeaks, fPerSecPx} = getPeaks(oData.oMediaBuffer, oData.iPerSecPx, 0, iWidth);
        aPeaksData = aPeaks;
		oData.fPerSecPx = fPerSecPx;
        toDraw();
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
        style.opacity = 1;
		const playing = setInterval(() => {
			const { currentTime: cTime } = oDom.oAudio;
			const {end} = oCurLine.value;
            if (end - cTime < 0.1) style.opacity = 0;
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
		// const text = JSON.stringify(oData.oMediaBuffer);
		// const blob = new Blob([text], {type: "application/json"});
		const blob = oData.oMediaBuffer.oChannelDataBlob_;
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
		const {iPerSecPx: perSecPxOld, oMediaBuffer} = oData;
		const {deltaY, clientX = window.innerWidth / 2} = ev;
		const [min, max, iStep] = [35, 350, 20]; // 每秒最小/大宽度（px），缩放步幅
		// ▼说明：小到头了就不要再缩小了，大到头了也就要放大了
		if (deltaY > 0 ? (perSecPxOld <= min) : (perSecPxOld >= max)){
			oData.drawing = false;
			return;
		}
		const {parentElement:{offsetLeft}, children:[markBar]} = oDom.oViewport;
		const iPerSecPx = (() => { //新-每秒宽度
			const result = perSecPxOld + iStep * (deltaY <= 0 ? 1 : -1);
			if (result < min) return min;
			else if (result > max) return max;
			return result;
		})();
		const fPerSecPx = (()=>{ // 新-每秒宽度（精确）
			const sampleSize = ~~(oMediaBuffer.sampleRate / iPerSecPx); // 每一份的点数 = 每秒采样率 / 每秒像素
			return oMediaBuffer.length / sampleSize / oMediaBuffer.duration; 
		})();
        const iNewLeftPx = getPointSec(ev) * fPerSecPx - (clientX - offsetLeft);
		markBar.style.width = fPerSecPx * oMediaBuffer.duration + 'px';
		oDom.oPointer.style.left = `${oDom.oAudio.currentTime * fPerSecPx}px`;
		oData.iPerSecPx = iPerSecPx;
		oData.drawing = true;
		oDom.oViewport.scrollLeft = iNewLeftPx; // 在此触发了缩放
		if (iNewLeftPx <= 0) { // 这里情况不明
			// console.log('小于0 =', iNewLeftPx);
			oFn.waveWrapScroll();
		}
	}
    // ▼得到点击处的秒数，收受一个事件对象
	function getPointSec({ clientX }) {
		const {scrollLeft, parentElement: {offsetLeft}} = oDom.oViewport;
		const iLeftPx = clientX - offsetLeft + scrollLeft; //鼠标距左边缘的px长度
		const iNowSec = iLeftPx / oData.fPerSecPx; //当前指向时间（秒）
		return iNowSec;
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
    watch(oDom, (oNew)=>{
        if (!oNew.oPointer) return;
        const myObserver = new ResizeObserver(entryArr => {
            setCanvasWidthAndDraw();
            const {width} = entryArr[0].contentRect;
            if (0) console.log('大小位置', width);
        });
        myObserver.observe(oNew.oViewport);
    });
    onMounted(()=>{
        setTimeout(()=>{
            oData.sWaveBarClassName = 'waist100';
        }, 200);
    });
    return {
        oDom,
        oData,
        oFn,
    };
}


