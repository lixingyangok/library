/*
 * @Author: 李星阳
 * @Date: 2021-11-27 19:20:52
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-11-27 21:14:30
 * @Description: 
 */
const { contextBridge } = require('electron');

// 所有Node.js API都可以在预加载过程中使用。
// 它拥有与Chrome扩展一样的沙盒。
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});


// 在vue页面中引用window.$electron.titile，获得 'electron-vite-vue'
contextBridge.exposeInMainWorld('$electron', {
    title: 'electron-vite-vue',
});