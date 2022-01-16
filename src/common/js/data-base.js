/*
 * @Author: 李星阳
 * @Date: 2022-01-12 19:32:20
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-16 09:40:53
 * @Description: 
 */
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("D:/Program Files (gree)/my-library/myDB.db");

// ▼所有表
const aTables = [
    "dev_history(info TEXT)", // 历史记录
    "media(hash text, name text, size int, duration int, dir text)", // 媒体文件
    "line(hash text, start int, end int, text TEXT, trans TEXT)", // 字幕行
];

export function initDataBase(){
    aTables.forEach(sCur=>{
        db.run(`CREATE TABLE IF NOT EXISTS ${sCur}`);
    });
    // ▼插入一条开发记录
    db.run("INSERT INTO dev_history VALUES ($time)", {
        $time: new Date().toLocaleString(),
    });
    db.get("SELECT count(*) FROM dev_history", function(err, row) {
        if (err) return;
        console.log('开发记录数量：', row['count(*)']);
    });
}


// ▼建表的语句
// db.serialize(function() {
//     db.run("CREATE TABLE IF NOT EXISTS dev_history(info TEXT)");
// });
// db.close();


