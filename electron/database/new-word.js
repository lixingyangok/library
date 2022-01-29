/*
 * @Author: 李星阳
 * @Date: 2022-01-16 10:40:40
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-29 14:30:50
 * @Description: 
 */

const { DataTypes } = require('sequelize');
const { sqlize } = require('./init-db.js');

const oNewWord = module.exports.line = sqlize.define('new_word', {
    hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    word: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.INTEGER, // 1新词汇, 2专有名词
        allowNull: false,
    },
});

oNewWord.sync({ alter: true });

module.exports.oFn = {
    // ▼保存
    async saveOneNewWord(obj) {
        const hasSaved = await oNewWord.findOne({ 
            where: { hash: obj.hash, word: obj.word },
        });
        if (hasSaved) throw Error('不能重复保存');
        obj.type = (
            obj.type || (/^[A-Z].+/.test(obj.word) ? 2 : 1)
        );
        const res = await oNewWord.create(obj).catch(err=>{
            console.log('插入出错', err);
        });
        return res;
    },
    // ▼查询媒体的生词
    async getWordsByHash({hash, more}) {
        const res = await oNewWord.findAll({
            where: {
                hash,
            },
        });
        if (!res) return;
        return res.map(cur=>cur.dataValues);
    },
    // ▼修改媒体的生词
    async switchWordType(obj) {
        const res = await oNewWord.update({
            type: obj.type == 1 ? 2 : 1,
        }, {
            where: {
                hash: obj.hash,
                word: obj.word,
            },
        });
        return res;
    },
    // ▼删除媒体的生词
    async delOneNewWord(obj) {
        const res = await User.destroy({
            where: {
                hash: obj.hash,
                word: obj.word,
            },
        });
        return res;
    },
};

