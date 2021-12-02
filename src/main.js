import { createApp } from 'vue';
import App from './App.vue';
import router from './router/router.js';
import store from './store/store.js';
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

const app = createApp(App);
app.use(router);
app.use(store);
app.mount('#app');