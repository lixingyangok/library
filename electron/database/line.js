/*
 * @Author: 李星阳
 * @Date: 2022-01-16 10:40:40
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-23 11:41:17
 * @Description: 
 */

const { DataTypes } = require('sequelize');
const { sqlize } = require('./init-db.js');

const oLine = module.exports.line = sqlize.define('line', {
    hash: DataTypes.STRING,
    start: DataTypes.FLOAT,
    end: DataTypes.FLOAT,
    text: DataTypes.STRING, // 原文
    trans: DataTypes.STRING, // 译文
    // 笔记？
});

oLine.sync({ alter: true });

module.exports.oFn = {
    // ▼批量保存
    async saveLine(arr){
        const res = await oLine.bulkCreate(arr);
        toLog(res);
    },
    // ▼查询所有【媒体字幕】
    async getLineInfo() {
        const {oPromise, fnResolve, fnReject} = newPromise();
        const sql = `
            SELECT
                line.hash,
                count(*) as count
            FROM line 
            group by line.hash
        `;
        db.all(sql, (err, row) => {
            if (err) return toLog('查询出错');
            fnResolve(row);
        });
        return oPromise;
    },
};



