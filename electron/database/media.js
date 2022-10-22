/*
 * @Author: 李星阳
 * @Date: 2022-01-16 10:33:24
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-10-22 14:46:39
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
    dir: DataTypes.STRING, // 所在位置
    name: DataTypes.STRING, // 文件名
    size: DataTypes.INTEGER, // i体积（比特）
    sizeStr: DataTypes.STRING, // s体积（MB）
    duration: DataTypes.FLOAT, // i时长（秒）
    durationStr: DataTypes.STRING, // s时长（时分秒）
    finishedAt: DataTypes.DATE, // 完成时间
    // xxxx: DataTypes.STRING, // 类型，故事，教材，似乎应该按目录解析，不记在媒体文件上
    // status: DataTypes.INTEGER, // 0默认，1进行中
    type: { // 这个好像没启用
        type: DataTypes.INTEGER,
        // 1默认独生子，2有同胞(同级文件)，3有同胞(范围包含堂亲)
        defaultValue: 1,  // 修改时应改一片，需要思考
    },
});
oMedia.sync();
/*
User.sync() - 如果表不存在,则创建该表(如果已经存在,则不执行任何操作)
User.sync({ force: true }) - 将创建表,如果表已经存在,则将其首先删除
User.sync({ alter: true }) - 这将检查数据库中表的当前状态(它具有哪些列,它们的数据类型等),然后在表中进行必要的更改以使其与模型匹配.
*/

module.exports.oFn = {
    // ▼保存：一个媒体信息
    async saveMediaInfo(obj) {
        const oState = await fs.stat(`${obj.dir}/${obj.name}`);
        obj.size = oState.size;
        const res = await oMedia.create(obj);
        return res?.dataValues;
    },
    // ▼修改：一个媒体信息
    async updateMediaInfo(obj) {
        const oNewInfo = JSON.parse(
            JSON.stringify(obj),
        );
        Reflect.deleteProperty(oNewInfo, 'id');
        const res = await oMedia.update(oNewInfo, {
            where: {
                id: obj.id,
            },
        });
        return res;
    },
    // ▼查询：库中媒体，一个或多个
    async getMediaInfo(obj) {
        // obj: {hash, dir}
        const aRes = await oMedia.findAll({
            where: obj,
            limit: (obj.hash && !obj.dir) ? 1 : 999,
        });
        return aRes.map(cur => cur.dataValues);
    },
    // ▼查询：所有【媒体文件夹】
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