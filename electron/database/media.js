/*
 * @Author: 李星阳
 * @Date: 2022-01-16 10:33:24
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-12 22:05:33
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
    finishedAt: DataTypes.DATE, // 完成时间
    // xxxx: DataTypes.STRING, // 类型，故事，教材，似乎应该按目录解析，不记在媒体文件上
    type: {
        type: DataTypes.INTEGER,
        // 1默认独生子，2有同胞(同级文件)，3有同胞(范围包含堂亲)
        defaultValue: 1,  // 修改时应改一片，需要思考
    },
});
oMedia.sync();

module.exports.oFn = {
    // ▼保存一个媒体信息
    async saveMediaInfo(obj) {
        const oState = await fs.stat(`${obj.dir}/${obj.name}`);
        obj.size = oState.size;
        const res = await oMedia.create(obj);
        return res?.dataValues;
    },
    // ▼查询库中媒体，一个或多个
    async getMediaInfo(obj) {
        // obj: {hash, dir}
        const aRes = await oMedia.findAll({
            where: obj,
            limit: (obj.hash && !obj.dir) ? 1 : 999,
        });
        return aRes.map(cur => cur.dataValues);
    },
    // ▼查询所有【媒体文件夹】
    async getMediaHomes() {
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