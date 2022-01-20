/*
 * @Author: 李星阳
 * @Date: 2022-01-16 10:33:24
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-20 19:44:33
 * @Description: 
 */

const fs = require('fs').promises;
const { DataTypes } = require('sequelize');
const { sqlize } = require('./init-db.js');

const oMedia = module.exports.media = sqlize.define('media', {
    hash: {
        type: DataTypes.STRING,
        unique: true,
    },
    dir: DataTypes.STRING, // 所以位置
    name: DataTypes.STRING, // 文件名
    size: DataTypes.INTEGER, // 体积（比特）
    sizeStr: DataTypes.STRING, // 体积（MB）
    duration: DataTypes.FLOAT, // 时长（秒）
    durationStr: DataTypes.STRING, // 时长（时分秒）
}, {
    // freezeTableName: true,
});
oMedia.sync({ alter: true });

module.exports.oFn = {
    // ▼查询库中媒体
    async getMediaInfo(sHash){
        const res = await oMedia.findOne({
            where: {
                hash: sHash,
            },
        });
        return res?.dataValues;
    },
    async saveMediaInfo(obj){
        const oState = await fs.stat(`${obj.dir}/${obj.name}`);
        obj.size = oState.size;
        const res = await oMedia.create(obj);
        return res;
    },
};

// ▼插入数据01
// const stmt = db.prepare(`
//     INSERT INTO media (hash, name, dir, size)
//     VALUES ($hash,$name,$dir,$size)
// `);
// stmt.run(prefixKey(obj), err => {
//     fnResolve(err);
// });
// stmt.finalize();

// ▼插入数据02
// console.log("Jane's auto-generated ID:", jane.id);
// const {oPromise, fnResolve, fnReject} = newPromise();
// const sql = `
//     INSERT INTO media (hash, name, dir, size)
//     VALUES ($hash, $name, $dir, $size)
// `;
// db.run(sql, prefixKey(obj), (err) => {
//     fnResolve(err);
// });
// const res = await oPromise;

// ▼查询数据
// const {oPromise, fnResolve, fnReject} = newPromise();
// const sql = "SELECT * FROM media where hash = ?";
// db.get(sql, sHash, (err, row) => {
//     if (err) return toLog('查询出错');
//     fnResolve(row);
// });
// return oPromise;