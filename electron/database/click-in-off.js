/*
 * @Author: 李星阳
 * @Date: 2022-10-22 11:49:11
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-10-22 14:47:49
 * @Description: 
 */

// const fs = require('fs').promises;
const { DataTypes } = require('sequelize');
const { sqlize } = require('./init-db.js');

const oClock = module.exports.clock_record = sqlize.define('clock_record', {
    // stime: DataTypes.STRING, // 日期时间
    mark: DataTypes.STRING, // 日期时间
});

// oClock.sync();
oClock.sync({ alter: true }) // 这将检查数据库中表的当前状态(它具有哪些列,它们的数据类型等),然后在表中进行必要的更改以使其与模型匹配.



module.exports.oFn = {
    // ▼保存
    async setClockRecord() {
        const obj = {};
        const res = await oClock.create();
        return res?.dataValues;
    },
    // ▼查询（未启用）在前端用发 sql 查询
    async getClockRecord() {
        const {oPromise, fnResolve, fnReject} = newPromise();
        const sql = `
            SELECT media.dir, count(*) as count
            FROM media 
            group by media.dir
        `;
        db.all(sql, (err, row) => {
            if (err) return toLog('查询出错');
            fnResolve(row);
        });
        return oPromise;
    },
};

