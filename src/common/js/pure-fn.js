/*
 * @Author: 李星阳
 * @Date: 2021-02-19 16:35:07
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-07-31 13:45:31
 * @Description: 
 */

// ▼ 通过文件地址得到媒体 buffer （此方法目前没用上）
export async function getBufferByPath(sPath){
	let err;
	// sPath = encodeURIComponent(sPath)
	const oMediaBuffer = await fetch(sPath).then(res => {
		return res.blob();
	}).then(res=>{
		return fileToBuffer(res, true);
	}).catch(res=>{
		err = res;
		console.error('读取媒体buffer未成功\n', res);
	});
	if (!oMediaBuffer || err) {
		return console.error('媒体地址\n', sPath);
	}
	return oMediaBuffer;
}

// 通过文件路径得到时长（很快）
export async function getMediaDuration(sFilePath){
	// let sFilePath = 'C:/Users/Administrator/Desktop/书虫L2_MP3/鲁滨逊漂流记01.ogg';                     
	const {oPromise, fnResolve, fnReject} = newPromise();
	const myAudio = new Audio();
	myAudio.oncanplay = function() {  
		// console.log('时长', myAudio.duration);
		fnResolve({
			fDuration: myAudio.duration,
			sDuration: secToStr(myAudio.duration),
		});
	}
	myAudio.src = sFilePath;
	return oPromise;
}

export async function fileToBuffer(oFile){
	const iBeginTime = new Date();
	let resolveFn = xx => xx;
	const promise = new Promise(f1 => resolveFn = f1);
	const onload = async evt => {
		const {result} = evt.currentTarget; // arrayBuffer
		let audioContext = new window.AudioContext();
		const oRealBuffer = await audioContext.decodeAudioData(result).catch(err=>{
			console.log('decodeAudioData() 出错\n', err);
		});
		audioContext = null; // 据说：如果不销毁audioContext，audio标签无法播放
		const oBuffer = getFakeBuffer(oRealBuffer);
		const sizeMB = (oFile.size/1024/1024).toFixed(2);
		const fElapsedSec = ((new Date() - iBeginTime) / 1000).toFixed(2) * 1;
		oBuffer.fElapsedSec = fElapsedSec;
		resolveFn(oBuffer);
		console.log(`■ 波形解析信息：\n■ 体积：${sizeMB}MB / 时长：${oBuffer.sDuration_} / 加载耗时：${fElapsedSec}秒\n`);
	};
	Object.assign(new FileReader(), {
		onload,
	}).readAsArrayBuffer(oFile);
	return promise;
}

// ▼将音频 buffer 转为假对象
export function getFakeBuffer(buffer){
	// 结果为真 buffer.length === buffer.duration * buffer.sampleRate
	// 结果为真 buffer.length === buffer.getChannelData(0).length
	const iLeap = 50; // 压缩
	// console.log('buffer.sampleRate-', buffer.sampleRate, buffer.sampleRate/iLeap);
	const buffer_ = { // 原始数据
		duration: buffer.duration,
		sDuration_: secToStr(buffer.duration),
		sampleRate: Math.round(buffer.sampleRate / iLeap),
		numberOfChannels: buffer.numberOfChannels,
	};
	const aChannelData_ = (() => {
		const aResult = [];
		const aChannel = buffer.getChannelData(0);
		const {length} = aChannel;
		// console.log(`遍历次数 ${(length / iLeap / 10_000).toFixed(2)} 万`);
		for (let idx = 0; idx < length; idx += iLeap) {
			const cur = aChannel[idx];
			aResult.push(cur * (cur > 0 ? 127 : 128));
		}
		return Int8Array.from(aResult);
	})();
	return {
		...buffer_,
		length: aChannelData_.length,
		aChannelData_,
	};
}

// ▼浮点秒，转为时间轴的时间
export function secToStr(fSecond, sType){
	const iHour = Math.floor(fSecond / 3600) + ''; //时
	const iMinut = Math.floor((fSecond - iHour * 3600) / 60) + ''; //分
	const fSec = fSecond - (iHour*3600 + iMinut*60) + ''; // 秒: 38.123
	const [sec01, sec02='000'] = fSec.split('.');
	let sTime = `${iHour.padStart(2, 0)}:${iMinut.padStart(2, 0)}:${sec01.padStart(2, 0)}`;
	if (!sType) return sTime; // 默认格式 13:20:59
	// ▼其它特殊格式 ===============================================
	let sTail = `,${sec02.slice(0, 3).padEnd(3, 0)}`;
	if (sType === 'lineTime'){ // 句子时间格式 0:00:57.17
		sTime = sTime.slice(1);
		sTail = '.' + sTail.slice(1, 3);
	}else if (sType === 'srtTime'){
		// 
	}
	return sTime + sTail; // srt 时间格式 00:00:15,000 --> 00:00:28,680
}

// ▼听写页加载时调用（解析波形的blob缓存）
export async function getChannelArr(oPromise){
	const oBlob = await oPromise;
	const arrayBuffer = await oBlob.arrayBuffer();
	const aInt8Array = new Int8Array(arrayBuffer);
	return aInt8Array;
}

// ▼字符转字幕数据，用于显示
export function SubtitlesStr2Arr(sSubtitles) {
	if (!sSubtitles) return;
	const aLine = [];
	let strArr = sSubtitles.split('\n');
	strArr = strArr.filter((cur, idx) => {
		const isTime = /\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/.test(cur);
		if (!isTime) return;
		aLine.push(strArr[idx + 1]);
		return true;
	});
	return strArr.map((cur, idx) => {
		const [aa, bb] = cur.split(' --> ');
		const [start, end] = [getSeconds(aa), getSeconds(bb)];
		const text = aLine[idx].trim() || '';
		return fixTime({start, end, text});
	});
}

// ▼时间轴的时间转秒
export function getSeconds(text) {
	const [hour, minute, second, tail] = text.match(/\d+/g);
	const number = (hour * 60 * 60) + (minute * 60) + `${second}.${tail}` * 1;
	return number.toFixed(2) * 1; // 保留2位小数足矣
};

// ▼修整某一行（补充 .long 信息
export function fixTime(theTarget){
	(()=>{
		const {name} = theTarget.constructor;
		if (name == 'Object') return [theTarget];
		else if(name == 'Array') return theTarget;
		return [];
	})().forEach(cur=>{
		const {start, end, text} = cur;
		cur.long = (end - start).toFixed(2) * 1;
		cur.start_ = secToStr(start, 'lineTime');
		cur.end_ = secToStr(end, 'lineTime');
		cur.text = text || '';
	});
	return theTarget;
}


// buffer.sampleRate  // 采样率：浮点数，单位为 sample/s
// buffer.length  // 采样帧率：整形
// buffer.duration  // 时长(秒)：双精度型
// ▼ 按接收到的数据 => 计算波峰波谷（纯函数）
export function getPeaks(buffer, iPerSecPx, left=0, iCanvasWidth=500) {
	// console.time('getPeaks');
	const {aChannelData_, length, sampleRate, duration} = buffer;
    const sampleSize = sampleRate / iPerSecPx ; // 每一份的点数 = 每秒采样率 / 每秒像素
    const aPeaks = [];
    let idx = Math.round(left);
    const last = idx + iCanvasWidth;
    while (idx <= last) {
        let min = 0;
        let max = 0;
        let start = Math.round(idx * sampleSize);
        const end = Math.round(start + sampleSize);
        while (start < end) {
            const value = aChannelData_[start];
            if (value > max) max = value;
            else if (value < min) min = value;
            start++;
        }
        aPeaks.push(max, min);
        idx++;
    }
    // ▼返回浮点型的每秒宽度(px)
    const fPerSecPx = length / sampleSize / duration;
	// console.timeEnd('getPeaks'); // getPeaks: 0.108154296875 ms
    return {aPeaks, fPerSecPx};
}


// ▼复制文字到剪贴板、参数是需要复制的文字
export function copyString(sString){
	const {body} = document;
	const oInput = Object.assign(document.createElement('input'), {
		value: sString, // 把文字放进 input 中，供复制
	});
	body.appendChild(oInput);
	oInput.select();  // 选中创建的input
	// ▼执行复制方法，该方法返回布尔值，表示复制的成功性
	const isCopyOk = document.execCommand('copy');
	console.log(`复制：${isCopyOk ? '成功' : '失败'}`);
	body.removeChild(oInput); // 操作中完成后 从Dom中删除创建的input
	return !!isCopyOk;
}

// ▼得到字母表 a,b,c.....
export const aAlphabet = [...Array(26).keys()].map(cur=>{
	return String.fromCharCode(97 + cur);
});


// ▼将收到的数组转换为【字幕文件】并下载
export function downloadSrt(aLines, fileName='字幕文件'){
	const aStr = aLines.map(({start, end, text}, idx) => {
		const t01 = secToStr(start, 'srtTime');
		const t02 = secToStr(end, 'srtTime');
		return `${idx + 1}\n${t01} --> ${t02}\n${text}\n`;
	}).join('\n');
	// console.log('aStr', aStr);
	downloadString(aStr, fileName, 'srt');
}


// ▼将收到的数组转换为【文本文件】并下载
// 将来下载文本时会用到
export function downloadString(aStr, fileName='文本文件', suffix='txt'){
	const blob = new Blob([aStr]);
	Object.assign(document.createElement('a'), {
		download: `${fileName}.${suffix}`,
		href: URL.createObjectURL(blob),
	}).click();
}


// ▼【文件】转字符
export function fileToStrings(oFile) {
	let resolveFn = xx => xx;
	const oPromise = new Promise(fn => resolveFn = fn);
	Object.assign(new FileReader(), {
		onload: event => resolveFn(event.target.result), // event.target.result就是文件文本内容,
	}).readAsText(oFile);
	return oPromise;
}


// ▼数组转 Blob，之前用于上传字幕（可能在停用中）
export function arrToblob(arr){
	const newArr = arr.map(cur=>({ // 净化
		start: cur.start.toFixed(2) * 1,
		end: cur.end.toFixed(2) * 1,
		text: cur.text, // 考虑加上 trim 
	}));
	const file = new Blob(
		[JSON.stringify(newArr)],
		{type: 'application/json;charset=utf-8'},
	);
	return file;
}

