import { createApp } from 'vue';
import App from './App.vue';
import router from './router/router.js';
import store from './store/store.js';

import './common/style/minireset.css';
import './common/style/global.scss';

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('D:/myDB.db');

// console.log('开始测试----\n', db);
// console.log('__dirname\n', __dirname);

const stmt = db.prepare("INSERT INTO lorem VALUES (?)");
for (var i = 0; i < 2; i++) {
    stmt.run(new Date().toLocaleString());
}
stmt.finalize();
let iQuantity = 0;
db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
    iQuantity++;
});
console.log('数据库数量：', iQuantity);

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
app.mount('#app');