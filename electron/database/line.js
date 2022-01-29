/*
 * @Author: 李星阳
 * @Date: 2022-01-16 10:40:40
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-29 18:02:39
 * @Description: 
 */

const { Op, DataTypes } = require('sequelize');
const { sqlize } = require('./init-db.js');

const oLine = module.exports.line = sqlize.define('line', {
    hash: DataTypes.STRING,
    start: DataTypes.FLOAT,
    end: DataTypes.FLOAT,
    text: DataTypes.STRING, // 原文
    trans: DataTypes.STRING, // 译文
    // filledAt: DataTypes.DATE, // 录入时间
    // 笔记内容？
});


oLine.sync({ alter: true });

module.exports.oFn = {
    // ▼批量保存
    async saveLine(arr) {
        const res = await oLine.bulkCreate(arr);
        return res;
    },
    // ▼查询所有【媒体字幕】
    async getLineInfo() {
        const { oPromise, fnResolve, fnReject } = newPromise();
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
    // ▼查询某个媒体的字幕
    async getLineByHash(hash) {
        const res = await oLine.findAll({
            where: {hash},
            order: [['start', 'asc']],
        });
        if (!res) return;
        // toLog(res[0]);
        return res.map(cur=>cur.dataValues);
    },
    // ▼按单词搜索字幕
    async searchLineBybWord(word) {
        const res = await oLine.findAll({
            where: {
                text: {
                    [Op.like]: `%${word}%`,
                },
            },
            order: [['hash']],
            limit: 1_000,
        });
        if (!res) return;
        // toLog(res[0]);
        return res.map(cur=>cur.dataValues);
    },
};

