/*
 * @Author: 李星阳
 * @Date: 2022-01-16 20:03:49
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-18 21:31:09
 * @Description: 
 */

const { DataTypes } = require('sequelize');


let devHistory;
module.exports.init = function(){
    console.log('\n\n初始化-devHistory 01');
    devHistory = sqlize.define('dev_history', {
        time: {
            type: DataTypes.DATE,
        },
        note: {
            type: DataTypes.STRING,
        },
    }, {
        // freezeTableName: true,
    });
    devHistory.sync().then(res => {
        console.log('\n\n初始化-devHistory 02');
    });
};

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
    async addOneRecord (){
        const res = await devHistory.create({
            time: new Date(),
            note: "测试中",
        }).catch(err=>{
            console.log('插入出错', err);
        })
        db.get("SELECT count(*) FROM dev_history", function(err, row) {
            if (err) return;
            toLog('开发记录数量：', row['count(*)']);
        });
    },
};

