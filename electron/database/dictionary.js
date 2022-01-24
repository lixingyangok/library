/*
 * @Author: 李星阳
 * @Date: 2022-01-24 19:50:21
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-24 21:04:33
 * @Description: 开发历史
 */
const fsp = require('fs').promises;
const { DataTypes } = require('sequelize');
const { sqlize } = require('./init-db.js');

const oDict = module.exports.line = sqlize.define('dictionary', {
    word: DataTypes.STRING,
    trans: DataTypes.STRING, // 译文，将来可能加长
});

oDict.sync({ alter: true });

module.exports.oFn = {
    // ▼批量保存（停用）
    // async initDictionary() {
    //     if (1) return;
    //     const res01 = await fsp.readFile('C:/Users/lixin/Desktop/10万单词.json','utf-8').catch((err)=>{
    //         console.log('字典数据没读成功', err);
    //     });
    //     if (!res01) return;
    //     const res02 = await oDict.bulkCreate(JSON.parse(res01));
    //     return res02;
    // },
    // ▼查询所有
    async getLineInfo123() {
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
    async getLineByHash123(hash) {
        const res = await oDict.findAll({
            where: {hash},
            order: [['start', 'asc']],
        });
        if (!res) return;
        // toLog(res[0]);
        return res.map(cur=>cur.dataValues);
    },
};
