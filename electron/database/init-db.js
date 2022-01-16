/*
 * @Author: 李星阳
 * @Date: 2022-01-12 19:32:20
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-16 20:08:05
 * @Description: 
 */
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(
    "D:/Program Files (gree)/my-library/myDB.db"
);

// ▼所有表
const aTables = [
    "dev_history(info TEXT)", // 历史记录
    "media(hash text, name text, size int, duration int, dir text)", // 媒体文件
    "line(hash text, start int, end int, text TEXT, trans TEXT)", // 字幕行
];

function initDataBase(){
    aTables.forEach(sCur=>{
        db.run(`CREATE TABLE IF NOT EXISTS ${sCur}`);
    });
}

module.exports.db = db;
module.exports.initDataBase = initDataBase;

// ▼建表的语句
// db.serialize(function() {
//     db.run("CREATE TABLE IF NOT EXISTS dev_history(info TEXT)");
// });
// db.close();


