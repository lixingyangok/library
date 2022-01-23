/*
 * @Author: 李星阳
 * @Date: 2022-01-09 17:59:23
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-23 20:05:23
 * @Description: 
 */

import {keyMap} from './key-map.js';
import { onBeforeUnmount } from 'vue';

// ▼注册按键监听
export function registerKeydownFn(oFnList){
    function keyDownFnCaller(ev) {
        const ctrl = ev.ctrlKey ? 'ctrl + ' : '';
        const alt = ev.altKey ? 'alt + ' : '';
        const shift = ev.shiftKey ? 'shift + ' : '';
        const keyName = keyMap[ev.keyCode] || '';
        const keyStr = ctrl + alt + shift + keyName;
        const theFn = oFnList[keyStr];
        if (!theFn) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (typeof theFn != 'string') theFn();
    }
    // console.log('onMounted 开始收集按键');
    document.addEventListener('keydown', keyDownFnCaller);
    onBeforeUnmount(()=>{
        console.log('卸载-取消按键监听');
        document.removeEventListener('keydown', keyDownFnCaller);
    });
}

// ▼注册主进程的监听员（似乎废弃了）
export function listenFromMainProcess(sName, fn){
    oRenderer.on(sName, fn);
    onBeforeUnmount(()=>{
        oRenderer.removeListener(sName, fn);
    });
}

export function getTubePath(sPath){
    return 'tube://abc?path=' + sPath;
}

// ▼文件名数字排序
export function mySort(arr, sKey){
    if (!arr) return;
    const regexp = /[^\d]+|\d+/g;
    arr.sort((aa, bb) => {
        let pos = 0;
        const weightsA = (aa?.[sKey] || '').match(regexp);
        const weightsB = (bb?.[sKey] || '').match(regexp);
        let weightA = weightsA[pos];
        let weightB = weightsB[pos];
        while (weightA && weightB) {
            const vv = weightA - weightB;
            if (!isNaN(vv) && vv !== 0) return vv;
            if (weightA !== weightB) return weightA > weightB ? 1 : -1;
            pos += 1;
            weightA = weightsA[pos];
            weightB = weightsB[pos];
        }
        return weightA ? 1 : -1;
    });
}

// const [a1, a2=0] = (aa?.[sKey] || '').match(/\d+/g) || [];
// const [b1, b2=0] = (bb?.[sKey] || '').match(/\d+/g) || [];
// // console.log(a1, b1);
// if (a1 && b1) {
//     return (a1*999 + a2*1) - (b1*999 + b2*1);
// }
// return aa[sKey].localeCompare(bb[sKey]);
