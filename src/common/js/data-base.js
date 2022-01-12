/*
 * @Author: 李星阳
 * @Date: 2022-01-12 19:32:20
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-12 20:07:46
 * @Description: 
 */
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("D:/Program Files (gree)/my-library/myDB.db");


export function initDataBase(){
    db.run(`CREATE TABLE IF NOT EXISTS user_list(name TEXT, age int)`); // 
    db.run("CREATE TABLE IF NOT EXISTS dev_history(info TEXT)");
    // ▼
    const stmt = db.prepare("INSERT INTO dev_history VALUES (?)");
    stmt.run(new Date().toLocaleString());
    stmt.finalize();
    db.each("SELECT count(*) FROM dev_history", function(err, row) {
        console.log('开发记录数量：', row['count(*)']);
    });
}

// ▼建表的语句
// db.serialize(function() {
//     db.run("CREATE TABLE IF NOT EXISTS dev_history(info TEXT)");
// });
// db.close();


