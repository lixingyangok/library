/*
 * @Author: 李星阳
 * @Date: 2022-01-12 19:32:20
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-30 10:55:15
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

module.exports.db = db;
module.exports.sqlize = sqlize;

