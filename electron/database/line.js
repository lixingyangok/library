/*
 * @Author: 李星阳
 * @Date: 2022-01-16 10:40:40
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-31 20:08:11
 * @Description: 
 */

const { Op, DataTypes } = require('sequelize');
const { sqlize } = require('./init-db.js');
const {media} = require('./media');

const oLine = module.exports.line = sqlize.define('line', {
    mediaId: { // 媒体记录的行ID，防止文件hash变化后引发错误
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: media, // 这是对另一个模型的参考
            key: 'id', // 这是引用模型的列名
        },
    },
    start: DataTypes.FLOAT,
    end: DataTypes.FLOAT,
    text: DataTypes.STRING, // 原文
    trans: DataTypes.STRING, // 译文
    filledAt: DataTypes.DATE, // 录入时间
    // 笔记内容？
});

oLine.sync({ alter: true });

const oFn = module.exports.oFn = {
    // ▼批量保存（导入用）
    async saveLine(arr) {
        const res = await oLine.bulkCreate(arr, {
            updateOnDuplicate: ['start', 'end', 'text', 'trans', 'filledAt'],
            // updateOnDuplicate是在插入的时候如果主键冲突就执行更新操作
        });
        return res;
    },
    // ▼修改字幕
    async updateLine(obj) {
        const arr = [[], 0];
        if (obj?.toSaveArr?.length) {
            obj.toSaveArr.forEach(cur => {
                if (cur.filledAt || !cur.text) return;
                cur.filledAt = new Date();
            });
            arr[0] = oFn.saveLine(obj.toSaveArr);
        }
        if (obj?.toDelArr?.length) {
            arr[1] = oLine.destroy({
                where: { id: obj.toDelArr },
            });
        }
        const res = await Promise.all(arr);
        if (res[0]?.map){
            res[0] = res[0].map(cur => cur.dataValues);
        }
        return res;
    },
    // ▼统计所有【媒体字幕】
    async getLineInfo() {
        const { oPromise, fnResolve, fnReject } = newPromise();
        const sql = `
            SELECT line.mediaId, count(*) as count
            FROM line
            group by line.mediaId
        `;
        db.all(sql, (err, row) => {
            if (err) return toLog('查询出错');
            fnResolve(row);
        });
        return oPromise;
    },
    // ▼查询某个媒体的字幕
    async getLineByMedia(mediaId) {
        const res = await oLine.findAll({
            where: {mediaId},
            order: [['start', 'asc']],
        });
        if (!res) return;
        return res.map(cur => cur.dataValues);
    },
    // ▼按单词搜索字幕
    async searchLineBybWord(word) {
        const res = await oLine.findAndCountAll({
            where: {
                text: {
                    [Op.like]: `%${word}%`,
                },
            },
            order: [['mediaId']],
            offset: 0,
            limit: 100,
        });
        if (!res) return;
        res.rows = res.rows.map(cur=>cur.dataValues);
        return res;
    },
};


