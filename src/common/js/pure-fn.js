/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

// ▼ 实际上1参接收的是一个Blob对象
export async function fileToBuffer(oFile, bGetFake=false){
	if (!oFile) return {};
	const t01 = new Date();
	let resolveFn = xx => xx;
	const promise = new Promise(resolve => resolveFn = resolve);
	const onload = async evt => {
		const arrayBuffer = evt.currentTarget.result;
		let audioContext = new window.AudioContext();
		// 近8分钟音频耗时 1,117ms
		let buffer = await audioContext.decodeAudioData(arrayBuffer).catch(err=>{
			console.log('读取波形 buffer 出错\n', err);
		});
		audioContext = null; // 如果不销毁audioContext对象的话，audio标签是无法播放的
		if (bGetFake) buffer = getFakeBuffer(buffer);
		resolveFn(buffer);
		const sizeMB = (oFile.size/1024/1024).toFixed(2);
		const spentSeconds = ((new Date() - t01) / 1000).toFixed(2);
		console.log(`■ 加载波形信息：\n■ 体积：${sizeMB}MB / 时长：${buffer.sDuration_} / 加载耗时：${spentSeconds}秒\n`);
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
	const buffer_ = { // 原始数据
		duration: buffer.duration,
		sDuration_: secToStr(buffer.duration).split(',')[0],
		sampleRate: Math.round(buffer.sampleRate / iLeap),
		numberOfChannels: buffer.numberOfChannels,
	};
	const aChannelData_ = (() => {
		const aResult = [];
		const aChannel = buffer.getChannelData(0);
		const {length} = aChannel;
		console.log(`遍历次数 ${(length / iLeap / 10_000).toFixed(2)} 万`);
		for (let idx = 0; idx < length; idx += iLeap) {
			const cur = aChannel[idx];
			aResult.push(cur * (cur > 0 ? 127 : 128));
		}
		return Int8Array.from(aResult);
	})();
	return {
		...buffer_,
		aChannelData_,
		length: aChannelData_.length,
		// ▼ 8分钟音频耗时 11ms
		oChannelDataBlob_: new Blob([aChannelData_], {type: 'application/json'}),
	};
}

// ▼浮点秒，转为时间轴的时间
export function secToStr(fSecond, forShow){
	const iHour = Math.floor(fSecond / 3600) + ''; //时
	const iMinut = Math.floor((fSecond - iHour * 3600) / 60) + ''; //分
	const fSec = fSecond - (iHour*3600 + iMinut*60) + ''; //秒
	const [sec01, sec02='000'] = fSec.split('.');
	let sTime = `${iHour.padStart(2, 0)}:${iMinut.padStart(2, 0)}:${sec01.padStart(2, 0)}`;
	let iTail = `,${sec02.slice(0, 3).padEnd(3, 0)}`;
	if (forShow){
		sTime = sTime.slice(1);
		iTail = '.' + iTail.slice(1, 3);
	}
	return sTime + iTail;
}

// ▼听写页加载时调用（解析波形的blob缓存）
export async function getChannelDataFromBlob(oBlob){
	const arrayBuffer = await oBlob.arrayBuffer();
	const aInt8Array = new Int8Array(arrayBuffer);
	return aInt8Array;
}

// ▼字符转字幕数据，用于显示
export function SubtitlesStr2Arr(sSubtitles) {
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
		return {start, end, text}; // fixTime({start, end, text});
	});
}

// ▼时间轴的时间转秒
export function getSeconds(text) {
	const [hour, minute, second, tail] = text.match(/\d+/g);
	const number = (hour * 60 * 60) + (minute * 60) + `${second}.${tail}` * 1;
	return number.toFixed(2) * 1; // 保留2位小数足矣
};

// ▼修整某一行（补充 .long 信息
export function fixTime(oTarget){
	const {start, end, text} = oTarget;
	oTarget.long = (end - start).toFixed(2) * 1;
	oTarget.start_ = secToStr(start, true);
	oTarget.end_ = secToStr(end, true);
	oTarget.text = text || '';
	return oTarget;
}

// ▼【文件】转字符（旧版的）
export function fileToStrings(oFile) {
	let resolveFn = xx => xx;
	const oPromise = new Promise(fn => resolveFn = fn);
	Object.assign(new FileReader(), {
		onload: event => resolveFn(event.target.result), // event.target.result就是文件文本内容,
	}).readAsText(oFile);
	return oPromise;
}


// ▲ 被使用的方法
// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// ▼ 没有被使用的方法
// ▼有后台功能之后的新方法---------------------------


// ▼数组转 Blob，用于上传字幕
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


// ▼可能是上传字幕用的
export async function fileToBlob(oFile){
	const res = await fileToTimeLines(oFile);
	const oBlob = arrToblob(res || []);
	return oBlob;
}


// ▼将收到的数组转换为【字幕文件】并下载
export function downloadSrt(aLines, fileName='字幕文件'){
	const aStr = aLines.map(({start, end, text}, idx) => {
		const [t01, t02] = [secToStr(start), secToStr(end)];
		return `${idx + 1}\n${t01} --> ${t02}\n${text}\n`;
	}).join('\n');
	downloadString(aStr, fileName, 'srt');
}

// ▼得到时间信息
export function getTimeInfo(oTime, sType, oAim){
	if (sType !=='f' && sType!=='s') return {};
	const [key1, key2] = ({
		f: ['fileModifyStr', 'fileModifyTs'],
		s: ['subtitleFileModifyStr', 'subtitleFileModifyTs'],
	}[sType]);
	const oResult = {
		[key1]: oTime.toString(),
		[key2]: oTime.getTime(),
	};
	if (oAim) Object.assign(oAim, oResult)
	return oResult;
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


// ▼
// export function getFakeBuffer(buffer){
// 	const buffer_ = { // ★原始数据
// 		duration: buffer.duration,
// 		length: buffer.length, // === buffer.getChannelData(0).length
// 		sampleRate: buffer.sampleRate,
// 		numberOfChannels: buffer.numberOfChannels,
// 	}
// 	return { // ★补充数据
// 		...buffer_,
// 		aChannelData_: Int8Array.from( // int8的取值范围 -128 到 127
// 			buffer.getChannelData(0).map(xx => xx * (xx > 0 ? 127 : 128)),
// 		),
// 		sDuration_: secToStr(buffer.duration).split(',')[0],
// 		oChannelDataBlob_: null,
// 	};
// }