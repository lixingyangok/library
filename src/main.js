import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import App from './App.vue';
import router from './router/router.js';
import store from './store/store.js';
import store2 from 'store2';
import { newPromise, setGlobal } from './common/js/global-setting.js';
// ▼ 样式
import './common/style/minireset.css';
import './common/style/global.scss';
import './common/lib/fontawesome-free-5.15.4-web/css/all.min.css';
import 'element-plus/dist/index.css';
// ▼ require
const { ipcRenderer } = require('electron');

// const sqlite3 = require('sqlite3').verbose();
// var db = new sqlite3.Database(':memory:', (err) => {
//     console.log('创建db成功？', !err);
//     db.loadExtension(
//         'D:/github/my-library/src/regexp.c',
//         function(err, res){
//             console.log('一参：\n', err);
//             console.log('二参：\n', res);
//         }
//     );
//     console.log(Reflect.ownKeys(db.__proto__));
//     window.db = db;
// });

// db.serialize(function() {
//     console.log('建表');
//     db.addListener('regexp', function(v1, v2){
//         console.log('v1', v1, v2);
//         return true;
//     });
//     db.run("CREATE TABLE lorem (info TEXT)");
//     var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
//     stmt.run("Ipsum " + new Date().toString());
//     stmt.finalize();
//     console.log("开始查询");
//     db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
//         console.log(row.id + ": " + row.info);
//     });
// });


// ▼ 其它声明，全局声明一定前置
const isDev = process.env.IS_DEV === "true";
window.ls = store2; // lg = localStorage
window.newPromise = newPromise;
window.oRenderer = ipcRenderer;
window.fnInvoke = ipcRenderer.invoke;

ls.set('oRecent', ls.get('oRecent') || {});
setGlobal();

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
myApp.use(ElementPlus);
myApp.mount('#app');


// ▼调试
const sTail = isDev ? '  ★开发★' : '  发布了';
document.title += sTail;

