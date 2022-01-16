import { createApp } from 'vue';
import App from './App.vue';
import router from './router/router.js';
import store from './store/store.js';
import store2 from 'store2';
import { newPromise, setGlobal } from './common/js/global-setting.js';
import {db, initDataBase} from './common/database/init-db.js';
// ▼ 样式
import './common/style/minireset.css';
import './common/style/global.scss';

// ▼ require
// ▼ 其它声明
const isDev = process.env.IS_DEV === "true";
window.ls = store2; // lg = localStorage
window.db = db; // db = dataBase
window.newPromise = newPromise;

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


// ▼调试
const sTail = isDev ? '  ★开发★' : '  发布了';
document.title += sTail;

