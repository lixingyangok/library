/*
 * @Author: 李星阳
 * @Date: 2022-01-16 20:03:49
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-19 21:46:20
 * @Description: 
 */

const { DataTypes } = require('sequelize');
const {sqlize} = require('./init-db.js');

const oHistory = ( module.exports.history ) = sqlize.define('dev_history', {
    note: {
        type: DataTypes.STRING,
    },
}, {
    // freezeTableName: true,
});

oHistory.sync({ alter: true });


module.exports.oFn = {
    // ▼插入一条开发记录（废弃）
    async addDevRecord (){
        db.run("INSERT INTO dev_history VALUES ($time)", {
            $time: new Date().toLocaleString(),
        });
        db.get("SELECT count(*) FROM dev_history", function(err, row) {
            if (err) return;
            toLog('开发记录数量：', row['count(*)']);
        });
    },
    // ▼插入一条开发记录
    async addOneRecord (note='测试中'){
        await oHistory.create({
            note,
        }).catch(err=>{
            console.log('插入出错', err);
        });
        db.get("SELECT count(*) FROM dev_history", function(err, row) {
            if (err) return;
            toLog('开发记录数量：', row['count(*)']);
        });
    },
};

