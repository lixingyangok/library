/*
 * @Author: 李星阳
 * @Date: 2022-01-09 17:59:23
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-16 20:38:52
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

// ▼注册主进程的监听员，
export function listenFromMainProcess(sName, fn){
    oRenderer.on(sName, fn);
    onBeforeUnmount(()=>{
        oRenderer.removeListener(sName, fn);
    });
}

export function getTubePath(sPath){
    return 'tube://abc?path=' + sPath;
}



