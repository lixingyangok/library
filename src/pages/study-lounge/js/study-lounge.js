import {toRefs, reactive} from 'vue';
import {fileToBuffer} from '../../../common/js/pure-fn';

const { ipcRenderer } = require('electron');
const {readFile, open: openIt} = require('fs/promises');
const {readFileSync} = require('fs');
const fs = require("fs");
const Duplex = require('stream').Duplex;
const isDev = process.env.IS_DEV == "true" ? true : false;

export function f1(){
    const obj = reactive({
        a: 11,
        b: 2222,
        sVideoSrc01: '',
    });
    async function loadFile(){
        const sFilePath = 'tube://a/?path=' + localStorage.getItem('sFilePath');
        obj.sVideoSrc01 = sFilePath;
        fetch(sFilePath).then(res => res.blob()).then(res=>{
            console.log('媒体blob\n', res);
            return fileToBuffer(res);
        }).then(res=>{
            console.log('媒体buffer\n', res);
        });
    }
    loadFile();
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

