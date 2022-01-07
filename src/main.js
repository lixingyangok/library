import { createApp } from 'vue';
import App from './App.vue';
import router from './router/router.js';
import store from './store/store.js';
import store2 from 'store2';
import { setGlobal } from './common/js/global-setting.js';
// ▼ 样式
import './common/style/minireset.css';
import './common/style/global.scss';

// ▼ require
const {exec} = require('child_process');
const sqlite3 = require('sqlite3').verbose();

// ▼ 其它声明
const isDev = process.env.IS_DEV === "true";
const db = new sqlite3.Database('D:/myDB.db');
const stmt = db.prepare("INSERT INTO dev_history VALUES (?)");

// ▼ 其它动作
window.lg = store2; // lg = local-Storage
setGlobal();

// ▼查询 exe 位置
// const { remote } = require('electron');
// const path = require('path');
// const exePath = path.dirname(remote.app.getPath('exe'));
// console.log('exePath', exePath);
// console.log('开始测试----\n', db);
// console.log('__dirname\n', __dirname);

stmt.run(new Date().toLocaleString());
stmt.finalize();
db.each("SELECT count(*) FROM dev_history", function(err, row) {
    console.log('开发记录数量：', row['count(*)']);
});
// ▼建表的语句
// db.serialize(function() {
//     db.run("CREATE TABLE dev_history (info TEXT)");
// });
// db.close();

// ▼ app
const myApp = createApp(App);
myApp.use(router);
myApp.use(store);
myApp.mount('#app');

exec('wmic logicaldisk get name', function(error, stdout, stderr){
    if (error || stderr) {
        console.error(`查询盘符出错了\n: ${error || stderr}`);
        return;
    }
    const arr = stdout.match(/\S+/g).slice(1);
    document.body.disks = arr;
    console.log('盘符：', arr);
});

// ▼调试
const sTail = isDev ? '  ★开发★' : '  发布了';
document.title += sTail;

