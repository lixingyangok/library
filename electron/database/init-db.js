/*
 * @Author: 李星阳
 * @Date: 2022-01-12 19:32:20
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-12 11:56:03
 * @Description: 
 */
const sqlite3 = require('sqlite3').verbose();
const { Sequelize } = require('sequelize');

// ▼建立数据库链接
const db = new sqlite3.Database(
    "D:/Program Files (gree)/my-library/myDB.db"
);

db.addListener('regexp', function(v1, v2){
    console.log('v1', v1, v2);
    return true;
});
db.get("SELECT count(*), REGEXP() as bb FROM dev_history", function(err, row) {
    toLog('开发记录数量000：', err, row);
});
setTimeout(()=>{
    toLog('5秒之后加载');
    // const obj = require('./dbExtension');
    db.loadExtension(
        'D:/github/my-library/src/regexp.c',
        function(err, res){
            console.log('xyz 001\n\n', err);
            console.log('xyz 001\n\n', res);
            console.log('\n\n\n\n\n\n');
        }
    );
}, 1*1000);

console.log('\n\n\n-----');
// console.log(sqlite3.create_function);
// console.log(sqlite3.createFunction);
// console.log(sqlite3.sqlite3_create_function);
// console.log(sqlite3.sqlite3CreateFunction);
// console.log(sqlite3.registerFunction);
// console.log(sqlite3.RegisterFunction);
// console.log(sqlite3.RegisterFunctions);

// console.log(db.create_function);
// console.log(db.createFunction);
// console.log(db.sqlite3_create_function);
// console.log(db.sqlite3CreateFunction);
// console.log(db.registerFunction);
// console.log(db.RegisterFunctions);
// console.log(db.RegisterFunction);
console.log(Reflect.ownKeys(sqlite3.__proto__));
console.log(Reflect.ownKeys(db.__proto__));

// ▼建立数据库链接
const sqlize = new Sequelize({
    dialect: 'sqlite',
    storage: 'D:/Program Files (gree)/my-library/myDB.db',
    define: {
        freezeTableName: true,
    },
});

module.exports.db = db;
module.exports.sqlize = sqlize;

/* 
    'close',               'exec',
    'wait',                'loadExtension',
    'serialize',           'parallelize',
    'configure',           'interrupt',
    'open',                'constructor',
    '_events',             '_eventsCount',
    '_maxListeners',       'setMaxListeners',
    'getMaxListeners',     'emit',
    'addListener',         'on',
    'prependListener',     'once',
    'prependOnceListener', 'removeListener',
    'off',                 'removeAllListeners',
    'listeners',           'rawListeners',
    'listenerCount',       'eventNames',
    'prepare',             'run',
    'get',                 'all',
    'each',                'map',
    'backup'
*/