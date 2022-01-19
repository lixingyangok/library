/*
 * @Author: 李星阳
 * @Date: 2022-01-12 19:32:20
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-19 21:05:26
 * @Description: 
 */
const sqlite3 = require('sqlite3').verbose();
const { Sequelize } = require('sequelize');

// ▼建立数据库链接
const db = new sqlite3.Database(
    "D:/Program Files (gree)/my-library/myDB.db"
);
// ▼建立数据库链接
const sqlize = new Sequelize({
    dialect: 'sqlite',
    storage: 'D:/Program Files (gree)/my-library/myDB.db',
    define: {
        freezeTableName: true,
    },
});


async function initDataBase(){
    
}


module.exports.db = db;
module.exports.sqlize = sqlize;
module.exports.initDataBase = initDataBase;

// ▼建表的语句01
// db.serialize(function() {
//     db.run("CREATE TABLE IF NOT EXISTS dev_history(info TEXT)");
// });
// db.close();

// ▼建表的语句02
// const aTables = [
//     "dev_history(info TEXT)", // 历史记录
//     "media(hash text, name text, size int, duration int, dir text)", // 媒体文件
//     "line(hash text, start int, end int, text TEXT, trans TEXT)", // 字幕行
// ];
// aTables.forEach(sCur=>{
//     db.run(`CREATE TABLE IF NOT EXISTS ${sCur}`);
// });
