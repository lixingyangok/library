import { createApp } from 'vue';
import App from './App.vue';
import router from './router/router.js';
import store from './store/store.js';
import store2 from 'store2';
import { setGlobal } from './common/js/global-setting.js';
import {initDataBase} from './common/js/data-base.js';
// ▼ 样式
import './common/style/minireset.css';
import './common/style/global.scss';

// ▼ require
const {exec} = require('child_process');
// ▼ 其它声明
const isDev = process.env.IS_DEV === "true";
window.ls = store2; // lg = local-Storage


setGlobal();
initDataBase();

// ▼查询 exe 位置
// const { remote } = require('electron');
// const path = require('path');
// const exePath = path.dirname(remote.app.getPath('exe'));
// console.log('exePath', exePath);
// console.log('__dirname\n', __dirname);

// ▼ app
const myApp = createApp(App);
myApp.use(router);
myApp.use(store);
myApp.mount('#app');

console.log('盘符如下：');
exec('wmic logicaldisk get name', function(error, stdout, stderr){
    if (error || stderr) {
        console.error(`查询盘符出错了\n: ${error || stderr}`);
        return;
    }
    const arr = stdout.match(/\S+/g).slice(1);
    document.body.disks = arr;
    console.log('盘符在此：', arr.join(', '));
});

// ▼调试
const sTail = isDev ? '  ★开发★' : '  发布了';
document.title += sTail;

