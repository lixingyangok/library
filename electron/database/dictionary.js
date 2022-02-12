/*
 * @Author: 李星阳
 * @Date: 2022-01-24 19:50:21
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-12 22:05:25
 * @Description: 开发历史
 */
// const fsp = require('fs').promises;
const { Op, DataTypes } = require('sequelize');
const { sqlize } = require('./init-db.js');

const oDict = module.exports.line = sqlize.define('dictionary', {
    word: {
        type: DataTypes.STRING,
        unique: true,
    },
    trans: DataTypes.STRING, // 译文，将来可能加长
    // 笔记??
    // 记性：动词，形容词
    // 变体：过去式，三单形式，分词，现在形式
},{
    indexes: [
        { unique: true, fields: ['word'] },
    ],
});

oDict.sync();

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
    // ▼ 查询提示词
    async getCandidate(obj) {
        const {sWord, limit=10} = obj;
        const res = await oDict.findAll({
            attributes: ['word'],
            where: {
                word: {
                    [Op.like]: `${sWord}%`,
                },
            },
            limit,
        });
        if (!res) return;
        return res.map(cur => cur.dataValues.word);
    },
};

