/*
 * @Author: 李星阳
 * @Date: 2021-11-28 13:33:09
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-10 21:51:52
 * @Description: 
 */


// electron/preload.js

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});
