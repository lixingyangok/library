import { createApp } from 'vue';
import App from './App.vue';
import router from './router/router.js';
import store from './store/store.js';

import './common/style/minireset.css';
import './common/style/global.scss';

const {exec} = require('child_process'); 
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('D:/myDB.db');


// ▼查询 exe 位置
// const { remote } = require('electron');
// const path = require('path');
// const exePath = path.dirname(remote.app.getPath('exe'));
// console.log('exePath', exePath);

// console.log('开始测试----\n', db);
// console.log('__dirname\n', __dirname);

const stmt = db.prepare("INSERT INTO lorem VALUES (?)");
for (var i = 0; i < 3; i++) {
    stmt.run(new Date().toLocaleString());
}
stmt.finalize();
// db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
db.each("SELECT count(*) FROM lorem", function(err, row) {
    console.log('数据库数量：', row);
});

// db.serialize(function() {
//     db.run("CREATE TABLE lorem (info TEXT)");
// });
// db.close();

function toClone(source) {
    if (!(source instanceof Object && typeof source == 'object' && source)) return source; //不处理非数组、非对象
    let newObj = new source.constructor;
    let iterator = source instanceof Array ? source.entries() : Object.entries(source);
    for (let [key, val] of iterator) {
        newObj[key] = val instanceof Object ? toClone(val) : val;
    }
    return newObj;
}

// ▼自定义方法
Object.defineProperties(Object.prototype, {
    '$dc': { // deep copy = 深拷贝
        value: function () {
            let val = null;
            try {
                val = toClone(this);
            } catch (err) {
                val = JSON.parse(JSON.stringify(this));
            }
            return val;
        },
    },
    '$cpFrom': { // copy from = 将本对象的值修改为目标对象的值
        value: function (source) {
            for (let key of Object.keys(this)) {
                if (key in source) this[key] = source[key];
            }
            return this;
        },
    },
});

const app = createApp(App);
app.use(router);
app.use(store);

exec('wmic logicaldisk get name', function(error, stdout, stderr){
    if (error || stderr) {
        console.error(`出错了\n: ${error || stderr}`);
        return fnReject(error || stderr);
    }
    const arr = stdout.match(/\S+/g).slice(1);
    document.body.disks = arr;
    app.mount('#app');
});

