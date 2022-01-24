/*
 * @Author: 李星阳
 * @Date: 2022-01-09 17:59:23
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-24 19:05:56
 * @Description: 
 */

import { keyMap } from './key-map.js';
import { onBeforeUnmount } from 'vue';

// ▼注册按键监听
export function registerKeydownFn(oFnList) {
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
    onBeforeUnmount(() => {
        console.log('卸载-取消按键监听');
        document.removeEventListener('keydown', keyDownFnCaller);
    });
}

// ▼注册主进程的监听员（似乎废弃了）
export function listenFromMainProcess(sName, fn) {
    oRenderer.on(sName, fn);
    onBeforeUnmount(() => {
        oRenderer.removeListener(sName, fn);
    });
}

export function getTubePath(sPath) {
    return 'tube://abc?path=' + sPath;
}

// ▼文件名数字排序
export function mySort(arr, sKey) {
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

export function SortLikeWin(v1, v2) {
    var a = v1.name;
    var b = v2.name;
    var reg = /[0-9]+/g;
    var lista = a.match(reg);
    var listb = b.match(reg);
    if (!lista || !listb) return a.localeCompare(b);
    for (var i = 0, minLen = Math.min(lista.length, listb.length); i < minLen; i++) {
        //数字所在位置序号
        var indexa = a.indexOf(lista[i]);
        var indexb = b.indexOf(listb[i]);
        //数字前面的前缀
        var prefixa = a.substring(0, indexa);
        var prefixb = b.substring(0, indexb);
        //数字的string
        var stra = lista[i];
        var strb = listb[i];
        //数字的值
        var numa = parseInt(stra);
        var numb = parseInt(strb);
        //如果数字的序号不等或前缀不等，属于前缀不同的情况，直接比较
        if (indexa != indexb || prefixa != prefixb) {
            return a.localeCompare(b);
        }
        //数字的string全等
        if (stra === strb) {
            //如果是最后一个数字，比较数字的后缀
            if (i == minLen - 1) {
                return a.substring(indexa).localeCompare(b.substring(indexb));
            }
            //如果不是最后一个数字，则循环跳转到下一个数字，并去掉前面相同的部分
            a = a.substring(indexa + stra.length);
            b = b.substring(indexa + stra.length);
        }
        //如果数字的string不全等，但值相等
        else if (numa == numb) { //直接比较数字前缀0的个数，多的更小
            return strb.lastIndexOf(numb + '') - stra.lastIndexOf(numa + '');
        }
        //如果数字不等，直接比较数字大小
        return numa - numb;
    }
}
//    使用方法,Array.sort(SortLikeWin);
// 注：localecompare 比较中文的时候有问题，替换为

function commonCompare(v1, v2) {
    if (v1 === v2) return 0;
    else return v1 < v2 ? -1 : 1;
}