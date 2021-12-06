import {toRefs, reactive} from 'vue';
const {readFile, open: openIt} = require('fs/promises');
const {readFileSync} = require('fs');
const fs = require("fs");

export function f1(){
    const obj = reactive({
        a: 1111111,
        b: 2222222,
        sVideoSrc01: '01',
        sVideoSrc02: '02',
        sVideoSrc03: '03',
    });
    async function loadFile(){
        const sFilePath = localStorage.getItem('sFilePath');
        
        // const oNodeBuffer = await readFile(sFilePath).catch(err => {
        //     console.log('取不到文件', err);
        // });
        const oNodeBuffer = await readFileSync(sFilePath);
        const uint8Buffer = Uint8Array.from(oNodeBuffer);
        console.log('得到文件oNodeBuffer', oNodeBuffer);
        const bolb = new Blob([uint8Buffer.buffer], {type: 'audio/mpeg'}); // 转为一个新的Blob文件流

        obj.sVideoSrc01 = URL.createObjectURL(bolb); //转换为url地址并直接给到audio
        // obj.sVideoSrc02 = URL.createObjectURL(bolb); //转换为url地址并直接给到audio
        // let file = new File([blob], 'aa.ogg', {type:'audio/ogg'})
        // obj.sVideoSrc01 = URL.createObjectURL(blob);
        // obj.sVideoSrc02 = URL.createObjectURL(file);
    };
    async function getFile(){
        const sFilePath = localStorage.getItem('sFilePath');
        const ss = fs.createReadStream(sFilePath);
        console.log('ss', ss);
        obj.sVideoSrc02 = ss;
        // const fd = await openIt(sFilePath);
        // fd.createReadStream({});
    };
    getFile();
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