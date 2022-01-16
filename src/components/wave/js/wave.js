import {
    reactive,
    getCurrentInstance,
    watch,
    computed,
    onMounted,
} from 'vue';
import {
    fileToBuffer,
    getPeaks,
    getChannelArr,
} from '../../../common/js/pure-fn.js';
import {getTubePath} from '../../../common/js/common-fn.js';


export default function(){
    let aPeaksData = []; // 波形数据
    const oDom = reactive({ // 从上到下，从外到内
        oMyWaveBar: null, // 最外层
        oCanvasDom: null, // canvas画布
        oViewport: null, // 视口
        oLongBar: null, // 视口内的横长条
        oAudio: null,
        oPointer: null,
    });
    const oData = reactive({
        oMediaBuffer: {}, // 媒体buffer，疑似需要向上提交以便显示时长等信息
        playing: false,
        iPerSecPx: 100,
        fPerSecPx: 100,
		iHeight: 0.4,
        iScrollLeft: 0,
        drawing: false,
        sWaveBarClassName: '',
        scrollTimer: null, // 滚动条
    });
    const oInstance = getCurrentInstance();
    const {props} = oInstance;
    const oCurLine = computed(()=>{
        return props.aLineArr[
            props.iCurLineIdx
        ];
    });
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
    // ▼滚动条动后调用
    function waveWrapScroll() {
        const {oMediaBuffer, iPerSecPx} = oData;
        const {offsetWidth, scrollLeft} = oDom.oViewport;
        const {aPeaks, fPerSecPx} = getPeaks(
            oMediaBuffer, iPerSecPx, scrollLeft, offsetWidth
        );
        aPeaksData = aPeaks;
        oData.fPerSecPx = fPerSecPx;
        oData.iScrollLeft = Math.max(0, scrollLeft); // 把新位置记下来
        toDraw();
    }
    // ▲外部方法 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    // ▼私有方法 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    async function initFn(sPath){
        const oTemp = (ls('aTemp') || []).find(cur=>{
            return cur.mediaPath == sPath;
        });
        console.log('有缓存 =', !!oTemp);
        let oMediaBuffer;
        if (oTemp) {
            oMediaBuffer = await getTempData(oTemp);
        }else{
            oMediaBuffer = await getAudioData(sPath);
        }
        oData.oMediaBuffer = oMediaBuffer;
        setCanvasWidthAndDraw();
        moveToFirstLine();
        oInstance.emit('pipe', oData.oMediaBuffer); // 向上传递数据
    }
    // ▼加载【缓存】数据
    async function getTempData(oTemp){
        const {sTempPath} = oTemp;
        const aChannelData_ = await fetch(sTempPath).then(res => {
            return getChannelArr(res.blob());
        });
        return { ...oTemp, aChannelData_ };
    }
    // ▼加载【媒体】数据
    async function getAudioData(sPath){
        const oMediaBuffer = await fetch(sPath).then(res => {
            return res.blob();
        }).then(res=>{
            return fileToBuffer(res, true);
        }).catch(res=>{
            console.log('读取媒体buffer未成功\n', res);
        });
        if (!oMediaBuffer) return;
        // console.log('解析耗时：', oMediaBuffer.fElapsedSec);
        return oMediaBuffer;
    }
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
            const cur1 = aPeaksData[idx * 2] * iHeight | 0; // 下退转整形
            const cur2 = aPeaksData[idx * 2 + 1] * iHeight | 0;
            // ▼参数依次为：x, y, with, height
            Context.fillRect(idx, (halfHeight - cur1), 1, cur1 - cur2);
            idx++;
        }
        oData.drawing = false;
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
        if (!oDom.oAudio) {
            console.log('没有<Audio/>');
        }
		oDom.oAudio.currentTime = fStartTime;
		oDom.oAudio.play();
        style.opacity = 1;
		const playing = setInterval(() => {
            if (!oDom.oAudio) {
                return clearInterval(oData.playing);
            }
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
    // ▼保存blob
    async function toSaveTemp(){
        const {oMediaBuffer} = oData;
        const {mediaPath} = oInstance.props;
        const oDate = new Date();
        const sDate = [oDate.getFullYear(), (oDate.getMonth()+1+'').padStart(2,0), (oDate.getDate()+'').padStart(2,0)].join('-');
        const sTempName = `${mediaPath.split('/').pop()}●${sDate}.blob`;
        const sSaveTo = oConfig.sTempDir + sTempName;
        const err = await fnInvoke("fileSaver", {
            sSaveTo,
            aChannelData_: oMediaBuffer.aChannelData_,
        })
        if (err) return console.log('保存文件失败：\n', err);
        const oNewTempInfo = { // 先存上，回头用
            ...oMediaBuffer,
            aChannelData_: [],
            mediaPath, // 配对的依据（将来改为 xxhash)
            sTempName,
            sTempPath: getTubePath(sSaveTo),
            // 将来补上：当前横纵缩放的程度，当前行号
        };
        toUpdateTempInfo(oNewTempInfo);
	}
    // ▼更新 localStorage
    function toUpdateTempInfo(oNewOne){
        console.log('oNewOne', oNewOne.$dc());
        const aTemp = ls('aTemp') || [];
        const iTarget = aTemp.findIndex((cur, idx)=>{
            const bExist = cur.mediaPath == oNewOne.mediaPath;
            if (bExist) aTemp[idx] = oNewOne; // 更新
            return bExist;
        });
        if (iTarget === -1){
            aTemp.push(oNewOne);
            (aTemp.length > 100) && aTemp.shift();
        }
        ls('aTemp', aTemp);
    }
    // ▼横向缩放波形
    function zoomWave(ev){
        if (oData.drawing) { // 防抖（很重要）
            return console.log('有效防抖'); 
        }
		const {iPerSecPx: perSecPxOld, oMediaBuffer} = oData;
		let {deltaY, clientX = window.innerWidth / 2} = ev; //. clientX 确实需要替补值
		const [min, max, iStep] = [45, 260, 25]; // 每秒最小/大宽度（px），缩放步幅
        // ▼小到头了就不要再缩小了，大到头了也就要放大了
		if (deltaY > 0 ? (perSecPxOld <= min) : (perSecPxOld >= max)){
			return oData.drawing = false;
		}
		const iPerSecPx = (() => { //新★每秒宽度
			const result = perSecPxOld + iStep * (deltaY <= 0 ? 1 : -1);
			if (result < min) return min;
			else if (result > max) return max;
			return result;
		})();
		const fPerSecPx = (()=>{ // 新★每秒宽度（精确）
			const sampleSize = (oMediaBuffer.sampleRate / iPerSecPx); // 每一份的点数 = 每秒采样率 / 每秒像素
			return oMediaBuffer.length / sampleSize / oMediaBuffer.duration; 
		})();
		const {offsetLeft} = oDom.oViewport.parentElement;
        const iNewLeftPx = getPointSec(clientX) * fPerSecPx - (clientX - offsetLeft);
        oData.drawing = true;
        oData.iPerSecPx = iPerSecPx;
		oDom.oPointer.style.left = `${oDom.oAudio.currentTime * fPerSecPx}px`;
		oDom.oViewport.scrollLeft = iNewLeftPx; // 在此触发了缩放
		if (iNewLeftPx <= 0) { // 这里情况不明
			// console.log('小于0 =', iNewLeftPx);
			waveWrapScroll();
		}
	}
    // ▼得到鼠标位置的的秒数，收受一个事件对象
	function getPointSec(clientX) {
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
    // ▼跳行后定位波形位置
	function goOneLine(oLine){
        if (!oDom.oViewport || !oLine) return;
		const {offsetWidth} = oDom.oViewport;
		const {fPerSecPx} = oData;
		const {start, long} = oLine;
		const iLeft = (() => { // 计算波形框定位的位置
			const startPx = fPerSecPx * start;
			const restPx = offsetWidth - long * fPerSecPx;
			if (restPx <= 0) return startPx - 100; //100表示起点距离左边100
			return startPx - restPx / 2;
		})();
		rollTheWave(iLeft);
	}
    // ▼定位滚动条
    function rollTheWave(iNewLeft){
		clearInterval(oData.scrollTimer);
        const {oViewport} = oDom;
		const iOldVal = oViewport['scrollLeft'];
		if (~~iOldVal === ~~iNewLeft) return;
		if ('不要动画') return (oViewport['scrollLeft'] = iNewLeft);
		const [iTakeTime, iTimes] = [200, 50]; // 走完全程耗时, x毫秒走一步
		const iOneStep = ~~((iNewLeft - iOldVal) / (iTakeTime / iTimes));
		oData.scrollTimer = setInterval(()=>{
			let iAimTo = oViewport['scrollLeft'] + iOneStep;
            const needStop = iNewLeft > iOldVal ? (iAimTo >= iNewLeft) : (iAimTo <= iNewLeft);
			if (needStop){
				clearInterval(oData.scrollTimer);
				iAimTo = iNewLeft;
			}
			oViewport['scrollLeft'] = iAimTo;
		}, iTimes);
	}
    function moveToFirstLine(){
        const canGo = oData.oMediaBuffer.duration && props.aLineArr.length;
        if (!canGo) return;
        setTimeout(()=>{
            // console.log('oDom.oLongBar -', oDom.oLongBar.offsetWidth);
            goOneLine(oCurLine.v);
        }, 200);
    }
    // =================================================================================================================

    watch(() => oDom.oMyWaveBar, (oNew)=>{
        if (!oNew) return;
        setTimeout(()=>{
            oData.sWaveBarClassName = 'waist100';
        }, 200);
    });
    watch(() => oDom.oViewport, (oNew)=>{
        if (!oNew) return;
        const myObserver = new ResizeObserver(entryArr => {
            setCanvasWidthAndDraw();
            const {width} = entryArr[0].contentRect;
            if (0) console.log('大小位置', width);
        });
        myObserver.observe(oNew);
    });
    watch(() => props.iCurLineIdx, (iNew, iOld)=>{
        if (iNew == iOld) return;
        if (!props.aLineArr?.length) return;
        goOneLine(oCurLine.v);
    });
    watch(() => props.mediaPath, (sNew, sOld)=>{
        if (sNew == sOld) return;
        initFn(sNew);
    }, {immediate: true});
    watch(() => props.aLineArr, async (aNew, aOld)=>{
        const condition = aNew?.length && !aOld?.length;
        if (!condition) return;
        // console.log('aNew?.length', aNew?.length);
        moveToFirstLine();
    }, {immediate: true});
    // ▼生命周期 ==================================================================
    onMounted(() => {
        if(0) console.log('波形加载了');
    });
    const oFn = {
        wheelOnWave,
        waveWrapScroll,
        toPlay,
        toSaveTemp,
        zoomWave,
        changeWaveHeigh,
        goOneLine,
    };
    return { oDom, oData, oFn };
}

export function getKeyDownFnMap(This, sType){
    const aFullFn = [
        {key: 'alt + ,', name: '波形横向缩放', fn: ()=>This.zoomWave({deltaY: 1})},
        {key: 'alt + .', name: '波形横向缩放', fn: ()=>This.zoomWave({deltaY: -1})},
        {key: 'alt + shift + ,', name: '波形纵向缩放', fn: ()=>This.changeWaveHeigh(-1)},
        {key: 'alt + shift + .', name: '波形纵向缩放', fn: ()=>This.changeWaveHeigh(1)},
    ];
    // ▼将来用于前端显示给用户
    // if(0) return [withNothing, withCtrl, withAlt];
    if (sType==='obj') {
        return aFullFn.reduce((oResult, cur)=>{
            oResult[cur.key] = cur.fn;
            return oResult;
        }, {});
    }
    return aFullFn;
}



